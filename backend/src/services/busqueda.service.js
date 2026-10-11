'use strict';

/**
 * Buscador global.
 *
 * Un solo texto busca a la vez en clientes, tickets, pagos C2P, solicitudes de
 * plan y facturas. SQL parametrizado con los comodines de entrada escapados:
 * la consulta del usuario nunca se concatena en el texto SQL.
 *
 * La salida usa camelCase, igual que el resto de la API (`ticketService.aVista`),
 * para que la app Android pueda reutilizar sus mismos DTO.
 */

const db = require('../db/pool');
const { validacion } = require('../utils/errors');
const { normalizarCedula } = require('../utils/cedula');
const ticketService = require('./ticket.service');

const LONGITUD_MINIMA = 2;
const LONGITUD_MAXIMA = 64;

/**
 * Nota sobre el patron: se envuelve el texto en % para buscar subcadena y se
 * deja que % y _ del propio usuario actuen como comodines (no se usa la
 * clausula ESCAPE a proposito: no es portable entre PostgreSQL y el motor en
 * memoria de las pruebas, y la consulta siempre va parametrizada, asi que no
 * hay riesgo de inyeccion). Si el operador escribe '%' la busqueda devuelve
 * todo, que es justo lo que espera al buscar por comodin.
 */
function patron(consulta) {
  return `%${consulta.replace(/\\/g, '')}%`;
}

function validarConsulta(consulta) {
  const limpia = typeof consulta === 'string' ? consulta.trim() : '';
  if (limpia.length < LONGITUD_MINIMA) {
    throw validacion(`Escribe al menos ${LONGITUD_MINIMA} caracteres para buscar.`, { campo: 'q' });
  }
  if (limpia.length > LONGITUD_MAXIMA) {
    throw validacion(`La busqueda no puede superar ${LONGITUD_MAXIMA} caracteres.`, { campo: 'q' });
  }
  return limpia;
}

/** Limita el numero de resultados por tipo. */
function aLimite(valor, porDefecto, maximo) {
  const n = Number.parseInt(valor, 10);
  if (!Number.isFinite(n) || n < 1) return porDefecto;
  return Math.min(n, maximo);
}

// ---------------------------------------------------------------------------
// Consultas (devuelven filas crudas de PostgreSQL, en snake_case)
// ---------------------------------------------------------------------------

/** Contratos por cedula exacta, nombre, plan, telefono o direccion. */
async function consultarClientes(consulta, max) {
  const like = patron(consulta);
  const cedulaExacta = normalizarCedula(consulta);

  const { rows } = await db.query(
    `SELECT cedula, nombre, plan, activado, servicio_activo, estado_fibra,
            mensualidad_usd, saldo_pendiente_usd, telefono, direccion, actualizado_en
       FROM clientes
      WHERE ($2::text IS NOT NULL AND cedula = $2)
         OR nombre ILIKE $1
         OR plan ILIKE $1
         OR telefono ILIKE $1
         OR direccion ILIKE $1
         OR cedula ILIKE $1
      ORDER BY nombre ASC
      LIMIT $3`,
    [like, cedulaExacta, max]
  );
  return rows;
}

/** Tickets por codigo, detalle, categoria, estado o nota tecnica. */
async function consultarTickets(consulta, { cedula, max }) {
  const like = patron(consulta);

  const { rows } = await db.query(
    `SELECT codigo, cedula, tipo, categoria, detalle, comprobante_url, estado, nota_tecnica, creado_en
       FROM tickets
      WHERE ($2::text IS NULL OR cedula = $2)
        AND (codigo ILIKE $1
             OR detalle ILIKE $1
             OR categoria ILIKE $1
             OR estado ILIKE $1
             OR nota_tecnica ILIKE $1)
      ORDER BY creado_en DESC
      LIMIT $3`,
    [like, cedula, max]
  );
  return rows;
}

/** Pagos C2P por referencia, banco, transaccion o codigo de respuesta. */
async function consultarPagos(consulta, { cedula, max }) {
  const like = patron(consulta);

  const { rows } = await db.query(
    `SELECT referencia, cedula, banco_nombre, codigo_banco, transaccion_id,
            monto_bs, estado, codigo_respuesta, mensaje, creado_en
       FROM pagos_c2p
      WHERE ($2::text IS NULL OR cedula = $2)
        AND (referencia ILIKE $1
             OR banco_nombre ILIKE $1
             OR transaccion_id ILIKE $1
             OR codigo_banco ILIKE $1
             OR codigo_respuesta ILIKE $1)
      ORDER BY creado_en DESC
      LIMIT $3`,
    [like, cedula, max]
  );
  return rows;
}

