'use strict';

const db = require('../db/pool');

function aVista(plan) {
  return {
    id: plan.id,
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    velocidadDownMbps: plan.velocidad_down_mbps,
    velocidadUpMbps: plan.velocidad_up_mbps,
    precioUsd: Number(plan.precio_usd),
    activo: plan.activo
  };
}

async function listarActivos() {
  const { rows } = await db.query(
    'SELECT * FROM planes WHERE activo = TRUE ORDER BY precio_usd ASC, nombre ASC'
  );
  return rows.map(aVista);
}

async function buscarPorId(id) {
  const { rows } = await db.query('SELECT * FROM planes WHERE id = $1 LIMIT 1', [id]);
  return rows[0] ? aVista(rows[0]) : null;
}

async function listarTodos() {
  const { rows } = await db.query('SELECT * FROM planes ORDER BY precio_usd ASC');
  return rows.map(aVista);
}

module.exports = { listarActivos, listarTodos, buscarPorId, aVista };
