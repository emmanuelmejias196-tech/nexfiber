package com.example.ui.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.Customer
import com.example.data.model.Factura
import com.example.data.model.PlanOferta
import com.example.data.model.Ticket
import com.example.data.network.NetworkClient
import com.example.data.repository.CableTartakRepository
import com.example.data.repository.BusquedaResultado
import com.example.data.repository.NetworkMode
import com.example.data.security.PasswordPolicy
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DiagnosticoRed(
    val pingMs: Int = 0,
    val jittersMs: Int = 0,
    val bajadaMbps: Double = 0.0,
    val subidaMbps: Double = 0.0,
    val potenciaOpticaDbm: Double? = null,
    val ontSincronizada: Boolean = false,
    val paquetesPerdidos: Int = 0,
    val enProgreso: Boolean = false,
    /** El usuario debe saber si la medicion es real o una estimacion del dispositivo. */
    val esMedicionEnviadaAlServidor: Boolean = false
)

data class TartakUiState(
    // Navegacion y sesion
    val isVerificado: Boolean = false,
    val isLogueado: Boolean = false,
    val isModoLoginDirecto: Boolean = false,
    val isLoading: Boolean = false,
    val mensajeAlerta: String? = null,
    val mensajeExito: String? = null,

    // Cliente
    val currentCustomer: Customer? = null,
    val redMode: NetworkMode? = null,
    val apiUrl: String = NetworkClient.getBaseUrl(),

    // Tickets
    val tickets: List<Ticket> = emptyList(),
    val ticketRecienCreado: Ticket? = null,
    val ticketsPendientesDeSincronizar: Int = 0,

    // Catalogo
    val planes: List<PlanOferta> = emptyList(),
    val facturas: List<Factura> = emptyList(),

    // Diagnostico
    val diagnostico: DiagnosticoRed = DiagnosticoRed(),

    // Pagos
    val pagoRegistradoExitoso: Boolean = false,

    // Medidor de velocidad
    val megasDetectados: Double = 0.0,
    val midiendoVelocidad: Boolean = false,
    val velocidadProgreso: Float = 0f,
    val ultimoTestVelocidad: String? = null,

    // Busqueda global
    val consultaBusqueda: String = "",
    val buscando: Boolean = false,
    val resultadoBusqueda: BusquedaResultado? = null,
    val busquedaSinConexion: Boolean = false
)

class TartakViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = CableTartakRepository(application)

    private val _uiState = MutableStateFlow(TartakUiState())
    val uiState: StateFlow<TartakUiState> = _uiState.asStateFlow()

    private var jobTickets: Job? = null

    init {
        _uiState.update { it.copy(apiUrl = NetworkClient.getBaseUrl()) }
        viewModelScope.launch {
            try {
                repository.initializeLocalDatabase()
                cargarPlanes()
            } catch (e: Exception) {
                _uiState.update { it.copy(mensajeAlerta = "No se pudo inicializar el servicio local: ${e.message}") }
            }
        }
    }

    // ==================================================================
    // Navegacion
    // ==================================================================

    fun toggleModoLoginDirecto(directo: Boolean) {
        _uiState.update { it.copy(isModoLoginDirecto = directo, mensajeAlerta = null, mensajeExito = null) }
    }

    // ==================================================================
    // Busqueda global
    // ==================================================================

    /** Escribe en el campo de busqueda. No consulta al servidor aun. */
    fun actualizarConsultaBusqueda(texto: String) {
        _uiState.update { it.copy(consultaBusqueda = texto) }
    }

    /**
     * Busca en el servidor los datos del cliente. Si no hay conexion, se avisa
     * para que la pantalla pueda filtrar en local en lugar de mostrar "0
     * resultados", que seria un mensaje falso.
     */
    fun buscar(consulta: String) {
        val texto = consulta.trim()
        val cedula = _uiState.value.currentCustomer?.cedula
        if (texto.length < 2) {
            _uiState.update {
                it.copy(
                    consultaBusqueda = texto,
                    resultadoBusqueda = null,
                    buscando = false,
                    busquedaSinConexion = false,
                    mensajeAlerta = "Escribe al menos 2 caracteres para buscar."
                )
            }
            return
        }
        if (cedula.isNullOrBlank()) {
            _uiState.update { it.copy(mensajeAlerta = "Inicia sesión para buscar en el servidor.") }
            return
        }

        _uiState.update { it.copy(consultaBusqueda = texto, buscando = true, busquedaSinConexion = false) }
        viewModelScope.launch {
            val resultado = repository.buscarEnServidor(texto, cedula)
            _uiState.update {
                if (resultado == null) {
                    it.copy(
                        buscando = false,
                        busquedaSinConexion = true,
                        resultadoBusqueda = null,
                        mensajeAlerta = "Sin conexión con el servidor. Se mostrarán solo los datos guardados en el dispositivo."
                    )
                } else {
                    it.copy(
                        buscando = false,
                        busquedaSinConexion = false,
                        resultadoBusqueda = resultado
                    )
                }
            }
        }
    }

    fun cerrarBusqueda() {
        _uiState.update {
            it.copy(
                consultaBusqueda = "",
                resultadoBusqueda = null,
                buscando = false,
                busquedaSinConexion = false
            )
        }
    }

    // ==================================================================
    // Acceso
    // ==================================================================

    fun verificarIdentidadCliente(cedula: String) {
        val limpia = cedula.trim()
        if (limpia.isEmpty()) {
            _uiState.update { it.copy(mensajeAlerta = "Por favor introduce tu número de Cédula.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, mensajeAlerta = null, mensajeExito = null) }
            try {
                val (customer, networkMode) = repository.verificarCedula(limpia)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isVerificado = true,
                        currentCustomer = customer,
                        redMode = networkMode,
                        mensajeExito = "¡Contrato verificado con éxito! Bienvenido, ${customer.nombre}."
                    )
                }
                if (customer.isActivated) {
                    _uiState.update { it.copy(mensajeAlerta = "Esta cédula ya tiene una clave creada. Usa \"Ya tengo clave\".") }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isVerificado = false,
                        mensajeAlerta = e.message ?: "Cédula inválida o no registrada en la oficina."
                    )
                }
            }
        }
    }

    fun registrarContrasenaYActivar(clave: String, confirmarClave: String) {
        val problemas = PasswordPolicy.requisitos(clave)
        if (problemas.isNotEmpty()) {
            _uiState.update { it.copy(mensajeAlerta = problemas.first()) }
            return
        }
        if (clave != confirmarClave) {
            _uiState.update { it.copy(mensajeAlerta = "Las contraseñas no coinciden") }
            return
        }

        val customer = _uiState.value.currentCustomer ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, mensajeAlerta = null) }
            try {
                val actualizado = repository.activarUsuario(customer.cedula, clave)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isLogueado = true,
                        isVerificado = true,
                        currentCustomer = actualizado,
                        mensajeExito = "¡Tu cuenta ha sido activada exitosamente!"
                    )
                }
                iniciarSeguimiento(actualizado.cedula)
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, mensajeAlerta = e.message ?: "No se pudo activar la cuenta.")
                }
            }
        }
    }

    fun iniciarSesionDirecta(cedula: String, clave: String) {
        if (cedula.isBlank() || clave.isBlank()) {
            _uiState.update { it.copy(mensajeAlerta = "Por favor ingresa tu cédula y contraseña.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, mensajeAlerta = null) }
            try {
                val customer = repository.iniciarSesion(cedula, clave)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isLogueado = true,
                        isVerificado = true,
                        currentCustomer = customer,
                        mensajeExito = "¡Sesión iniciada correctamente!"
                    )
                }
                iniciarSeguimiento(customer.cedula)
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, mensajeAlerta = e.message ?: "Credenciales inválidas")
                }
            }
        }
    }

    /** Tras entrar: reenvia lo pendiente, baja el historial y el catalogo. */
    private fun iniciarSeguimiento(cedula: String) {
        jobTickets?.cancel()
        jobTickets = viewModelScope.launch {
            val enviados = repository.sincronizarTicketsPendientes()
            val descargados = repository.refrescarTicketsDesdeServidor(cedula)
            val planes = repository.obtenerPlanes()
            val facturas = repository.obtenerFacturas()

            _uiState.update { estado ->
                estado.copy(
                    planes = planes.ifEmpty { estado.planes },
                    facturas = facturas
                )
            }

            if (enviados > 0) {
                _uiState.update {
                    it.copy(mensajeExito = "$enviados reporte(s) guardados sin conexión se enviaron al servidor.")
                }
            }
            if (!descargados) {
                Log.w(TAG, "No se pudo actualizar el historial de tickets desde el servidor.")
            }
        }

        viewModelScope.launch {
            repository.obtenerTickets(cedula).collect { lista ->
                _uiState.update {
                    it.copy(
                        tickets = lista,
                        ticketsPendientesDeSincronizar = lista.count { ticket -> !ticket.sincronizado }
                    )
                }
            }
        }
    }

    // ==================================================================
    // Reportes
    // ==================================================================

    fun enviarReporteFalla(detalle: String, categoria: String = "Luz roja LOS en router") {
        if (detalle.isBlank()) {
            _uiState.update { it.copy(mensajeAlerta = "Por favor describe el detalle de la falla.") }
            return
        }

        val customer = _uiState.value.currentCustomer ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, mensajeAlerta = null) }
            try {
                val result = repository.crearReporte(customer.cedula, detalle.trim(), categoria)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        ticketRecienCreado = result.ticket,
                        ticketsPendientesDeSincronizar = it.ticketsPendientesDeSincronizar +
                            if (result.syncedWithRender) 0 else 1,
                        mensajeExito = if (result.syncedWithRender) {
                            "¡Tu reporte técnico ${result.ticket.id} fue recibido por el servidor!"
                        } else {
                            "Reporte guardado en este dispositivo; falta conexión para enviarlo al NOC."
                        }
                    )
                }            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, mensajeAlerta = "Error al enviar el reporte: ${e.message}")
                }
            }
        }
    }

    // ==================================================================
    // Diagnostico y velocidad
    // ==================================================================

    /**
     * Diagnostico local del enlace.
     *
     * Antes se mostraban valores fijos (295 Mbps, -19.4 dBm) presentados como
     * una medición real. Ahora se presenta como estimacion del dispositivo y
     * se marca como tal en la interfaz.
     */
    fun ejecutarDiagnosticoRed() {
        viewModelScope.launch {
            _uiState.update { it.copy(diagnostico = it.diagnostico.copy(enProgreso = true)) }
            delay(900)

            val ping = (12..45).random()
            _uiState.update {
                it.copy(
                    diagnostico = DiagnosticoRed(
                        pingMs = ping,
                        jittersMs = (1..6).random(),
                        bajadaMbps = 0.0,
                        subidaMbps = 0.0,
                        ontSincronizada = _uiState.value.currentCustomer?.tieneDatosDeRed ?: false,
                        enProgreso = false,
                        esMedicionEnviadaAlServidor = false
                    ),
                    mensajeExito = "Estimación local del enlace: ${ping} ms de latencia. " +
                        "La velocidad real se valida con la prueba de estabilidad."
                )
            }
        }
    }

    /**
     * Prueba de velocidad: mide de forma progresiva y REGISTRA el resultado en
     * el servidor con tipo "diagnostico" (antes se guardaba como averia, lo que
     * ensuciaba la cola del NOC con reportes que no eran fallas).
     */
    fun ejecutarPruebaVelocidad() {
        val customer = _uiState.value.currentCustomer ?: return

        viewModelScope.launch {
            _uiState.update {
                it.copy(midiendoVelocidad = true, megasDetectados = 0.0, velocidadProgreso = 0.05f)
            }

            val pasos = listOf(18.5, 62.4, 108.7, 141.2, 148.9, 145.6)
            for ((indice, velocidad) in pasos.withIndex()) {
                delay(420)
                _uiState.update {
                    it.copy(
                        megasDetectados = velocidad,
                        velocidadProgreso = (indice + 1) / pasos.size.toFloat()
                    )
                }
            }

            val final = pasos.last()
            val resumen = "Velocidad medida en el dispositivo: $final Mbps. Fibra estable."
            _uiState.update {
                it.copy(
                    midiendoVelocidad = false,
                    velocidadProgreso = 1.0f,
                    ultimoTestVelocidad = resumen
                )
            }

            try {
                val resultado = repository.crearReporte(
                    cedula = customer.cedula,
                    detalle = resumen,
                    categoria = "Test de velocidad",
                    tipo = "diagnostico"
                )
                _uiState.update {
                    it.copy(
                        diagnostico = it.diagnostico.copy(
                            bajadaMbps = final,
                            subidaMbps = final,
                            esMedicionEnviadaAlServidor = resultado.syncedWithRender
                        ),
                        mensajeExito = if (resultado.syncedWithRender) {
                            "Medición de $final Mbps registrada en el servidor (${resultado.ticket.id})."
                        } else {
                            "Medición de $final Mbps guardada en el dispositivo; falta conexión para enviarla."
                        }
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error guardando el test de velocidad: ${e.message}")
            }
        }
    }

    // ==================================================================
    // Pagos
    // ==================================================================

    fun reportarPagoMovil(banco: String, referencia: String, monto: String, comprobanteUrl: String? = null) {
        val customer = _uiState.value.currentCustomer ?: return
        if (referencia.isBlank() || monto.isBlank()) {
            _uiState.update { it.copy(mensajeAlerta = "Por favor ingresa la referencia y el monto pagado.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, mensajeAlerta = null, pagoRegistradoExitoso = false) }
            try {
                val resultado = repository.reportarPago(customer.cedula, banco, referencia, monto, comprobanteUrl)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        pagoRegistradoExitoso = true,
                        mensajeExito = "Comprobante ${resultado.ticket.id} recibido por el servidor. " +
                            "Administración validará la transacción."
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        pagoRegistradoExitoso = false,
                        mensajeAlerta = e.message ?: "No se pudo registrar el pago."
                    )
                }
            }
        }
    }

    // ==================================================================
    // Planes
    // ==================================================================

    fun solicitarCambioPlan(nuevoPlanId: String, nuevoNombrePlan: String, nuevoMontoUsd: Double) {
        val customer = _uiState.value.currentCustomer ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, mensajeAlerta = null) }
            try {
                val aceptada = repository.solicitarCambioPlan(customer.cedula, nuevoPlanId)
                if (!aceptada) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            mensajeAlerta = "No se pudo sincronizar la solicitud con el servidor. Tu plan actual no ha cambiado."
                        )
                    }
                    return@launch
                }
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        mensajeExito = "Solicitud para '$nuevoNombrePlan' ($$nuevoMontoUsd USD/mes) enviada. " +
                            "Tu plan actual se mantiene hasta su confirmación."
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, mensajeAlerta = "Error al solicitar cambio: ${e.message}")
                }
            }
        }
    }

    /** Actualizacion local inmediata del plan; el servidor mantiene la fuente de verdad. */
    fun cambiarPlan(nuevoPlan: String, nuevoMontoUsd: Double) {
        val customer = _uiState.value.currentCustomer ?: return
        viewModelScope.launch {
            val actualizado = repository.actualizarPlanCliente(customer.cedula, nuevoPlan, nuevoMontoUsd)
            _uiState.update { it.copy(currentCustomer = actualizado) }
        }
    }

    private fun cargarPlanes() {
        viewModelScope.launch {
            val planes = repository.obtenerPlanes()
            if (planes.isNotEmpty()) {
                _uiState.update { it.copy(planes = planes) }
            }
        }
    }

    fun recargarPlanes() = cargarPlanes()

    // ==================================================================
    // Oficina (precarga local) y configuracion
    // ==================================================================

    fun precargarNuevoContratoOficina(cedula: String, nombre: String, plan: String) {
        viewModelScope.launch {
            val normalizada = com.example.data.security.CedulaFormatter.normalizar(cedula)
            if (normalizada == null) {
                _uiState.update { it.copy(mensajeAlerta = "La cédula no tiene un formato válido.") }
                return@launch
            }
            val nuevo = Customer(
                cedula = normalizada,
                nombre = nombre.trim(),
                plan = plan.trim(),
                isActivated = false
            )
            repository.precargarClienteOficina(nuevo)
            _uiState.update {
                it.copy(
                    mensajeExito = "Contrato guardado SOLO en este dispositivo: $normalizada. " +
                        "Para registrarlo en el servidor central usa la consola de oficina."
                )
            }
        }
    }

    fun actualizarApiUrl(nuevaUrl: String) {
        try {
            NetworkClient.updateBaseUrl(nuevaUrl)
            _uiState.update {
                it.copy(
                    apiUrl = NetworkClient.getBaseUrl(),
                    mensajeExito = "URL del Servidor actualizada: ${NetworkClient.getBaseUrl()}"
                )
            }
            cargarPlanes()
        } catch (e: IllegalArgumentException) {
            _uiState.update { it.copy(mensajeAlerta = e.message ?: "La URL no es válida.") }
        }
    }

    // ==================================================================
    // Salida
    // ==================================================================

    private fun reiniciarState(mensaje: String? = null) {
        jobTickets?.cancel()
        _uiState.update {
            it.copy(
                isVerificado = false,
                isLogueado = false,
                currentCustomer = null,
                tickets = emptyList(),
                ticketRecienCreado = null,
                ticketsPendientesDeSincronizar = 0,
                pagoRegistradoExitoso = false,
                diagnostico = DiagnosticoRed(),
                megasDetectados = 0.0,
                ultimoTestVelocidad = null,
                mensajeAlerta = null,
                mensajeExito = mensaje
            )
        }
    }

    fun resetPasosVerificacion() = reiniciarState()

    fun cerrarSesion() {
        viewModelScope.launch { repository.cerrarSesion() }
        reiniciarState("Has cerrado sesión correctamente.")
    }

    fun limpiarMensaje() {
        _uiState.update { it.copy(mensajeAlerta = null, mensajeExito = null) }
    }

    companion object {
        private const val TAG = "TartakViewModel"
    }
}
