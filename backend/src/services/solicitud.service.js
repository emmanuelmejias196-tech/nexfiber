'use strict';

const db = require('../db/pool');
const { noEncontrado, validacion } = require('../utils/errors');
const planService = require('./plan.service');
const auditoria = require('./auditoria.service');

/**
 * Solicitud de cambio de plan.
 * El plan del cliente NO cambia hasta que la oficina la aprueba; por eso
 * queda como solicitud y no como UPDATE directo sobre clientes.
 */
async function crear({ cliente, planNuevoId, ip = null }) {
  const plan = await planService.buscarPorId(planNuevoId);
  if (!plan) {
    throw validacion('El plan solicitado no existe en el catalogo.', { planNuevoId });
  }
  if (!plan.activo) {
    throw validacion('El plan solicitado ya no esta disponible.', { planNuevoId });
  }
  if (plan.nombre === cliente.plan) {
    throw validacion('Ya tienes ese plan contratado.');
  }

  const { rows } = await db.query(
    `INSERT INTO solicitudes_cambio_plan
       (cliente_id, cedula, plan_actual, plan_nuevo_id, plan_nuevo_nombre, monto_usd, estado)
     VALUES ($1, $2, $3, $4, $5, $6, 'Pendiente')
     RETURNING *`,
    [cliente.id, cliente.cedula, cliente.plan, plan.id, plan.nombre, plan.precioUsd]
  );

  await auditoria.registrar({
    actor: `cliente:${cliente.cedula}`,
    accion: 'plan.solicitado',
    entidad: 'solicitudes_cambio_plan',
    entidadId: String(rows[0].id),
    ip,
    metadata: { de: cliente.plan, a: plan.nombre }
  });

  return rows[0];
}

async function listarPorCliente(cedula) {
  const { rows } = await db.query(
    `SELECT * FROM solicitudes_cambio_plan
      WHERE cedula = $1
      ORDER BY creado_en DESC`,
    [cedula]
  );
  return rows;
}

async function listarTodas({ estado = null } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM solicitudes_cambio_plan
      WHERE ($1::text IS NULL OR estado = $1)
      ORDER BY creado_en DESC`,
    [estado]
  );
  return rows;
}

/** Aprueba (y aplica) o rechaza una solicitud desde la oficina. */
async function resolver({ id, estado, nota = null, ip = null }) {
  if (!['Aprobado', 'Rechazado'].includes(estado)) {
    throw validacion('El estado debe ser "Aprobado" o "Rechazado".');
  }

  const resultado = await db.withTransaction(async (cliente) => {
    const { rows } = await cliente.query(
      `SELECT * FROM solicitudes_cambio_plan WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const solicitud = rows[0];
    if (!solicitud) throw noEncontrado('La solicitud indicada no existe.');
    if (solicitud.estado !== 'Pendiente') {
      throw validacion(`La solicitud ya fue ${solicitud.estado.toLowerCase()}.`);
    }

    await cliente.query(
      `UPDATE solicitudes_cambio_plan
          SET estado = $1, nota = $2, actualizado_en = NOW()
        WHERE id = $3`,
      [estado, nota, id]
    );

    if (estado === 'Aprobado' && solicitud.plan_nuevo_id) {
      await cliente.query(
        `UPDATE clientes
            SET plan = $1, plan_id = $2, mensualidad_usd = COALESCE($3, mensualidad_usd), actualizado_en = NOW()
          WHERE id = $4`,
        [solicitud.plan_nuevo_nombre, solicitud.plan_nuevo_id, solicitud.monto_usd, solicitud.cliente_id]
      );
    }

    return solicitud;
  });

  await auditoria.registrar({
    actor: 'admin',
    accion: `plan.${estado.toLowerCase()}`,
    entidad: 'solicitudes_cambio_plan',
    entidadId: String(id),
    ip
  });

  return resultado;
}

module.exports = { crear, listarPorCliente, listarTodas, resolver };
