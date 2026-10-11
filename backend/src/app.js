'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const config = require('./config/env');
const logger = require('./config/logger');
const { limitadorGlobal } = require('./middleware/rateLimit');
const { noEncontrado, manejadorErrores } = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const appRoutes = require('./routes/app.routes');
const pagosRoutes = require('./routes/pagos.routes');
const adminRoutes = require('./routes/admin.routes');
const consolaRoutes = require('./routes/consola.routes');
const legacyRoutes = require('./routes/legacy.routes');

const MENSAJE_RAIZ =
  '⚡ Servidor Central NEXFIBER con Multi-usuarios Operando.';

function crearApp() {
  const app = express();

  // Detras de proxies (Render) para obtener la IP real en el rate limit.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.set('etag', false);

  app.use(
    helmet({
      // API sin HTML: se desactiva la CSP y se permite CORS desde cualquier
      // origen porque el cliente es una app movil (sin cookies ni credenciales).
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  const permitirTodos = config.seguridad.corsOrigins.includes('*');
  app.use(
    cors({
      origin: permitirTodos ? true : config.seguridad.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
      maxAge: 86400
    })
  );

  app.use(compression());
  // Limite duro del cuerpo: los reportes no necesitan mas de 64 KB.
  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));

  app.use(limitadorGlobal);

  app.use((req, res, next) => {
    const inicio = Date.now();
    res.on('finish', () => {
      if (req.path === '/health' || req.path === '/api/health') return;
      logger.debug(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - inicio}ms`);
    });
    next();
  });

  // Raiz: se conserva el texto exacto que la app mostraba en el pie de pagina.
  app.get('/', (req, res) => {
    res.type('text/plain; charset=utf-8').send(MENSAJE_RAIZ);
  });

  app.get('/version', (req, res) => {
    res.json({ success: true, version: config.version, entorno: config.nodeEnv });
  });

  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);

  // API actual (app con sesion y tokens)
  app.use('/api/app', authRoutes);
  app.use('/api/app', appRoutes);

  // Pagos C2P
  app.use('/api/pagos', pagosRoutes);

  // Consola de oficina
  app.use('/api/admin', adminRoutes);

  // Consola web de operacion (/consola) con su propia sesion por cookie.
  app.use(consolaRoutes);

  // Rutas heredadas: se montan bajo /api y en la raiz.
  app.use('/api', legacyRoutes);
  app.use('/', legacyRoutes);

  app.use(noEncontrado);
  app.use(manejadorErrores);

  return app;
}

module.exports = { crearApp, MENSAJE_RAIZ };