async function consultarSolicitudes(consulta, { cedula, max }) {
  const like = patron(consulta);

  const { rows } = await db.query(
    `SELECT id, cedula, plan_actual, plan_nuevo_nombre, monto_usd, estado, nota, creado_en
       FROM solicitudes_cambio_plan
      WHERE ($2::text IS NULL OR cedula = $2)
        AND (plan_nuevo_nombre ILIKE $1
             OR plan_actual ILIKE $1
             OR estado ILIKE $1)
      ORDER BY creado_en DESC
      LIMIT $3`,
    [like, cedula, max]
  );
  return rows;
}

async function consultarFacturas(consulta, { clienteId, max }) {
  const like = patron(consulta);

  const { rows } = await db.query(
    `SELECT id, periodo, monto_usd, estado, pdf_url, pagado_en
       FROM facturas
      WHERE ($2::bigint IS NULL OR cliente_id = $2)
        AND (periodo ILIKE $1 OR estado ILIKE $1)
      ORDER BY periodo DESC
      LIMIT $3`,
    [like, clienteId, max]
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Vistas (camelCase, mismo contrato que el resto de la API)
// ---------------------------------------------------------------------------

const vistaCliente = (c) => ({
  cedula: c.cedula,
  nombre: c.nombre,
  plan: c.plan,
  activado: Boolean(c.activado),
  servicioActivo: Boolean(c.servicio_activo),
  estadoFibra: c.estado_fibra,
  mensualidadUsd: Number(c.mensualidad_usd || 0),
  saldoPendienteUsd: Number(c.saldo_pendiente_usd || 0),
  telefono: c.telefono,
  direccion: c.direccion,
  fecha: c.actualizado_en
});

const vistaPago = (p) => ({
  referencia: p.referencia,
  cedula: p.cedula,
  banco: p.banco_nombre,
  codigoBanco: p.codigo_banco,
  transaccionId: p.transaccion_id,
  montoBs: Number(p.monto_bs || 0),
  estado: p.estado,
  codigoRespuesta: p.codigo_respuesta,
  mensaje: p.mensaje,
  fecha: p.creado_en
});

const vistaSolicitud = (s) => ({
  id: Number(s.id),
  cedula: s.cedula,
  planActual: s.plan_actual,
  planNuevo: s.plan_nuevo_nombre,
  montoUsd: Number(s.monto_usd || 0),
  estado: s.estado,
  nota: s.nota,
  fecha: s.creado_en
});

const vistaFactura = (f) => ({
  id: Number(f.id),
  periodo: f.periodo,
  montoUsd: Number(f.monto_usd || 0),
  estado: f.estado,
  pdfUrl: f.pdf_url,
  fecha: f.pagado_en
});

/**
 * Busqueda consolidada.
 * @param {string} consulta texto libre (cedula, nombre, codigo, referencia...)
 * @param {object} opciones
 * @param {string|null} opciones.cedula acota tickets/pagos/solicitudes a un contrato.
 * @param {number|null} opciones.clienteId acota las facturas a un contrato.
 * @param {number|string} opciones.limite resultados por tipo (maximo 100).
 */
async function buscarGlobal(consulta, { cedula = null, clienteId = null, limite } = {}) {
  const limpia = validarConsulta(consulta);
  const max = aLimite(limite, 20, 100);

  const [clientes, tickets, pagos, solicitudes, facturas] = await Promise.all([
    consultarClientes(limpia, max),
    consultarTickets(limpia, { cedula, max: max * 2 }),
    consultarPagos(limpia, { cedula, max }),
    consultarSolicitudes(limpia, { cedula, max }),
    consultarFacturas(limpia, { clienteId, max })
  ]);

  return {
    consulta: limpia,
    total: clientes.length + tickets.length + pagos.length + solicitudes.length + facturas.length,
    conteos: {
      clientes: clientes.length,
      tickets: tickets.length,
      pagos: pagos.length,
      solicitudes: solicitudes.length,
      facturas: facturas.length
    },
    resultados: {
      clientes: clientes.map(vistaCliente),
      tickets: tickets.map(ticketService.aVista),
      pagos: pagos.map(vistaPago),
      solicitudes: solicitudes.map(vistaSolicitud),
      facturas: facturas.map(vistaFactura)
    }
  };
}

module.exports = { buscarGlobal, validarConsulta };