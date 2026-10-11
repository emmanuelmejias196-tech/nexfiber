'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { prepararEntorno, crearCliente, limpiar, db } = require('./helpers');

const CLAVE = 'Tartak2026';

test('API de NEXFIBER', async (t) => {
  const { app } = await prepararEntorno();

  await t.test('raiz responde el mensaje de compatibilidad', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /Servidor Central (NEXFIBER|de Cable Tartak)/);
  });

  await t.test('health reporta el estado de la base de datos', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.baseDeDatos.estado, 'ok');
  });

  await t.test('ruta inexistente devuelve 404 en JSON', async () => {
    const res = await request(app).get('/ruta-que-no-existe');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'RUTA_NO_ENCONTRADA');
  });

  await t.test('verificar-cedula rechaza cedulas con formato invalido', async () => {
    const res = await request(app).post('/api/app/verificar-cedula').send({ cedula: 'abc' });
    assert.equal(res.status, 422);
    assert.equal(res.body.error, 'VALIDACION');
  });

  await t.test('verificar-cedula informa cuando no esta registrada', async () => {
    await limpiar();
    const res = await request(app).post('/api/app/verificar-cedula').send({ cedula: 'V-99999999' });
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'CEDULA_NO_REGISTRADA');
  });

  await t.test('verificar-cedula devuelve el contrato y normaliza el formato', async () => {
    await crearCliente({ cedula: 'V-28000000' });
    const res = await request(app).post('/api/app/verificar-cedula').send({ cedula: '28000000' });
    assert.equal(res.status, 200);
    assert.equal(res.body.cedula, 'V-28000000');
    assert.equal(res.body.nombre, 'Cliente de Prueba');
    assert.equal(res.body.activado, false);
  });

  await t.test('activar-usuario crea la clave y devuelve tokens', async () => {
    const res = await request(app)
      .post('/api/app/activar-usuario')
      .send({ cedula: '28000000', clave: CLAVE });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.accessToken, 'debe devolver accessToken');
    assert.ok(res.body.refreshToken, 'debe devolver refreshToken');
    assert.equal(res.body.cliente.activado, true);
  });

  await t.test('la clave nunca se guarda en claro', async () => {
    const { rows } = await db.query('SELECT clave_hash FROM clientes WHERE cedula = $1', ['V-28000000']);
    assert.ok(rows[0].clave_hash.startsWith('$2'), 'debe ser un hash bcrypt');
    assert.ok(!rows[0].clave_hash.includes(CLAVE));
  });

  await t.test('no se puede sobrescribir una clave existente', async () => {
    const res = await request(app)
      .post('/api/app/activar-usuario')
      .send({ cedula: 'V-28000000', clave: 'OtraClave1' });
    assert.equal(res.status, 409);
    assert.match(res.body.mensaje, /ya tiene una clave creada/);
  });

  await t.test('la activacion rechaza contrasenas debiles', async () => {
    await crearCliente({ cedula: 'V-28555123', nombre: 'Segundo Cliente' });
    const res = await request(app)
      .post('/api/app/activar-usuario')
      .send({ cedula: 'V-28555123', clave: 'aaa' });
    assert.equal(res.status, 422);
  });

  await t.test('iniciar-sesion acepta credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-28000000', clave: CLAVE });
    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken);
  });

  await t.test('iniciar-sesion rechaza contrasena incorrecta', async () => {
    const res = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-28000000', clave: 'ClaveIncorrecta1' });
    assert.equal(res.status, 401);
  });

  await t.test('las rutas protegidas exigen token', async () => {
    const res = await request(app).get('/api/app/tickets');
    assert.equal(res.status, 401);
  });

  await t.test('flujo completo: crear reporte, listar tickets y usar el ticketId del servidor', async (sub) => {
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-28000000', clave: CLAVE });
    const token = login.body.accessToken;

    const creado = await request(app)
      .post('/api/app/crear-reporte')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'falla', categoria: 'Luz roja LOS en router', detalle: 'El router muestra luz roja desde hace dos horas.' });

    assert.equal(creado.status, 201);
    assert.match(creado.body.ticketId, /^TK-\d{5}$/, 'el codigo lo asigna el servidor');

    const listado = await request(app)
      .get('/api/app/tickets')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(listado.status, 200);
    assert.equal(listado.body.tickets.length, 1);
    assert.equal(listado.body.tickets[0].id, creado.body.ticketId);
    assert.equal(listado.body.tickets[0].estado, 'Registrado');
  });

  await t.test('un cliente no puede leer tickets de otro', async () => {
    await crearCliente({ cedula: 'V-30112233', nombre: 'Otro Cliente' });
    await request(app).post('/api/app/activar-usuario').send({ cedula: 'V-30112233', clave: CLAVE });
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-30112233', clave: CLAVE });

    const listado = await request(app)
      .get('/api/app/tickets/TK-10001')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    assert.equal(listado.status, 404);
  });

  await t.test('solicitar cambio de plan deja el plan actual intacto', async () => {
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-28000000', clave: CLAVE });
    const token = login.body.accessToken;

    const res = await request(app)
      .post('/api/app/solicitar-cambio')
      .set('Authorization', `Bearer ${token}`)
      .send({ nuevoPlanId: 'p4' });

    assert.equal(res.status, 201);
    assert.equal(res.body.solicitud.estado, 'Pendiente');

    const perfil = await request(app)
      .get('/api/app/mi-perfil')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(perfil.body.cliente.plan, 'Plan Oro - 300 Mbps', 'el plan no cambia hasta aprobar');
  });

  await t.test('la consola de oficina exige la clave de administracion', async () => {
    const { rows } = await db.query('SELECT id FROM solicitudes_cambio_plan ORDER BY id DESC LIMIT 1');
    const id = rows[0].id;

    const sinClave = await request(app)
      .post(`/api/admin/solicitudes-plan/${id}/resolver`)
      .send({ estado: 'Aprobado' });
    assert.equal(sinClave.status, 401);

    const claveIncorrecta = await request(app)
      .post(`/api/admin/solicitudes-plan/${id}/resolver`)
      .set('x-admin-key', 'no-es-la-clave')
      .send({ estado: 'Aprobado' });
    assert.equal(claveIncorrecta.status, 401);

    const aprobada = await request(app)
      .post(`/api/admin/solicitudes-plan/${id}/resolver`)
      .set('x-admin-key', 'clave-admin-de-pruebas')
      .send({ estado: 'Aprobado' });
    assert.equal(aprobada.status, 200);

    const perfil = await db.query('SELECT plan, plan_id FROM clientes WHERE cedula = $1', ['V-28000000']);
    assert.equal(perfil.rows[0].plan, 'Plan Gamer - 500 Mbps');
    assert.equal(perfil.rows[0].plan_id, 'p4');
  });

  await t.test('el NOC puede actualizar el estado de un ticket', async () => {
    const listado = await request(app)
      .get('/api/admin/tickets?tipo=falla')
      .set('x-admin-key', 'clave-admin-de-pruebas');
    assert.equal(listado.status, 200);

    const codigo = listado.body.tickets[0].id;
    const res = await request(app)
      .patch(`/api/admin/tickets/${codigo}`)
      .set('x-admin-key', 'clave-admin-de-pruebas')
      .send({ estado: 'Resuelto', notaTecnica: 'Sustituida la ONT. Servicio restablecido.' });

    assert.equal(res.status, 200);
    assert.equal(res.body.ticket.estado, 'Resuelto');
  });

  await t.test('el catalogo de planes es publico', async () => {
    const res = await request(app).get('/api/app/planes');
    assert.equal(res.status, 200);
    assert.equal(res.body.planes.length, 4);
  });

  await t.test('el pago C2P rechaza referencias duplicadas', async () => {
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-28000000', clave: CLAVE });
    const token = login.body.accessToken;

    const datos = {
      telefono: '04141234567',
      cedula: 'V-28000000',
      codigoBanco: '0134',
      referencia: '84729104',
      montoBs: 45.5
    };

    const primero = await request(app)
      .post('/api/pagos/c2p-automatico')
      .set('Authorization', `Bearer ${token}`)
      .send(datos);
    assert.equal(primero.status, 201);
    assert.equal(primero.body.exito, true);

    const segundo = await request(app)
      .post('/api/pagos/c2p-automatico')
      .set('Authorization', `Bearer ${token}`)
      .send(datos);
    assert.equal(segundo.status, 400);
    assert.equal(segundo.body.codigoRespuesta, 'ERR_REFERENCIA_DUPLICADA');
  });

  await t.test('el pago C2P rechaza bancos fuera del catalogo SUDEBAN', async () => {
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-28000000', clave: CLAVE });
    const token = login.body.accessToken;

    const res = await request(app)
      .post('/api/pagos/c2p-automatico')
      .set('Authorization', `Bearer ${token}`)
      .send({
        telefono: '04141234567',
        cedula: 'V-28000000',
        codigoBanco: '9999',
        referencia: '84729999',
        montoBs: 10
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.codigoRespuesta, 'ERR_BANCO_NO_RECONOCIDO');
  });

  await t.test('el refresco de token rota correctamente', async () => {
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-28000000', clave: CLAVE });

    const nuevo = await request(app)
      .post('/api/app/refresh')
      .send({ refreshToken: login.body.refreshToken });
    assert.equal(nuevo.status, 200);
    assert.notEqual(nuevo.body.refreshToken, login.body.refreshToken);

    // El token anterior queda revocado: reutilizarlo invalida la sesion.
    const reutilizado = await request(app)
      .post('/api/app/refresh')
      .send({ refreshToken: login.body.refreshToken });
    assert.equal(reutilizado.status, 401);
  });

  await t.test('las rutas legacy siguen respondiendo para las APK antiguas', async () => {
    const res = await request(app).post('/verificar-cedula').send({ cedula: 'V-28000000' });
    assert.equal(res.status, 200);
    assert.equal(res.body.nombre, 'Cliente de Prueba');

    const reporte = await request(app)
      .post('/reportar-falla')
      .send({ cedula: 'V-28000000', tipo: 'falla', detalle: 'Prueba desde version antigua de la app.' });
    assert.equal(reporte.status, 201);
    assert.ok(reporte.body.ticketId);
  });

  await t.test('cambiar clave invalida las sesiones abiertas', async () => {
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-30112233', clave: CLAVE });
    const token = login.body.accessToken;

    const cambio = await request(app)
      .post('/api/app/cambiar-clave')
      .set('Authorization', `Bearer ${token}`)
      .send({ claveActual: CLAVE, claveNueva: 'NuevaClave2026' });
    assert.equal(cambio.status, 200);

    const refresco = await request(app)
      .post('/api/app/refresh')
      .send({ refreshToken: login.body.refreshToken });
    assert.equal(refresco.status, 401);

    const nuevoLogin = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-30112233', clave: 'NuevaClave2026' });
    assert.equal(nuevoLogin.status, 200);
  });

  // -------------------------------------------------------------------------
  // Buscador global y consola web
  // -------------------------------------------------------------------------

  await t.test('busqueda global encuentra por cedula, codigo de ticket y referencia', async () => {
    await limpiar();
    await crearCliente({ cedula: 'V-11223344', nombre: 'Maria Gomez', telefono: '04141111111' });

    const ticket = await db.query(
      `INSERT INTO tickets (codigo, cedula, tipo, categoria, detalle, estado)
       VALUES ('TK-10001','V-11223344','falla','Sin senal','No hay senal en la TV','Registrado')
       RETURNING codigo`
    );
    assert.equal(ticket.rows[0].codigo, 'TK-10001');

    await db.query(
      `INSERT INTO pagos_c2p (cedula, telefono, codigo_banco, banco_nombre, referencia, monto_bs, estado, codigo_respuesta)
       VALUES ('V-11223344','04141111111','0102','Banco de prueba','REF-98765',120.50,'Pendiente','01')`
    );

    const r = await request(app).get('/api/admin/buscar?q=gomez').set('x-admin-key', 'clave-admin-de-pruebas');
    assert.equal(r.status, 200);
    assert.equal(r.body.success, true);
    assert.equal(r.body.resultados.clientes.length, 1);
    assert.equal(r.body.resultados.clientes[0].cedula, 'V-11223344');

    const porTicket = await request(app)
      .get('/api/admin/buscar?q=TK-10001')
      .set('x-admin-key', 'clave-admin-de-pruebas');
    assert.equal(porTicket.body.resultados.tickets.length, 1);
    assert.equal(porTicket.body.resultados.tickets[0].codigo, 'TK-10001');

    const porReferencia = await request(app)
      .get('/api/admin/buscar?q=REF-98765')
      .set('x-admin-key', 'clave-admin-de-pruebas');
    assert.equal(porReferencia.body.resultados.pagos.length, 1);
    assert.equal(porReferencia.body.resultados.pagos[0].referencia, 'REF-98765');
  });

  await t.test('la busqueda del cliente solo devuelve sus propios datos', async () => {
    await limpiar();
    await crearCliente({ cedula: 'V-11223344', nombre: 'Maria Gomez' });
    await crearCliente({ cedula: 'V-55667788', nombre: 'Pedro Privado' });

    await db.query(
      `INSERT INTO tickets (codigo, cedula, tipo, categoria, detalle, estado)
       VALUES ('TK-10002','V-55667788','falla','Sin senal','Ticket de otro cliente','Registrado')`
    );

    await request(app).post('/api/app/activar-usuario').send({
      cedula: 'V-11223344',
      clave: CLAVE,
      telefono: '04141111111'
    });

    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-11223344', clave: CLAVE });
    assert.equal(login.status, 200);

    const res = await request(app)
      .get('/api/app/buscar?q=Ticket')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.resultados.tickets.length, 0, 'no debe ver tickets ajenos');

    const propio = await request(app)
      .get('/api/app/buscar?q=Gomez')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    assert.equal(propio.body.resultados.clientes.length, 1);
  });

  await t.test('la busqueda exige sesion y longitud minima', async () => {
    await limpiar();
    await crearCliente({ cedula: 'V-11223344', nombre: 'Maria Gomez' });
    const sinSesion = await request(app).get('/api/app/buscar?q=gomez');
    assert.equal(sinSesion.status, 401);

    const adminSinClave = await request(app).get('/api/admin/buscar?q=gomez');
    assert.equal(adminSinClave.status, 401);

    await request(app).post('/api/app/activar-usuario').send({
      cedula: 'V-11223344',
      clave: CLAVE,
      telefono: '04141111111'
    });
    const login = await request(app)
      .post('/api/app/iniciar-sesion')
      .send({ cedula: 'V-11223344', clave: CLAVE });

    const corta = await request(app)
      .get('/api/app/buscar?q=a')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    assert.equal(corta.status, 422);
  });

  await t.test('el estado de ticket solo acepta valores del ciclo de vida', async () => {
    await db.query(
      `INSERT INTO tickets (codigo, cedula, tipo, categoria, detalle, estado)
       VALUES ('TK-10002','V-11223344','falla','Sin senal','Ticket de prueba','Registrado')`
    );

    await request(app)
      .patch('/api/admin/tickets/TK-10002')
      .set('x-admin-key', 'clave-admin-de-pruebas')
      .send({ estado: 'Estado Inventado' });
    assert.equal((await db.query('SELECT estado FROM tickets WHERE codigo = $1', ['TK-10002'])).rows[0].estado,
      'Registrado');

    const ok = await request(app)
      .patch('/api/admin/tickets/TK-10002')
      .set('x-admin-key', 'clave-admin-de-pruebas')
      .send({ estado: 'En Proceso', notaTecnica: 'Tecnico en camino' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.ticket.estado, 'En Proceso');
    assert.equal(ok.body.ticket.notaTecnica, 'Tecnico en camino');
  });

  await t.test('la consola web exige clave y la cookie de sesion', async () => {
    const pagina = await request(app).get('/consola');
    assert.equal(pagina.status, 200);
    assert.match(pagina.text, /Consola de operacion/);

    const sinClave = await request(app).post('/consola/api/resumen');
    assert.equal(sinClave.status, 401);

    const claveMala = await request(app).post('/consola/login').send({ clave: 'incorrecta' });
    assert.equal(claveMala.status, 401);

    const agente = request.agent(app);
    const login = await agente.post('/consola/login').send({ clave: 'clave-admin-de-pruebas' });
    assert.equal(login.status, 200);

    const resumen = await agente.get('/consola/api/resumen');
    assert.equal(resumen.status, 200);
    assert.ok(Number.isInteger(resumen.body.clientes.total));

    const busqueda = await agente.get('/consola/api/buscar?q=Gomez');
    assert.equal(busqueda.status, 200);
    assert.equal(busqueda.body.success, true);

    await agente.post('/consola/logout');
    const trasCerrar = await agente.get('/consola/api/resumen');
    assert.equal(trasCerrar.status, 401, 'cerrar sesion debe revocar la cookie');
  });
});
