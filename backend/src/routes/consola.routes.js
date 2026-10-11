'use strict';

/** Rutas de la consola web de oficina. Se sirve desde /consola */

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { z } = require('zod');
const busquedaService = require('../services/busqueda.service');
const clienteService = require('../services/cliente.service');
const ticketService = require('../services/ticket.service');
const solicitudService = require('../services/solicitud.service');
const planService = require('../services/plan.service');
const db = require('../db/pool');
const { compararEnTiempoConstante } = require('../utils/password');
const { noAutorizado, validacion } = require('../utils/errors');
const config = require('../config/env');
const { validarBody, asyncHandler } = require('../middleware/errorHandler');

const DIRECTORIO_PUBLICO = path.resolve(__dirname, '..', 'public');
const router = express.Router();

/**
 * La consola es una pagina web: el navegador no puede leer `x-admin-key` de
 * forma segura, asi que se pide por POST y se entrega una cookie de sesion
 * firmada con el mismo secreto de la API. La clave nunca viaja en la URL ni
 * queda en el historial del navegador.
 */
const COOKIE_SESION = 'tartak_consola';
const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

/**
 * Sesiones activas en memoria. La cookie esta firmada, pero firmarla no la
 * revoca: sin este registro, un "cerrar sesion" no invalidaria nada y una
 * cookie robada serviria hasta 8 horas. Nota: es por instancia; si Render
 * escala horizontalmente hay que mover este registro a la base de datos.
 */
const sesionesActivas = new Map();

function limpiarSesionesVencidas() {
  const ahora = Date.now();
  for (const [id, expira] of sesionesActivas) {
    if (expira <= ahora) sesionesActivas.delete(id);
  }
}

function firmarCookie(valor) {
  const firma = crypto.createHmac('sha256', config.seguridad.adminKey).update(valor).digest('hex');
  return `${valor}.${firma}`;
}

function verificarCookie(cookie) {
  if (!cookie || !cookie.includes('.')) return null;
  const [valor, firma] = cookie.split('.');
  if (!compararEnTiempoConstante(cookie, firmarCookie(valor))) return null;
  return valor;
}

function leerCookie(req, nombre) {
  const bruto = req.headers.cookie || '';
  for (const parte of bruto.split(';')) {
    const [clave, ...resto] = parte.trim().split('=');
    if (clave === nombre) return decodeURIComponent(resto.join('='));
  }
  return null;
}

function sesionValida(req) {
  if (!config.seguridad.adminKey) return false;
  const id = verificarCookie(leerCookie(req, COOKIE_SESION));
  if (!id) return false;
  limpiarSesionesVencidas();
  return sesionesActivas.has(id);
}

router.get('/consola', (req, res) => {
  if (!config.seguridad.adminKey) {
    return res
      .status(503)
      .send('La consola web esta deshabilitada: define ADMIN_API_KEY en el panel de Render.');
  }
  res.sendFile(path.join(DIRECTORIO_PUBLICO, 'consola.html'));
});

// Activos estaticos de la consola (css/js). Montados aparte de express.static
// global para no exponer el resto del directorio public.
router.use('/consola/assets', express.static(DIRECTORIO_PUBLICO, { index: false, maxAge: '1h' }));

router.post(
  '/consola/login',
  asyncHandler(async (req, res) => {
    if (!config.seguridad.adminKey) throw noAutorizado('La consola esta deshabilitada.');

    const clave = String(req.body?.clave || '');
    if (!compararEnTiempoConstante(clave, config.seguridad.adminKey)) {
      await db.query(
        `INSERT INTO auditoria (actor, accion, entidad, ip) VALUES ('consola', 'consola.acceso.fallido', $1, $2)`,
        [req.ip, String(req.get('user-agent') || '').slice(0, 60)]
      ).catch(() => {});
      throw noAutorizado('Clave de administracion incorrecta.');
    }

    limpiarSesionesVencidas();
    const id = crypto.randomBytes(24).toString('hex');
    sesionesActivas.set(id, Date.now() + DURACION_SESION_MS);

    res.cookie(COOKIE_SESION, firmarCookie(id), {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.esProduccion,
      maxAge: DURACION_SESION_MS
    });
    res.json({ success: true, mensaje: 'Sesion iniciada.' });
  })
);

