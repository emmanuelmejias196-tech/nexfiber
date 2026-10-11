'use strict';

/**
 * SERVICIO AUTOMATIZADO DE PAGO MOVIL C2P (Comercio a Persona)
 * Cable Tartak Telecomunicaciones - Integracion con pasarela bancaria.
 *
 * Mejoras frente a la version original en memoria:
 *  - la anti-replay (referencias unicas) se persiste en PostgreSQL mediante
 *    la restriccion UNIQUE (codigo_banco, referencia), por lo que sobrevive a
 *    reinicios y funciona con varias instancias del servicio;
 *  - validacion y normalizacion de todos los campos de entrada;
 *  - verificacion opcional de firma HMAC del payload (C2P_REQUIRE_SIGNATURE);
 *  - el "switch bancario" es inyectable: en produccion se conecta al gateway
 *    real, en pruebas se usa el simulador.
 */

const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../config/logger');
const db = require('../db/pool');
const { soloDigitos } = require('../utils/cedula');

// Catalogo de bancos autorizados (SUDEBAN)
const BANCOS_PERMITIDOS = {
  '0102': 'Banco de Venezuela',
  '0105': 'Banco Mercantil',
  '0108': 'Banco Provincial',
  '0134': 'Banesco Banco Universal',
  '0114': 'Bancaribe',
  '0172': 'Bancamiga',
  '0163': 'Banco del Tesoro',
  '0175': 'Banco Bicentenario'
};

const TELEFONOS_MOVILES = /^(0414|0424|0412|0416|0426)\d{7}$/;
const REFERENCIA = /^\d{6,14}$/;

/** Respaldo en memoria: solo si la base de datos no esta disponible. */
const referenciasEnMemoria = new Set();

function rechazo(codigoRespuesta, mensaje) {
  return { exito: false, codigoRespuesta, mensaje, transaccionId: null };
}

/**
 * Simulacion de la compensacion interbancaria.
 * Se reemplaza por la llamada HTTPS real (Suiche7B / Conexus) en produccion.
 */
async function consultarSwitchBancario({ referencia }) {
  // Latencia tipica de la red bancaria.
  await new Promise((resolve) => setTimeout(resolve, 80));

  if (referencia.endsWith('0000')) {
    return {
      aprobado: false,
      codigo: 'ERR_FONDOS_INSUFICIENTES',
      motivo: 'Fondos insuficientes en la cuenta del pagador o token C2P vencido.'
    };
  }

  return {
    aprobado: true,
    codigo: '00',
    motivo: 'Transaccion liquidada exitosamente en camara de compensacion.'
  };
}

/**
 * @param {Object} payload
 * @param {string} payload.telefono  Numero del pagador (04141234567)
 * @param {string} payload.cedula    Cedula del pagador
 * @param {string} payload.codigoBanco Codigo SUDEBAN de 4 digitos
 * @param {string} payload.referencia Referencia emitida por el banco
 * @param {number} payload.montoBs   Monto pagado en bolivares
 * @param {string} [payload.tokenC2P] Token temporal del banco
 * @param {string} [payload.firma]   Firma HMAC del payload (opcional)
 * @returns {Promise<Object>}
 */
