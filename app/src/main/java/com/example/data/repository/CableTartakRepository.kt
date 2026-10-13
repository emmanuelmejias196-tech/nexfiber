package com.example.data.repository

import android.content.Context
import android.util.Log
import com.example.data.database.AppDatabase
import com.example.data.database.CustomerEntity
import com.example.data.database.TicketEntity
import com.example.data.model.Customer
import com.example.data.model.Factura
import com.example.data.model.PlanOferta
import com.example.data.model.Ticket
import com.example.data.network.ActivarUsuarioRequest
import com.example.data.network.ClienteDto
import com.example.data.network.CrearReporteRequest
import com.example.data.network.CredencialesRequest
import com.example.data.network.NetworkClient
import com.example.data.network.ReportePagoRequest
import com.example.data.network.SolicitarCambioPlanRequest
import com.example.data.network.TicketDto
import com.example.data.network.VerificarCedulaRequest
import com.example.data.security.CedulaFormatter
import com.example.data.security.TokenStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

sealed class NetworkMode {
    data class OnlineApi(val url: String) : NetworkMode()
    data class LocalOfficeSync(val reason: String) : NetworkMode()
}

data class ReportCreationResult(
    val ticket: Ticket,
    val syncedWithRender: Boolean
)

/** Pago C2P tal como lo devuelve el buscador del servidor. */
data class PagoRegistrado(
    val referencia: String,
    val banco: String,
    val montoBs: Double,
    val estado: String,
    val codigoRespuesta: String,
    val fecha: String
)

/** Solicitud de cambio de plan devuelta por el buscador. */
data class SolicitudCambio(
    val planActual: String,
    val planNuevo: String,
    val montoUsd: Double,
    val estado: String,
    val nota: String?,
    val fecha: String
)

/** Resultado consolidado de la busqueda global del cliente. */
data class BusquedaResultado(
    val consulta: String,
    val total: Int,
    val tickets: List<Ticket>,
    val pagos: List<PagoRegistrado>,
    val solicitudes: List<SolicitudCambio>,
    val facturas: List<Factura>,
    val conectado: Boolean
)

class CableTartakRepository(private val context: Context) {

    private val db = AppDatabase.getDatabase(context)
    private val dao = db.dao()
    private val tokenStore = TokenStore.obtener(context).also { NetworkClient.registrarTokenStore(it) }
    private val firebaseManager = com.example.data.firebase.FirebaseManager(context)

    private val api get() = NetworkClient.apiService

    suspend fun initializeLocalDatabase() = withContext(Dispatchers.IO) {
        db.openHelper.writableDatabase
    }

    // ==================================================================
    // Sesion
    // ==================================================================

    /**
     * Verifica el contrato por cedula.
     *
     * El servidor es la fuente de verdad: si responde, se actualiza la copia
     * local (antes solo se insertaba si no existia, lo que dejaba datos viejos
     * en pantalla). Si no hay conexion, se usa el contrato cacheado.
     */
    suspend fun verificarCedula(cedula: String): Pair<Customer, NetworkMode> = withContext(Dispatchers.IO) {
        val limpia = CedulaFormatter.normalizar(cedula)
            ?: throw IllegalArgumentException("La cédula no tiene un formato válido.")

        try {
            val respuesta = api.verificarCedula(VerificarCedulaRequest(limpia))

            if (respuesta.isSuccessful && respuesta.body()?.nombre != null) {
                val cuerpo = respuesta.body()!!
                val cliente = cuerpo.aCustomer()
                dao.insertCustomer(CustomerEntity.fromDomain(cliente, System.currentTimeMillis()))
                firebaseManager.syncCustomerToFirestore(cliente)
                return@withContext Pair(cliente, NetworkMode.OnlineApi(NetworkClient.getBaseUrl()))
            }

            // Rutas antiguas: se mantienen por si el servidor no esta actualizado.
            val directo = api.verificarCedulaDirecto(VerificarCedulaRequest(limpia))
            if (directo.isSuccessful && directo.body()?.nombre != null) {
                val cliente = directo.body()!!.aCustomer()
                dao.insertCustomer(CustomerEntity.fromDomain(cliente, System.currentTimeMillis()))
                firebaseManager.syncCustomerToFirestore(cliente)
                return@withContext Pair(cliente, NetworkMode.OnlineApi(NetworkClient.getBaseUrl()))
            }
        } catch (e: Exception) {
            Log.w(TAG, "Servidor no disponible al verificar (${e.message}); se usa la copia local")
        }

        val local = dao.getCustomerByCedula(limpia)
            ?: throw IllegalArgumentException(
                "Cédula $limpia no se encuentra registrada en la oficina de Cable Tartak."
            )

        Pair(local.toDomain(), NetworkMode.LocalOfficeSync("Contrato precargado en Oficina Tartak"))
    }

