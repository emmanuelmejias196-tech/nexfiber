'use strict';

const { AppError, validacion } = require('../utils/errors');
const logger = require('../config/logger');
const config = require('../config/env');

/** 404 para cualquier ruta no registrada. */
function noEncontrado(req, res) {
  res.status(404).json({
    success: false,
    error: 'RUTA_NO_ENCONTRADA',
    mensaje: `La ruta ${req.method} ${req.originalUrl} no existe en el servidor.`
  });
}

/**
 * Manejador global de errores.
 * Los AppError se muestran al cliente; el resto se registra y se responde
 * con 500 sin filtrar detalles internos.
 */
// eslint-disable-next-line no-unused-vars
function manejadorErrores(error, req, res, next) {
  if (error instanceof AppError) {
    if (error.codigoHttp >= 500) {
      logger.error(error.message, { ruta: req.originalUrl, codigo: error.codigoInterno });
    }
    return res.status(error.codigoHttp).json({
      success: false,
      error: error.codigoInterno,
      mensaje: error.message,
      ...(error.detalles ? { detalles: error.detalles } : {})
    });
  }

  if (error && error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'JSON_INVALIDO',
      mensaje: 'El cuerpo de la peticion no es JSON valido.'
    });
  }

  if (error && (error.code === '23505' || error.code === '23503')) {
    return res.status(409).json({
      success: false,
      error: 'CONFLICTO',
      mensaje: 'La operacion choca con un registro existente.'
    });
  }

  logger.error('Error no controlado', {
    ruta: req.originalUrl,
    mensaje: error && error.message,
    pila: config.esProduccion ? undefined : error && error.stack
  });

  res.status(500).json({
    success: false,
    error: 'ERROR_INTERNO',
    mensaje: 'Ocurrio un error inesperado en el servidor. Intenta de nuevo.'
  });
}

/** Envuelve un manejador async para que los rechazos lleguen al manejador global. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Valida el cuerpo de la peticion con un esquema de zod y reemplaza
 * req.body por el resultado ya parseado y saneado.
 */
function validarBody(esquema) {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join('.') || '(cuerpo)',
        mensaje: i.message
      }));
      return next(validacion('Los datos enviados no son validos.', detalles));
    }
    req.body = resultado.data;
    next();
  };
}

module.exports = { noEncontrado, manejadorErrores, asyncHandler, validarBody };
