'use strict';

const db = require('../db/pool');

async function listarPorCliente(clienteId) {
  const { rows } = await db.query(
    `SELECT id, periodo, monto_usd, estado, pdf_url, pagado_en
       FROM facturas
      WHERE cliente_id = $1
      ORDER BY periodo DESC`,
    [clienteId]
  );
  return rows.map((f) => ({
    id: f.id,
    periodo: f.periodo,
    montoUsd: Number(f.monto_usd),
    estado: f.estado,
    pdfUrl: f.pdf_url,
    pagadoEn: f.pagado_en
  }));
}

module.exports = { listarPorCliente };