    /**
     * Crea la clave del cliente y abre sesion.
     * La clave viaja al servidor y no se guarda en el dispositivo.
     */
    suspend fun activarUsuario(cedula: String, clave: String): Customer = withContext(Dispatchers.IO) {
        val limpia = CedulaFormatter.normalizar(cedula)
            ?: throw IllegalArgumentException("La cédula no tiene un formato válido.")

        val respuesta = api.activarUsuario(ActivarUsuarioRequest(limpia, clave))
        val cuerpo = respuesta.body()

        if (!respuesta.isSuccessful || cuerpo == null) {
            throw IllegalArgumentException(cuerpo?.mensaje ?: "No se pudo activar la cuenta.")
        }

        guardarSesion(cuerpo.accessToken, cuerpo.refreshToken)
        val cliente = cuerpo.cliente?.aCustomer()
            ?: throw IllegalStateException("El servidor no devolvio los datos del contrato.")

        dao.insertCustomer(CustomerEntity.fromDomain(cliente, System.currentTimeMillis()))
        cliente
    }

    /**
     * Inicia sesion contra el servidor.
     *
     * Antes comparaba la contrasena guardada en el dispositivo y aceptaba
     * CUALQUIER valor cuando no habia clave registrada (fallo de autenticacion).
     * Ahora la verificacion es exclusivamente del servidor.
     */
    suspend fun iniciarSesion(cedula: String, clave: String): Customer = withContext(Dispatchers.IO) {
        val limpia = CedulaFormatter.normalizar(cedula)
            ?: throw IllegalArgumentException("La cédula no tiene un formato válido.")

        val respuesta = api.iniciarSesion(CredencialesRequest(limpia, clave))
        val cuerpo = respuesta.body()

        if (!respuesta.isSuccessful || cuerpo == null) {
            throw IllegalArgumentException(
                cuerpo?.mensaje ?: "Cédula o contraseña incorrectas."
            )
        }

        guardarSesion(cuerpo.accessToken, cuerpo.refreshToken)
        val cliente = cuerpo.cliente?.aCustomer()
            ?: throw IllegalStateException("El servidor no devolvio los datos del contrato.")

        dao.insertCustomer(CustomerEntity.fromDomain(cliente, System.currentTimeMillis()))
        cliente
    }

    /** Cierra sesion en el servidor y borra los tokens locales. */
    suspend fun cerrarSesion() = withContext(Dispatchers.IO) {
        val refresh = tokenStore.refreshToken
        if (!refresh.isNullOrBlank()) {
            runCatching {
                api.cerrarSesionRemoto(com.example.data.network.RefreshRequest(refresh))
            }
        }
        tokenStore.limpiar()
    }

    private fun guardarSesion(access: String?, refresh: String?) {
        if (access.isNullOrBlank() || refresh.isNullOrBlank()) {
            throw IllegalStateException("El servidor no devolvio una sesion valida. Intenta de nuevo.")
        }
        tokenStore.guardar(access, refresh)
    }

    fun haySesion(): Boolean = tokenStore.haySesion

    // ==================================================================
    // Catalogo y perfil
    // ==================================================================

    suspend fun obtenerPlanes(): List<PlanOferta> = withContext(Dispatchers.IO) {
        val respuesta = api.obtenerPlanes()
        if (respuesta.isSuccessful) {
            respuesta.body()?.planes?.map {
                PlanOferta(
                    id = it.id,
                    nombre = it.nombre,
                    descripcion = it.descripcion.orEmpty(),
                    velocidadDownMbps = it.velocidadDownMbps,
                    velocidadUpMbps = it.velocidadUpMbps,
                    precioUsd = it.precioUsd
                )
            }.orEmpty()
        } else {
            emptyList()
        }
    }

    suspend fun obtenerFacturas(): List<Factura> = withContext(Dispatchers.IO) {
        val respuesta = api.obtenerFacturas()
        if (respuesta.isSuccessful) {
            respuesta.body()?.facturas?.map {
                Factura(it.periodo, it.montoUsd, it.estado ?: "Pagado", it.pdfUrl)
            }.orEmpty()
        } else {
            emptyList()
        }
    }

    // ==================================================================
    // Tickets
    // ==================================================================

