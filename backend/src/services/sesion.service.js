'use strict';

const db = require('../db/pool');
const config = require('../config/env');
const { noAutorizado } = require('../utils/errors');
const { sha256 } = require('../utils/password');
const { firmarAccessToken, firmarRefreshToken } = require('../middleware/auth');

/** Emite un par de tokens para una sesion recien iniciada. */
async function emitirSesion(cliente, { userAgent, ip }) {
  const accessToken = firmarAccessToken(cliente);
  const refresh = firmarRefreshToken(cliente, { userAgent, ip });
  return {
    accessToken,
    refreshToken: refresh.token,
    expiraEn: refresh.expiraEn,
    expiraEnSegundos: config.auth.accessTtlSegundos
  };
}

/**
 * Rota el token de refresco: el token recibido se revoca y se emite uno nuevo.
 * Detecta reutilizacion: si un token ya revocado se presenta otra vez, se
 * revoca toda la familia de sesiones del cliente.
 */
async function refrescar({ refreshToken, userAgent, ip }) {
  if (!refreshToken) throw noAutorizado('Falta el token de refresco.');

  const hash = sha256(refreshToken);
  const { rows } = await db.query(
    `SELECT rt.id, rt.cliente_id, rt.expira_en, rt.revocado_en, c.cedula, c.activado
       FROM refresh_tokens rt
       JOIN clientes c ON c.id = rt.cliente_id
      WHERE rt.token_hash = $1`,
    [hash]
  );

  const registro = rows[0];
  if (!registro) throw noAutorizado('Token de refresco invalido.');

  if (registro.revocado_en) {
    await db.query(
      'UPDATE refresh_tokens SET revocado_en = NOW() WHERE cliente_id = $1 AND revocado_en IS NULL',
      [registro.cliente_id]
    );
    throw noAutorizado('Sesion invalidada. Vuelve a iniciar sesion.');
  }

  if (new Date(registro.expira_en).getTime() <= Date.now()) {
    throw noAutorizado('Tu sesion expiro. Vuelve a iniciar sesion.');
  }

  if (!registro.activado) throw noAutorizado('La cuenta ya no esta activa.');

  await db.query('UPDATE refresh_tokens SET revocado_en = NOW() WHERE id = $1', [registro.id]);

  const cliente = await db.query('SELECT * FROM clientes WHERE id = $1', [registro.cliente_id]);
  return emitirSesion(cliente.rows[0], { userAgent, ip });
}

async function revocar({ refreshToken, clienteId = null }) {
  if (refreshToken) {
    await db.query('UPDATE refresh_tokens SET revocado_en = NOW() WHERE token_hash = $1', [
      sha256(refreshToken)
    ]);
    return;
  }
  if (clienteId) {
    await db.query(
      'UPDATE refresh_tokens SET revocado_en = NOW() WHERE cliente_id = $1 AND revocado_en IS NULL',
      [clienteId]
    );
  }
}

async function purgarExpirados() {
  const { rowCount } = await db.query('DELETE FROM refresh_tokens WHERE expira_en < NOW()');
  return rowCount;
}

module.exports = { emitirSesion, refrescar, revocar, purgarExpirados };
