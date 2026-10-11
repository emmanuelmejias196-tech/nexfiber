package com.example.data.security

/**
 * Normalizacion de cedula, igual que aplica el servidor
 * (backend/src/utils/cedula.js) para que ambos extremos coincidan.
 */
object CedulaFormatter {

    private val patron = Regex("^([VEJ])-?(\\d{5,10})$", RegexOption.IGNORE_CASE)

    /** Devuelve el formato canonico "V-12345678" o null si no es valida. */
    fun normalizar(entrada: String?): String? {
        val limpio = entrada?.trim()?.uppercase().orEmpty()
        if (limpio.isEmpty()) return null

        val conPrefijo = if (Regex("^[VEJ]-").containsMatchIn(limpio)) limpio else "V-$limpio"
        val coincidencia = patron.find(conPrefijo) ?: return null
        val (letra, digitos) = coincidencia.destructured
        return "$letra-$digitos"
    }

    fun esValida(entrada: String?): Boolean = normalizar(entrada) != null

    /** Cadena para mostrar cuando el dato no viene del servidor. */
    const val NO_DISPONIBLE = "No disponible"
}
