'use strict';

const { z } = require('zod');
const router = require('express').Router();
const { asyncHandler, validarBody } = require('../middleware/errorHandler');
const { autenticar, autenticarAdmin } = require('../middleware/auth');
const { limitadorEscritura } = require('../middleware/rateLimit');
const c2p = require('../payments/c2p');
const pagoService = require('../services/pago.service');

const esquemaC2P = z.object({
  telefono: z.string().min(10).max(20),
  cedula: z.string().min(4).max(20),
  codigoBanco: z.string().min(2).max(6),
  referencia: z.string().min(4).max(20),
  montoBs: z.union([z.number(), z.string()]),
  tokenC2P: z.string().max(64).nullish(),
  firma: z.string().max(256).nullish()
});

/**
 * POST /api/pagos/c2p-automatico
 * Conciliacion automatica de pago movil. Requiere sesion: el backend no
 * acepta notificaciones de pago anonimas.
 */
router.post(
  '/c2p-automatico',
  autenticar,
  limitadorEscritura,
  validarBody(esquemaC2P),
  asyncHandler(async (req, res) => {
    const resultado = await c2p.procesarPagoMovilC2P({
      ...req.body,
      // La identidad la aporta la sesion, no el cuerpo de la peticion.
      cedula: req.cliente.cedula
    });

    const codigo = resultado.exito ? 201 : 400;
    res.status(codigo).json({
      success: resultado.exito,
      ...resultado
    });
  })
);

/** GET /api/pagos/:transaccionId */
router.get(
  '/:transaccionId',
  autenticar,
  asyncHandler(async (req, res) => {
    const pago = await pagoService.obtenerPago(req.params.transaccionId);
    res.json({
      success: true,
      pago: {
        transaccionId: pago.transaccion_id,
        banco: pago.banco_nombre,
        referencia: pago.referencia,
        montoBs: Number(pago.monto_bs),
        estado: pago.estado,
        fechaHora: pago.creado_en
      }
    });
  })
);

/** Panel de conciliacion para la oficina. */
router.get(
  '/admin/pagos',
  autenticarAdmin,
  asyncHandler(async (req, res) => {
    const pagos = await c2p.listarPagos({ cedula: req.query.cedula || null, limite: 200 });
    res.json({ success: true, pagos });
  })
);

module.exports = router;
