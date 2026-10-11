'use strict';

/**
 * Infraestructura de pruebas: PostgreSQL en memoria (pg-mem) + migraciones reales.
 * Permite ejecutar la suite completa sin levantar una base de datos.
 */

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_DISABLED = 'true';

// Solo se definen si el script de prueba no los fijó antes (p. ej. tests/smoke.js).
process.env.JWT_SECRET ||= 'secreto-de-pruebas-no-usar-en-produccion';
process.env.ADMIN_API_KEY ||= 'clave-admin-de-pruebas';

const { newDb } = require('pg-mem');
const db = require('../src/db/pool');
const { migrate } = require('../src/db/migrate');
const { crearApp } = require('../src/app');

let instancia = null;

async function crearBaseDeDatosEnMemoria() {
  const memoria = newDb({ autoCreateForeignKeyIndices: true });
  const adaptador = memoria.adapters.createPg();
  const pool = new adaptador.Pool();
  db.setPool(pool);

  await migrate({ soloPendientes: false });

  await pool.query(
    `INSERT INTO planes (id, nombre, descripcion, velocidad_down_mbps, velocidad_up_mbps, precio_usd)
     VALUES ('p1','Plan Basico - 100 Mbps','Basico',100,100,25.00),
            ('p2','Plan Plata - 200 Mbps','Plata',200,200,35.00),
            ('p3','Plan Oro - 300 Mbps','Oro',300,300,45.00),
            ('p4','Plan Gamer - 500 Mbps','Gamer',500,500,60.00)`
  );

  return { memoria, pool };
}

async function prepararEntorno() {
  if (instancia) return instancia;
  const { pool } = await crearBaseDeDatosEnMemoria();
  instancia = { app: crearApp(), pool };
  return instancia;
}

/** Crea un contrato de prueba. Devuelve la fila creada. */
async function crearCliente(overrides = {}) {
  const datos = {
    cedula: 'V-28000000',
    nombre: 'Cliente de Prueba',
    plan_id: 'p3',
    plan: 'Plan Oro - 300 Mbps',
    mensualidad_usd: 45,
    ...overrides
  };

  const { rows } = await db.query(
    `INSERT INTO clientes (cedula, nombre, plan_id, plan, mensualidad_usd, fecha_corte, direccion, telefono)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (cedula) DO UPDATE SET nombre = EXCLUDED.nombre
     RETURNING *`,
    [
      datos.cedula,
      datos.nombre,
      datos.plan_id,
      datos.plan,
      datos.mensualidad_usd,
      datos.fechaCorte || '15 de cada mes',
      datos.direccion || 'Sector Centro',
      datos.telefono || '04141234567'
    ]
  );
  return rows[0];
}

async function limpiar() {
  await db.query('DELETE FROM auditoria');
  await db.query('DELETE FROM refresh_tokens');
  await db.query('DELETE FROM codigos_activacion');
  await db.query('DELETE FROM solicitudes_cambio_plan');
  await db.query('DELETE FROM pagos_c2p');
  await db.query('DELETE FROM tickets');
  await db.query('DELETE FROM facturas');
  await db.query('DELETE FROM clientes');
}

module.exports = { prepararEntorno, crearCliente, limpiar, db };
