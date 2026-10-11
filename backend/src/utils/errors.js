'use strict';

/**
 * Errores de aplicacion con codigo HTTP.
 * El manejador global los traduce a respuestas JSON consistentes.
 */

class AppError extends Error {
  constructor(codigoHttp, codigoInterno, mensaje, detalles = null) {
    super(mensaje);
    this.name = 'AppError';
    this.codigoHttp = codigoHttp;
    this.codigoInterno = codigoInterno;
    this.detalles = detalles;
    this.esEsperado = true;
  }
}

const noEncontrado = (mensaje = 'Recurso no encontrado') =>
  new AppError(404, 'NO_ENCONTRADO', mensaje);

const noAutorizado = (mensaje = 'Credenciales invalidas') =>
  new AppError(401, 'NO_AUTORIZADO', mensaje);

const prohibido = (mensaje = 'No tienes permiso para realizar esta accion') =>
  new AppError(403, 'PROHIBIDO', mensaje);

const conflicto = (mensaje, detalles = null) =>
  new AppError(409, 'CONFLICTO', mensaje, detalles);

const validacion = (mensaje = 'Datos invalidos', detalles = null) =>
  new AppError(422, 'VALIDACION', mensaje, detalles);

const demasiadasPeticiones = (mensaje = 'Demasiados intentos. Espera un momento e intenta de nuevo.') =>
  new AppError(429, 'DEMASIADAS_PETICIONES', mensaje);

const noDisponible = (mensaje = 'Servicio no disponible temporalmente') =>
  new AppError(503, 'NO_DISPONIBLE', mensaje);

module.exports = {
  AppError,
  noEncontrado,
  noAutorizado,
  prohibido,
  conflicto,
  validacion,
  demasiadasPeticiones,
  noDisponible
};
