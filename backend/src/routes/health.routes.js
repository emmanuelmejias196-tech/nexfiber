'use strict';

const router = require('express').Router();
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../db/pool');
const config = require('../config/env');

/**
 * Salud del servicio. Responde 200 aunque la base de datos falle, indicando el
 * estado en el cuerpo: asi el monitor de Render no reinicia el servicio por
 * un problema transitorio de conexion.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let baseDeDatos = { estado: 'desconocido' };
    const inicio = Date.now();

    try {
      await db.ping();
      baseDeDatos = { estado: 'ok', latenciaMs: Date.now() - inicio };
    } catch (error) {
      baseDeDatos = { estado: 'error', mensaje: error.message };
    }

    res.json({
      success: baseDeDatos.estado === 'ok',
      servicio: config.nombreApp,
      version: config.version,
      entorno: config.nodeEnv,
      tiempoActivoSegundos: Math.round(process.uptime()),
      memoriaMb: Math.round(process.memoryUsage().rss / 1048576),
      baseDeDatos,
      hora: new Date().toISOString()
    });
  })
);

module.exports = router;
