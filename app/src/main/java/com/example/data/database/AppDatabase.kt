package com.example.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [CustomerEntity::class, TicketEntity::class], version = 3, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dao(): CableTartakDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "cable_tartak_db"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .build()
                INSTANCE = instance
                instance
            }
        }

        /**
         * 1 -> 2
         *
         * La version original de esta migracion BORRABA filas de clientes. Se
         * sustituyo por una sentencia inocua: perder contratos de clientes es
         * inaceptable y ningun usuario debe ver desaparecer su servicio por
         * actualizar la app.
         */
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Sin cambios de esquema ni de datos (migracion conservada por
                // compatibilidad con instalaciones que ya estaban en version 2).
            }
        }

        /**
         * 2 -> 3
         *
         * Reconstruye las tablas para:
         *  - eliminar `customers.clave` (la contrasena en claro que se guardaba);
         *  - anadir `customers.planId`, `customers.ultimaSyncEn` y
         *    `tickets.sincronizado`.
         * Los datos existentes (contratos y tickets) se copian intactos.
         */
        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS customers_new (
                        cedula TEXT NOT NULL PRIMARY KEY,
                        nombre TEXT NOT NULL,
                        plan TEXT NOT NULL,
                        planId TEXT,
                        isActivated INTEGER NOT NULL,
                        servicioActivo INTEGER NOT NULL,
                        ontSerial TEXT NOT NULL,
                        ipAsignada TEXT NOT NULL,
                        potenciaOptica TEXT NOT NULL,
                        estadoFibra TEXT NOT NULL,
                        mensualidadUsd REAL NOT NULL,
                        saldoPendienteUsd REAL NOT NULL,
                        fechaCorte TEXT NOT NULL,
                        direccion TEXT NOT NULL,
                        telefono TEXT NOT NULL,
                        ultimaSyncEn INTEGER
                    )
                    """.trimIndent()
                )

                database.execSQL(
                    """
                    INSERT INTO customers_new (
                        cedula, nombre, plan, planId, isActivated, servicioActivo, ontSerial,
                        ipAsignada, potenciaOptica, estadoFibra, mensualidadUsd, saldoPendienteUsd,
                        fechaCorte, direccion, telefono, ultimaSyncEn
                    )
                    SELECT
                        cedula, nombre, plan, NULL, isActivated, servicioActivo, ontSerial,
                        ipAsignada, potenciaOptica, estadoFibra, mensualidadUsd, saldoPendienteUsd,
                        fechaCorte, direccion, telefono, NULL
                    FROM customers
                    """.trimIndent()
                )

                database.execSQL("DROP TABLE customers")
                database.execSQL("ALTER TABLE customers_new RENAME TO customers")

                database.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS tickets_new (
                        id TEXT NOT NULL PRIMARY KEY,
                        cedula TEXT NOT NULL,
                        tipo TEXT NOT NULL,
                        categoria TEXT NOT NULL,
                        detalle TEXT NOT NULL,
                        fecha TEXT NOT NULL,
                        estado TEXT NOT NULL,
                        notaTecnica TEXT,
                        sincronizado INTEGER NOT NULL DEFAULT 1
                    )
                    """.trimIndent()
                )

                database.execSQL(
                    """
                    INSERT INTO tickets_new (
                        id, cedula, tipo, categoria, detalle, fecha, estado, notaTecnica, sincronizado
                    )
                    SELECT id, cedula, tipo, categoria, detalle, fecha, estado, notaTecnica, 1
                    FROM tickets
                    """.trimIndent()
                )

                database.execSQL("DROP TABLE tickets")
                database.execSQL("ALTER TABLE tickets_new RENAME TO tickets")
            }
        }
    }
}
