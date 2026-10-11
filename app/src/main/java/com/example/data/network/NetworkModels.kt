package com.example.data.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/** Perfil completo del cliente con sus ultimos tickets y solicitudes. */
@JsonClass(generateAdapter = true)
data class MiPerfilResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "cliente") val cliente: ClienteDto? = null,
    @param:Json(name = "ticketsRecientes") val ticketsRecientes: List<TicketDto> = emptyList(),
    @param:Json(name = "facturas") val facturas: List<FacturaDto> = emptyList()
)

/** Envoltura de error que devuelve el servidor cuando success = false. */
@JsonClass(generateAdapter = true)
data class ApiErrorDto(
    @param:Json(name = "error") val error: String? = null,
    @param:Json(name = "mensaje") val mensaje: String? = null,
    @param:Json(name = "detalles") val detalles: List<ApiDetalleDto>? = null
)

@JsonClass(generateAdapter = true)
data class ApiDetalleDto(
    @param:Json(name = "campo") val campo: String? = null,
    @param:Json(name = "mensaje") val mensaje: String? = null
)

@JsonClass(generateAdapter = true)
data class VerificarCedulaRequest(
    @param:Json(name = "cedula") val cedula: String
)

/**
 * Respuesta de la verificacion de contrato.
 * Los campos `nombre`, `plan` y `activado` los consume la app.
 */
@JsonClass(generateAdapter = true)
data class VerificarCedulaResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "nombre") val nombre: String? = null,
    @param:Json(name = "plan") val plan: String? = null,
    @param:Json(name = "error") val error: String? = null,
    @param:Json(name = "activado") val activado: Boolean = false,
    @param:Json(name = "cedula") val cedula: String? = null,
    @param:Json(name = "mensaje") val mensaje: String? = null,
    @param:Json(name = "servicioActivo") val servicioActivo: Boolean = true,
    @param:Json(name = "estadoFibra") val estadoFibra: String? = null,
    @param:Json(name = "mensualidadUsd") val mensualidadUsd: Double = 0.0,
    @param:Json(name = "saldoPendienteUsd") val saldoPendienteUsd: Double = 0.0,
    @param:Json(name = "fechaCorte") val fechaCorte: String? = null,
    @param:Json(name = "ontSerial") val ontSerial: String? = null,
    @param:Json(name = "ipAsignada") val ipAsignada: String? = null,
    @param:Json(name = "potenciaOptica") val potenciaOptica: String? = null,
    @param:Json(name = "direccion") val direccion: String? = null,
    @param:Json(name = "telefono") val telefono: String? = null
)

@JsonClass(generateAdapter = true)
data class ActivarUsuarioRequest(
    @param:Json(name = "cedula") val cedula: String,
    @param:Json(name = "clave") val clave: String
)

@JsonClass(generateAdapter = true)
data class CredencialesRequest(
    @param:Json(name = "cedula") val cedula: String,
    @param:Json(name = "clave") val clave: String
)

/** Respuesta de activacion e inicio de sesion: contrato + tokens. */
@JsonClass(generateAdapter = true)
data class SesionResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "mensaje") val mensaje: String? = null,
    @param:Json(name = "error") val error: String? = null,
    @param:Json(name = "cliente") val cliente: ClienteDto? = null,
    @param:Json(name = "accessToken") val accessToken: String? = null,
    @param:Json(name = "refreshToken") val refreshToken: String? = null,
    @param:Json(name = "expiraEnSegundos") val expiraEnSegundos: Long? = null
)

@JsonClass(generateAdapter = true)
data class ClienteDto(
    @param:Json(name = "cedula") val cedula: String,
    @param:Json(name = "nombre") val nombre: String,
    @param:Json(name = "plan") val plan: String,
    @param:Json(name = "planId") val planId: String? = null,
    @param:Json(name = "activado") val activado: Boolean = false,
    @param:Json(name = "servicioActivo") val servicioActivo: Boolean = true,
    @param:Json(name = "estadoFibra") val estadoFibra: String? = null,
    @param:Json(name = "mensualidadUsd") val mensualidadUsd: Double = 0.0,
    @param:Json(name = "saldoPendienteUsd") val saldoPendienteUsd: Double = 0.0,
    @param:Json(name = "fechaCorte") val fechaCorte: String? = null,
    @param:Json(name = "ontSerial") val ontSerial: String? = null,
    @param:Json(name = "ipAsignada") val ipAsignada: String? = null,
    @param:Json(name = "potenciaOptica") val potenciaOptica: String? = null,
    @param:Json(name = "direccion") val direccion: String? = null,
    @param:Json(name = "telefono") val telefono: String? = null
)

