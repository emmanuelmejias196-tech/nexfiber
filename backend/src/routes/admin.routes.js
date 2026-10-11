'use strict';

const { z } = require('zod');
const router = require('express').Router();
const { asyncHandler, validarBody } = require('../middleware/errorHandler');
const { autenticarAdmin } = require('../middleware/auth');
const clienteService = require('../services/cliente.service');
const ticketService = require('../services/ticket.service');
const solicitudService = require('../services/solicitud.service');
const planService = require('../services/plan.service');
const busquedaService = require('../services/busqueda.service');
const sesionService = require('../services/sesion.service');
const db = require('../db/pool');

const esquemaCliente = z.object({
  cedula: z.string().min(4).max(20),
  nombre: z.string().min(3).max(160),
  plan: z.string().min(2).max(120).default('Plan Oro - 300 Mbps'),
  planId: z.string().max(32).nullish(),
  mensualidadUsd: z.coerce.number().min(0).max(100000).nullish(),
  ontSerial: z.string().max(64).nullish(),
  ipAsignada: z.string().max(45).nullish(),
  potenciaOpticaDbm: z.coerce.number().min(-60).max(10).nullish(),
  estadoFibra: z.string().max(64).nullish(),
  fechaCorte: z.string().max(64).nullish(),
  direccion: z.string().max(300).nullish(),
  telefono: z.string().max(24).nullish(),
  servicioActivo: z.boolean().nullish()
});

const esquemaEstadoTicket = z.object({
  estado: z.string().min(3).max(48),
  notaTecnica: z.string().max(2000).nullish()
});

const esquemaResolverSolicitud = z.object({
  estado: z.enum(['Aprobado', 'Rechazado']),
  nota: z.string().max(1000).nullish()
});

/** Todas las rutas exigen x-admin-key. */
router.use(autenticarAdmin);

/** Panel resumen para la oficina. */
router.get(
  '/resumen',
  asyncHandler(async (req, res) => {
    const clientes = await clienteService.contar();
    const { rows: porEstado } = await db.query(
      'SELECT estado, COUNT(*)::int AS total FROM tickets GROUP BY estado ORDER BY estado'
    );
    const { rows: pendientes } = await db.query(
      "SELECT COUNT(*)::int AS total FROM solicitudes_cambio_plan WHERE estado = 'Pendiente'"
    );
    const { rows: pagosHoy } = await db.query(
      "SELECT COUNT(*)::int AS total, COALESCE(SUM(monto_bs), 0) AS total_bs FROM pagos_c2p WHERE creado_en >= CURRENT_DATE"
    );

    res.json({
      success: true,
      clientes,
      ticketsPorEstado: porEstado,
      solicitudesPendientes: pendientes[0].total,
      pagosHoy
    });
  })
);

/** Precargar / actualizar un contrato (sustituye al alta local en la app). */
router.post(
  '/clientes',
  validarBody(esquemaCliente),
  asyncHandler(async (req, res) => {
    const cliente = await clienteService.crearCliente(req.body);
    res.status(201).json({ success: true, mensaje: 'Contrato registrado.', cliente: clienteService.aVistaPublica(cliente) });
  })
);

router.get(
  '/clientes',
  asyncHandler(async (req, res) => {
    const clientes = await clienteService.listar({
      limite: Math.min(Number.parseInt(req.query.limite, 10) || 50, 200),
      offset: Math.max(Number.parseInt(req.query.offset, 10) || 0, 0),
      soloActivados: req.query.activados === 'true'
    });
    res.json({ success: true, total: clientes.length, clientes: clientes.map(clienteService.aVistaPublica) });
  })
);

/** Listado de tickets con filtros para el NOC. */
router.get(
  '/tickets',
  asyncHandler(async (req, res) => {
    const tickets = await ticketService.listarTodos({
      estado: req.query.estado || null,
      tipo: req.query.tipo || null,
      limite: Math.min(Number.parseInt(req.query.limite, 10) || 100, 500),
      offset: Math.max(Number.parseInt(req.query.offset, 10) || 0, 0)
    });
    res.json({ success: true, total: tickets.length, tickets: tickets.map(ticketService.aVista) });
  })
);

router.patch(
  '/tickets/:codigo',
  validarBody(esquemaEstadoTicket),
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

/** Solicitudes de cambio de plan. */
router.get(
  '/solicitudes-plan',
  asyncHandler(async (req, res) => {
    const solicitudes = await solicitudService.listarTodas({ estado: req.query.estado || null });
    res.json({ success: true, solicitudes });
  })
);

router.post(
  '/solicitudes-plan/:id/resolver',
  validarBody(esquemaResolverSolicitud),
  asyncHandler(async (req, res) => {
    const solicitud = await solicitudService.resolver({
      id: Number.parseInt(req.params.id, 10),
      estado: req.body.estado,
      nota: req.body.nota,
      ip: req.ip
    });
    res.json({ success: true, solicitud });
  })
);

router.get(
  '/planes',
  asyncHandler(async (req, res) => {
    res.json({ success: true, planes: await planService.listarTodos() });
  })
);

/**
 * GET /api/admin/buscar?q=...
 * Busqueda global en toda la cartera: clientes, tickets, pagos, solicitudes y
 * facturas. Es lo que usa la consola web para encontrar cualquier cosa.
 */
router.get(
  '/buscar',
  asyncHandler(async (req, res) => {
    const resultado = await busquedaService.buscarGlobal(req.query.q, {
      limite: req.query.limite
    });
    res.json({ success: true, ...resultado });
  })
);

/** Housekeeping: elimina tokens de refresco caducados. */
router.post(
  '/mantenimiento/purgar-sesiones',
  asyncHandler(async (req, res) => {
    const purgados = await sesionService.purgarExpirados();
    res.json({ success: true, mensaje: `${purgados} sesiones caducadas eliminadas.` });
  })
);

module.exports = router;