    /**
     * Registra un reporte (averia o diagnostico).
     *
     * El identificador lo asigna el servidor. Antes la app lo generaba con
     * Math.random() y lo guardaba aunque el servidor devolviera otro, por lo
     * que el numero que veia el cliente no existia en el sistema del NOC.
     * Si no hay conexion, el reporte queda en el dispositivo con
     * `sincronizado = false` y se reenvia en el proximo inicio de sesion.
     */
    suspend fun crearReporte(
        cedula: String,
        detalle: String,
        categoria: String = "Luz roja LOS en router",
        tipo: String = "falla",
        comprobanteUrl: String? = null
    ): ReportCreationResult = withContext(Dispatchers.IO) {
        val limpia = CedulaFormatter.normalizar(cedula)
            ?: throw IllegalArgumentException("La cédula no tiene un formato válido.")

        val peticion = CrearReporteRequest(
            cedula = limpia,
            tipo = tipo,
            detalle = detalle,
            categoria = categoria,
            comprobanteUrl = comprobanteUrl
        )

        try {
            val respuesta = api.crearReporte(peticion)
            val cuerpo = respuesta.body()

            if (respuesta.isSuccessful && cuerpo?.success != false && !cuerpo?.ticketId.isNullOrBlank()) {
                val ticket = Ticket(
                    id = cuerpo!!.ticketId!!,
                    cedula = limpia,
                    tipo = tipo,
                    categoria = categoria,
                    detalle = detalle,
                    fecha = formatearFecha(),
                    estado = cuerpo.ticket?.estado ?: estadoPorTipo(tipo),
                    notaTecnica = cuerpo.ticket?.notaTecnica,
                    sincronizado = true
                )
                dao.insertTicket(TicketEntity.fromDomain(ticket))
                firebaseManager.syncTicketToFirestore(ticket)
                return@withContext ReportCreationResult(ticket, true)
            }

            // Compatibilidad con servidores que solo expone /reportar-falla.
            val directo = api.reportarFallaDirecto(peticion)
            val cuerpoDirecto = directo.body()
            if (directo.isSuccessful && cuerpoDirecto?.success != false && !cuerpoDirecto?.ticketId.isNullOrBlank()) {
                val ticket = Ticket(
                    id = cuerpoDirecto!!.ticketId!!,
                    cedula = limpia,
                    tipo = tipo,
                    categoria = categoria,
                    detalle = detalle,
                    fecha = formatearFecha(),
                    estado = estadoPorTipo(tipo),
                    sincronizado = true
                )
                dao.insertTicket(TicketEntity.fromDomain(ticket))
                firebaseManager.syncTicketToFirestore(ticket)
                return@withContext ReportCreationResult(ticket, true)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Servidor no disponible al reportar (${e.message})")
        }

        val pendiente = Ticket(
            id = "TMP-" + UUID.randomUUID().toString().take(8).uppercase(),
            cedula = limpia,
            tipo = tipo,
            categoria = categoria,
            detalle = detalle,
            fecha = formatearFecha(),
            estado = estadoPorTipo(tipo),
            sincronizado = false
        )
        dao.insertTicket(TicketEntity.fromDomain(pendiente))
        firebaseManager.syncTicketToFirestore(pendiente)
        ReportCreationResult(pendiente, false)
    }

    /** Reenvia al servidor los tickets que se crearon sin conexion. */
    suspend fun sincronizarTicketsPendientes(): Int = withContext(Dispatchers.IO) {
        val pendientes = dao.getTicketsPendientes()
        var enviados = 0

        for (local in pendientes) {
            try {
                val respuesta = api.crearReporte(
                    CrearReporteRequest(
                        cedula = local.cedula,
                        tipo = local.tipo,
                        detalle = local.detalle,
                        categoria = local.categoria,
                        comprobanteUrl = null
                    )
                )
                val cuerpo = respuesta.body()
                val ticketId = cuerpo?.ticketId
                if (respuesta.isSuccessful && !ticketId.isNullOrBlank()) {
                    val confirmado = Ticket(
                        id = ticketId,
                        cedula = local.cedula,
                        tipo = local.tipo,
                        categoria = local.categoria,
                        detalle = local.detalle,
                        fecha = local.fecha,
                        estado = cuerpo?.ticket?.estado ?: local.estado,
                        notaTecnica = cuerpo?.ticket?.notaTecnica ?: local.notaTecnica,
                        sincronizado = true
                    )
                    dao.insertTicket(TicketEntity.fromDomain(confirmado))
                    firebaseManager.syncTicketToFirestore(confirmado)
                    dao.deleteTicket(local.id)
                    enviados += 1
                }
            } catch (e: Exception) {
                Log.w(TAG, "No se pudo sincronizar el ticket ${local.id}: ${e.message}")
                break
            }
        }
        enviados
    }

    fun obtenerTickets(cedula: String): Flow<List<Ticket>> {
        val limpia = CedulaFormatter.normalizar(cedula) ?: cedula.trim().uppercase()
        return dao.getTicketsByCedula(limpia).map { lista -> lista.map { it.toDomain() } }
    }

    /**
     * Busca en el servidor dentro de los datos del propio cliente: tickets,
     * pagos, solicitudes de plan y facturas.
     *
     * Devuelve `null` cuando no hay conexion o el servidor no responde, para
     * que la interfaz pueda distinguir "no hay resultados" de "no se pudo
     * buscar" y ofrezca el filtrado local en su lugar.
     */
    suspend fun buscarEnServidor(consulta: String, cedula: String): BusquedaResultado? =
        withContext(Dispatchers.IO) {
            val texto = consulta.trim()
            if (texto.length < 2) return@withContext BusquedaResultado(
                consulta = texto,
                total = 0,
                tickets = emptyList(),
                pagos = emptyList(),
                solicitudes = emptyList(),
                facturas = emptyList(),
                conectado = true
            )

            try {
                val respuesta = api.buscar(texto)
                if (!respuesta.isSuccessful) {
                    Log.w(TAG, "La busqueda en el servidor falló: ${respuesta.code()}")
                    return@withContext null
                }
                val cuerpo = respuesta.body()
                val resultados = cuerpo?.resultados
                BusquedaResultado(
                    consulta = cuerpo?.consulta ?: texto,
                    total = cuerpo?.total ?: 0,
                    tickets = resultados?.tickets.orEmpty().map { it.aTicket(cedula) },
                    pagos = resultados?.pagos.orEmpty().map {
                        PagoRegistrado(
                            referencia = it.referencia.orEmpty(),
                            banco = it.banco.orEmpty(),
                            montoBs = it.montoBs,
                            estado = it.estado.orEmpty(),
                            codigoRespuesta = it.codigoRespuesta.orEmpty(),
                            fecha = it.fecha.orEmpty()
                        )
                    },
                    solicitudes = resultados?.solicitudes.orEmpty().map {
                        SolicitudCambio(
                            planActual = it.planActual.orEmpty(),
                            planNuevo = it.planNuevo.orEmpty(),
                            montoUsd = it.montoUsd,
                            estado = it.estado.orEmpty(),
                            nota = it.nota,
                            fecha = it.fecha.orEmpty()
                        )
                    },
                    facturas = resultados?.facturas.orEmpty().map {
                        Factura(it.periodo, it.montoUsd, it.estado ?: "Pagado", it.pdfUrl)
                    },
                    conectado = true
                )
            } catch (e: Exception) {
                Log.w(TAG, "Sin conexion para buscar '$texto': ${e.message}")
                null
            }
        }

    /** Descarga el historial de tickets del servidor y actualiza la copia local. */
    suspend fun refrescarTicketsDesdeServidor(cedula: String): Boolean = withContext(Dispatchers.IO) {
        val limpia = CedulaFormatter.normalizar(cedula) ?: return@withContext false
        try {
            val respuesta: Response<com.example.data.network.TicketsResponse> = api.obtenerTickets()
            if (respuesta.isSuccessful) {
                val remotos = respuesta.body()?.tickets.orEmpty().map { it.aTicket(limpia) }
                if (remotos.isNotEmpty()) {
                    dao.insertTickets(remotos.map { TicketEntity.fromDomain(it) })
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo refrescar los tickets: ${e.message}")
            false
        }
    }

    suspend fun precargarClienteOficina(customer: Customer) = withContext(Dispatchers.IO) {
        dao.insertCustomer(CustomerEntity.fromDomain(customer))
    }

    // ==================================================================
    // Pagos y plan
    // ==================================================================

    suspend fun reportarPago(
        cedula: String,
        banco: String,
        referencia: String,
        monto: String,
        comprobanteUrl: String?
    ): ReportCreationResult = withContext(Dispatchers.IO) {
        val limpia = CedulaFormatter.normalizar(cedula)
            ?: throw IllegalArgumentException("La cédula no tiene un formato válido.")

        try {
            val respuesta = api.registrarPago(
                ReportePagoRequest(banco, referencia, monto.replace("$", "").trim(), comprobanteUrl)
            )
            val cuerpo = respuesta.body()
            if (respuesta.isSuccessful && !cuerpo?.ticketId.isNullOrBlank()) {
                val ticket = Ticket(
                    id = cuerpo!!.ticketId!!,
                    cedula = limpia,
                    tipo = "pago",
                    categoria = "Reporte de Pago Móvil / Transferencia",
                    detalle = "Banco: $banco | Ref: $referencia | Monto: $$monto",
                    fecha = formatearFecha(),
                    estado = cuerpo.ticket?.estado ?: "En Conciliación",
                    notaTecnica = cuerpo.ticket?.notaTecnica
                )
                dao.insertTicket(TicketEntity.fromDomain(ticket))
                return@withContext ReportCreationResult(ticket, true)
            }
            throw IllegalArgumentException(cuerpo?.mensaje ?: "El servidor rechazó el comprobante.")
        } catch (e: IllegalArgumentException) {
            throw e
        } catch (e: Exception) {
            throw IllegalStateException(
                "No se pudo enviar el comprobante. Revisa tu conexión e inténtalo de nuevo."
            )
        }
    }

    suspend fun solicitarCambioPlan(cedula: String, nuevoPlanId: String): Boolean = withContext(Dispatchers.IO) {
        val limpia = CedulaFormatter.normalizar(cedula) ?: return@withContext false
        try {
            val respuesta = api.solicitarCambioPlan(SolicitarCambioPlanRequest(limpia, nuevoPlanId))
            if (respuesta.isSuccessful && respuesta.body()?.success != false) return@withContext true

            val directo = api.solicitarCambioPlanDirecto(SolicitarCambioPlanRequest(limpia, nuevoPlanId))
            return@withContext directo.isSuccessful && directo.body()?.success != false
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo solicitar el cambio de plan: ${e.message}")
            false
        }
    }

    suspend fun actualizarPlanCliente(cedula: String, nuevoPlan: String, nuevaMensualidad: Double): Customer =
        withContext(Dispatchers.IO) {
            val limpia = CedulaFormatter.normalizar(cedula) ?: cedula.trim().uppercase()
            val existente = dao.getCustomerByCedula(limpia)
            val actualizado = CustomerEntity.fromDomain(
                (existente?.toDomain() ?: Customer(limpia, "Cliente Tartak", nuevoPlan)).copy(
                    plan = nuevoPlan,
                    mensualidadUsd = nuevaMensualidad
                )
            )
            dao.insertCustomer(actualizado)
            actualizado.toDomain()
        }

    suspend fun obtenerCliente(cedula: String): Customer? = withContext(Dispatchers.IO) {
        CedulaFormatter.normalizar(cedula)?.let { dao.getCustomerByCedula(it)?.toDomain() }
    }

    // ==================================================================
    // Utilidades
    // ==================================================================

    private fun formatearFecha(): String =
        SimpleDateFormat("dd/MM/yyyy hh:mm a", Locale.getDefault()).format(Date())

    private fun estadoPorTipo(tipo: String): String =
        if (tipo == "pago") "En Conciliación" else "Registrado"

    private fun ClienteDto.aCustomer() = Customer(
        cedula = cedula,
        nombre = nombre,
        plan = plan,
        planId = planId,
        isActivated = activado,
        servicioActivo = servicioActivo,
        ontSerial = ontSerial.orEmpty(),
        ipAsignada = ipAsignada.orEmpty(),
        potenciaOptica = potenciaOptica.orEmpty(),
        estadoFibra = estadoFibra.orEmpty(),
        mensualidadUsd = mensualidadUsd,
        saldoPendienteUsd = saldoPendienteUsd,
        fechaCorte = fechaCorte.orEmpty(),
        direccion = direccion.orEmpty(),
        telefono = telefono.orEmpty()
    )

    private fun com.example.data.network.VerificarCedulaResponse.aCustomer() = Customer(
        cedula = cedula.orEmpty(),
        nombre = nombre.orEmpty(),
        plan = plan.orEmpty(),
        isActivated = activado,
        servicioActivo = servicioActivo,
        ontSerial = ontSerial.orEmpty(),
        ipAsignada = ipAsignada.orEmpty(),
        potenciaOptica = potenciaOptica.orEmpty(),
        estadoFibra = estadoFibra.orEmpty(),
        mensualidadUsd = mensualidadUsd,
        saldoPendienteUsd = saldoPendienteUsd,
        fechaCorte = fechaCorte.orEmpty(),
        direccion = direccion.orEmpty(),
        telefono = telefono.orEmpty()
    )

    private fun TicketDto.aTicket(cedula: String) = Ticket(
        id = id,
        cedula = this.cedula ?: cedula,
        tipo = tipo ?: "falla",
        categoria = categoria ?: "Sin categoría",
        detalle = detalle.orEmpty(),
        fecha = fecha ?: "",
        estado = estado ?: "Registrado",
        notaTecnica = notaTecnica,
        sincronizado = true
    )

    companion object {
        private const val TAG = "CableTartakRepo"
    }
}
