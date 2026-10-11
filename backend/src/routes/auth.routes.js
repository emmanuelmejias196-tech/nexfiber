'use strict';

const { z } = require('zod');
const router = require('express').Router();
const { asyncHandler, validarBody } = require('../middleware/errorHandler');
const { limitadorAutenticacion } = require('../middleware/rateLimit');
const { autenticar } = require('../middleware/auth');
const clienteService = require('../services/cliente.service');
const sesionService = require('../services/sesion.service');
const auditoria = require('../services/auditoria.service');
const { validacion } = require('../utils/errors');

const esquemaVerificar = z.object({
  cedula: z.string().min(4).max(20)
});

const esquemaActivar = z.object({
  cedula: z.string().min(4).max(20),
  clave: z.string().min(4).max(128),
  codigoActivacion: z.string().min(4).max(12).nullish()
});

const esquemaLogin = z.object({
  cedula: z.string().min(4).max(20),
  clave: z.string().min(1).max(128)
});

const esquemaRefresh = z.object({
  refreshToken: z.string().min(10).max(400)
});

const esquemaCambiarClave = z.object({
  claveActual: z.string().min(1).max(128),
  claveNueva: z.string().min(4).max(128)
});

function contexto(req) {
  return { ip: req.ip, userAgent: req.get('user-agent') || null };
}

/**
 * POST /api/app/verificar-cedula
 * Consulta el contrato precargado por la oficina. No requiere contrasena.
 * Respuesta compatible con la app Android: { nombre, plan, activado, ... }
 */
router.post(
  '/verificar-cedula',
  limitadorAutenticacion,
  validarBody(esquemaVerificar),
  asyncHandler(async (req, res) => {
    const resultado = await clienteService.verificarCedula(req.body.cedula);

    if (!resultado) {
      return res.status(404).json({
        success: false,
        error: 'CEDULA_NO_REGISTRADA',
        mensaje: 'La cedula no se encuentra registrada en la oficina de Cable Tartak.'
      });
    }

    res.json({
      success: true,
      ...resultado.vista,
      mensaje: resultado.cliente.activado
        ? 'Contrato verificado. Tu cuenta ya esta activada.'
        : 'Contrato verificado. Crea tu clave para continuar.'
    });
  })
);

/**
 * POST /api/app/activar-usuario
 * Crea la clave del cliente por primera vez y devuelve tokens de sesion.
 */
const activar = asyncHandler(async (req, res) => {
  const { cedula, clave, codigoActivacion } = req.body;
  const cliente = await clienteService.activarCuenta({ cedula, clave, codigoActivacion, ip: req.ip });
  const tokens = await sesionService.emitirSesion(cliente, contexto(req));

  res.status(201).json({
    success: true,
    mensaje: 'Tu cuenta fue activada correctamente. Bienvenido a Cable Tartak.',
    cliente: clienteService.aVistaPublica(cliente),
    ...tokens
  });
});

router.post('/activar-usuario', limitadorAutenticacion, validarBody(esquemaActivar), activar);

/**
 * POST /api/app/iniciar-sesion
 * Autentica contra el servidor y devuelve tokens. Sustituye a la validacion
 * local de la app, que comparaba la contrasena en claro.
 */
const iniciarSesion = asyncHandler(async (req, res) => {
  const cliente = await clienteService.autenticar({ ...req.body, ip: req.ip });
  const tokens = await sesionService.emitirSesion(cliente, contexto(req));

  await auditoria.registrar({
    actor: `cliente:${cliente.cedula}`,
    accion: 'acceso.ok',
    entidad: 'clientes',
    entidadId: String(cliente.id),
    ip: req.ip
  });

  res.json({
    success: true,
    mensaje: 'Sesion iniciada correctamente.',
    cliente: clienteService.aVistaPublica(cliente),
    ...tokens
  });
});

router.post('/iniciar-sesion', limitadorAutenticacion, validarBody(esquemaLogin), iniciarSesion);
router.post('/login', limitadorAutenticacion, validarBody(esquemaLogin), iniciarSesion);

router.post(
  '/refresh',
  validarBody(esquemaRefresh),
  asyncHandler(async (req, res) => {
    const tokens = await sesionService.refrescar({
      refreshToken: req.body.refreshToken,
      ...contexto(req)
    });
    res.json({ success: true, ...tokens });
  })
);

router.post(
  '/logout',
  validarBody(esquemaRefresh.partial()),
  asyncHandler(async (req, res) => {
    if (req.body.refreshToken) {
      await sesionService.revocar({ refreshToken: req.body.refreshToken });
    }
    res.json({ success: true, mensaje: 'Sesion cerrada.' });
  })
);

router.post(
  '/cambiar-clave',
  autenticar,
  validarBody(esquemaCambiarClave),
  asyncHandler(async (req, res) => {
    const cliente = await clienteService.buscarPorId(req.cliente.id);
    if (!cliente) throw validacion('No se encontro la cuenta.');
    await clienteService.cambiarClave({
      cliente,
      claveActual: req.body.claveActual,
      claveNueva: req.body.claveNueva,
      ip: req.ip
    });
    res.json({ success: true, mensaje: 'Tu contrasena fue actualizada. Vuelve a iniciar sesion.' });
  })
);

module.exports = router;
