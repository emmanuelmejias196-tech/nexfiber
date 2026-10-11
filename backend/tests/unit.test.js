'use strict';

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.JWT_SECRET = 'secreto-de-pruebas';

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizarCedula, exigirCedula, soloDigitos } = require('../src/utils/cedula');
const { revisarPoliticaClave, hashearClave, verificarClave, compararEnTiempoConstante } = require('../src/utils/password');
const { dividirSentencias } = require('../src/db/migrate');
const { prefijoTicket, codigoNumerico } = require('../src/utils/tokens');
const { normalizarPago } = require('../src/utils/pago');

test('normalizacion de cedulas', async (t) => {
  await t.test('acepta el formato con y sin prefijo', () => {
    assert.equal(normalizarCedula('28000000'), 'V-28000000');
    assert.equal(normalizarCedula('V-28000000'), 'V-28000000');
    assert.equal(normalizarCedula('v-28000000'), 'V-28000000');
    assert.equal(normalizarCedula('  28000000  '), 'V-28000000');
  });

  await t.test('respeta los prefijos E y J', () => {
    assert.equal(normalizarCedula('E-12345678'), 'E-12345678');
    assert.equal(normalizarCedula('J-9999999'), 'J-9999999');
  });

  await t.test('rechaza entradas invalidas', () => {
    assert.equal(normalizarCedula(''), null);
    assert.equal(normalizarCedula('abc'), null);
    assert.equal(normalizarCedula('V-12'), null);
    assert.equal(normalizarCedula('X-12345678'), null);
    assert.equal(normalizarCedula(null), null);
    assert.equal(normalizarCedula(12345678), null);
  });

  await t.test('exigirCedula lanza 422 con mensaje claro', () => {
    assert.throws(() => exigirCedula('abc'), (e) => e.codigoHttp === 422);
  });

  await t.test('soloDigitos extrae la parte numerica', () => {
    assert.equal(soloDigitos('V-28.000.000'), '28000000');
  });
});

test('politica de contrasenas', async (t) => {
  await t.test('rechaza contrasenas vacias o demasiado cortas', () => {
    assert.ok(revisarPoliticaClave('').length > 0);
    assert.ok(revisarPoliticaClave('abc').length > 0);
  });

  await t.test('rechaza espacios en los extremos', () => {
    assert.ok(revisarPoliticaClave('Tartak1 ').length > 0);
  });

  await t.test('rechaza contrasenas con muy pocos caracteres distintos', () => {
    assert.ok(revisarPoliticaClave('aaaaaa').length > 0);
  });

  await t.test('acepta una contrasena razonable', () => {
    assert.deepEqual(revisarPoliticaClave('Tartak2026'), []);
  });

  await t.test('bcrypt genera sales distintas y verifica correctamente', async () => {
    const a = await hashearClave('Tartak2026');
    const b = await hashearClave('Tartak2026');
    assert.notEqual(a, b, 'cada hash debe usar su propia sal');
    assert.equal(await verificarClave('Tartak2026', a), true);
    assert.equal(await verificarClave('Tartak2026', b), true);
    assert.equal(await verificarClave('Otra', a), false);
    assert.equal(await verificarClave('Tartak2026', null), false);
  });
});

test('comparacion en tiempo constante', () => {
  assert.equal(compararEnTiempoConstante('abc', 'abc'), true);
  assert.equal(compararEnTiempoConstante('abc', 'abd'), false);
  assert.equal(compararEnTiempoConstante('abc', 'abcd'), false);
  assert.equal(compararEnTiempoConstante('', ''), true);
});

test('ejecutor de migraciones', async (t) => {
  await t.test('divide sentencias por punto y coma', () => {
    const sql = 'CREATE TABLE a (id INT); CREATE TABLE b (id INT);';
    assert.equal(dividirSentencias(sql).length, 2);
  });

  await t.test('ignora los comentarios de linea', () => {
    const sql = '-- comentario con ; punto y coma\nCREATE TABLE a (id INT);';
    const partes = dividirSentencias(sql);
    assert.equal(partes.length, 1);
    assert.ok(!partes[0].includes('comentario'));
  });

  await t.test('respeta los bloques dollar-quoted', () => {
    const sql = `CREATE FUNCTION f() RETURNS void AS $$
      BEGIN
        SELECT 1;
      END;
    $$ LANGUAGE plpgsql;
    CREATE TABLE a (id INT);`;
    const partes = dividirSentencias(sql);
    assert.equal(partes.length, 2);
  });
});

test('utilidades de tickets y pagos', async (t) => {
  await t.test('prefijo por tipo de ticket', () => {
    assert.equal(prefijoTicket('falla'), 'TK-');
    assert.equal(prefijoTicket('pago'), 'PG-');
    assert.equal(prefijoTicket('diagnostico'), 'DG-');
  });

  await t.test('codigo numerico de activacion con longitud fija', () => {
    const codigo = codigoNumerico(6);
    assert.equal(codigo.length, 6);
    assert.match(codigo, /^\d{6}$/);
  });

  await t.test('normalizarPago limpia el monto del cuerpo de la peticion', () => {
    assert.equal(normalizarPago('$45.50'), '45.50');
    assert.equal(normalizarPago(' 45,50 '), '45,50');
  });
});
