package com.example.data.model

/**
 * Contrato del cliente.
 *
 * IMPORTANTE: los campos técnicos (ipAsignada, ontSerial, potenciaOptica,
 * direccion, telefono) vienen del servidor. Cuando el servidor no los envia,
 * quedan vacios y la interfaz muestra "No disponible": la app ya no inventa
 * datos de red, porque un valor fictinio se confunde con una medición real.
 */
data class Customer(
    val cedula: String,
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
    val telefono: String = ""
) {
    val tieneDatosDeRed: Boolean
        get() = ipAsignada.isNotBlank() || ontSerial.isNotBlank()
}

data class Ticket(
    val id: String,
    val cedula: String,
    val tipo: String = "falla",
    val categoria: String,
    val detalle: String,
    val fecha: String,
    val estado: String = "Registrado",
    val notaTecnica: String? = null,
    /** false cuando el ticket existe solo en el dispositivo y aun no llega al servidor. */
    val sincronizado: Boolean = true
)

/** Plan del catalogo comercial. */
data class PlanOferta(
    val id: String,
    val nombre: String,
    val descripcion: String,
    val velocidadDownMbps: Int,
    val velocidadUpMbps: Int,
    val precioUsd: Double
) {
    val precioFormateado: String
        get() = "$${precioUsd.toInt()}/mes"
}

/** Factura del historial de pagos. */
data class Factura(
    val periodo: String,
    val montoUsd: Double,
    val estado: String,
    val pdfUrl: String? = null
) {
    val montoFormateado: String
        get() = "$" + String.format("%.2f", montoUsd)
}
