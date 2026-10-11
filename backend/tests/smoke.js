'use strict';

/**
 * Prueba de humo: arranca la aplicacion real sobre una base de datos en
 * memoria, aplica las migraciones de database/ y recorre el flujo completo
 * del cliente. Sirve para comprobar que todo encaja antes de desplegar.
 *
 *   node tests/smoke.js
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.JWT_SECRET = 'humo-solo-pruebas';
process.env.ADMIN_API_KEY = 'humo-admin';

const request = require('supertest');
const { prepararEntorno, crearCliente, db } = require('./helpers');

const CLAVE = 'Tartak2026';

function comprobar(condicion, mensaje) {
  if (!condicion) {
    console.error(`  FALLO: ${mensaje}`);
    process.exitCode = 1;
    throw new Error(mensaje);
  }
  console.log(`  ok  ${mensaje}`);
}

async function principal() {
  console.log('\n== Verificacion de extremo a extremo (base en memoria) ==\n');
  const { app } = await prepararEntorno();

  console.log('1. Salud del servicio');
  const salud = await request(app).get('/health');
  comprobar(salud.body.baseDeDatos.estado === 'ok', 'la base de datos responde');

  console.log('\n2. Alta de contrato por la oficina');
  await crearCliente({ cedula: 'V-28000000', nombre: 'Cliente de Prueba' });
  const alta = await request(app)
    .post('/api/admin/clientes')
    .set('x-admin-key', 'humo-admin')
    .send({ cedula: 'V-28555123', nombre: 'Segundo Cliente', planId: 'p2', mensualidadUsd: 35 });
  comprobar(alta.status === 201, 'la consola de oficina registra el contrato');

  console.log('\n3. Verificacion de cedula');
  const verificacion = await request(app)
    .post('/api/app/verificar-cedula')
    .send({ cedula: '28000000' });
  comprobar(verificacion.body.nombre === 'Cliente de Prueba', 'el cliente ve su contrato');
  comprobar(verificacion.body.activado === false, 'la cuenta aun no esta activada');

  console.log('\n4. Activacion de la cuenta');
  const activacion = await request(app)
    .post('/api/app/activar-usuario')
    .send({ cedula: 'V-28000000', clave: CLAVE });
  comprobar(activacion.status === 201, 'la cuenta se activa');
  comprobar(!!activacion.body.accessToken, 'recibe token de acceso');

  const { rows } = await db.query('SELECT clave_hash FROM clientes WHERE cedula = $1', ['V-28000000']);
  comprobar(rows[0].clave_hash.startsWith('$2'), 'la clave se guarda como hash bcrypt');

  console.log('\n5. Inicio de sesion');
  const sesion = await request(app)
    .post('/api/app/iniciar-sesion')
    .send({ cedula: 'V-28000000', clave: CLAVE });
  comprobar(sesion.status === 200, 'inicia sesion con la clave correcta');
  const token = sesion.body.accessToken;

  const claveMala = await request(app)
    .post('/api/app/iniciar-sesion')
    .send({ cedula: 'V-28000000', clave: 'Incorrecta123' });
  comprobar(claveMala.status === 401, 'rechaza una clave incorrecta');

  console.log('\n6. Reporte de averia');
  const reporte = await request(app)
    .post('/api/app/crear-reporte')
    .set('Authorization', `Bearer ${token}`)
    .send({ tipo: 'falla', categoria: 'Luz roja LOS', detalle: 'Router sin senal desde hace una hora.' });
  comprobar(reporte.status === 201, 'el reporte se registra');
  comprobar(/^TK-\d{5}$/.test(reporte.body.ticketId), `el codigo lo asigna el servidor (${reporte.body.ticketId})`);

  const sinToken = await request(app).get('/api/app/tickets');
  comprobar(sinToken.status === 401, 'sin token no se leen los tickets');

  const tickets = await request(app)
    .get('/api/app/tickets')
    .set('Authorization', `Bearer ${token}`);
  comprobar(tickets.body.tickets.length === 1, 'el cliente ve su ticket');

  console.log('\n7. Pago movil C2P');
  const pago = {
    telefono: '04141234567',
    cedula: 'V-28000000',
    codigoBanco: '0134',
    referencia: '84729104',
    montoBs: 45
  };
  const primero = await request(app)
    .post('/api/pagos/c2p-automatico')
    .set('Authorization', `Bearer ${token}`)
    .send(pago);
  comprobar(primero.status === 201, 'el pago se concilia');

  const repetido = await request(app)
    .post('/api/pagos/c2p-automatico')
    .set('Authorization', `Bearer ${token}`)
    .send(pago);
  comprobar(repetido.body.codigoRespuesta === 'ERR_REFERENCIA_DUPLICADA', 'una referencia no se puede reutilizar');

  console.log('\n8. Solicitud de cambio de plan');
  const solicitud = await request(app)
    .post('/api/app/solicitar-cambio')
    .set('Authorization', `Bearer ${token}`)
    .send({ nuevoPlanId: 'p4' });
  comprobar(solicitud.status === 201, 'la solicitud se registra');

  const aprobacion = await request(app)
    .post(`/api/admin/solicitudes-plan/${solicitud.body.solicitud.id}/resolver`)
    .set('x-admin-key', 'humo-admin')
    .send({ estado: 'Aprobado' });
  comprobar(aprobacion.status === 200, 'la oficina la aprueba');

  const perfil = await request(app)
    .get('/api/app/mi-perfil')
    .set('Authorization', `Bearer ${token}`);
  comprobar(perfil.body.cliente.plan === 'Plan Gamer - 500 Mbps', 'el plan nuevo queda activo');

  console.log('\n9. Ruta heredada (APK antiguas)');
  const legado = await request(app)
    .post('/reportar-falla')
    .send({ cedula: 'V-28555123', tipo: 'falla', detalle: 'Reporte desde la version anterior.' });
  comprobar(legado.status === 201, 'la ruta heredada sigue respondiendo');

  console.log('\n10. Cierre de sesion');
  const cierre = await request(app)
    .post('/api/app/logout')
    .send({ refreshToken: sesion.body.refreshToken });
  comprobar(cierre.status === 200, 'cierra sesion');

  const despues = await request(app)
    .post('/api/app/refresh')
    .send({ refreshToken: sesion.body.refreshToken });
  comprobar(despues.status === 401, 'el token de refresco queda invalidado');

  console.log('\n== Verificacion completada sin fallos ==\n');
}

principal()
  .then(() => process.exit(process.exitCode || 0))
  .catch((error) => {
    console.error('\nError inesperado:', error.message);
    process.exit(1);
  });