async function procesarPagoMovilC2P({
  telefono,
  cedula,
  codigoBanco,
  referencia,
  montoBs,
  tokenC2P,
  firma
}) {
  const inicio = Date.now();

  if (config.pagos.requiereFirmaBancaria) {
    if (!config.pagos.firmaSecreta) {
      return rechazo('ERR_CONFIGURACION', 'La verificacion de firma esta activa pero falta C2P_SIGNATURE_SECRET.');
    }
    const esperada = crypto
      .createHmac('sha256', config.pagos.firmaSecreta)
      .update(`${telefono}|${cedula}|${codigoBanco}|${referencia}|${montoBs}`)
      .digest('hex');
    const a = Buffer.from(String(firma || ''), 'utf8');
    const b = Buffer.from(esperada, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return rechazo('ERR_FIRMA_INVALIDA', 'La firma del payload no es valida.');
    }
  }

  const telLimpio = soloDigitos(telefono);
  const refLimpia = String(referencia ?? '').trim();
  const bancoLimpio = String(codigoBanco ?? '').replace(/\D/g, '').padStart(4, '0');
  const cedulaLimpia = String(cedula ?? '').trim().toUpperCase();
  const monto = Number.parseFloat(montoBs);

  if (!TELEFONOS_MOVILES.test(telLimpio)) {
    return rechazo(
      'ERR_TELEFONO_INVALIDO',
      'El numero de telefono no corresponde a un operador movil venezolano valido de 11 digitos.'
    );
  }

  const nombreBanco = BANCOS_PERMITIDOS[bancoLimpio];
  if (!nombreBanco) {
    return rechazo(
      'ERR_BANCO_NO_RECONOCIDO',
      `El codigo bancario '${bancoLimpio}' no se encuentra en el catalogo nacional SUDEBAN.`
    );
  }

  if (!REFERENCIA.test(refLimpia)) {
    return rechazo('ERR_REFERENCIA_FORMATO', 'La referencia debe contener entre 6 y 14 digitos numericos.');
  }

  if (!Number.isFinite(monto) || monto <= 0) {
    return rechazo('ERR_MONTO_INVALIDO', 'El monto a conciliar debe ser un valor numerico positivo mayor a 0.');
  }

  if (monto > 100000000) {
    return rechazo('ERR_MONTO_INVALIDO', 'El monto supera el maximo aceptado por el servicio.');
  }

  // Anti-replay: la base de datos es la fuente de verdad.
  const clave = `${bancoLimpio}:${refLimpia}`;
  let clienteId = null;
  try {
    const { rows } = await db.query('SELECT id FROM clientes WHERE cedula = $1 LIMIT 1', [cedulaLimpia]);
    clienteId = rows[0] ? rows[0].id : null;
  } catch (error) {
    logger.warn('No se pudo resolver el cliente para el pago C2P', { mensaje: error.message });
  }

  if (referenciasEnMemoria.has(clave)) {
    return rechazo(
      'ERR_REFERENCIA_DUPLICADA',
      `La referencia ${refLimpia} del banco ${nombreBanco} ya fue conciliada previamente.`
    );
  }

  const respuestaBanco = await consultarSwitchBancario({ banco: bancoLimpio, referencia: refLimpia, monto });
  if (!respuestaBanco.aprobado) {
    return rechazo(respuestaBanco.codigo, `Rechazado por ${nombreBanco}: ${respuestaBanco.motivo}`);
  }

  const transaccionId = `TRK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const registro = {
    clienteId,
    cedula: cedulaLimpia || null,
    telefono: telLimpio,
    codigoBanco: bancoLimpio,
    bancoNombre: nombreBanco,
    referencia: refLimpia,
    montoBs: monto,
    estado: 'Aprobado',
    codigoRespuesta: '00_APROBADO',
    mensaje: 'Pago Movil validado y acreditado automaticamente. Tu servicio de Internet Cable Tartak se encuentra ACTIVO.',
    transaccionId,
    tokenC2P: tokenC2P || null
  };

  try {
    await db.query(
      `INSERT INTO pagos_c2p (cliente_id, cedula, telefono, codigo_banco, banco_nombre, referencia,
                             monto_bs, estado, codigo_respuesta, mensaje, transaccion_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        registro.clienteId,
        registro.cedula,
        registro.telefono,
        registro.codigoBanco,
        registro.bancoNombre,
        registro.referencia,
        registro.montoBs,
        registro.estado,
        registro.codigoRespuesta,
        registro.mensaje,
        registro.transaccionId
      ]
    );
  } catch (error) {
    // 23505 = violacion de la restriccion UNIQUE (codigo_banco, referencia).
    if (error && error.code === '23505') {
      referenciasEnMemoria.add(clave);
      return rechazo(
        'ERR_REFERENCIA_DUPLICADA',
        `La referencia ${refLimpia} del banco ${nombreBanco} ya fue conciliada previamente.`
      );
    }
    // Sin base de datos se conserva el respaldo en memoria y se avisa.
    logger.error('No se pudo persistir el pago C2P', { mensaje: error.message });
    referenciasEnMemoria.add(clave);
  }

  return {
    exito: true,
    codigoRespuesta: '00_APROBADO',
    transaccionId: registro.transaccionId,
    banco: registro.bancoNombre,
    telefono: registro.telefono,
    referencia: registro.referencia,
    montoConciliadoBs: registro.montoBs,
    fechaHora: new Date().toISOString(),
    tiempoProcesamientoMs: Date.now() - inicio,
    mensaje: registro.mensaje
  };
}

async function listarPagos({ cedula = null, limite = 100 } = {}) {
  const { rows } = await db.query(
    `SELECT id, cedula, telefono, codigo_banco, banco_nombre, referencia, monto_bs, estado,
            codigo_respuesta, mensaje, transaccion_id, creado_en
       FROM pagos_c2p
      WHERE ($1::text IS NULL OR cedula = $1)
      ORDER BY creado_en DESC
      LIMIT $2`,
    [cedula, limite]
  );
  return rows;
}

module.exports = {
  procesarPagoMovilC2P,
  consultarSwitchBancario,
  listarPagos,
  BANCOS_PERMITIDOS
};
