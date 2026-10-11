package com.example.data.security

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

/**
 * Guarda la sesion del cliente (token de acceso y de refresco).
 *
 * Decisiones de seguridad:
 *  - la contrasena NUNCA se guarda: solo se envia al servidor, que la
 *    almacena como hash bcrypt;
 *  - los tokens viven en un archivo de preferencias privado de la app
 *    (MODE_PRIVATE) y en memoria;
 *  - la copia de seguridad del dispositivo esta deshabilitada en el
 *    manifiesto, por lo que este archivo no sale del telefono.
 */
class TokenStore(context: Context) {

    private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(
        NOMBRE_PREFERENCIAS,
        Context.MODE_PRIVATE
    )

    @Volatile
    private var accesoEnMemoria: String? = prefs.getString(CLAVE_ACCESO, null)

    val accessToken: String?
        get() = accesoEnMemoria

    val refreshToken: String?
        get() = prefs.getString(CLAVE_REFRESCO, null)

    val haySesion: Boolean
        get() = !accesoEnMemoria.isNullOrBlank() && !refreshToken.isNullOrBlank()

    fun guardar(accessToken: String, refreshToken: String) {
        accesoEnMemoria = accessToken
        prefs.edit()
            .putString(CLAVE_ACCESO, accessToken)
            .putString(CLAVE_REFRESCO, refreshToken)
            .apply()
    }

    /** Actualiza solo el token de acceso tras un refresco. */
    fun actualizarAcceso(accessToken: String) {
        accesoEnMemoria = accessToken
        prefs.edit().putString(CLAVE_ACCESO, accessToken).apply()
    }

    fun limpiar() {
        accesoEnMemoria = null
        prefs.edit().clear().apply()
        Log.d(TAG, "Sesion local eliminada")
    }

    companion object {
        private const val TAG = "TokenStore"
        private const val NOMBRE_PREFERENCIAS = "tartak_sesion"
        private const val CLAVE_ACCESO = "access_token"
        private const val CLAVE_REFRESCO = "refresh_token"

        @Volatile
        private var INSTANCIA: TokenStore? = null

        fun obtener(context: Context): TokenStore =
            INSTANCIA ?: synchronized(this) {
                INSTANCIA ?: TokenStore(context).also { INSTANCIA = it }
            }
    }
}
