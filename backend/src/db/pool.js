'use strict';

const { Pool } = require('pg');
const config = require('../config/env');
const logger = require('../config/logger');

let pool = null;

function construirPool() {
  if (!config.db.url) {
    throw new Error(
      'Falta DATABASE_URL (o POSTGRES_URL). Configura la conexion a PostgreSQL en backend/.env o en el panel de Render.'
    );
  }

  const creado = new Pool({
    connectionString: config.db.url,
    max: config.db.maxConexiones,
    idleTimeoutMillis: config.db.idleTimeoutMs,
    connectionTimeoutMillis: config.db.connectionTimeoutMs,
    // Render exige TLS en las bases gestionadas; en local se puede desactivar.
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false
  });

  creado.on('error', (err) => {
    logger.error('Error inesperado en el pool de PostgreSQL', { mensaje: err.message });
  });

  return creado;
}

function getPool() {
  if (!pool) pool = construirPool();
  return pool;
}

/**
 * Permite inyectar un pool alterno (se usa en las pruebas con pg-mem).
 */
function setPool(nuevo) {
  pool = nuevo;
  return pool;
}

async function query(texto, parametros) {
  return getPool().query(texto, parametros);
}

/** Ejecuta una consulta dentro de una transaccion; revierte ante cualquier error. */
async function withTransaction(fn) {
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    try {
      await cliente.query('ROLLBACK');
    } catch (errorRollback) {
      logger.error('No se pudo revertir la transaccion', { mensaje: errorRollback.message });
    }
    throw error;
  } finally {
    cliente.release();
  }
}

async function ping() {
  const resultado = await query('SELECT 1 AS ok');
  return resultado.rows[0] && resultado.rows[0].ok === 1;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, setPool, query, withTransaction, ping, closePool };
