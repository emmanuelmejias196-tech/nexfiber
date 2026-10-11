'use strict';

/**
 * Carga de datos iniciales.
 *
 * Aplica database/seed.sql y, si se define SEED_PASSWORD, activa las cuentas
 * de demostracion con esa contrasena (guardada siempre como hash bcrypt).
 */

const fs = require('fs');
const config = require('../config/env');
const logger = require('../config/logger');
const db = require('./pool');
const { migrate } = require('./migrate');
const { hashearClave } = require('../utils/password');

async function seed() {
  const archivo = config.rutas.directorioSeed;
  if (!fs.existsSync(archivo)) {
    logger.warn(`No se encontro el archivo de semilla en ${archivo}; se omite.`);
    return;
  }

  const sql = fs.readFileSync(archivo, 'utf8');
  await db.query(sql);
  logger.info('Datos iniciales cargados desde seed.sql');

  const clave = process.env.SEED_PASSWORD;
  if (!clave) {
    logger.info(
      'SEED_PASSWORD no esta definido: las cuentas de demostracion quedan sin activar (se activan desde la app).'
    );
    return;
  }

  const hash = await hashearClave(clave);
  const { rows } = await db.query('SELECT id, cedula FROM clientes');
  for (const cliente of rows) {
    await db.query(
      'UPDATE clientes SET clave_hash = $1, activado = TRUE, actualizado_en = NOW() WHERE id = $2',
      [hash, cliente.id]
    );
  }
  logger.info(`Cuentas de demostracion activadas: ${rows.length}`);
}

if (require.main === module) {
  migrate()
    .then(seed)
    .then(() => db.closePool())
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error.message);
      process.exit(1);
    });
}

module.exports = { seed };
