'use strict';

const config = require('./config/env');
const logger = require('./config/logger');
const db = require('./db/pool');
const { crearApp } = require('./app');
const { migrate } = require('./db/migrate');
const { purgarExpirados } = require('./services/sesion.service');

const app = crearApp();

async function principal() {
  if (config.db.aplicarMigracionesAlArrancar) {
    logger.info('MIGRATE_ON_BOOT=true: aplicando migraciones pendientes...');
    await migrate();
  }

  const servidor = app.listen(config.puerto, '0.0.0.0', () => {
    logger.info(`${config.nombreApp} v${config.version} escuchando en el puerto ${config.puerto}`, {
      entorno: config.nodeEnv
    });
  });

  servidor.keepAliveTimeout = 65000;
  servidor.headersTimeout = 66000;

  // Limpieza periodica de sesiones caducadas.
  const intervalo = setInterval(
    () => {
      purgarExpirados()
        .then((n) => n > 0 && logger.info(`Sesiones caducadas purgadas: ${n}`))
        .catch((e) => logger.warn('No se pudieron purgar las sesiones', { mensaje: e.message }));
    },
    6 * 60 * 60 * 1000
  );
  intervalo.unref();

  async function apagar(senal) {
    logger.info(`Senal ${senal} recibida: cerrando el servidor...`);
    clearInterval(intervalo);
    servidor.close(async () => {
      try {
        await db.closePool();
      } catch (error) {
        logger.warn('Error al cerrar el pool', { mensaje: error.message });
      }
      process.exit(0);
    });
    // Si las conexiones se resisten, se fuerza la salida.
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on('SIGTERM', () => apagar('SIGTERM'));
  process.on('SIGINT', () => apagar('SIGINT'));

  process.on('unhandledRejection', (motivo) => {
    logger.error('Promesa rechazada sin manejar', { motivo: String(motivo) });
  });
}

principal().catch((error) => {
  logger.error('No se pudo iniciar el servidor', { mensaje: error.message });
  process.exit(1);
});
