'use strict';

const db = require('../db/pool');
const logger = require('../config/logger');

/**
 * Servicio de Sincronización NEXFIBER: Render PostgreSQL <-> Firebase Firestore
 * 
 * Regla de negocio:
 *  - PostgreSQL (Render) es la Fuente Única de Verdad para contratos, saldos y pagos.
 *  - Firebase Firestore es la capa de lectura y tiempo real para la App Móvil.
 */

// Configuración opcional de Firebase desde variables de entorno
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

/**
 * Comprueba si la integración de Firebase está configurada en el entorno.
 */
function estaConfigurado() {
  return Boolean(FIREBASE_PROJECT_ID);
}

/**
 * Sincroniza el perfil y estado de cuenta de un cliente hacia Firebase Firestore.
 */
async function sincronizarClienteAFirebase(clienteId) {
  if (!estaConfigurado()) {
    logger.debug(`[FirebaseSync] Sincronización omitida: FIREBASE_PROJECT_ID no configurado.`);
    return { ok: false, razon: 'firebase_no_configurado' };
  }

  try {
    const { rows } = await db.query(
      `SELECT c.id, c.cedula, c.nombres, c.apellidos, c.telefono, c.correo,
              c.saldo_pendiente, c.activo, c.firebase_uid,
              p.nombre AS plan_nombre, p.velocidad_mbps, p.precio_usd
       FROM clientes c
       LEFT JOIN planes p ON c.plan_id = p.id
       WHERE c.id = $1`,
      [clienteId]
    );

    if (rows.length === 0) {
      return { ok: false, razon: 'cliente_no_encontrado' };
    }

    const c = rows[0];
    const payload = {
      cedula: c.cedula,
      nombreCompleto: `${c.nombres} ${c.apellidos}`.trim(),
      telefono: c.telefono,
      correo: c.correo,
      plan: {
        nombre: c.plan_nombre,
        velocidad: c.velocidad_mbps,
        precioUsd: Number(c.precio_usd || 0)
      },
      servicioActivo: Boolean(c.activo),
      saldoPendienteUsd: Number(c.saldo_pendiente || 0),
      actualizadoEn: new Date().toISOString()
    };

    logger.info(`[FirebaseSync] Cliente ${c.cedula} preparado para Firestore:`, payload);
    return { ok: true, clienteId, payload };
  } catch (error) {
    logger.error(`[FirebaseSync] Error sincronizando cliente ${clienteId}:`, error);
    return { ok: false, error: error.message };
  }
}

/**
 * Sincroniza un ticket de avería o soporte hacia Firebase Firestore.
 */
async function sincronizarTicketAFirebase(ticketId) {
  if (!estaConfigurado()) return { ok: false, razon: 'firebase_no_configurado' };

  try {
    const { rows } = await db.query(
      `SELECT t.id, t.codigo, t.asunto, t.descripcion, t.estado, t.prioridad,
              t.creado_en, c.cedula
       FROM tickets t
       JOIN clientes c ON t.cliente_id = c.id
       WHERE t.id = $1`,
      [ticketId]
    );

    if (rows.length === 0) return { ok: false, razon: 'ticket_no_encontrado' };

    const t = rows[0];
    const payload = {
      codigo: t.codigo,
      cedula: t.cedula,
      asunto: t.asunto,
      descripcion: t.descripcion,
      estado: t.estado,
      prioridad: t.prioridad,
      creadoEn: t.creado_en
    };

    logger.info(`[FirebaseSync] Ticket ${t.codigo} preparado para Firestore:`, payload);
    return { ok: true, ticketId, payload };
  } catch (error) {
    logger.error(`[FirebaseSync] Error sincronizando ticket ${ticketId}:`, error);
    return { ok: false, error: error.message };
  }
}

/**
 * Procesa un reporte de pago originado en la App Móvil (Firestore) y lo registra en PostgreSQL.
 */
async function registrarPagoDesdeFirebase({ cedula, referencia, bancoOrigen, telefono, montoBs, tasaBcv, montoUsd }) {
  try {
    const { rows: clienteRows } = await db.query(
      `SELECT id FROM clientes WHERE cedula = $1 LIMIT 1`,
      [cedula]
    );

    if (clienteRows.length === 0) {
      return { ok: false, error: 'Cliente no encontrado en PostgreSQL' };
    }

    const clienteId = clienteRows[0].id;

    const { rows: pagoRows } = await db.query(
      `INSERT INTO pagos_c2p (cliente_id, referencia, banco_origen, telefono_pagador, monto_bs, tasa_bcv, monto_usd, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente')
       ON CONFLICT (referencia) DO NOTHING
       RETURNING id, referencia, estado`,
      [clienteId, referencia, bancoOrigen, telefono, montoBs, tasaBcv, montoUsd]
    );

    if (pagoRows.length === 0) {
      return { ok: false, error: 'El pago con esta referencia ya fue registrado previamente.' };
    }

    logger.info(`[FirebaseSync] Pago ${referencia} ingresado a PostgreSQL desde App Móvil.`);
    return { ok: true, pago: pagoRows[0] };
  } catch (error) {
    logger.error(`[FirebaseSync] Error registrando pago desde Firebase:`, error);
    return { ok: false, error: error.message };
  }
}

module.exports = {
  estaConfigurado,
  sincronizarClienteAFirebase,
  sincronizarTicketAFirebase,
  registrarPagoDesdeFirebase
};
