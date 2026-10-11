'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { demasiadasPeticiones } = require('../utils/errors');

const desactivado = process.env.RATE_LIMIT_DISABLED === 'true' || process.env.NODE_ENV === 'test';

function crearLimitador({ max, ventanaMs, mensaje, nombre = 'global' }) {
  return rateLimit({
    keyGenerator: (req) => req.ip,
    windowMs: ventanaMs,
    max: desactivado ? 0 : max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => desactivado,
    handler: (req, res, next) => next(demasiadasPeticiones(mensaje))
  });
}

const quinceMinutos = 15 * 60 * 1000;

const limitadorGlobal = crearLimitador({
  max: config.seguridad.limitePeticionesGlobal,
  ventanaMs: quinceMinutos,
  mensaje: 'Demasiadas solicitudes desde este dispositivo. Intenta de nuevo en unos minutos.'
});

/** Limite estricto para activar cuenta e iniciar sesion: frena fuerza bruta. */
const limitadorAutenticacion = crearLimitador({
  max: config.seguridad.limiteAutenticacion,
  ventanaMs: quinceMinutos,
  mensaje: 'Demasiados intentos de acceso. Espera 15 minutos antes de reintentar.'
});

const limitadorEscritura = crearLimitador({
  max: config.seguridad.limiteEscritura,
  ventanaMs: quinceMinutos,
  mensaje: 'Demasiados envios seguidos. Espera un momento antes de continuar.'
});

module.exports = { limitadorGlobal, limitadorAutenticacion, limitadorEscritura, crearLimitador };