router.post('/consola/logout', (req, res) => {
  const id = verificarCookie(leerCookie(req, COOKIE_SESION));
  if (id) sesionesActivas.delete(id);
  res.clearCookie(COOKIE_SESION);
  res.json({ success: true });
});

router.get('/consola/sesion', (req, res) => {
  res.json({ success: sesionValida(req), habilitada: Boolean(config.seguridad.adminKey) });
});

/** Middleware: a partir de aqui, todo exige sesion de consola valida. */
router.use('/consola/api', (req, res, next) => {
  if (!sesionValida(req)) {
    return next(noAutorizado('Inicia sesion en la consola.'));
  }
  next();
});

router.get(
  '/consola/api/resumen',
  asyncHandler(async (req, res) => {
    const clientes = await clienteService.contar();
    const { rows: porEstado } = await db.query(
      'SELECT estado, COUNT(*)::int AS total FROM tickets GROUP BY estado ORDER BY estado'
    );
    const { rows: pendientes } = await db.query(
      "SELECT COUNT(*)::int AS total FROM solicitudes_cambio_plan WHERE estado = 'Pendiente'"
    );
    const { rows: pagosHoy } = await db.query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(monto_bs), 0) AS total_bs
         FROM pagos_c2p WHERE CAST(creado_en AS date) = CURRENT_DATE`
    );
    res.json({ success: true, clientes, ticketsPorEstado: porEstado, solicitudesPendientes: pendientes[0].total, pagosHoy });
  })
);

router.get(
  '/consola/api/buscar',
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await busquedaService.buscarGlobal(req.query.q, { limite: req.query.limite })) });
  })
);

/** GET /consola/api/clientes  (listado completo; `listar` ya excluye clave_hash) */
router.get(
  '/consola/api/clientes',
  asyncHandler(async (req, res) => {
    const clientes = await clienteService.listar({
      limite: Math.min(Number.parseInt(req.query.limite, 10) || 100, 500)
    });
    res.json({ success: true, total: clientes.length, clientes });
  })
);

router.get(
  '/consola/api/tickets',
  asyncHandler(async (req, res) => {
    const tickets = await ticketService.listarTodos({
      estado: req.query.estado || null,
      tipo: req.query.tipo || null,
      limite: Math.min(Number.parseInt(req.query.limite, 10) || 100, 500)
    });
    res.json({ success: true, total: tickets.length, tickets: tickets.map(ticketService.aVista) });
  })
);

router.patch(
  '/consola/api/tickets/:codigo',
  validarBody(z.object({
    estado: z.string().min(3).max(48),
    notaTecnica: z.string().max(2000).nullish()
  })),
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.actualizarEstado({
      codigo: req.params.codigo,
      estado: req.body.estado,
      notaTecnica: req.body.notaTecnica,
      ip: req.ip
    });
    res.json({ success: true, ticket: ticketService.aVista(ticket) });
  })
);

router.get(
  '/consola/api/solicitudes',
  asyncHandler(async (req, res) => {
    res.json({ success: true, solicitudes: await solicitudService.listarTodas({ estado: req.query.estado || null }) });
  })
);

router.post(
  '/consola/api/solicitudes/:id/resolver',
  asyncHandler(async (req, res) => {
    const solicitud = await solicitudService.resolver({
      id: Number.parseInt(req.params.id, 10),
      estado: String(req.body?.estado || ''),
      nota: req.body?.nota || null,
      ip: req.ip
    });
    res.json({ success: true, solicitud });
  })
);

router.get(
  '/consola/api/planes',
  asyncHandler(async (req, res) => {
    res.json({ success: true, planes: await planService.listarTodos() });
  })
);

router.post(
  '/consola/api/clientes',
  asyncHandler(async (req, res) => {
    const cuerpo = req.body || {};
    if (!cuerpo.cedula || !cuerpo.nombre) {
      throw validacion('La cedula y el nombre son obligatorios.', {
        campo: !cuerpo.cedula ? 'cedula' : 'nombre'
      });
    }
    const cliente = await clienteService.crearCliente(cuerpo);
    res.status(201).json({ success: true, cliente });
  })
);

module.exports = router;
