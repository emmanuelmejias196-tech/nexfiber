'use strict';

/**
 * Rutas heredadas de la primera version del API.
 *
 * Se mantienen para que las APK ya instaladas en los telefonos sigan
 * funcionando. Todas estan limitadas por tasa y validan la entrada; las que
 * crean datos exigen ademas un token de sesion valido.
 */

const { z } = require('zod');
const router = require('express').Router();
const { asyncHandler, validarBody } = require('../middleware/errorHandler');
const { autenticar } = require('../middleware/auth');
const { limitadorEscritura } = require('../middleware/rateLimit');
const clienteService = require('../services/cliente.service');
const ticketService = require('../services/ticket.service');
const solicitudService = require('../services/solicitud.service');

const esquemaVerificar = z.object({ cedula: z.string().min(4).max(20) });
const esquemaActivar = z.object({ cedula: z.string().min(4).max(20), clave: z.string().min(4).max(128) });
const esquemaReporte = z.object({
  cedula: z.string().min(4).max(20),
  tipo: z.string().max(16).default('falla'),
  detalle: z.string().min(5).max(2000),
  categoria: z.string().max(160).nullish(),
  comprobante_url: z.string().max(500).nullish()
});
const esquemaCambio = z.object({ cedula: z.string().min(4).max(20), nuevoPlanId: z.string().min(1).max(32) });

/** POST /verificar-cedula */
router.post(
  '/verificar-cedula',
  validarBody(esquemaVerificar),
  asyncHandler(async (req, res) => {
    const resultado = await clienteService.verificarCedula(req.body.cedula);
    if (!resultado) {
      return res.status(404).json({ success: false, error: 'CEDULA_NO_REGISTRADA', mensaje: 'Cedula no encontrada.' });
    }
    res.json({ success: true, ...resultado.vista });
  })
);

/** POST /activar-usuario */
router.post(
  '/activar-usuario',
  validarBody(esquemaActivar),
  asyncHandler(async (req, res) => {
    const cliente = await clienteService.activarCuenta({ ...req.body, ip: req.ip });
    res.status(201).json({ success: true, mensaje: 'Cuenta activada.', cliente: clienteService.aVistaPublica(cliente) });
  })
);

/** POST /reportar-falla  (alias legacy de crear-reporte, sin sesion) */
router.post(
  '/reportar-falla',
  limitadorEscritura,
  validarBody(esquemaReporte),
  asyncHandler(async (req, res) => {
    const cliente = await clienteService.buscarPorCedula(req.body.cedula);
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'CEDULA_NO_REGISTRADA', mensaje: 'Cedula no encontrada.' });
    }

    const ticket = await ticketService.crear({
      cliente,
      tipo: req.body.tipo,
      categoria: req.body.categoria,
      detalle: req.body.detalle,
      comprobanteUrl: req.body.comprobante_url,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      mensaje: `Reporte ${ticket.codigo} recibido.`,
      ticketId: ticket.codigo,
      ticket: ticketService.aVista(ticket)
    });
  })
);

/** POST /solicitar-cambio */
router.post(
  '/solicitar-cambio',
  validarBody(esquemaCambio),
  asyncHandler(async (req, res) => {
    const cliente = await clienteService.buscarPorCedula(req.body.cedula);
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'CEDULA_NO_REGISTRADA', mensaje: 'Cedula no encontrada.' });
    }
    const solicitud = await solicitudService.crear({ cliente, planNuevoId: req.body.nuevoPlanId, ip: req.ip });
    res.status(201).json({
      success: true,
      mensaje: `Solicitud para ${solicitud.plan_nuevo_nombre} registrada.`,
      solicitudId: solicitud.id
    });
  })
);

/**
 * POST /api/crear-reporte con token: la variante actual y recomendada.
 * Se expone aqui para que la app nueva use la misma ruta con Bearer.
 */
router.post(
  '/crear-reporte',
  autenticar,
  limitadorEscritura,
  validarBody(esquemaReporte.omit({ cedula: true })),
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.crear({
      cliente: req.cliente,
      tipo: req.body.tipo,
      categoria: req.body.categoria,
      detalle: req.body.detalle,
      comprobanteUrl: req.body.comprobante_url,
      ip: req.ip
    });
    res.status(201).json({
      success: true,
      mensaje: `Reporte ${ticket.codigo} recibido.`,
      ticketId: ticket.codigo,
      ticket: ticketService.aVista(ticket)
    });
  })
);

module.exports = router;
