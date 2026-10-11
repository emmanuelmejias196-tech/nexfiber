'use strict';

/** Logger minimo con niveles y sin dependencias externas. */

const config = require('../config/env');

const NIVELES = { debug: 10, info: 20, warn: 30, error: 40 };
const umbral = NIVELES[process.env.LOG_LEVEL] || (config.esProduccion ? NIVELES.info : NIVELES.debug);

function formatear(nivel, mensaje,extra) {
  const base = `[${new Date().toISOString()}] ${nivel.toUpperCase().padEnd(5)} ${mensaje}`;
  if (extra === undefined) return base;
  try {
    return `${base} ${JSON.stringify(extra)}`;
  } catch {
    return base;
  }
}

function emitir(nivel, mensaje, extra) {
  if (NIVELES[nivel] < umbral) return;
  const linea = formatear(nivel, mensaje, extra);
  if (nivel === 'error') console.error(linea);
  else if (nivel === 'warn') console.warn(linea);
  else console.log(linea);
}

module.exports = {
  debug: (m, e) => emitir('debug', m, e),
  info: (m, e) => emitir('info', m, e),
  warn: (m, e) => emitir('warn', m, e),
  error: (m, e) => emitir('error', m, e)
};