@JsonClass(generateAdapter = true)
data class CrearReporteRequest(
    @param:Json(name = "cedula") val cedula: String,
    @param:Json(name = "tipo") val tipo: String = "falla",
    @param:Json(name = "detalle") val detalle: String,
    @param:Json(name = "categoria") val categoria: String? = null,
    @param:Json(name = "comprobante_url") val comprobanteUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class CrearReporteResponse(
    @param:Json(name = "success") val success: Boolean = true,
    @param:Json(name = "mensaje") val mensaje: String? = null,
    @param:Json(name = "error") val error: String? = null,
    @param:Json(name = "ticketId") val ticketId: String? = null,
    @param:Json(name = "ticket") val ticket: TicketDto? = null
)

@JsonClass(generateAdapter = true)
data class TicketDto(
    @param:Json(name = "id") val id: String,
    @param:Json(name = "codigo") val codigo: String? = null,
    @param:Json(name = "cedula") val cedula: String? = null,
    @param:Json(name = "tipo") val tipo: String? = null,
    @param:Json(name = "categoria") val categoria: String? = null,
    @param:Json(name = "detalle") val detalle: String? = null,
    @param:Json(name = "comprobanteUrl") val comprobanteUrl: String? = null,
    @param:Json(name = "estado") val estado: String? = null,
    @param:Json(name = "notaTecnica") val notaTecnica: String? = null,
    @param:Json(name = "fecha") val fecha: String? = null
)

@JsonClass(generateAdapter = true)
data class TicketsResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "total") val total: Int = 0,
    @param:Json(name = "tickets") val tickets: List<TicketDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class SolicitarCambioPlanRequest(
    @param:Json(name = "cedula") val cedula: String,
    @param:Json(name = "nuevoPlanId") val nuevoPlanId: String
)

@JsonClass(generateAdapter = true)
data class SolicitarCambioPlanResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "mensaje") val mensaje: String? = null,
    @param:Json(name = "error") val error: String? = null,
    @param:Json(name = "solicitudId") val solicitudId: Long? = null
)

@JsonClass(generateAdapter = true)
data class PlanDto(
    @param:Json(name = "id") val id: String,
    @param:Json(name = "nombre") val nombre: String,
    @param:Json(name = "descripcion") val descripcion: String? = null,
    @param:Json(name = "velocidadDownMbps") val velocidadDownMbps: Int = 0,
    @param:Json(name = "velocidadUpMbps") val velocidadUpMbps: Int = 0,
    @param:Json(name = "precioUsd") val precioUsd: Double = 0.0,
    @param:Json(name = "activo") val activo: Boolean = true
)

@JsonClass(generateAdapter = true)
data class PlanesResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "planes") val planes: List<PlanDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ReportePagoRequest(
    @param:Json(name = "banco") val banco: String,
    @param:Json(name = "referencia") val referencia: String,
    @param:Json(name = "monto") val monto: String,
    @param:Json(name = "comprobante_url") val comprobanteUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class FacturaDto(
    @param:Json(name = "id") val id: Long = 0,
    @param:Json(name = "periodo") val periodo: String,
    @param:Json(name = "montoUsd") val montoUsd: Double = 0.0,
    @param:Json(name = "estado") val estado: String? = null,
    @param:Json(name = "pdfUrl") val pdfUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class FacturasResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "facturas") val facturas: List<FacturaDto> = emptyList()
)

/**
 * Resultado de GET /api/app/buscar. Reutiliza los mismos DTO del resto de la
 * API: el servidor devuelve unicamente datos del propio cliente.
 */
@JsonClass(generateAdapter = true)
data class PagoBusquedaDto(
    @param:Json(name = "referencia") val referencia: String? = null,
    @param:Json(name = "cedula") val cedula: String? = null,
    @param:Json(name = "banco") val banco: String? = null,
    @param:Json(name = "transaccionId") val transaccionId: String? = null,
    @param:Json(name = "montoBs") val montoBs: Double = 0.0,
    @param:Json(name = "estado") val estado: String? = null,
    @param:Json(name = "codigoRespuesta") val codigoRespuesta: String? = null,
    @param:Json(name = "fecha") val fecha: String? = null
)

@JsonClass(generateAdapter = true)
data class SolicitudBusquedaDto(
    @param:Json(name = "id") val id: Long = 0,
    @param:Json(name = "planActual") val planActual: String? = null,
    @param:Json(name = "planNuevo") val planNuevo: String? = null,
    @param:Json(name = "montoUsd") val montoUsd: Double = 0.0,
    @param:Json(name = "estado") val estado: String? = null,
    @param:Json(name = "nota") val nota: String? = null,
    @param:Json(name = "fecha") val fecha: String? = null
)

@JsonClass(generateAdapter = true)
data class BusquedaResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "consulta") val consulta: String = "",
    @param:Json(name = "total") val total: Int = 0,
    @param:Json(name = "resultados") val resultados: ResultadosBusquedaDto? = null
)

@JsonClass(generateAdapter = true)
data class ResultadosBusquedaDto(
    @param:Json(name = "clientes") val clientes: List<ClienteDto> = emptyList(),
    @param:Json(name = "tickets") val tickets: List<TicketDto> = emptyList(),
    @param:Json(name = "pagos") val pagos: List<PagoBusquedaDto> = emptyList(),
    @param:Json(name = "solicitudes") val solicitudes: List<SolicitudBusquedaDto> = emptyList(),
    @param:Json(name = "facturas") val facturas: List<FacturaDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class RefreshRequest(
    @param:Json(name = "refreshToken") val refreshToken: String
)

@JsonClass(generateAdapter = true)
data class RefreshResponse(
    @param:Json(name = "success") val success: Boolean = false,
    @param:Json(name = "accessToken") val accessToken: String? = null,
    @param:Json(name = "refreshToken") val refreshToken: String? = null
)
