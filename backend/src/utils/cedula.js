'use strict';

/**
 * Normalizacion y validacion de cedulas venezolanas (V / E / J).
 * El cliente Android normaliza igual (ver formatCedula en el repositorio),
 * por lo que ambos extremos convergen al mismo formato canonico.
 */

const PREFIJOS = ['V', 'E', 'J'];
const PATRON = /^([VEJ])-?(\d{5,10})$/i;

/** Devuelve el formato canonico "V-12345678" o null si no es valida. */
function normalizarCedula(entrada) {
  if (typeof entrada !== 'string') return null;
  const limpio = entrada.trim().toUpperCase();
  if (!limpio) return null;

  const conPrefijo = /^[VEJ]-/.test(limpio) ? limpio : `V-${limpio}`;
  const coincidencia = PATRON.exec(conPrefijo);
  if (!coincidencia) return null;

  return `${coincidencia[1].toUpperCase()}-${coincidencia[2]}`;
}

/** Valida y normaliza; lanza un error 422 con mensaje claro si no es valida. */
function exigirCedula(entrada, campo = 'cedula') {
  const { validacion } = require('./errors');
  const normalizada = normalizarCedula(entrada);
  if (!normalizada) {
    throw validacion(
      'La cedula no tiene un formato valido. Ejemplos: 12345678 o V-12345678.',
      { campo, valor: typeof entrada === 'string' ? entrada.slice(0, 32) : null }
    );
  }
  return normalizada;
}

/** Extrae solo los digitos, util para comparaciones y busquedas. */
function soloDigitos(entrada) {
  if (typeof entrada !== 'string') return '';
  return entrada.replace(/\D/g, '');
}

module.exports = { normalizarCedula, exigirCedula, soloDigitos, PREFIJOS };
