package com.example.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.data.model.Customer

/**
 * Contrato cacheado en el dispositivo.
 *
 * La version 3 elimino la columna `clave`: la contrasena nunca se guarda en el
 * telefono, solo el token de sesion. La migracion 2->3 reconstruye la tabla
 * conservando todos los demas datos.
 */
@Entity(tableName = "customers")
data class CustomerEntity(
    @PrimaryKey val cedula: String,
    val nombre: String,
    val plan: String,
    val planId: String? = null,
    val isActivated: Boolean = false,
    val servicioActivo: Boolean = true,
    val ontSerial: String = "",
    val ipAsignada: String = "",
    val potenciaOptica: String = "",
    val estadoFibra: String = "",
    val mensualidadUsd: Double = 0.0,
    val saldoPendienteUsd: Double = 0.0,
    val fechaCorte: String = "",
    val direccion: String = "",
    val telefono: String = "",
    val ultimaSyncEn: Long? = null
) {
    fun toDomain(): Customer = Customer(
        cedula = cedula,
        nombre = nombre,
        plan = plan,
        planId = planId,
        isActivated = isActivated,
        servicioActivo = servicioActivo,
        ontSerial = ontSerial,
        ipAsignada = ipAsignada,
        potenciaOptica = potenciaOptica,
        estadoFibra = estadoFibra,
        mensualidadUsd = mensualidadUsd,
        saldoPendienteUsd = saldoPendienteUsd,
        fechaCorte = fechaCorte,
        direccion = direccion,
        telefono = telefono
    )

    companion object {
        fun fromDomain(customer: Customer, ultimaSyncEn: Long? = null): CustomerEntity = CustomerEntity(
            cedula = customer.cedula,
            nombre = customer.nombre,
            plan = customer.plan,
            planId = customer.planId,
            isActivated = customer.isActivated,
            servicioActivo = customer.servicioActivo,
            ontSerial = customer.ontSerial,
            ipAsignada = customer.ipAsignada,
            potenciaOptica = customer.potenciaOptica,
            estadoFibra = customer.estadoFibra,
            mensualidadUsd = customer.mensualidadUsd,
            saldoPendienteUsd = customer.saldoPendienteUsd,
            fechaCorte = customer.fechaCorte,
            direccion = customer.direccion,
            telefono = customer.telefono,
            ultimaSyncEn = ultimaSyncEn
        )
    }
}
