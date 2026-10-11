package com.example.data.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface CableTartakDao {

    // ------------------------------------------------------------------
    // Clientes
    // ------------------------------------------------------------------

    @Query("SELECT * FROM customers WHERE cedula = :cedula LIMIT 1")
    suspend fun getCustomerByCedula(cedula: String): CustomerEntity?

    @Query("SELECT * FROM customers")
    fun getAllCustomers(): Flow<List<CustomerEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomer(customer: CustomerEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomers(customers: List<CustomerEntity>)

    @Update
    suspend fun updateCustomer(customer: CustomerEntity)

    // ------------------------------------------------------------------
    // Tickets
    // ------------------------------------------------------------------

    @Query("SELECT * FROM tickets WHERE cedula = :cedula ORDER BY fecha DESC")
    fun getTicketsByCedula(cedula: String): Flow<List<TicketEntity>>

    @Query("SELECT * FROM tickets WHERE cedula = :cedula ORDER BY fecha DESC")
    suspend fun getTicketsByCedulaOnce(cedula: String): List<TicketEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTicket(ticket: TicketEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTickets(tickets: List<TicketEntity>)

    /** Tickets creados sin conexion que aun no llegaron al servidor. */
    @Query("SELECT * FROM tickets WHERE sincronizado = 0 ORDER BY fecha ASC")
    suspend fun getTicketsPendientes(): List<TicketEntity>

    @Query("SELECT * FROM tickets WHERE id = :id LIMIT 1")
    suspend fun getTicketById(id: String): TicketEntity?

    @Query("UPDATE tickets SET estado = :nuevoEstado, notaTecnica = :nota WHERE id = :id")
    suspend fun updateTicketStatus(id: String, nuevoEstado: String, nota: String?)

    @Query("DELETE FROM tickets WHERE id = :id")
    suspend fun deleteTicket(id: String)
}
