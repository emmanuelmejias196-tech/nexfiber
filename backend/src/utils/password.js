'use strict';

/**
 * Hash y verificacion de contrasenas.
 *
 * Se usa bcrypt (bcryptjs, implementacion en JS puro para no depender de
 * compilacion nativa en Render). El hash incluye su propia sal, por lo que
 * dos clientes con la misma clave producen cadenas distintas.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/env');

function roundsEfectivos() {
  // bcrypt acepta coste 4..31. En pruebas se reduce para no ralentizar.
  if (process.env.NODE_ENV === 'test') return 4;
  return Math.min(31, Math.max(4, config.auth.bcryptRounds));
}

async function hashearClave(clave) {
  return bcrypt.hash(clave, roundsEfectivos());
}

async function verificarClave(clave, hash) {
  if (!clave || !hash) return false;
  try {
    return await bcrypt.compare(clave, hash);
  } catch {
    return false;
  }
}

/** SHA-256 en hexadecimal: se usa para guardar tokens de refresco. */
function sha256(valor) {
  return crypto.createHash('sha256').update(String(valor)).digest('hex');
}

/** Compara dos cadenas en tiempo constante (evita filtraciones por temporizacion). */
function compararEnTiempoConstante(a, b) {
  const bufferA = Buffer.from(String(a ?? ''), 'utf8');
  const bufferB = Buffer.from(String(b ?? ''), 'utf8');
  if (bufferA.length !== bufferB.length) {
    // Compare igualmente para no filtrar la longitud por el tiempo de retorno.
    crypto.timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Politica de contrasena del cliente.
 * Devuelve un array de requisitos incumplidos (vacio = clave aceptable).
 */
function revisarPoliticaClave(clave) {
  const errores = [];
  const min = config.seguridad.longitudMinimaClave;
  const max = config.seguridad.longitudMaximaClave;

  if (typeof clave !== 'string' || clave.length === 0) {
    errores.push('La contrasena no puede estar vacia.');
    return errores;
  }
  if (clave.length < min) errores.push(`La contrasena debe tener al menos ${min} caracteres.`);
  if (clave.length > max) errores.push(`La contrasena no puede superar ${max} caracteres.`);
  if (/^\s|\s$/.test(clave)) errores.push('La contrasena no puede empezar ni terminar con espacios.');
  if (new Set(clave).size < 3) errores.push('La contrasena necesita al menos 3 caracteres distintos.');
  return errores;
}

module.exports = {
  hashearClave,
  verificarClave,
  sha256,
  compararEnTiempoConstante,
  revisarPoliticaClave
};
