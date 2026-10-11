'use strict';

const { z } = require('zod');
const router = require('express').Router();
const { asyncHandler, validarBody } = require('../middleware/errorHandler');
const { autenticar } = require('../middleware/auth');
const { limitadorEscritura } = require('../middleware/rateLimit');
const clienteService = require('../services/cliente.service');
const ticketService = require('../services/ticket.service');
const solicitudService = require('../services/solicitud.service');
const planService = require('../services/plan.service');
const pagoService = require('../services/pago.service');
const facturaService = require('../services/factura.service');
const busquedaService = require('../services/busqueda.service');
const { validacion } = require('../utils/errors');

const esquemaReporte = z.object({
  tipo: z.enum(['falla', 'pago', 'diagnostico']).default('falla'),
  categoria: z.string().min(3).max(160).default('Sin categoria'),
  detalle: z.string().min(5).max(2000),
  comprobante_url: z.string().max(500).nullish(),
  cedula: z.string().max(20).nullish()
});

const esquemaCambioPlan = z.object({
  nuevoPlanId: z.string().min(1).max(32),
  cedula: z.string().max(20).nullish()
});

/** GET /api/app/mi-perfil */
router.get(
  '/mi-perfil',
  autenticar,
  asyncHandler(async (req, res) => {
    const cliente = await clienteService.buscarPorId(req.cliente.id);
    const tickets = await ticketService.listarPorCliente(cliente.cedula, { limite: 5 });
    const solicitudes = await solicitudService.listarPorCliente(cliente.cedula);
    const facturas = await facturaService.listarPorCliente(cliente.id);

    res.json({
      success: true,
      cliente: clienteService.aVistaPublica(cliente),
      ticketsRecientes: tickets.map(ticketService.aVista),
      solicitudesPlan: solicitudes,
      facturas
    });
  })
);

/**
 * POST /api/app/crear-reporte
 * Alta de averia, pago o diagnostico. El codigo lo asigna el servidor, de modo
 * que la app ya no genera identificadores locales que divergen del backend.
 */
router.post(
  '/crear-reporte',
  autenticar,
  limitadorEscritura,
  validarBody(esquemaReporte),
  asyncHandler(async (req, res) => {
    const cliente = req.cliente;
    const { tipo, categoria, detalle, comprobante_url: comprobanteUrl } = req.body;

    if (tipo === 'pago') {
      throw validacion(
        'Los pagos se registran con el endpoint de pagos. Usa POST /api/app/reporte-pago con los datos bancarios.'
      );
    }

    const ticket = await ticketService.crear({
      cliente,
      tipo,
      categoria,
      detalle,
      comprobanteUrl,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      mensaje: `Reporte ${ticket.codigo} recibido por el Centro de Operaciones de Red.`,
      ticketId: ticket.codigo,
      ticket: ticketService.aVista(ticket)
    });
  })
);

/** GET /api/app/tickets  (historial sincronizado con el servidor) */
router.get(
  '/tickets',
  autenticar,
  asyncHandler(async (req, res) => {
    const limite = Math.min(Number.parseInt(req.query.limite, 10) || 50, 200);
    const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
    const tickets = await ticketService.listarPorCliente(req.cliente.cedula, { limite, offset });
    res.json({ success: true, total: tickets.length, tickets: tickets.map(ticketService.aVista) });
  })
);

/** GET /api/app/tickets/:codigo */
router.get(
  '/tickets/:codigo',
  autenticar,
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.buscarPorCodigo(req.params.codigo, req.cliente.cedula);
    res.json({ success: true, ticket: ticketService.aVista(ticket) });
  })
);

/** POST /api/app/reporte-pago  (comprobante de pago movil / transferencia) */
const esquemaPago = z.object({
  banco: z.string().min(2).max(80),
  referencia: z.string().min(4).max(20),
  monto: z.string().min(1).max(20),
  comprobante_url: z.string().max(500).nullish()
});

router.post(
  '/reporte-pago',
  autenticar,
  limitadorEscritura,
  validarBody(esquemaPago),
  asyncHandler(async (req, res) => {
    const ticket = await pagoService.registrarReportePago({
      cliente: req.cliente,
      banco: req.body.banco,
      referencia: req.body.referencia,
      monto: req.body.monto,
      comprobanteUrl: req.body.comprobante_url,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      mensaje: 'Comprobante recibido. Administracion validara la transaccion.',
      ticketId: ticket.codigo,
      ticket: ticketService.aVista(ticket)
    });
  })
);

/**
 * POST /api/app/solicitar-cambio
 * Registra la solicitud; el plan actual se mantiene hasta la aprobacion.
 */
router.post(
  '/solicitar-cambio',
  autenticar,
  limitadorEscritura,
  validarBody(esquemaCambioPlan),
  asyncHandler(async (req, res) => {
    const solicitud = await solicitudService.crear({
      cliente: req.cliente,
      planNuevoId: req.body.nuevoPlanId,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      mensaje: `Solicitud para ${solicitud.plan_nuevo_nombre} registrada. Tu plan actual se mantiene hasta su aprobacion.`,
      solicitud: {
        id: solicitud.id,
        planActual: solicitud.plan_actual,
        planNuevo: solicitud.plan_nuevo_nombre,
        montoUsd: solicitud.monto_usd === null ? null : Number(solicitud.monto_usd),
        estado: solicitud.estado
      }
    });
  })
);

/** GET /api/app/solicitudes-plan */
router.get(
  '/solicitudes-plan',
  autenticar,
  asyncHandler(async (req, res) => {
    const solicitudes = await solicitudService.listarPorCliente(req.cliente.cedula);
    res.json({ success: true, solicitudes });
  })
);

/** GET /api/app/pagos  (historial de pagos C2P conciliados) */
router.get(
  '/pagos',
  autenticar,
  asyncHandler(async (req, res) => {
    const pagos = await pagoService.historialPagos(req.cliente.cedula);
    res.json({ success: true, pagos });
  })
);

/** GET /api/app/facturas */
router.get(
  '/facturas',
  autenticar,
  asyncHandler(async (req, res) => {
    const facturas = await facturaService.listarPorCliente(req.cliente.id);
    res.json({ success: true, facturas });
  })
);

/** GET /api/app/planes  (publico: alimenta el catalogo de la app) */
router.get(
  '/planes',
  asyncHandler(async (req, res) => {
    res.json({ success: true, planes: await planService.listarActivos() });
  })
);

/**
 * GET /api/app/buscar?q=...
 *
 * Busqueda del cliente sobre SUS PROPIOS datos: tickets, pagos, solicitudes de
 * plan y facturas. Nunca consulta contratos de otros clientes.
 */
router.get(
  '/buscar',
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = await busquedaService.buscarGlobal(req.query.q, {
      cedula: req.cliente.cedula,
      clienteId: req.cliente.id
    });
    res.json({ success: true, ...resultado });
  })
);

module.exports = router;
