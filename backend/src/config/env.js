'use strict';

/**
 * Configuracion por variables de entorno.
 * Ningun secreto se escribe en el codigo: todo llega desde process.env.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

const raizBackend = path.resolve(__dirname, '..', '..');
const raizRepo = path.resolve(raizBackend, '..');

// Carga .env solo en desarrollo local; en Render las variables llegan del entorno.
const envFile = path.join(raizBackend, '.env');
if (fs.existsSync(envFile) && !process.env.RENDER) {
  dotenv.config({ path: envFile });
}

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on', 'si'].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * En desarrollo generamos secretos efimeros para que el arranque local no
 * falle por falta de configuracion. En produccion (NODE_ENV=production) es
 * obligatorio: si falta JWT_SECRET el proceso no arranca.
 */
function resolverSecreto(nombre, bytes) {
  const valor = process.env[nombre];
  if (valor && valor.trim().length > 0) return valor.trim();

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Falta la variable de entorno obligatoria ${nombre}. Definela en el panel de Render o en backend/.env.`
    );
  }

  const efimero = crypto.randomBytes(bytes).toString('hex');
  console.warn(
    `[config] ${nombre} no esta definido: se genera un valor efimero para esta sesion de desarrollo. ` +
      'Las sesiones no sobreviviran a un reinicio. Define la variable para trabajar de forma estable.'
  );
  return efimero;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const esProduccion = nodeEnv === 'production';

const config = {
  nodeEnv,
  esProduccion,
  puerto: int(process.env.PORT, 3000),
  version: process.env.APP_VERSION || '1.0.0',
  nombreApp: 'Cable Tartak API',

  db: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
    ssl: bool(process.env.DATABASE_SSL, esProduccion),
    maxConexiones: int(process.env.DATABASE_POOL_MAX, 10),
    idleTimeoutMs: int(process.env.DATABASE_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMs: int(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10000),
    aplicarMigracionesAlArrancar: bool(process.env.MIGRATE_ON_BOOT, false)
  },

  auth: {
    jwtSecret: resolverSecreto('JWT_SECRET', 48),
    issuer: process.env.JWT_ISSUER || 'cable-tartak-api',
    accessTtlSegundos: int(process.env.JWT_ACCESS_TTL, 30 * 60),
    refreshTtlDias: int(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
    bcryptRounds: int(process.env.BCRYPT_ROUNDS, 12),
    // Cuando es true, crear la clave exige ademas un codigo de un solo uso.
    activacionRequiereOtp: bool(process.env.ACTIVATION_REQUIRES_OTP, false)
  },

  seguridad: {
    adminKey: process.env.ADMIN_API_KEY || '',
    corsOrigins: (process.env.CORS_ORIGINS || '*')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    limitePeticionesGlobal: int(process.env.RATE_LIMIT_GLOBAL, 600),
    limiteAutenticacion: int(process.env.RATE_LIMIT_AUTH, 10),
    limiteEscritura: int(process.env.RATE_LIMIT_WRITE, 60),
    longitudMinimaClave: int(process.env.PASSWORD_MIN_LENGTH, 6),
    longitudMaximaClave: int(process.env.PASSWORD_MAX_LENGTH, 128)
  },

  pagos: {
    requiereFirmaBancaria: bool(process.env.C2P_REQUIRE_SIGNATURE, false),
    firmaSecreta: process.env.C2P_SIGNATURE_SECRET || '',
    timeoutSwitchMs: int(process.env.C2P_SWITCH_TIMEOUT_MS, 4000)
  },

  rutas: {
    directorioMigraciones:
      process.env.MIGRATIONS_DIR || path.join(raizRepo, 'database', 'migrations'),
    directorioSeed: process.env.SEED_FILE || path.join(raizRepo, 'database', 'seed.sql')
  },

  raizRepo,
  raizBackend
};

module.exports = config;
module.exports.bool = bool;
module.exports.int = int;
