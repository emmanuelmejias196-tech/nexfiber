'use strict';

const db = require('../db/pool');
const { noEncontrado, validacion } = require('../utils/errors');
const { prefijoTicket } = require('../utils/tokens');
const auditoria = require('./auditoria.service');

const ESTADOS_POR_TIPO = {
  falla: 'Registrado',
  pago: 'En Conciliacion',
  diagnostico: 'Registrado'
};

/**
 * Estados validos del ciclo de vida de un ticket. Sin esta lista, `estado` era
 * un texto libre: un typo guardaba un estado inexistente que ningun filtro ni
 * reporte reconocia, y la cola de la oficina lo dejaba contando.
 */
const ESTADOS_TICKET = [
  'Registrado',
  'Asignado',
  'En Proceso',
  'En Conciliacion',
  'Resuelto',
  'Cerrado',
  'Cancelado'
];

function esEstadoValido(estado) {
  return ESTADOS_TICKET.includes(estado);
}

/** Genera el codigo visible del ticket usando la secuencia del esquema. */
async function generarCodigo(tipo) {
  const { rows } = await db.query("SELECT nextval('ticket_codigo_seq') AS n");
  return `${prefijoTicket(tipo)}${String(rows[0].n).padStart(5, '0')}`;
}

function aVista(ticket) {
  return {
    id: ticket.codigo,
    codigo: ticket.codigo,
    cedula: ticket.cedula,
    tipo: ticket.tipo,
    categoria: ticket.categoria,
    detalle: ticket.detalle,
    comprobanteUrl: ticket.comprobante_url,
    estado: ticket.estado,
    notaTecnica: ticket.nota_tecnica,
    fecha: ticket.creado_en
  };
}

async function crear({ cliente, tipo = 'falla', categoria, detalle, comprobanteUrl = null, ip = null }) {
  if (!detalle || String(detalle).trim().length < 5) {
    throw validacion('Describe el detalle del reporte (minimo 5 caracteres).');
  }
  if (String(detalle).length > 2000) {
    throw validacion('El detalle del reporte es demasiado largo (maximo 2000 caracteres).');
  }

  const tipoNormalizado = ['falla', 'pago', 'diagnostico'].includes(tipo) ? tipo : 'falla';
  const codigo = await generarCodigo(tipoNormalizado);

  const { rows } = await db.query(
    `INSERT INTO tickets (codigo, cliente_id, cedula, tipo, categoria, detalle, comprobante_url, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      codigo,
      cliente.id,
      cliente.cedula,
      tipoNormalizado,
      String(categoria || 'Sin categoria').trim().slice(0, 160),
      String(detalle).trim(),
      comprobanteUrl ? String(comprobanteUrl).slice(0, 500) : null,
      ESTADOS_POR_TIPO[tipoNormalizado]
    ]
  );

  const ticket = rows[0];
  await auditoria.registrar({
    actor: `cliente:${cliente.cedula}`,
    accion: 'ticket.creado',
    entidad: 'tickets',
    entidadId: codigo,
    ip,
    metadata: { tipo: tipoNormalizado, categoria: ticket.categoria }
  });

  return ticket;
}

async function listarPorCliente(cedula, { limite = 50, offset = 0 } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM tickets
      WHERE cedula = $1
      ORDER BY creado_en DESC
      LIMIT $2 OFFSET $3`,
    [cedula, limite, offset]
  );
  return rows;
}

async function listarTodos({ estado = null, tipo = null, limite = 100, offset = 0 } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM tickets
      WHERE ($1::text IS NULL OR estado = $1)
        AND ($2::text IS NULL OR tipo = $2)
      ORDER BY creado_en DESC
      LIMIT $3 OFFSET $4`,
    [estado, tipo, limite, offset]
  );
  return rows;
}

async function buscarPorCodigo(codigo, cedula = null) {
  const { rows } = await db.query(
    `SELECT * FROM tickets
      WHERE codigo = $1
        AND ($2::text IS NULL OR cedula = $2)
      LIMIT 1`,
    [codigo, cedula]
  );
  if (!rows[0]) throw noEncontrado('El ticket indicado no existe.');
  return rows[0];
}

async function actualizarEstado({ codigo, estado, notaTecnica = null, ip = null }) {
  if (!esEstadoValido(estado)) {
    throw validacion(`Estado de ticket no valido. Usa uno de: ${ESTADOS_TICKET.join(', ')}.`, {
      campo: 'estado'
    });
  }
  if (notaTecnica !== null && String(notaTecnica).length > 2000) {
    throw validacion('La nota tecnica no puede superar 2000 caracteres.', { campo: 'notaTecnica' });
  }

  const { rows } = await db.query(
    `UPDATE tickets
        SET estado = $1,
            nota_tecnica = COALESCE($2, nota_tecnica),
            actualizado_en = NOW()
      WHERE codigo = $3
      RETURNING *`,
    [estado, notaTecnica, codigo]
  );
  if (!rows[0]) throw noEncontrado('El ticket indicado no existe.');

  await auditoria.registrar({
    actor: 'admin',
    accion: 'ticket.actualizado',
    entidad: 'tickets',
    entidadId: codigo,
    ip,
    metadata: { estado }
  });

  return rows[0];
}

module.exports = {
  crear,
  listarPorCliente,
  listarTodos,
  buscarPorCodigo,
  actualizarEstado,
  aVista,
  ESTADOS_TICKET,
  esEstadoValido
};
