package com.example.data.security

/**
 * Politica de contrasenas del cliente.
 *
 * Debe coincidir con la del servidor (backend/src/utils/password.js) para que
 * el usuario no descubra en el servidor lo que la app ya le habia aceptado.
 */
object PasswordPolicy {

    const val MINIMO = 6
    const val MAXIMO = 128

    /** Devuelve los requisitos incumplidos; lista vacia = clave aceptable. */
    fun requisitos(clave: String?): List<String> {
        val errores = mutableListOf<String>()
        if (clave.isNullOrEmpty()) {
            errores += "La contraseña no puede estar vacía."
            return errores
        }
        if (clave.length < MINIMO) errores += "La contraseña debe tener al menos $MINIMO caracteres."
        if (clave.length > MAXIMO) errores += "La contraseña no puede superar $MAXIMO caracteres."
        if (clave.startsWith(" ") || clave.endsWith(" ")) {
            errores += "La contraseña no puede empezar ni terminar con espacios."
        }
        if (clave.toSet().size < 3) {
            errores += "La contraseña necesita al menos 3 caracteres distintos."
        }
        return errores
    }

    fun esValida(clave: String?): Boolean = requisitos(clave).isEmpty()
}
