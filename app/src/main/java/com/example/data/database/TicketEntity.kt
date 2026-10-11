package com.example.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.data.model.Ticket

@Entity(tableName = "tickets")
data class TicketEntity(
    @PrimaryKey val id: String,
    val cedula: String,
    val tipo: String,
    val categoria: String,
    val detalle: String,
    val fecha: String,
    val estado: String,
    val notaTecnica: String? = null,
    /** false si el ticket aun no ha sido confirmado por el servidor. */
    val sincronizado: Boolean = true
) {
    fun toDomain(): Ticket = Ticket(
        id = id,
        cedula = cedula,
        tipo = tipo,
        categoria = categoria,
        detalle = detalle,
        fecha = fecha,
        estado = estado,
        notaTecnica = notaTecnica,
        sincronizado = sincronizado
    )

    companion object {
        fun fromDomain(ticket: Ticket): TicketEntity = TicketEntity(
            id = ticket.id,
            cedula = ticket.cedula,
            tipo = ticket.tipo,
            categoria = ticket.categoria,
            detalle = ticket.detalle,
            fecha = ticket.fecha,
            estado = ticket.estado,
            notaTecnica = ticket.notaTecnica,
            sincronizado = ticket.sincronizado
        )
    }
}
