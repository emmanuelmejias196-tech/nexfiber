import { createServer } from 'node:http';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getIntegrationStatus, providerCatalog, syncProvider } from './integrations.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const databasePath = process.env.CABLE_TARTAK_DB || join(root, 'data', 'cable-tartak.sqlite');
const port = Number(process.env.PORT || 3000);
const sessionDurationSeconds = 60 * 60 * 12;
const roles = ['dueño', 'admin', 'tecnico'];
const staticTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

mkdirSync(join(root, 'data'), { recursive: true });
const database = new DatabaseSync(databasePath);
const newLocal = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('dueño', 'admin', 'tecnico')),
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS client_credentials (
    cedula_normalized TEXT PRIMARY KEY,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS records (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY(collection, id)
  );
  CREATE INDEX IF NOT EXISTS records_collection_idx ON records(collection);
`;
database.exec(newLocal);

function inTransaction(operation) {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = operation();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

const recordCollections = [
  'clientes', 'fallas', 'planes', 'taquilla-virtual', 'alerta-masiva',
  'inventario', 'despachos', 'cajas-nap', 'notificaciones-tecnicos', 'ordenes-instalacion', 'cierres-caja', 'solicitudes-servicio'
];

function seedRecords() {
  const count = database.prepare('SELECT COUNT(*) AS count FROM records').get().count;
  if (count > 0) return;
  const seeds = {
    clientes: [
      { id: 'CLI-001', cedula: 'V-20145892', nombre: 'Carlos Mendoza', plan: 'Plan Oro - 300 Mbps', estado: 'Activo', fechaRegistro: '2026-01-15', telefono: '+58 414-5550192', direccion: 'Sector Las Acacias, Calle 4, Casa 12', sector: 'Las Acacias (NAP-04)', ipAsignada: '10.20.104.15', potenciaOpticaDbm: -19.4, montoDeuda: 0, costoMensualPlan: 50, estadoPago: 'Al Día', historialPagos: [] },
      { id: 'CLI-002', cedula: 'V-18765432', nombre: 'María Valentina Ríos', plan: 'Plan Plata - 200 Mbps', estado: 'Activo', fechaRegistro: '2026-02-03', telefono: '+58 412-8889921', direccion: 'Av. Libertador, Torre Azul, Apto 5-B', sector: 'Centro Norte (NAP-01)', ipAsignada: '10.20.101.44', potenciaOpticaDbm: -21.2, montoDeuda: 35, costoMensualPlan: 35, estadoPago: 'Pendiente', historialPagos: [] },
      { id: 'CLI-003', cedula: 'V-25678901', nombre: 'José Gregorio Ramos', plan: 'Plan Bronce - 100 Mbps', estado: 'Activo', fechaRegistro: '2026-02-20', telefono: '+58 416-3331122', direccion: 'Urb. Los Pinos, Vereda 8, Casa 15', sector: 'Los Pinos (NAP-08)', ipAsignada: '10.20.108.92', potenciaOpticaDbm: -27.8, montoDeuda: 50, costoMensualPlan: 25, estadoPago: 'En Mora', historialPagos: [] }
    ],
    planes: [
      { id: 'PLAN-001', nombre: 'Plan Bronce - 100 Mbps', velocidad: '100 Mbps', precio: 25, descripcion: 'Plan de fibra óptica de 100 Mbps.', activo: true, color: 'amber' },
      { id: 'PLAN-002', nombre: 'Plan Plata - 200 Mbps', velocidad: '200 Mbps', precio: 35, descripcion: 'Plan de fibra óptica de 200 Mbps.', activo: true, color: 'slate' },
      { id: 'PLAN-003', nombre: 'Plan Oro - 300 Mbps', velocidad: '300 Mbps', precio: 50, descripcion: 'Plan de fibra óptica de 300 Mbps.', activo: true, color: 'yellow' }
    ],
    fallas: [
      { id: 'INC-101', cedula: 'V-25678901', nombreCliente: 'José Gregorio Ramos', detalle: 'Sin servicio de internet; LOS encendido en la ONT.', prioridad: 'Crítica', estado: 'Pendiente', fechaReporte: new Date().toISOString(), sector: 'Los Pinos (NAP-08)', potenciaOpticaDbm: -32.5 },
      { id: 'INC-102', cedula: 'V-20145892', nombreCliente: 'Carlos Mendoza', detalle: 'Atenuación intermitente en acometida.', prioridad: 'Alta', estado: 'En Revisión', fechaReporte: new Date().toISOString(), sector: 'Las Acacias (NAP-04)', potenciaOpticaDbm: -26.9, tecnicoAsignado: 'Equipo de Campo FTTH' }
    ],
    inventario: [
      { id: 'INV-001', codigo: 'DROP-1H-FTTH', nombre: 'Cable Drop de fibra óptica', categoria: 'Cable Drop', cantidad: 620, unidad: 'metros', umbralMinimoAlerta: 500, alertaCompra: false, ubicacion: 'Almacén Central', ultimoReabastecimiento: new Date().toISOString().slice(0, 10) },
      { id: 'INV-002', codigo: 'FAST-SC-APC', nombre: 'Conectores rápidos SC/APC', categoria: 'Conectores', cantidad: 74, unidad: 'unidades', umbralMinimoAlerta: 20, alertaCompra: false, ubicacion: 'Almacén Central', ultimoReabastecimiento: new Date().toISOString().slice(0, 10) },
      { id: 'INV-003', codigo: 'ONT-GPON-WIFI', nombre: 'Módem ONT GPON', categoria: 'Equipos ONT', cantidad: 14, unidad: 'unidades', umbralMinimoAlerta: 5, alertaCompra: false, ubicacion: 'Almacén Central', ultimoReabastecimiento: new Date().toISOString().slice(0, 10) }
    ],
    despachos: [],
    'taquilla-virtual': [],
    'alerta-masiva': [
      { id: 'ALR-801', zona: 'Los Pinos (NAP-08)', activo: true, motivo: 'Avería de fibra en nodo sector Los Pinos', fecha: new Date().toISOString(), declaradoPor: 'Administración' }
    ],
    'cajas-nap': [
      { id: 'NAP-01', nombre: 'NAP-01 Centro Norte', sector: 'Centro Norte', ubicacionPoste: 'Poste 1', coordenadas: '', puertosTotales: 16, puertosOcupados: 8, potenciaEntradaDbm: -19, estado: 'Operativa', notas: '' },
      { id: 'NAP-04', nombre: 'NAP-04 Las Acacias', sector: 'Las Acacias', ubicacionPoste: 'Poste 4', coordenadas: '', puertosTotales: 16, puertosOcupados: 11, potenciaEntradaDbm: -20, estado: 'Operativa', notas: '' }
    ],
    'notificaciones-tecnicos': [],
    'ordenes-instalacion': [],
    'solicitudes-servicio': []
  };
  const insert = database.prepare('INSERT INTO records(collection, id, payload) VALUES (?, ?, ?)');
  const seed = () => inTransaction(() => {
    for (const [collection, items] of Object.entries(seeds)) {
      for (const item of items) insert.run(collection, item.id, JSON.stringify(item));
    }
  });
  seed();
}

seedRecords();

const getRecords = database.prepare('SELECT payload FROM records WHERE collection = ? ORDER BY rowid DESC');
const getRecord = database.prepare('SELECT payload FROM records WHERE collection = ? AND id = ?');
const insertRecord = database.prepare('INSERT INTO records(collection, id, payload) VALUES (?, ?, ?)');
const upsertRecord = database.prepare('INSERT INTO records(collection, id, payload) VALUES (?, ?, ?) ON CONFLICT(collection, id) DO UPDATE SET payload = excluded.payload');
const deleteRecord = database.prepare('DELETE FROM records WHERE collection = ? AND id = ?');

function listRecords(collection) {
  return getRecords.all(collection).map(row => JSON.parse(row.payload));
}

function readRecord(collection, id) {
  const row = getRecord.get(collection, String(id));
  return row ? JSON.parse(row.payload) : null;
}

function saveRecord(collection, value) {
  const record = { ...value, id: String(value.id || `${collection.slice(0, 3).toUpperCase()}-${randomBytes(5).toString('hex')}`) };
  upsertRecord.run(collection, record.id, JSON.stringify(record));
  return record;
}

function removeRecord(collection, id) {
  return deleteRecord.run(collection, String(id)).changes > 0;
}

const legacySamplePayment = readRecord('taquilla-virtual', 'PAG-VIRTUAL-001');
if (legacySamplePayment?.referencia === '9845' || legacySamplePayment?.referencia === '4812') {
  removeRecord('taquilla-virtual', legacySamplePayment.id);
}

function publicUser(user) {
  return { id: user.id, usuario: user.username, nombre: user.display_name, rol: user.role, activo: Boolean(user.active) };
}

function createPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function cookieValue(request, key) {
  const cookies = (request.headers.cookie || '').split(';');
  const match = cookies.map(part => part.trim()).find(part => part.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.slice(key.length + 1)) : '';
}

function setSession(response, user) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  database.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(tokenHash, user.id, expiresAt);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `ct_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionDurationSeconds}${secure}`);
}

function clearSession(response) {
  response.setHeader('Set-Cookie', 'ct_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
}

function getSessionUser(request) {
  const token = cookieValue(request, 'ct_session');
  if (!token) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const row = database.prepare(`
    SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.active = 1
  `).get(tokenHash, Math.floor(Date.now() / 1000));
  return row || null;
}

function send(response, status, payload, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 4_000_000) throw Object.assign(new Error('La solicitud es demasiado grande.'), { status: 413 });
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error('El cuerpo debe ser JSON válido.'), { status: 400 });
  }
}

function requireRoles(user, allowed) {
  return allowed.includes(user.role);
}

function normalizedId(value) {
  return String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function findClient(cedula) {
  const normalizedCedula = normalizedId(cedula);
  return listRecords('clientes').find(client => normalizedId(client.cedula) === normalizedCedula) || null;
}

function matchesClientPhone(client, phone) {
  const expected = String(client?.telefono || '').replace(/\D/g, '');
  const supplied = String(phone || '').replace(/\D/g, '');
  return expected.length >= 7 && supplied.length >= 7 && expected.endsWith(supplied.slice(-7));
}

function publicClient(client, activated = false) {
  return {
    cedula: client.cedula,
    nombre: client.nombre,
    plan: client.plan,
    telefono: client.telefono || '',
    activado: activated,
    mensualidadUsd: Number(client.costoMensualPlan || 0),
    servicioActivo: !client.esClientePrueba && client.estado === 'Activo',
    estadoServicio: client.estado || 'Pendiente',
    esClientePrueba: Boolean(client.esClientePrueba),
    napId: client.napId || '',
    napNombre: client.napNombre || '',
    puertoNap: client.puertoNap || null,
    serialOnt: client.serialOnt || '',
    potenciaOpticaDbm: typeof client.potenciaOpticaDbm === 'number' ? client.potenciaOpticaDbm : null
  };
}

function classifyFailure(detail) {
  const text = String(detail || '').toLowerCase();
  if (/apag[oó]n|sin luz|sin electricidad|sin corriente|corte el[eé]ctrico|falla el[eé]ctrica/.test(text)) {
    return { clasificacion: 'Posible interrupción eléctrica', prioridad: 'Media' };
  }
  if (/los|luz roja|fibra rota|cable roto|cortad[oa]|sin se[nñ]al|atenuaci[oó]n/.test(text)) {
    return { clasificacion: 'Posible falla física de fibra', prioridad: 'Alta' };
  }
  if (/intermitente|lento|wifi|wi-fi|conexi[oó]n inestable/.test(text)) {
    return { clasificacion: 'Conectividad intermitente', prioridad: 'Media' };
  }
  return { clasificacion: 'Revisión general', prioridad: 'Media' };
}

function matchingNapBoxes(sector) {
  const requested = normalizedId(sector);
  if (!requested) return [];
  return listRecords('cajas-nap').filter(box => {
    const identifiers = [box.sector, box.nombre, box.id].map(normalizedId).filter(Boolean);
    return identifiers.some(identifier => identifier.includes(requested) || requested.includes(identifier));
  });
}

function availableNapPorts(box) {
  const assigned = box.asignacionesPuertos
    ? box.asignacionesPuertos.filter(port => port.estado === 'Ocupado').length
    : Number(box.puertosOcupados || 0);
  return Math.max(0, Number(box.puertosTotales || 0) - assigned);
}

function recentSectorReports(sector, since = Date.now() - 30 * 60 * 1000) {
  const key = normalizedId(sector);
  if (!key) return [];
  return listRecords('fallas').filter(failure => {
    const created = Date.parse(failure.creadoEn || failure.fechaReporte || 0);
    return failure.estado !== 'Resuelto' && normalizedId(failure.sector) === key && created >= since;
  });
}

function businessDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function receiptsForUserAndDate(userId, date) {
  return listRecords('clientes').flatMap(client => (client.historialPagos || []).map(payment => ({
    ...payment,
    cedula: client.cedula,
    nombreCliente: client.nombre
  }))).filter(payment => payment.registradoPorId === userId && payment.fechaContable === date);
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function touchInventory(id, delta) {
  const item = readRecord('inventario', id);
  if (!item) return null;
  const nextAmount = Number(item.cantidad) + delta;
  if (nextAmount < 0) throw Object.assign(new Error(`Inventario insuficiente para ${item.nombre}.`), { status: 409 });
  return saveRecord('inventario', {
    ...item,
    cantidad: nextAmount,
    alertaCompra: nextAmount < Number(item.umbralMinimoAlerta || 0)
  });
}

async function handleApi(request, response, url) {
  const method = request.method || 'GET';
  const path = url.pathname;
  const user = getSessionUser(request);
  const ownerCount = database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'dueño'").get().count;

  if (path === '/api/health' && method === 'GET') return send(response, 200, { ok: true, service: 'cable-tartak-api' });

  if (path === '/api/integrations/status' && method === 'GET') {
    const providers = getIntegrationStatus();
    return send(response, 200, {
      providers,
      connected: providers.filter(item => item.configured).length,
      total: providers.length,
      ready: providers.filter(item => item.configured).length > 0
    });
  }

  if (path === '/api/integrations/sync' && method === 'POST') {
    const body = await readBody(request);
    const provider = String(body.provider || '').trim();
    const result = await syncProvider(provider || 'WispHub');
    if (!result.ok) return send(response, 400, result);
    return send(response, 200, result);
  }

  if (path === '/api/auth/status' && method === 'GET') return send(response, 200, { needsOwner: ownerCount === 0 });

  if (path === '/api/auth/first-owner' && method === 'POST') {
    if (database.prepare('SELECT COUNT(*) AS count FROM users').get().count > 0) return send(response, 409, { error: 'La configuración inicial ya fue completada.' });
    const body = await readBody(request);
    const username = String(body.usuario || '').trim().toLowerCase();
    const displayName = String(body.nombre || '').trim();
    const password = String(body.clave || '');
    if (!/^[a-z0-9._-]{3,32}$/.test(username) || displayName.length < 2 || password.length < 10) {
      return send(response, 400, { error: 'Indique un usuario válido, nombre y contraseña de al menos 10 caracteres.' });
    }
    const credentials = createPassword(password);
    const createOwner = () => inTransaction(() => {
      if (database.prepare('SELECT COUNT(*) AS count FROM users').get().count > 0) return null;
      const result = database.prepare('INSERT INTO users(username, display_name, role, salt, password_hash) VALUES (?, ?, ?, ?, ?)')
        .run(username, displayName, 'dueño', credentials.salt, credentials.hash);
      return database.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    });
    const createdUser = createOwner();
    if (!createdUser) return send(response, 409, { error: 'La configuración inicial ya fue completada.' });
    setSession(response, createdUser);
    return send(response, 201, { user: publicUser(createdUser) });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const body = await readBody(request);
    const username = String(body.usuario || '').trim().toLowerCase();
    const password = String(body.clave || '');
    const account = database.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
    if (!account || !verifyPassword(password, account.salt, account.password_hash)) {
      return send(response, 401, { error: 'Usuario o contraseña incorrectos.' });
    }
    setSession(response, account);
    return send(response, 200, { user: publicUser(account) });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const token = cookieValue(request, 'ct_session');
    if (token) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(createHash('sha256').update(token).digest('hex'));
    clearSession(response);
    return send(response, 200, { ok: true });
  }

  if (path === '/api/auth/session' && method === 'GET') {
    if (!user) return send(response, 200, { user: null });
    return send(response, 200, { user: publicUser(user) });
  }

  if (path === '/api/client/payments' && method === 'POST') {
    const body = await readBody(request);
    const cedula = String(body.cedula || '').trim().toUpperCase();
    const bank = String(body.banco || '').trim().slice(0, 60);
    const reference = String(body.referencia || '').trim().toUpperCase();
    const amount = Number(body.monto);
    const proofUrl = String(body.comprobanteUrl || '');
    const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(cedula));
    if (!client) return send(response, 400, { error: 'No se pudieron validar los datos. Verifica la cédula o contacta a la oficina.' });
    if (client.esClientePrueba) return send(response, 409, { error: 'La cuenta de prueba no puede reportar pagos reales.' });
    const acceptedBanks = ['Banesco', 'Banco de Venezuela', 'Mercantil', 'Provincial', 'Bancaribe', 'Otro'];
    if (!acceptedBanks.includes(bank) || !/^[A-Z0-9]{4,32}$/.test(reference) || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return send(response, 400, { error: 'Verifica el banco, referencia y monto.' });
    }

    const proofMatch = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(proofUrl);
    if (!proofMatch) return send(response, 400, { error: 'Adjunta un comprobante JPG, PNG o WEBP válido.' });
    const proofBytes = Buffer.from(proofMatch[2], 'base64');
    const imageType = proofMatch[1];
    const isPng = imageType === 'png' && proofBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = imageType === 'jpeg' && proofBytes[0] === 255 && proofBytes[1] === 216 && proofBytes[2] === 255;
    const isWebp = imageType === 'webp' && proofBytes.toString('ascii', 0, 4) === 'RIFF' && proofBytes.toString('ascii', 8, 12) === 'WEBP';
    if (proofBytes.length < 100 || proofBytes.length > 2 * 1024 * 1024 || !(isPng || isJpeg || isWebp)) {
      return send(response, 400, { error: 'El comprobante debe ser una imagen válida de hasta 2 MB.' });
    }

    const duplicate = listRecords('taquilla-virtual').some(payment =>
      payment.estado !== 'RECHAZADO' && String(payment.banco).toLowerCase() === bank.toLowerCase() && String(payment.referencia).toUpperCase() === reference
    );
    if (duplicate) return send(response, 409, { error: 'Ya existe un comprobante con ese banco y referencia.' });

    const now = new Date();
    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    const recentSubmissions = listRecords('taquilla-virtual').filter(payment =>
      normalizedId(payment.cedula) === normalizedId(cedula) && Date.parse(payment.enviadoEn || 0) > oneHourAgo
    ).length;
    if (recentSubmissions >= 5) return send(response, 429, { error: 'Se alcanzó el límite temporal de comprobantes para este titular.' });
    const payment = saveRecord('taquilla-virtual', {
      id: makeId('PAGV'), cedula, nombreCliente: client.nombre, banco: bank, referencia: reference,
      monto: amount, telefono: String(body.telefono || '').trim().slice(0, 24),
      fecha: now.toISOString().slice(0, 10), enviadoEn: now.toISOString(), hora: now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      comprobanteUrl: proofUrl, estado: 'PENDIENTE'
    });
    return send(response, 201, { received: true, id: payment.id, status: 'PENDIENTE' });
  }

  if (path === '/api/client/plans' && method === 'GET') {
      if (path === '/api/client/coverage' && method === 'GET') {
        const sector = String(url.searchParams.get('sector') || '').trim();
        const boxes = matchingNapBoxes(sector);
        if (!boxes.length) return send(response, 200, { status: 'survey-required', sector, boxes: [], message: 'La cobertura debe confirmarse con una visita técnica.' });
        const available = boxes.filter(box => box.estado === 'Operativa' && availableNapPorts(box) > 0);
        return send(response, 200, {
          status: available.length ? 'available' : 'saturated',
          sector,
          boxes: boxes.map(box => ({ id: box.id, nombre: box.nombre, sector: box.sector, estado: box.estado, puertosLibres: availableNapPorts(box) })),
          message: available.length ? 'Hay capacidad registrada en esta zona.' : 'Las cajas NAP registradas en esta zona no tienen puertos disponibles.'
        });
      }
    return send(response, 200, listRecords('planes').filter(plan => plan.activo).map(plan => ({
      id: plan.id, nombre: plan.nombre, velocidad: plan.velocidad, precio: plan.precio, activo: plan.activo
    })));
  }

  if (path === '/api/client/verify-contract' && method === 'POST') {
    const body = await readBody(request);
    const client = findClient(body.cedula);
    if (!client || !matchesClientPhone(client, body.telefono)) {
      return send(response, 400, { error: 'No se pudieron validar la cédula y el teléfono. Contacta a la oficina.' });
    }
    const credentials = database.prepare('SELECT cedula_normalized FROM client_credentials WHERE cedula_normalized = ?')
      .get(normalizedId(client.cedula));
    return send(response, 200, publicClient(client, Boolean(credentials)));
  }

  if (path === '/api/client/activate-account' && method === 'POST') {
    const body = await readBody(request);
    const client = findClient(body.cedula);
    const password = String(body.clave || '');
    if (!client || !matchesClientPhone(client, body.telefono)) {
      return send(response, 400, { error: 'No se pudieron validar la cédula y el teléfono. Contacta a la oficina.' });
    }
    if (password.length < 8) return send(response, 400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
    const normalizedCedula = normalizedId(client.cedula);
    if (database.prepare('SELECT cedula_normalized FROM client_credentials WHERE cedula_normalized = ?').get(normalizedCedula)) {
      return send(response, 409, { error: 'La cuenta ya está activada. Inicia sesión con tu contraseña.' });
    }
    const credentials = createPassword(password);
    database.prepare('INSERT INTO client_credentials(cedula_normalized, salt, password_hash) VALUES (?, ?, ?)')
      .run(normalizedCedula, credentials.salt, credentials.hash);
    return send(response, 201, publicClient(client, true));
  }

  if (path === '/api/client/login' && method === 'POST') {
    const body = await readBody(request);
    const client = findClient(body.cedula);
    if (!client) return send(response, 401, { error: 'Cédula o contraseña incorrectas.' });
    const credentials = database.prepare('SELECT salt, password_hash FROM client_credentials WHERE cedula_normalized = ?')
      .get(normalizedId(client.cedula));
    if (!credentials || !verifyPassword(String(body.clave || ''), credentials.salt, credentials.password_hash)) {
      return send(response, 401, { error: 'Cédula o contraseña incorrectas.' });
    }
    return send(response, 200, publicClient(client, true));
  }

  if (path === '/api/client/tickets' && method === 'GET') {
    const cedula = url.searchParams.get('cedula');
    const telefono = url.searchParams.get('telefono');
    const client = findClient(cedula);
    if (!client || !matchesClientPhone(client, telefono)) {
      return send(response, 400, { error: 'No se pudieron validar la cédula y el teléfono.' });
    }
    const tickets = listRecords('fallas')
      .filter(failure => normalizedId(failure.cedula) === normalizedId(client.cedula))
      .map(failure => ({
        id: failure.id,
        cedula: client.cedula,
        tipo: 'falla',
        categoria: failure.clasificacion || failure.categoria || 'Avería',
        detalle: failure.detalle || '',
        fecha: failure.fechaReporte || failure.creadoEn || '',
        estado: failure.estado || 'Pendiente',
        notaTecnica: failure.notasTecnico || null
      }));
    return send(response, 200, tickets);
  }

  if (path === '/api/client/plan-requests' && method === 'POST') {
    const body = await readBody(request);
    const client = findClient(body.cedula);
    if (!client || !matchesClientPhone(client, body.telefono)) {
      return send(response, 400, { error: 'No se pudieron validar la cédula y el teléfono.' });
    }
    const plan = readRecord('planes', body.planId);
    if (!plan?.activo) return send(response, 400, { error: 'El plan seleccionado ya no está disponible.' });
    if (client.plan === plan.nombre) return send(response, 409, { error: 'Ese ya es tu plan actual.' });
    const duplicate = listRecords('solicitudes-servicio').some(request =>
      request.tipo === 'CAMBIO_PLAN' && normalizedId(request.cedula) === normalizedId(client.cedula) && request.estado === 'PENDIENTE'
    );
    if (duplicate) return send(response, 409, { error: 'Ya tienes una solicitud de cambio de plan pendiente.' });
    const planRequest = saveRecord('solicitudes-servicio', {
      id: makeId('PLAN'), tipo: 'CAMBIO_PLAN', clienteId: client.id, cedula: client.cedula,
      nombre: client.nombre, telefono: client.telefono, planAnterior: client.plan, planId: plan.id,
      planNombre: plan.nombre, estado: 'PENDIENTE', fecha: new Date().toISOString(), enviadaEn: new Date().toISOString()
    });
    return send(response, 201, { id: planRequest.id, status: planRequest.estado, message: 'Solicitud de cambio recibida para revisión.' });
  }

  if (path === '/api/client/service-requests' && method === 'POST') {
    const body = await readBody(request);
    const cedula = String(body.cedula || '').trim().toUpperCase();
    const username = normalizedId(cedula);
    const nombre = String(body.nombre || '').trim();
    const telefono = String(body.telefono || '').trim();
    const direccion = String(body.direccion || '').trim();
    const sector = String(body.sector || '').trim();
    const plan = readRecord('planes', body.plan);
    if (!/^[A-Z0-9-]{5,20}$/.test(cedula) || nombre.length < 2 || telefono.length < 7 || direccion.length < 5 || sector.length < 2 || !plan?.activo) {
      return send(response, 400, { error: 'Revisa tus datos, el sector y el plan seleccionado.' });
    }
    const matchedBoxes = matchingNapBoxes(sector);
    if (matchedBoxes.length && !matchedBoxes.some(box => box.estado === 'Operativa' && availableNapPorts(box) > 0)) {
      return send(response, 409, { error: 'La zona aparece sin puertos NAP disponibles. La oficina debe confirmar una ampliación o una caja cercana antes de tomar la solicitud.' });
    }
    if (listRecords('clientes').some(client => normalizedId(client.cedula) === username)) {
      return send(response, 409, { error: 'Ya existe un servicio asociado a esa cédula. Si necesitas soporte, reporta una avería.' });
    }
    const duplicatedRequest = listRecords('solicitudes-servicio').some(request =>
      normalizedId(request.cedula) === username && request.estado === 'PENDIENTE'
    );
    if (duplicatedRequest) return send(response, 409, { error: 'Ya tienes una solicitud pendiente para esta cédula.' });
    const serviceRequest = saveRecord('solicitudes-servicio', {
      id: makeId('SOL'), tipo: 'INSTALACION', cedula, nombre, telefono, direccion, sector,
      planId: plan.id, planNombre: plan.nombre, coberturaNaps: matchedBoxes.map(box => box.id), estado: 'PENDIENTE', fecha: new Date().toISOString(),
      enviadaEn: new Date().toISOString()
    });
    return send(response, 201, { id: serviceRequest.id, status: serviceRequest.estado, message: 'Solicitud recibida para revisión.' });
  }

  if (path === '/api/client/failures' && method === 'POST') {
    const body = await readBody(request);
    const cedula = String(body.cedula || '').trim().toUpperCase();
    const telefono = String(body.telefono || '').replace(/\D/g, '');
    const detail = String(body.detalle || '').trim();
    const sector = String(body.sector || '').trim();
    const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(cedula));
    const clientPhone = String(client?.telefono || '').replace(/\D/g, '');
    if (!client || !clientPhone || telefono.length < 7 || !clientPhone.endsWith(telefono.slice(-7))) {
      return send(response, 400, { error: 'No se pudieron validar la cédula y el teléfono. Contacta a la oficina para verificar tus datos.' });
    }
    if (detail.length < 10) return send(response, 400, { error: 'Describe el problema con al menos 10 caracteres.' });
    const recentReports = listRecords('fallas').filter(failure =>
      normalizedId(failure.cedula) === normalizedId(cedula) && Date.parse(failure.creadoEn || failure.fechaReporte || 0) > Date.now() - 60 * 60 * 1000
    ).length;
    if (recentReports >= 3) return send(response, 429, { error: 'Ya se recibieron varios reportes recientes para esta cuenta. Contacta a la oficina.' });
    const clientSector = sector || client.sector || '';
    const sectorReports = recentSectorReports(clientSector);
    if (sectorReports.length >= 2) {
      return send(response, 202, {
        sectorIncident: true,
        message: `Ya hay varios reportes recientes en ${clientSector}. Estamos verificando una posible incidencia de zona; puede deberse a energía o a la red. No hace falta enviar otro reporte por ahora.`
      });
    }
    const diagnosis = classifyFailure(detail);
    const failure = saveRecord('fallas', {
      id: makeId('INC'), cedula: client.cedula, nombreCliente: client.nombre, telefonoCliente: client.telefono,
      direccionCasa: client.direccion || '', sector: clientSector, detalle: detail,
      ...diagnosis, estado: 'Pendiente', fechaReporte: new Date().toISOString(), creadoEn: new Date().toISOString(),
      tecnicoAsignado: 'Equipo de Campo FTTH', origen: 'PORTAL_CLIENTE'
    });
    return send(response, 201, { id: failure.id, status: failure.estado, message: 'Reporte recibido.' });
  }

  if (!user) return send(response, 401, { error: 'Inicie sesión para continuar.' });

  if (path === '/api/auth/accounts' && method === 'GET') {
    if (user.role !== 'dueño') return send(response, 403, { error: 'Solo un dueño puede consultar las cuentas.' });
    const accounts = database.prepare('SELECT id, username, display_name, role, active FROM users ORDER BY id').all();
    return send(response, 200, accounts.map(publicUser));
  }

  if (path === '/api/auth/accounts' && method === 'POST') {
    if (user.role !== 'dueño') return send(response, 403, { error: 'Solo un dueño puede crear cuentas.' });
    const body = await readBody(request);
    const username = String(body.usuario || '').trim().toLowerCase();
    const displayName = String(body.nombre || '').trim();
    const password = String(body.clave || '');
    const role = String(body.rol || '');
    if (!/^[a-z0-9._-]{3,32}$/.test(username) || displayName.length < 2 || password.length < 10 || !roles.includes(role)) {
      return send(response, 400, { error: 'Usuario inválido, nombre requerido, contraseña mínima de 10 caracteres y rol válido.' });
    }
    const credentials = createPassword(password);
    try {
      const result = database.prepare('INSERT INTO users(username, display_name, role, salt, password_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)')
        .run(username, displayName, role, credentials.salt, credentials.hash, user.id);
      const account = database.prepare('SELECT id, username, display_name, role, active FROM users WHERE id = ?').get(result.lastInsertRowid);
      return send(response, 201, publicUser(account));
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) return send(response, 409, { error: 'Ese usuario ya existe.' });
      throw error;
    }
  }

  const accountRoute = /^\/api\/auth\/accounts\/(\d+)(?:\/(password))?$/.exec(path);
  if (accountRoute && !accountRoute[2] && method === 'DELETE') {
    if (user.role !== 'dueño') return send(response, 403, { error: 'Solo un dueño puede eliminar cuentas.' });
    const accountId = Number(accountRoute[1]);
    const account = database.prepare('SELECT id, role, active FROM users WHERE id = ?').get(accountId);
    if (!account) return send(response, 404, { error: 'Cuenta no encontrada.' });
    if (account.id === user.id) return send(response, 409, { error: 'No puedes eliminar tu propia cuenta.' });
    if (account.role === 'dueño' && account.active) {
      const ownerCount = database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'dueño' AND active = 1").get().count;
      if (ownerCount <= 1) return send(response, 409, { error: 'Debe quedar al menos un dueño activo.' });
    }
    inTransaction(() => {
      database.prepare('DELETE FROM sessions WHERE user_id = ?').run(accountId);
      database.prepare('DELETE FROM users WHERE id = ?').run(accountId);
    });
    return send(response, 200, { ok: true });
  }

  if (accountRoute && method === 'PATCH') {
    if (user.role !== 'dueño') return send(response, 403, { error: 'Solo un dueño puede modificar cuentas.' });
    const accountId = Number(accountRoute[1]);
    const current = database.prepare('SELECT id, username, display_name, role, active FROM users WHERE id = ?').get(accountId);
    if (!current) return send(response, 404, { error: 'Cuenta no encontrada.' });
    const body = await readBody(request);
    const nextRole = body.rol === undefined ? current.role : String(body.rol);
    const nextActive = body.activo === undefined ? Boolean(current.active) : Boolean(body.activo);
    const nextName = body.nombre === undefined ? current.display_name : String(body.nombre).trim();
    if (!roles.includes(nextRole) || nextName.length < 2) return send(response, 400, { error: 'Nombre o rol inválido.' });
    if (current.id === user.id && (nextRole !== 'dueño' || !nextActive)) return send(response, 409, { error: 'No puedes desactivar ni cambiar el rol de tu propia cuenta.' });
    if (current.role === 'dueño' && current.active && (nextRole !== 'dueño' || !nextActive)) {
      const ownerCount = database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'dueño' AND active = 1").get().count;
      if (ownerCount <= 1) return send(response, 409, { error: 'Debe quedar al menos un dueño activo.' });
    }
    database.prepare('UPDATE users SET display_name = ?, role = ?, active = ? WHERE id = ?').run(nextName, nextRole, Number(nextActive), accountId);
    database.prepare('DELETE FROM sessions WHERE user_id = ?').run(accountId);
    const updated = database.prepare('SELECT id, username, display_name, role, active FROM users WHERE id = ?').get(accountId);
    return send(response, 200, publicUser(updated));
  }

  if (accountRoute && accountRoute[2] === 'password' && method === 'POST') {
    if (user.role !== 'dueño') return send(response, 403, { error: 'Solo un dueño puede restablecer contraseñas.' });
    const accountId = Number(accountRoute[1]);
    if (accountId === user.id) return send(response, 409, { error: 'Usa otra cuenta de dueño para restablecer tu propia contraseña.' });
    const account = database.prepare('SELECT id FROM users WHERE id = ?').get(accountId);
    if (!account) return send(response, 404, { error: 'Cuenta no encontrada.' });
    const body = await readBody(request);
    const password = String(body.clave || '');
    if (password.length < 10) return send(response, 400, { error: 'La contraseña debe tener al menos 10 caracteres.' });
    const credentials = createPassword(password);
    inTransaction(() => {
      database.prepare('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?').run(credentials.salt, credentials.hash, accountId);
      database.prepare('DELETE FROM sessions WHERE user_id = ?').run(accountId);
    });
    return send(response, 200, { ok: true, message: 'Contraseña restablecida.' });
  }

  if (!path.startsWith('/api/admin/')) return send(response, 404, { error: 'Ruta no encontrada.' });

  if (path === '/api/admin/tecnicos' && method === 'GET') {
    if (!requireRoles(user, ['dueño', 'admin'])) return send(response, 403, { error: 'No tiene permiso para consultar el personal técnico.' });
    const technicians = database.prepare("SELECT id, username, display_name FROM users WHERE role = 'tecnico' AND active = 1 ORDER BY display_name").all();
    return send(response, 200, technicians.map(technician => ({ id: technician.id, usuario: technician.username, nombre: technician.display_name })));
  }

  const route = path.slice('/api/admin/'.length).split('/').filter(Boolean).map(decodeURIComponent);
  if (route[0] === 'despachar-materiales') route.unshift('inventario');
  if (route[0] === 'pre-cargar-cliente') route.unshift('clientes');
  const collection = route[0];
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(request) : {};
  const ownerAdmin = ['dueño', 'admin'];
  const technicianWrite = ['dueño', 'admin', 'tecnico'];

  if (!recordCollections.includes(collection) && !['consulta-deuda', 'registrar-pago'].includes(collection)) {
    return send(response, 404, { error: 'Recurso no encontrado.' });
  }

  if (collection === 'solicitudes-servicio') {
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'Solo dueño y administración pueden revisar solicitudes.' });
    if (method === 'GET' && route.length === 1) return send(response, 200, listRecords(collection));
    if (route[1] && route[2] === 'aprobar' && method === 'POST') {
      const requestRecord = readRecord(collection, route[1]);
      if (!requestRecord) return send(response, 404, { error: 'Solicitud no encontrada.' });
      if (requestRecord.estado !== 'PENDIENTE') return send(response, 409, { error: 'La solicitud ya fue procesada.' });
      const plan = readRecord('planes', requestRecord.planId);
      if (!plan?.activo) return send(response, 409, { error: 'El plan solicitado ya no está disponible.' });
      const matchedBoxes = matchingNapBoxes(requestRecord.sector);
      if (matchedBoxes.length && !matchedBoxes.some(box => box.estado === 'Operativa' && availableNapPorts(box) > 0)) {
        return send(response, 409, { error: 'La capacidad de la zona cambió y ya no hay puertos NAP disponibles. Confirma una nueva caja antes de aprobar.' });
      }
      if (listRecords('clientes').some(client => normalizedId(client.cedula) === normalizedId(requestRecord.cedula))) {
        return send(response, 409, { error: 'Ya existe un cliente con esa cédula.' });
      }
      const now = new Date();
      const approval = () => inTransaction(() => {
        const currentRequest = readRecord(collection, route[1]);
        if (!currentRequest || currentRequest.estado !== 'PENDIENTE') return null;
        const client = saveRecord('clientes', {
          id: makeId('CLI'), cedula: requestRecord.cedula, nombre: requestRecord.nombre, plan: plan.nombre,
          estado: 'Pendiente', fechaRegistro: businessDate(now), telefono: requestRecord.telefono,
          direccion: requestRecord.direccion, sector: requestRecord.sector, montoDeuda: 0,
          costoMensualPlan: Number(plan.precio), estadoPago: 'Al Día', historialPagos: []
        });
        const notification = saveRecord('notificaciones-tecnicos', {
          id: makeId('NOTIF'), tipo: 'NUEVA_INSTALACION', titulo: 'Nueva instalación pendiente',
          nombreCliente: client.nombre, telefonoCliente: client.telefono, direccionCasa: client.direccion,
          sectorNap: client.sector, planCliente: client.plan, fecha: businessDate(now),
          hora: now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), leida: false, estado: 'Pendiente'
        });
        const order = saveRecord('ordenes-instalacion', {
          id: makeId('INST'), cedula: client.cedula, nombreCliente: client.nombre, telefonoCliente: client.telefono,
          direccionCasa: client.direccion, sectorNap: client.sector, plan: client.plan, fecha: businessDate(now),
          estado: 'Pendiente Por Instalar', tecnicoAsignado: 'Equipo de Campo FTTH'
        });
        const updatedRequest = saveRecord(collection, {
          ...currentRequest, estado: 'APROBADA', revisadaPorId: user.id, revisadaPor: user.display_name,
          revisadaEn: now.toISOString(), clienteId: client.id, ordenId: order.id
        });
        return { cliente: client, orden: order, solicitud: updatedRequest, notificacion: notification };
      });
      const result = approval();
      if (!result) return send(response, 409, { error: 'La solicitud fue procesada por otro usuario.' });
      return send(response, 201, { ...result, message: 'Solicitud aprobada; cliente y orden de instalación creados.' });
    }
    if (route[1] && route[2] === 'rechazar' && method === 'POST') {
      const requestRecord = readRecord(collection, route[1]);
      if (!requestRecord) return send(response, 404, { error: 'Solicitud no encontrada.' });
      if (requestRecord.estado !== 'PENDIENTE') return send(response, 409, { error: 'La solicitud ya fue procesada.' });
      const updatedRequest = saveRecord(collection, {
        ...requestRecord, estado: 'RECHAZADA', motivoRechazo: String(body.motivo || '').trim().slice(0, 300),
        revisadaPorId: user.id, revisadaPor: user.display_name, revisadaEn: new Date().toISOString()
      });
      return send(response, 200, { solicitud: updatedRequest, message: 'Solicitud rechazada.' });
    }
    return send(response, 404, { error: 'Operación de solicitud no encontrada.' });
  }

  if (collection === 'cierres-caja') {
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'Solo dueños y administradores pueden consultar o cerrar caja.' });
    const date = businessDate();
    const closingId = `CIERRE-${user.id}-${date}`;
    if (method === 'GET' && route.length === 1) {
      const receipts = receiptsForUserAndDate(user.id, date);
      const cashReceipts = receipts.filter(receipt => /efectivo|cash/i.test(String(receipt.metodo || '')));
      const digitalReceipts = receipts.filter(receipt => !/efectivo|cash/i.test(String(receipt.metodo || '')));
      const closures = listRecords(collection).filter(closing => user.role === 'dueño' || closing.administradorId === user.id);
      return send(response, 200, {
        fecha: date,
        cierreHoy: readRecord(collection, closingId),
        resumen: {
          cantidadPagos: receipts.length,
          totalEfectivo: cashReceipts.reduce((total, receipt) => total + Number(receipt.monto || 0), 0),
          totalDigital: digitalReceipts.reduce((total, receipt) => total + Number(receipt.monto || 0), 0),
          totalCobrado: receipts.reduce((total, receipt) => total + Number(receipt.monto || 0), 0),
          pagos: receipts
        },
        cierres: closures.slice(0, 100)
      });
    }
    if (method === 'POST' && route.length === 1) {
      const countedCash = Number(body.efectivoContado);
      if (!Number.isFinite(countedCash) || countedCash < 0) return send(response, 400, { error: 'Indica el efectivo contado; debe ser cero o mayor.' });
      if (readRecord(collection, closingId)) return send(response, 409, { error: 'La caja de hoy ya fue cerrada para esta cuenta.' });
      const receipts = receiptsForUserAndDate(user.id, date);
      const cashReceipts = receipts.filter(receipt => /efectivo|cash/i.test(String(receipt.metodo || '')));
      const digitalReceipts = receipts.filter(receipt => !/efectivo|cash/i.test(String(receipt.metodo || '')));
      const totalCash = cashReceipts.reduce((total, receipt) => total + Number(receipt.monto || 0), 0);
      const totalDigital = digitalReceipts.reduce((total, receipt) => total + Number(receipt.monto || 0), 0);
      const closing = {
        id: closingId,
        fecha: date,
        administradorId: user.id,
        administradorUsuario: user.username,
        administradorNombre: user.display_name,
        cantidadPagos: receipts.length,
        totalEfectivoSistema: totalCash,
        efectivoContado: countedCash,
        diferenciaEfectivo: Number((countedCash - totalCash).toFixed(2)),
        totalDigital,
        totalCobrado: Number((totalCash + totalDigital).toFixed(2)),
        notas: String(body.notas || '').trim().slice(0, 500),
        cerradoEn: new Date().toISOString()
      };
      try {
        inTransaction(() => {
          if (readRecord(collection, closingId)) throw Object.assign(new Error('La caja de hoy ya fue cerrada para esta cuenta.'), { status: 409 });
          saveRecord(collection, closing);
        });
      } catch (error) {
        if (error.status === 409) return send(response, 409, { error: error.message });
        throw error;
      }
      return send(response, 201, { cierre: closing, mensaje: 'Cierre diario guardado.' });
    }
    return send(response, 405, { error: 'Método no permitido.' });
  }

  if (collection === 'clientes') {
    if (method === 'GET' && route.length === 1) {
      if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para consultar la lista de clientes.' });
      return send(response, 200, listRecords(collection));
    }
    if (method === 'POST' && route[1] === 'pre-cargar-cliente') {
      if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para registrar clientes.' });
      const cedula = String(body.cedula || '').trim().toUpperCase();
      const name = String(body.nombre || '').trim();
      if (!cedula || !name) return send(response, 400, { error: 'Cédula y nombre son obligatorios.' });
      if (listRecords('clientes').some(client => normalizedId(client.cedula) === normalizedId(cedula))) return send(response, 409, { error: 'Ya existe un cliente con esa cédula.' });
      const plan = listRecords('planes').find(item => item.nombre === body.plan || item.id === body.plan);
            const matchedBoxes = matchingNapBoxes(body.sector);
            if (matchedBoxes.length && !matchedBoxes.some(box => box.estado === 'Operativa' && availableNapPorts(box) > 0)) {
              return send(response, 409, { error: 'La zona no tiene puertos disponibles en las cajas NAP registradas. Confirma expansión de red antes de registrar el cliente.' });
            }
      const client = saveRecord(collection, {
        id: makeId('CLI'), cedula, nombre: name, plan: String(body.plan || ''), estado: 'Pendiente',
        fechaRegistro: new Date().toISOString().slice(0, 10), telefono: String(body.telefono || ''),
        direccion: String(body.direccion || ''), sector: String(body.sector || ''), montoDeuda: 0,
        costoMensualPlan: Number(plan?.precio || 0), estadoPago: 'Al Día', historialPagos: []
      });
      const createdAt = new Date();
      saveRecord('notificaciones-tecnicos', {
        id: makeId('NOTIF'), tipo: 'NUEVA_INSTALACION', titulo: 'Nueva instalación pendiente', nombreCliente: name,
        telefonoCliente: client.telefono, direccionCasa: client.direccion, sectorNap: client.sector,
        planCliente: client.plan, fecha: createdAt.toISOString().slice(0, 10),
        hora: createdAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), leida: false, estado: 'Pendiente'
      });
      saveRecord('ordenes-instalacion', {
        id: makeId('INST'), cedula, nombreCliente: name, telefonoCliente: client.telefono,
        direccionCasa: client.direccion, sectorNap: client.sector, plan: client.plan,
        fecha: createdAt.toISOString().slice(0, 10), estado: 'Pendiente Por Instalar', tecnicoAsignado: 'Equipo de Campo FTTH'
      });
      return send(response, 201, { cliente: client, mensaje: 'Cliente registrado y orden de instalación creada.' });
    }
  }

  if (collection === 'planes') {
    if (method === 'GET' && route.length === 1) {
      if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para consultar los planes.' });
      return send(response, 200, listRecords(collection));
    }
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para modificar planes.' });
    if (method === 'POST' && route.length === 1) {
      if (!String(body.nombre || '').trim() || Number(body.precio) <= 0) return send(response, 400, { error: 'Nombre y precio válido son obligatorios.' });
      const plan = saveRecord(collection, { ...body, id: makeId('PLAN'), activo: true });
      return send(response, 201, { plan, mensaje: 'Plan creado.' });
    }
    if (route[1] && method === 'PUT') {
      const current = readRecord(collection, route[1]);
      if (!current) return send(response, 404, { error: 'Plan no encontrado.' });
      const plan = saveRecord(collection, { ...current, ...body, id: current.id });
      if (body.actualizarClientesExistentes) {
        for (const client of listRecords('clientes')) {
          if (client.plan === current.nombre) saveRecord('clientes', { ...client, plan: plan.nombre, costoMensualPlan: Number(plan.precio) });
        }
      }
      return send(response, 200, { plan, mensaje: 'Plan actualizado.' });
    }
    if (route[1] && method === 'DELETE') {
      const current = readRecord(collection, route[1]);
      if (!current) return send(response, 404, { error: 'Plan no encontrado.' });
      const assignedClients = listRecords('clientes').filter(client => client.plan === current.nombre);
      const replacement = listRecords(collection).find(plan => plan.id !== current.id && plan.activo);
      if (assignedClients.length && !replacement) return send(response, 409, { error: 'No se puede eliminar el único plan asignado a clientes.' });
      inTransaction(() => {
        for (const client of assignedClients) saveRecord('clientes', { ...client, plan: replacement.nombre, costoMensualPlan: Number(replacement.precio) });
        removeRecord(collection, current.id);
      });
      return send(response, 200, { mensaje: 'Plan eliminado y clientes reasignados.' });
    }
  }

  if (collection === 'consulta-deuda' && method === 'GET' && route[1]) {
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para consultar deudas.' });
    const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(route[1]));
    return client ? send(response, 200, { cliente: client }) : send(response, 404, { error: 'No se encontró el cliente.' });
  }

  if (collection === 'registrar-pago' && method === 'POST') {
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para registrar pagos.' });
    if (user.role === 'admin' && readRecord('cierres-caja', `CIERRE-${user.id}-${businessDate()}`)) {
      return send(response, 409, { error: 'Tu caja de hoy ya está cerrada. No puedes registrar más cobros.' });
    }
    const amount = Number(body.monto);
    const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(body.cedula));
    if (!client) return send(response, 404, { error: 'Cliente no encontrado.' });
    if (client.esClientePrueba) return send(response, 409, { error: 'El cliente de prueba no admite cobros reales.' });
    if (!Number.isFinite(amount) || amount <= 0) return send(response, 400, { error: 'El monto debe ser mayor que cero.' });
    const now = new Date();
    const date = now.toISOString().replace('T', ' ').slice(0, 16);
    const remainingDebt = Math.max(0, Number(client.montoDeuda || 0) - amount);
    const receipt = {
      id: makeId('PAG'), monto: amount, fecha: date, fechaContable: businessDate(now), metodo: String(body.metodo || 'Taquilla'),
      recibidoPor: user.display_name, registradoPorId: user.id, registradoPorUsuario: user.username,
      numeroComprobante: makeId('REC'), notas: String(body.notas || '')
    };
    saveRecord('clientes', { ...client, montoDeuda: remainingDebt, estadoPago: remainingDebt === 0 ? 'Al Día' : 'Pendiente', estado: remainingDebt === 0 && client.estado === 'Suspendido' ? 'Activo' : client.estado, fechaUltimoPago: date.slice(0, 10), historialPagos: [receipt, ...(client.historialPagos || [])] });
    return send(response, 201, { comprobante: receipt, deudaRestante: remainingDebt, mensaje: 'Pago registrado.' });
  }

  if (collection === 'fallas') {
    if (method === 'GET' && route.length === 1) return send(response, 200, listRecords(collection));
    if (method === 'POST' && route.length === 1) {
      if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para registrar averías.' });
      const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(body.cedula));
      const failure = saveRecord(collection, {
        id: makeId('INC'), cedula: String(body.cedula || '').trim().toUpperCase(), nombreCliente: client?.nombre || 'Cliente',
        detalle: String(body.detalle || '').trim(), prioridad: body.prioridad || 'Media', estado: 'Pendiente',
        fechaReporte: new Date().toISOString(), sector: client?.sector || '', direccionCasa: client?.direccion || '', telefonoCliente: client?.telefono || '', tecnicoAsignado: 'Equipo de Campo FTTH'
      });
      return send(response, 201, { falla: failure, mensaje: 'Avería registrada.' });
    }
    if (route[1] && route[2] === 'resolver' && method === 'PUT') {
      if (!requireRoles(user, technicianWrite)) return send(response, 403, { error: 'No tiene permiso para resolver averías.' });
      const current = readRecord(collection, route[1]);
      if (!current) return send(response, 404, { error: 'Avería no encontrada.' });
      const measuredPower = body.potenciaFinal === '' || body.potenciaFinal == null ? null : Number(body.potenciaFinal);
      if (measuredPower !== null && (!Number.isFinite(measuredPower) || measuredPower < -50 || measuredPower > 0)) {
        return send(response, 400, { error: 'La potencia óptica debe estar entre -50 y 0 dBm.' });
      }
      const resolvedAt = new Date().toISOString();
      const failure = saveRecord(collection, { ...current, estado: 'Resuelto', notasTecnico: String(body.solucion || ''), tecnicoAsignado: String(body.tecnico || user.display_name), fechaResolucion: resolvedAt, ...(measuredPower === null ? {} : { potenciaOpticaDbm: measuredPower }) });
      const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(current.cedula));
      if (client && measuredPower !== null) {
        const history = [{ fecha: resolvedAt, potenciaOpticaDbm: measuredPower, ticketId: current.id, tecnico: String(body.tecnico || user.display_name) }, ...(client.historialOptico || [])].slice(0, 90);
        saveRecord('clientes', {
          ...client,
          potenciaOpticaDbm: measuredPower,
          historialOptico: history,
          alertaOptica: measuredPower <= -27
        });
      }
      return send(response, 200, { falla: failure, mensaje: 'Avería resuelta.' });
    }
  }

  if (collection === 'alerta-masiva') {
    if (!requireRoles(user, ['dueño'])) return send(response, 403, { error: 'Solo un dueño puede administrar alertas masivas.' });
    if (method === 'GET' && route.length === 1) return send(response, 200, listRecords(collection));
    if (method === 'POST' && route.length === 1) {
      if (!String(body.zona || '').trim()) return send(response, 400, { error: 'Indique la zona afectada.' });
      const alert = saveRecord(collection, { id: makeId('ALR'), zona: String(body.zona).trim(), activo: true, motivo: String(body.motivo || ''), fecha: new Date().toISOString(), declaradoPor: user.display_name });
      return send(response, 201, { alerta: alert, mensaje: 'Alerta masiva creada.' });
    }
    if (route[1] && method === 'DELETE') {
      const alert = listRecords(collection).find(item => item.id === route[1] || item.zona === route[1]);
      if (!alert) return send(response, 404, { error: 'Alerta no encontrada.' });
      removeRecord(collection, alert.id);
      return send(response, 200, { mensaje: 'Alerta levantada.' });
    }
  }

  if (collection === 'ordenes-instalacion' && route[1] && route[2] === 'asignar' && method === 'PUT') {
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'Solo dueños y administradores pueden asignar instalaciones.' });
    const order = readRecord(collection, route[1]);
    if (!order) return send(response, 404, { error: 'Orden no encontrada.' });
    if (order.estado !== 'Pendiente Por Instalar') return send(response, 409, { error: 'Solo se pueden reasignar órdenes pendientes.' });
    const username = String(body.tecnicoUsuario || '').trim().toLowerCase();
    let assignee = null;
    if (username) {
      assignee = database.prepare("SELECT username, display_name FROM users WHERE username = ? AND role = 'tecnico' AND active = 1").get(username);
      if (!assignee) return send(response, 400, { error: 'Selecciona un técnico activo.' });
    }
    const updated = saveRecord(collection, {
      ...order,
      tecnicoAsignado: assignee?.username || 'Equipo de Campo FTTH',
      tecnicoNombre: assignee?.display_name || 'Equipo de Campo FTTH'
    });
    return send(response, 200, { orden: updated });
  }

  if (collection === 'ordenes-instalacion' && route[1] && route[2] === 'iniciar' && method === 'PUT') {
    if (!requireRoles(user, technicianWrite)) return send(response, 403, { error: 'No tiene permiso para iniciar instalaciones.' });
    const order = readRecord(collection, route[1]);
    if (!order) return send(response, 404, { error: 'Orden no encontrada.' });
    if (order.estado !== 'Pendiente Por Instalar') return send(response, 409, { error: 'La orden ya fue iniciada o completada.' });
    if (user.role === 'tecnico' && order.tecnicoAsignado && order.tecnicoAsignado !== 'Equipo de Campo FTTH' && order.tecnicoAsignado.toLowerCase() !== user.username.toLowerCase()) {
      return send(response, 403, { error: 'Esta instalación está asignada a otro técnico.' });
    }
    const updated = saveRecord(collection, {
      ...order,
      estado: 'En Progreso',
      tecnicoAsignado: user.role === 'tecnico' ? user.username : order.tecnicoAsignado,
      tecnicoNombre: user.role === 'tecnico' ? user.display_name : order.tecnicoNombre,
      inicioTrabajo: new Date().toISOString()
    });
    return send(response, 200, { orden: updated });
  }

  if (collection === 'taquilla-virtual') {
    if (method === 'GET' && route.length === 1) {
      if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para consultar pagos.' });
      return send(response, 200, listRecords(collection));
    }
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para procesar pagos virtuales.' });
    if (route[1] === 'aprobar' && method === 'POST' || route[1] === 'rechazar' && method === 'POST') {
      const payment = readRecord(collection, body.id);
      if (!payment) return send(response, 404, { error: 'Pago no encontrado.' });
      if (payment.estado !== 'PENDIENTE') return send(response, 409, { error: 'Este pago ya fue procesado.' });
      if (route[1] === 'aprobar' && user.role === 'admin' && readRecord('cierres-caja', `CIERRE-${user.id}-${businessDate()}`)) {
        return send(response, 409, { error: 'Tu caja de hoy ya está cerrada. No puedes aprobar más pagos.' });
      }
      const state = route[1] === 'aprobar' ? 'APROBADO' : 'RECHAZADO';
      const processedAt = new Date().toISOString();
      inTransaction(() => {
        saveRecord(collection, { ...payment, estado: state, fechaProcesado: processedAt, procesadoPor: user.display_name, procesadoPorId: user.id, procesadoPorUsuario: user.username, motivoRechazo: body.motivo || '' });
        if (state === 'APROBADO') {
          const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(payment.cedula));
          if (client) {
            const amount = Number(payment.monto) || 0;
            const remainingDebt = Math.max(0, Number(client.montoDeuda || 0) - amount);
            const receipt = { id: makeId('PAG'), monto: amount, fecha: processedAt.slice(0, 16).replace('T', ' '), fechaContable: businessDate(new Date(processedAt)), metodo: `Pago móvil ${payment.banco || ''}`.trim(), recibidoPor: user.display_name, registradoPorId: user.id, registradoPorUsuario: user.username, numeroComprobante: String(payment.referencia || makeId('REC')), notas: 'Pago móvil aprobado' };
            saveRecord('clientes', { ...client, montoDeuda: remainingDebt, estadoPago: remainingDebt === 0 ? 'Al Día' : 'Pendiente', estado: remainingDebt === 0 && client.estado === 'Suspendido' ? 'Activo' : client.estado, fechaUltimoPago: processedAt.slice(0, 10), historialPagos: [receipt, ...(client.historialPagos || [])] });
          }
        }
      });
      return send(response, 200, { mensaje: `Pago ${state.toLowerCase()}.` });
    }
  }

  if (collection === 'inventario') {
    if (method === 'GET' && route.length === 1) return send(response, 200, { inventario: listRecords('inventario'), despachos: listRecords('despachos') });
    if (route[1] === 'reabastecer' && method === 'POST') {
      if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para reabastecer inventario.' });
      const item = readRecord(collection, body.id);
      if (!item || Number(body.cantidadSumar) <= 0) return send(response, 400, { error: 'Material o cantidad inválidos.' });
      const updated = saveRecord(collection, { ...item, cantidad: Number(item.cantidad) + Number(body.cantidadSumar), ultimoReabastecimiento: new Date().toISOString().slice(0, 10), alertaCompra: false });
      return send(response, 200, { inventario: listRecords(collection), item: updated, mensaje: 'Stock reabastecido.' });
    }
    if (route[1] === 'despachar-materiales' && method === 'POST') {
      if (!requireRoles(user, technicianWrite)) return send(response, 403, { error: 'No tiene permiso para despachar materiales.' });
      const cable = Number(body.cableGastado || body.metrosDrop || 0);
      const connectors = Number(body.conectoresGastados || body.conectores || 0);
      const ontChanged = Boolean(body.ontCambiada);
      const portAssignment = body.asignacionPuerto;
      if (cable < 0 || connectors < 0) return send(response, 400, { error: 'Las cantidades no pueden ser negativas.' });
      const installation = body.ticketId ? readRecord('ordenes-instalacion', body.ticketId) : null;
      if (installation && installation.estado !== 'En Progreso') {
        return send(response, 409, { error: 'Inicia la instalación antes de registrar materiales.' });
      }
      if (installation && user.role === 'tecnico' && installation.tecnicoAsignado?.toLowerCase() !== user.username.toLowerCase()) {
        return send(response, 403, { error: 'Esta instalación está asignada a otro técnico.' });
      }
      let targetBox = null;
      let targetPort = 0;
      let targetClient = null;
      if (installation) {
        targetPort = Number(portAssignment?.puerto);
        const serialOnt = String(portAssignment?.serialOnt || '').trim().toUpperCase();
        if (!portAssignment?.napId || !Number.isInteger(targetPort) || !/^[A-Z0-9-]{6,40}$/.test(serialOnt)) {
          return send(response, 400, { error: 'Indica una caja NAP, un puerto y un serial ONT válido.' });
        }
        const macOnt = String(portAssignment?.macOnt || '').trim().toUpperCase();
        if (macOnt && !/^(?:[A-F0-9]{2}[:-]){5}[A-F0-9]{2}$|^[A-F0-9]{12}$/.test(macOnt)) {
          return send(response, 400, { error: 'La dirección MAC de la ONT no tiene un formato válido.' });
        }
        if (portAssignment?.potenciaOpticaDbm !== '' && portAssignment?.potenciaOpticaDbm != null) {
          const signal = Number(portAssignment.potenciaOpticaDbm);
          if (!Number.isFinite(signal) || signal < -50 || signal > 0) return send(response, 400, { error: 'La potencia óptica debe estar entre -50 y 0 dBm.' });
        }
        targetBox = readRecord('cajas-nap', portAssignment.napId);
        if (!targetBox || targetBox.estado !== 'Operativa') return send(response, 409, { error: 'La caja NAP no existe o no está operativa.' });
        if (targetPort < 1 || targetPort > Number(targetBox.puertosTotales)) return send(response, 400, { error: 'El puerto indicado no pertenece a esa caja NAP.' });
        const serialInUse = listRecords('clientes').some(client => String(client.serialOnt || '').toUpperCase() === serialOnt);
        if (serialInUse) return send(response, 409, { error: 'Ese serial ONT ya está registrado en otro cliente.' });
        if (macOnt && listRecords('clientes').some(client => String(client.macOnt || '').replace(/[:-]/g, '').toUpperCase() === macOnt.replace(/[:-]/g, ''))) {
          return send(response, 409, { error: 'Esa dirección MAC ya está registrada en otro cliente.' });
        }
        targetClient = listRecords('clientes').find(client => normalizedId(client.cedula) === normalizedId(installation.cedula));
        if (!targetClient) return send(response, 404, { error: 'No se encontró el cliente asociado a la instalación.' });
      }
      const dispatch = () => inTransaction(() => {
        let assignments = [];
        if (installation) {
          const currentBox = readRecord('cajas-nap', targetBox.id);
          const currentOrder = readRecord('ordenes-instalacion', installation.id);
          if (!currentBox || currentBox.estado !== 'Operativa' || !currentOrder || currentOrder.estado !== 'En Progreso') {
            throw Object.assign(new Error('La caja o la orden cambió mientras se guardaba la instalación.'), { status: 409 });
          }
          assignments = currentBox.asignacionesPuertos || Array.from({ length: Number(currentBox.puertosTotales) }, (_, index) => ({
            puerto: index + 1,
            estado: index < Number(currentBox.puertosOcupados || 0) ? 'Ocupado' : 'Libre',
            legado: index < Number(currentBox.puertosOcupados || 0)
          }));
          if (assignments.find(item => Number(item.puerto) === targetPort)?.estado === 'Ocupado') {
            throw Object.assign(new Error('Ese puerto NAP ya está ocupado. Selecciona otro puerto disponible.'), { status: 409 });
          }
          if (listRecords('clientes').some(client => String(client.serialOnt || '').toUpperCase() === String(portAssignment.serialOnt).trim().toUpperCase())) {
            throw Object.assign(new Error('Ese serial ONT ya fue registrado.'), { status: 409 });
          }
          const normalizedMac = String(portAssignment.macOnt || '').replace(/[:-]/g, '').toUpperCase();
          if (normalizedMac && listRecords('clientes').some(client => String(client.macOnt || '').replace(/[:-]/g, '').toUpperCase() === normalizedMac)) {
            throw Object.assign(new Error('Esa dirección MAC ya fue registrada.'), { status: 409 });
          }
        }
        if (cable) touchInventory('INV-001', -cable);
        if (connectors) touchInventory('INV-002', -connectors);
        if (ontChanged) touchInventory('INV-003', -1);
        const item = saveRecord('despachos', { id: makeId('DESP'), fecha: new Date().toISOString(), ticketId: body.ticketId || '', tecnico: user.display_name, cableGastado: cable, conectoresGastados: connectors, ontCambiada: ontChanged, motivo: body.ticketId ? `Cierre de ${body.ticketId}` : 'Despacho técnico' });
        if (body.ticketId) {
          for (const name of ['fallas', 'ordenes-instalacion']) {
            const linked = readRecord(name, body.ticketId);
            if (linked && name === 'fallas') saveRecord(name, { ...linked, estado: 'Resuelto', fechaResolucion: new Date().toISOString() });
            if (linked && name === 'ordenes-instalacion') {
              const installData = installation ? {
                napId: targetBox.id,
                napNombre: targetBox.nombre,
                puertoNap: targetPort,
                serialOnt: String(portAssignment.serialOnt).trim().toUpperCase(),
                macOnt: String(portAssignment.macOnt || '').trim().toUpperCase(),
                oltNombre: String(portAssignment.oltNombre || '').trim(),
                oltFrame: String(portAssignment.frame || '').trim(),
                oltSlot: String(portAssignment.slot || '').trim(),
                oltPon: String(portAssignment.pon || '').trim(),
                onuId: String(portAssignment.onuId || '').trim(),
                potenciaOpticaDbm: portAssignment.potenciaOpticaDbm === '' || portAssignment.potenciaOpticaDbm == null ? null : Number(portAssignment.potenciaOpticaDbm)
              } : {};
              saveRecord(name, { ...linked, ...installData, estado: 'Instalado', metrosDropUsados: cable, conectoresUsados: connectors });
              const client = listRecords('clientes').find(item => normalizedId(item.cedula) === normalizedId(linked.cedula));
              if (client) {
                if (installation) {
                  assignments = assignments.map(port => Number(port.puerto) === targetPort ? {
                    puerto: targetPort,
                    estado: 'Ocupado',
                    clienteId: client.id || client.cedula,
                    cedula: client.cedula,
                    nombreCliente: client.nombre,
                    serialOnt: installData.serialOnt,
                    macOnt: installData.macOnt,
                    oltNombre: installData.oltNombre,
                    frame: installData.oltFrame,
                    slot: installData.oltSlot,
                    pon: installData.oltPon,
                    onuId: installData.onuId,
                    potenciaOpticaDbm: installData.potenciaOpticaDbm,
                    asignadoEn: new Date().toISOString()
                  } : port);
                  saveRecord('cajas-nap', {
                    ...targetBox,
                    asignacionesPuertos: assignments,
                    puertosOcupados: assignments.filter(port => port.estado === 'Ocupado').length,
                    estado: assignments.every(port => port.estado === 'Ocupado') ? 'Saturada' : 'Operativa'
                  });
                }
                const opticalHistory = installData.potenciaOpticaDbm === null ? {} : {
                  historialOptico: [{ fecha: new Date().toISOString(), potenciaOpticaDbm: installData.potenciaOpticaDbm, ticketId: linked.id, tecnico: user.display_name }, ...(client.historialOptico || [])].slice(0, 90),
                  alertaOptica: installData.potenciaOpticaDbm <= -27
                };
                saveRecord('clientes', { ...client, ...installData, ...opticalHistory, sector: installation ? targetBox.sector : client.sector, estado: 'Activo', estadoPago: client.estadoPago || 'Al Día' });
              }
            }
          }
        }
        return item;
      });
      const item = dispatch();
      return send(response, 200, {
        despacho: item,
        inventario: listRecords('inventario'),
        despachos: listRecords('despachos'),
        fallas: listRecords('fallas'),
        ordenesInstalacion: listRecords('ordenes-instalacion'),
        cajasNap: listRecords('cajas-nap'),
        clientes: listRecords('clientes')
      });
    }
  }

  if (collection === 'cajas-nap') {
    if (method === 'GET' && route.length === 1) {
      if (!requireRoles(user, technicianWrite)) return send(response, 403, { error: 'No tiene permiso para consultar las cajas NAP.' });
      return send(response, 200, listRecords(collection));
    }
    if (!requireRoles(user, ownerAdmin)) return send(response, 403, { error: 'No tiene permiso para modificar cajas NAP.' });
    if (method === 'POST' && route.length === 1) {
      if (readRecord(collection, body.id)) return send(response, 409, { error: 'Ya existe una caja con ese ID.' });
      const box = saveRecord(collection, body);
      return send(response, 201, { caja: box });
    }
    if (route[1] && method === 'PUT') {
      const current = readRecord(collection, route[1]);
      if (!current) return send(response, 404, { error: 'Caja NAP no encontrada.' });
      const nextCapacity = Number(body.puertosTotales ?? current.puertosTotales);
      const assignedPorts = current.asignacionesPuertos
        ? current.asignacionesPuertos.filter(port => port.estado === 'Ocupado').length
        : Number(current.puertosOcupados || 0);
      if (!Number.isInteger(nextCapacity) || nextCapacity < 1 || (assignedPorts !== undefined && assignedPorts > nextCapacity)) {
        return send(response, 409, { error: 'La capacidad no puede ser menor que el número de puertos asignados.' });
      }
      const nextAssignments = current.asignacionesPuertos
        ? Array.from({ length: nextCapacity }, (_, index) => current.asignacionesPuertos.find(port => Number(port.puerto) === index + 1) || { puerto: index + 1, estado: 'Libre' })
        : undefined;
      const updatedBox = {
        ...current,
        ...body,
        id: route[1],
        ...(current.asignacionesPuertos ? { asignacionesPuertos: nextAssignments, puertosOcupados: assignedPorts } : { puertosOcupados: Math.min(Number(body.puertosOcupados ?? assignedPorts), nextCapacity) })
      };
      return send(response, 200, { caja: saveRecord(collection, updatedBox) });
    }
    if (route[1] && method === 'DELETE') {
      const current = readRecord(collection, route[1]);
      if (!current) return send(response, 404, { error: 'Caja NAP no encontrada.' });
      if (Number(current.puertosOcupados || 0) > 0 || current.asignacionesPuertos?.some(port => port.estado === 'Ocupado')) {
        return send(response, 409, { error: 'No se puede eliminar una caja NAP con puertos ocupados. Reasigna primero los abonados conectados.' });
      }
      return removeRecord(collection, route[1]) ? send(response, 200, { ok: true }) : send(response, 404, { error: 'Caja NAP no encontrada.' });
    }
  }

  if (collection === 'ordenes-instalacion' && route[1] && route[2] === 'completar' && method === 'PUT') {
    if (!requireRoles(user, technicianWrite)) return send(response, 403, { error: 'No tiene permiso para completar instalaciones.' });
    const order = readRecord(collection, route[1]);
    if (!order) return send(response, 404, { error: 'Orden no encontrada.' });
    if (order.estado !== 'En Progreso') return send(response, 409, { error: 'Inicia la instalación antes de completarla.' });
    if (user.role === 'tecnico' && order.tecnicoAsignado?.toLowerCase() !== user.username.toLowerCase()) return send(response, 403, { error: 'Esta instalación está asignada a otro técnico.' });
    const updated = saveRecord(collection, { ...order, estado: 'Instalado', metrosDropUsados: Number(body.metrosDrop || 0), conectoresUsados: Number(body.conectores || 0), tecnicoAsignado: String(body.tecnico || user.display_name) });
    return send(response, 200, { orden: updated });
  }

  if (['notificaciones-tecnicos', 'ordenes-instalacion', 'despachos'].includes(collection) && method === 'GET' && route.length === 1) {
    const records = listRecords(collection);
    if (collection === 'ordenes-instalacion' && user.role === 'tecnico') {
      return send(response, 200, records.filter(order => !order.tecnicoAsignado || order.tecnicoAsignado === 'Equipo de Campo FTTH' || order.tecnicoAsignado.toLowerCase() === user.username.toLowerCase()));
    }
    return send(response, 200, records);
  }

  return send(response, 404, { error: 'Ruta no encontrada.' });
}

function serveStatic(request, response, url) {
  const requestedPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = normalize(join(root, 'dist', requestedPath));
  if (!filePath.startsWith(join(root, 'dist'))) return send(response, 403, { error: 'Ruta inválida.' });
  try {
    if (!statSync(filePath).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': staticTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(readFileSync(filePath));
  } catch {
    if (!extname(requestedPath)) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(readFileSync(join(root, 'dist', 'index.html')));
      return;
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('No se encontró la página. Ejecuta npm run build primero.');
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) await handleApi(request, response, url);
    else serveStatic(request, response, url);
  } catch (error) {
    const status = Number(error.status) || 500;
    if (status === 500) console.error('API error:', error);
    if (!response.headersSent) send(response, status, { error: status === 500 ? 'Error interno del servidor.' : error.message });
    else response.end();
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Cable Tartak API listening on http://localhost:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});

function close() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', close);
process.on('SIGTERM', close);