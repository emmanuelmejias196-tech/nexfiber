'use strict';

/**
 * Punto de entrada compatible con la version anterior de este modulo.
 *
 * Antes exportaba `procesarPagoMovilC2P` y `BANCOS_PERMITIDOS` con un
 * registro de referencias en memoria. La implementacion real esta ahora en
 * src/payments/c2p.js, con la anti-replay persistida en PostgreSQL.
 *
 * Se mantiene este archivo para no romper integraciones existentes.
 */

const c2p = require('./src/payments/c2p');

module.exports = {
  procesarPagoMovilC2P: c2p.procesarPagoMovilC2P,
  consultarSwitchBancario: c2p.consultarSwitchBancario,
  listarPagos: c2p.listarPagos,
  BANCOS_PERMITIDOS: c2p.BANCOS_PERMITIDOS
};
