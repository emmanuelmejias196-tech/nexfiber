'use strict';

const db = require('../db/pool');
const config = require('../config/env');
const { noEncontrado, conflicto, noAutorizado, prohibido, validacion } = require('../utils/errors');
const { hashearClave, verificarClave, revisarPoliticaClave } = require('../utils/password');
const { normalizarCedula } = require('../utils/cedula');
const auditoria = require('./auditoria.service');

const CAMPOS = `
  id, cedula, nombre, plan_id, plan, clave_hash, activado, servicio_activo, ont_serial,
  ip_asignada, potencia_optica_dbm, estado_fibra, mensualidad_usd, saldo_pendiente_usd,
  fecha_corte, direccion, telefono, creado_en, actualizado_en
`;

function aNumero(valor, porDefecto = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : porDefecto;
}

/**
 * Vista publica del contrato. Nunca incluye clave_hash ni datos internos.
 * Los campos `nombre` y `plan` se mantienen porque son los que consume
 * la app Android (NetworkModels.VerificarCedulaResponse).
 */
function aVistaPublica(cliente) {
  return {
    cedula: cliente.cedula,
    nombre: cliente.nombre,
    plan: cliente.plan,
    planId: cliente.plan_id,
    activado: Boolean(cliente.activado),
    servicioActivo: Boolean(cliente.servicio_activo),
    estadoFibra: cliente.estado_fibra,
    mensualidadUsd: aNumero(cliente.mensualidad_usd, 30),
    saldoPendienteUsd: aNumero(cliente.saldo_pendiente_usd, 0),
    fechaCorte: cliente.fecha_corte,
    ontSerial: cliente.ont_serial,
    ipAsignada: cliente.ip_asignada,
    potenciaOptica: cliente.potencia_optica_dbm === null ? null : `${cliente.potencia_optica_dbm} dBm`,
    direccion: cliente.direccion,
    telefono: cliente.telefono
  };
}

