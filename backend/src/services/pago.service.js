'use strict';

const db = require('../db/pool');
const { noEncontrado } = require('../utils/errors');
const c2p = require('../payments/c2p');

/**
 * Reporte de pago enviado por el cliente desde la app: genera un ticket de
 * tipo "pago" para que la oficina lo concilie. El saldo pendiente se reduce
 * solo cuando la oficina aprueba, no al reportar.
 */
async function registrarReportePago({ cliente, banco, referencia, monto, comprobanteUrl, ip = null }) {
  const ticketService = require('./ticket.service');

  const detalle = `Banco: ${String(banco || '').slice(0, 80)} | Ref: ${String(referencia || '').slice(0, 20)} | Monto: $${String(monto || '').slice(0, 20)}`;

  return ticketService.crear({
    cliente,
    tipo: 'pago',
    categoria: 'Reporte de Pago Movil / Transferencia',
    detalle,
    comprobanteUrl: comprobanteUrl || null,
    ip
  });
}

async function historialPagos(cedula) {
  return c2p.listarPagos({ cedula });
}

async function obtenerPago(transaccionId) {
  const { rows } = await db.query('SELECT * FROM pagos_c2p WHERE transaccion_id = $1 LIMIT 1', [
    transaccionId
  ]);
  if (!rows[0]) throw noEncontrado('La transaccion indicada no existe.');
  return rows[0];
}

module.exports = { registrarReportePago, historialPagos, obtenerPago, procesar: c2p.procesarPagoMovilC2P };
