'use strict';

const db = require('../db/pool');
const logger = require('../config/logger');

/**
 * Registro de acciones sensibles. Nunca debe romper la operacion principal:
 * si la auditoria falla, solo se avisa por log.
 */
async function registrar({ actor, accion, entidad = null, entidadId = null, ip = null, metadata = {} }) {
  try {
    await db.query(
      `INSERT INTO auditoria (actor, accion, entidad, entidad_id, ip, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [String(actor).slice(0, 64), accion, entidad, entidadId, ip, metadata]
    );
  } catch (error) {
    logger.warn('No se pudo escribir el registro de auditoria', { accion, mensaje: error.message });
  }
}

module.exports = { registrar };
