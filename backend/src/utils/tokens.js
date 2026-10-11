'use strict';

/** Generacion de tokens opacos para refresco y codigos de activacion. */

const crypto = require('crypto');

function tokenAleatorio(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Codigo numerico de 6 digitos para verificacion de activacion. */
function codigoNumerico(longitud = 6) {
  const maximo = 10 ** longitud;
  const valor = crypto.randomInt(0, maximo);
  return String(valor).padStart(longitud, '0');
}

function prefijoTicket(tipo) {
  if (tipo === 'pago') return 'PG-';
  if (tipo === 'diagnostico') return 'DG-';
  return 'TK-';
}

module.exports = { tokenAleatorio, codigoNumerico, prefijoTicket };
