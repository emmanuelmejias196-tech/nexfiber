'use strict';

/**
 * Ejecutor de migraciones.
 *
 * Lee los archivos .sql de database/migrations en orden lexicografico y los
 * aplica dentro de una transaccion, registrandolos en schema_migrations.
 * Es idempotente: volver a ejecutarlo no repite cambios ya aplicados.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('../config/logger');
const db = require('./pool');

async function crearTablaMigraciones(cliente) {
  await cliente.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre      VARCHAR(255) PRIMARY KEY,
      aplicado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Divide el archivo en sentencias de SQL.
 *
 * El analisis es caracter a caracter y respeta:
 *  - comentarios de linea `--` hasta el salto de linea;
 *  - cadenas entre comillas simples;
 *  - bloques $$ ... $$ (funciones y triggers), dentro de los cuales el
 *    punto y coma NO termina la sentencia.
 * De este modo un archivo con varias sentencias en una misma linea, o con
 * una funcion que contiene ';', se procesa correctamente.
 */
function dividirSentencias(sql) {
  const sentencias = [];
  let actual = '';
  let i = 0;
  let etiquetaDollar = null; // delimitador $$ o $tag$ abierto

  while (i < sql.length) {
    const caracter = sql[i];
    const siguiente = sql[i + 1];

    // Comentario de linea
    if (!etiquetaDollar && caracter === '-' && siguiente === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
      continue;
    }

    // Apertura de bloque dollar-quoted
    if (caracter === '$') {
      const coincidencia = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (coincidencia) {
        const delimitador = coincidencia[0];
        if (etiquetaDollar === null) {
          etiquetaDollar = delimitador;
          actual += delimitador;
          i += delimitador.length;
          continue;
        }
        if (etiquetaDollar === delimitador) {
          etiquetaDollar = null;
          actual += delimitador;
          i += delimitador.length;
          continue;
        }
      }
    }

    // Cadena entre comillas simples (con '' como escape)
    if (!etiquetaDollar && caracter === "'") {
      actual += caracter;
      i += 1;
      while (i < sql.length) {
        actual += sql[i];
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            actual += sql[i + 1];
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Comentario de bloque
    if (!etiquetaDollar && caracter === '/' && siguiente === '*') {
      const cierre = sql.indexOf('*/', i + 2);
      i = cierre === -1 ? sql.length : cierre + 2;
      continue;
    }

    if (caracter === ';' && etiquetaDollar === null) {
      const limpia = actual.trim();
      if (limpia) sentencias.push(limpia);
      actual = '';
      i += 1;
      continue;
    }

    actual += caracter;
    i += 1;
  }

  const cola = actual.trim();
  if (cola) sentencias.push(cola);
  return sentencias;
}

async function migrate({ cliente = null, soloPendientes = true } = {}) {
  const directorio = config.rutas.directorioMigraciones;
  if (!fs.existsSync(directorio)) {
    throw new Error(`No se encontro el directorio de migraciones en ${directorio}`);
  }

  const archivos = fs
    .readdirSync(directorio)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const contexto = cliente || db.getPool();
  const aplicados = [];

  if (!cliente) await crearTablaMigraciones(contexto);
  else await crearTablaMigraciones(cliente);

  const { rows } = await contexto.query('SELECT nombre FROM schema_migrations');
  const registro = new Set(rows.map((r) => r.nombre));

  for (const archivo of archivos) {
    if (soloPendientes && registro.has(archivo)) {
      logger.debug(`Migracion ya aplicada, se omite: ${archivo}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(directorio, archivo), 'utf8');
    const sentencias = dividirSentencias(sql);

    await contexto.query('BEGIN');
    try {
      for (const sentencia of sentencias) {
        await contexto.query(sentencia);
      }
      await contexto.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
      await contexto.query('COMMIT');
    } catch (error) {
      await contexto.query('ROLLBACK');
      throw new Error(`Fallo la migracion ${archivo}: ${error.message}`);
    }

    aplicados.push(archivo);
    logger.info(`Migracion aplicada: ${archivo}`);
  }

  return aplicados;
}

if (require.main === module) {
  migrate()
    .then((aplicadas) => {
      logger.info(
        aplicadas.length === 0
          ? 'Base de datos ya estaba al dia. No hay migraciones pendientes.'
          : `Migraciones completadas: ${aplicadas.length}`
      );
      return db.closePool();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error.message);
      process.exit(1);
    });
}

module.exports = { migrate, dividirSentencias, crearTablaMigraciones };
