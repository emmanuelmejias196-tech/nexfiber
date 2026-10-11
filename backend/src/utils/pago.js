'use strict';

/** Normalizacion de montos reportados por la app (pueden venir con $ o espacios). */

function normalizarPago(monto) {
  if (monto === null || monto === undefined) return '';
  return String(monto)
    .replace(/[$\s]/g, '')
    .trim();
}

module.exports = { normalizarPago };
