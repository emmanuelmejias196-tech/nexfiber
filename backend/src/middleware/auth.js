'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const db = require('../db/pool');
const { noAutorizado, prohibido } = require('../utils/errors');
const { sha256, compararEnTiempoConstante } = require('../utils/password');

function firmarAccessToken(cliente) {
  return jwt.sign(
    {
      sub: String(cliente.id),
      cedula: cliente.cedula,
      nombre: cliente.nombre,
      rol: 'cliente',
      typ: 'access'
    },
    config.auth.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.auth.accessTtlSegundos,
      issuer: config.auth.issuer
    }
  );
}

function firmarRefreshToken(cliente, { userAgent = null, ip = null } = {}) {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiraEn = new Date(Date.now() + config.auth.refreshTtlDias * 86400000);

  db.query(
    `INSERT INTO refresh_tokens (id, cliente_id, token_hash, expira_en, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [crypto.randomUUID(), cliente.id, sha256(token), expiraEn, userAgent, ip]
  ).catch((error) => {
    require('../config/logger').error('No se pudo guardar el refresh token', { mensaje: error.message });
  });

  return { token, expiraEn };
}

/** Verifica el JWT de acceso y carga req.cliente. */
async function autenticar(req, res, next) {
  try {
    const encabezado = req.get('authorization') || '';
    const [esquema, token] = encabezado.split(' ');

    if (!token || String(esquema).toLowerCase() !== 'bearer') {
      throw noAutorizado('Falta el token de sesion. Inicia sesion nuevamente.');
    }

    let payload;
    try {
      payload = jwt.verify(token, config.auth.jwtSecret, {
        algorithms: ['HS256'],
        issuer: config.auth.issuer
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw noAutorizado('Tu sesion expiro. Inicia sesion nuevamente.');
      }
      throw noAutorizado('Token de sesion invalido.');
    }

    if (payload.typ !== 'access') throw noAutorizado('Token de sesion invalido.');

    const { rows } = await db.query(
      `SELECT id, cedula, nombre, plan, plan_id, activado, servicio_activo, mensualidad_usd,
              saldo_pendiente_usd, fecha_corte, ont_serial, ip_asignada, potencia_optica_dbm,
              estado_fibra, direccion, telefono
         FROM clientes
        WHERE id = $1`,
      [payload.sub]
    );

    const cliente = rows[0];
    if (!cliente) throw noAutorizado('La cuenta asociada a la sesion ya no existe.');
    if (!cliente.activado) throw prohibido('Tu cuenta aun no ha sido activada.');

    req.cliente = cliente;
    next();
  } catch (error) {
    next(error);
  }
}

/** Autenticacion de la consola de oficina / API administrativa. */
function autenticarAdmin(req, res, next) {
  const configurada = config.seguridad.adminKey;
  if (!configurada) {
    return next(
      prohibido('La API administrativa esta deshabilitada: define ADMIN_API_KEY en el panel de Render.')
    );
  }

  const recibido = req.get('x-admin-key') || (req.query && req.query.adminKey) || '';
  if (!compararEnTiempoConstante(recibido, configurada)) {
    return next(noAutorizado('Clave de administracion invalida.'));
  }
  req.admin = { rol: 'admin' };
  next();
}

module.exports = {
  autenticar,
  autenticarAdmin,
  firmarAccessToken,
  firmarRefreshToken
};