async function buscarPorCedula(cedula, { conClave = true } = {}) {
  const normalizada = normalizarCedula(cedula);
  if (!normalizada) return null;

  const columnas = conClave ? CAMPOS : CAMPOS.replace('clave_hash, ', '');
  const { rows } = await db.query(`SELECT ${columnas} FROM clientes WHERE cedula = $1 LIMIT 1`, [
    normalizada
  ]);
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await db.query(`SELECT ${CAMPOS} FROM clientes WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

/**
 * Verificacion de cedula (contrato precargado por la oficina).
 * No filtra si la cedula existe: el cliente Android necesita distinguir
 * "no registrada" de "registrada sin clave".
 */
async function verificarCedula(cedula) {
  const cliente = await buscarPorCedula(cedula);
  if (!cliente) return null;
  return { cliente, vista: aVistaPublica(cliente) };
}

/**
 * Activacion de cuenta: define la clave del cliente por primera vez.
 *
 * Reglas de seguridad:
 *  - el contrato debe existir;
 *  - no se puede sobrescribir una clave ya establecida (evita secuestro de cuenta);
 *  - la clave se guarda solo como hash bcrypt;
 *  - con ACTIVATION_REQUIRES_OTP se exige ademas un codigo de un solo uso.
 */
async function activarCuenta({ cedula, clave, codigoActivacion = null, ip = null }) {
  const cliente = await buscarPorCedula(cedula);
  if (!cliente) {
    throw noEncontrado('La cedula no se encuentra registrada en la oficina de Cable Tartak.');
  }

  if (cliente.clave_hash) {
    throw conflicto(
      'Esta cedula ya tiene una clave creada. Usa "Ya tengo clave" para iniciar sesion.'
    );
  }

  const problemas = revisarPoliticaClave(clave);
  if (problemas.length > 0) throw validacion(problemas[0], { requisitos: problemas });

  if (config.auth.activacionRequiereOtp) {
    const consumo = await consumirCodigoActivacion(cliente.id, codigoActivacion);
    if (!consumo) {
      throw noAutorizado('El codigo de verificacion es invalido o expiro.');
    }
  }

  const hash = await hashearClave(clave);
  const { rows } = await db.query(
    `UPDATE clientes
        SET clave_hash = $1, activado = TRUE, actualizado_en = NOW()
      WHERE id = $2 AND clave_hash IS NULL
      RETURNING ${CAMPOS}`,
    [hash, cliente.id]
  );

  const actualizado = rows[0];
  if (!actualizado) {
    throw conflicto('La cuenta ya fue activada en otro dispositivo. Intenta iniciar sesion.');
  }

  await auditoria.registrar({
    actor: `cliente:${actualizado.cedula}`,
    accion: 'cuenta.activada',
    entidad: 'clientes',
    entidadId: String(actualizado.id),
    ip
  });

  return actualizado;
}

async function autenticar({ cedula, clave, ip = null }) {
  const cliente = await buscarPorCedula(cedula);
  const credencialesInvalidas = noAutorizado('Cedula o contrasena incorrectas.');

  if (!cliente) {
    // Se ejecuta un hash ficticio para igualar el tiempo de respuesta y no
    // revelar por temporizacion si la cedula existe.
    await hashearClave('cedula-inexistente');
    throw credencialesInvalidas;
  }

  if (!cliente.clave_hash) {
    throw prohibido('Tu cuenta aun no ha sido activada. Crea tu clave primero.');
  }

  const correcta = await verificarClave(clave, cliente.clave_hash);
  if (!correcta) {
    await auditoria.registrar({
      actor: `cliente:${cliente.cedula}`,
      accion: 'acceso.fallido',
      entidad: 'clientes',
      entidadId: String(cliente.id),
      ip
    });
    throw credencialesInvalidas;
  }

  if (!cliente.activado) {
    throw prohibido('Tu cuenta esta suspendida. Contacta a la oficina de Cable Tartak.');
  }

  return cliente;
}

async function cambiarClave({ cliente, claveActual, claveNueva, ip = null }) {
  const problemas = revisarPoliticaClave(claveNueva);
  if (problemas.length > 0) throw validacion(problemas[0], { requisitos: problemas });

  const actual = await buscarPorId(cliente.id);
  const correcta = await verificarClave(claveActual, actual.clave_hash);
  if (!correcta) throw noAutorizado('La contrasena actual no es correcta.');

  if (await verificarClave(claveNueva, actual.clave_hash)) {
    throw validacion('La nueva contrasena debe ser distinta de la actual.');
  }

  const hash = await hashearClave(claveNueva);
  await db.query('UPDATE clientes SET clave_hash = $1, actualizado_en = NOW() WHERE id = $2', [
    hash,
    cliente.id
  ]);
  await db.query('UPDATE refresh_tokens SET revocado_en = NOW() WHERE cliente_id = $1 AND revocado_en IS NULL', [
    cliente.id
  ]);

  await auditoria.registrar({
    actor: `cliente:${actual.cedula}`,
    accion: 'clave.actualizada',
    entidad: 'clientes',
    entidadId: String(cliente.id),
    ip
  });

  return true;
}

/** Alta de contrato desde la oficina (consola administrativa). */
async function crearCliente(datos) {
  const cedula = normalizarCedula(datos.cedula);
  if (!cedula) throw validacion('La cedula no tiene un formato valido.');

  if (!datos.nombre || String(datos.nombre).trim().length < 3) {
    throw validacion('El nombre del cliente es obligatorio.');
  }

  const plan = String(datos.plan || 'Plan Oro - 300 Mbps').trim();
  const planId = datos.planId || null;

  const { rows } = await db.query(
    `INSERT INTO clientes (cedula, nombre, plan_id, plan, servicio_activo, ont_serial, ip_asignada,
                           potencia_optica_dbm, estado_fibra, mensualidad_usd, fecha_corte, direccion, telefono)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (cedula) DO UPDATE
       SET nombre = EXCLUDED.nombre,
           plan = EXCLUDED.plan,
           plan_id = EXCLUDED.plan_id,
           mensualidad_usd = EXCLUDED.mensualidad_usd,
           actualizado_en = NOW()
     RETURNING ${CAMPOS}`,
    [
      cedula,
      String(datos.nombre).trim(),
      planId,
      plan,
      datos.servicioActivo !== false,
      datos.ontSerial || null,
      datos.ipAsignada || null,
      datos.potenciaOpticaDbm ?? null,
      datos.estadoFibra || 'En Linea (Sincronizado)',
      aNumero(datos.mensualidadUsd, 35),
      datos.fechaCorte || '15 de cada mes',
      datos.direccion || null,
      datos.telefono || null
    ]
  );

  return rows[0];
}

async function actualizarPlanCliente({ cedula, plan, planId, mensualidadUsd }) {
  const cliente = await buscarPorCedula(cedula);
  if (!cliente) throw noEncontrado('Contrato no encontrado.');

  const { rows } = await db.query(
    `UPDATE clientes
        SET plan = COALESCE($1, plan),
            plan_id = COALESCE($2, plan_id),
            mensualidad_usd = COALESCE($3, mensualidad_usd),
            actualizado_en = NOW()
      WHERE id = $4
      RETURNING ${CAMPOS}`,
    [plan || null, planId || null, mensualidadUsd ?? null, cliente.id]
  );
  return rows[0];
}

async function listar({ limite = 50, offset = 0, soloActivados = false } = {}) {
  const { rows } = await db.query(
    `SELECT ${CAMPOS.replace('clave_hash, ', '')}
       FROM clientes
      WHERE ($3 = FALSE OR activado = TRUE)
      ORDER BY actualizado_en DESC
      LIMIT $1 OFFSET $2`,
    [limite, offset, soloActivados]
  );
  return rows;
}

async function contar() {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS total, COUNT(CASE WHEN activado THEN 1 END)::int AS activados FROM clientes'
  );
  return rows[0];
}

/** Valida y consume un codigo de activacion de un solo uso. */
async function consumirCodigoActivacion(clienteId, codigo) {
  if (!codigo) return false;
  const { hashearClave } = require('../utils/password');
  const hash = await hashearClave(String(codigo).trim());

  const { rows } = await db.query(
    `UPDATE codigos_activacion
        SET consumido_en = NOW()
      WHERE cliente_id = $1
        AND codigo_hash = $2
        AND consumido_en IS NULL
        AND expira_en > NOW()
      RETURNING id`,
    [clienteId, hash]
  );
  return rows.length > 0;
}

module.exports = {
  CAMPOS,
  aVistaPublica,
  buscarPorCedula,
  buscarPorId,
  verificarCedula,
  activarCuenta,
  autenticar,
  cambiarClave,
  crearCliente,
  actualizarPlanCliente,
  listar,
  contar,
  consumirCodigoActivacion
};
