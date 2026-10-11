package com.example.data.network

import com.example.BuildConfig
import com.example.data.security.TokenStore
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.io.IOException
import java.net.URI
import java.util.concurrent.TimeUnit

/**
 * Cliente HTTP de la app.
 *
 * - La URL base viene de BuildConfig (definida en Gradle) y puede cambiarse en
 *   caliente desde el dialogo de configuracion.
 * - Se adjunta automaticamente el token de sesion como `Authorization: Bearer`.
 * - Un 401 dispara un unico refresco de token y reintenta la peticion una vez.
 * - El log de red solo se activa en compilaciones de depuracion.
 */
object NetworkClient {

    private const val CABECERA_AUTORIZACION = "Authorization"
    private const val PREFIJO_BEARER = "Bearer "

    @Volatile
    var tokenStore: TokenStore? = null

    private var currentBaseUrl: String = normalizarUrl(BuildConfig.API_BASE_URL)

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val clienteOkHttp: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .callTimeout(75, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .addInterceptor { chain ->
            val peticion = chain.request()
            val token = tokenStore?.accessToken
            val autorizada = if (token.isNullOrBlank() || peticion.header(CABECERA_AUTORIZACION) != null) {
                peticion
            } else {
                peticion.newBuilder().header(CABECERA_AUTORIZACION, PREFIJO_BEARER + token).build()
            }
            chain.proceed(autorizada)
        }
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(
                    HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
                )
            }
        }
        .authenticator(RefrescoAuthenticator())
        .build()

    private var retrofit: Retrofit = construirRetrofit(currentBaseUrl)

    var apiService: TartakApiService = retrofit.create(TartakApiService::class.java)
        private set

    fun getBaseUrl(): String = currentBaseUrl

    fun registrarTokenStore(store: TokenStore) {
        tokenStore = store
    }

    /**
     * Cambia la URL base en caliente.
     * @throws IllegalArgumentException si la URL no es http/https valida.
     */
    fun updateBaseUrl(nuevaUrl: String) {
        currentBaseUrl = normalizarUrl(nuevaUrl)
        retrofit = construirRetrofit(currentBaseUrl)
        apiService = retrofit.create(TartakApiService::class.java)
    }

    /** Valida y normaliza una URL base; solo admite http/https. */
    fun normalizarUrl(url: String): String {
        val limpia = url.trim()
        require(limpia.isNotEmpty()) { "La URL del servidor no puede estar vacía." }

        val conProtocolo = if (limpia.startsWith("http://") || limpia.startsWith("https://")) {
            limpia
        } else {
            "https://$limpia"
        }

        val uri = runCatching { URI(conProtocolo) }.getOrNull()
        require(uri != null && !uri.host.isNullOrBlank()) {
            "La URL del servidor no es válida. Ejemplo: https://cable-tartak-api.onrender.com/"
        }

        return if (conProtocolo.endsWith("/")) conProtocolo else "$conProtocolo/"
    }

    /** Indica si la URL apunta a un host local o al emulador. */
    fun esServidorLocal(url: String = currentBaseUrl): Boolean =
        url.startsWith("http://") && listOf("10.0.2.2", "localhost", "127.0.0.1").any { url.contains(it) }

    private fun construirRetrofit(url: String): Retrofit = Retrofit.Builder()
        .baseUrl(url)
        .client(clienteOkHttp)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    /**
     * Reautenticacion automatica: ante un 401 por token caducado se pide un
     * token nuevo y se reintenta la peticion una sola vez. Si el refresco
     * falla, la sesion local se limpia y el usuario debe volver a entrar.
     */
    private class RefrescoAuthenticator : Authenticator {
        override fun authenticate(route: Route?, response: Response): Request? {
            if (contarIntentos(response) >= 2) return null

            val store = tokenStore ?: return null
            val refresh = store.refreshToken ?: return null

            val respuesta = try {
                runBlocking { apiService.refrescarSesion(RefreshRequest(refresh)) }
            } catch (e: IOException) {
                null
            }

            val cuerpo = respuesta?.body()
            val acceso = cuerpo?.accessToken
            if (cuerpo == null || acceso.isNullOrBlank()) {
                store.limpiar()
                return null
            }

            val nuevoRefresh = cuerpo.refreshToken ?: refresh
            store.guardar(acceso, nuevoRefresh)

            return response.request.newBuilder()
                .header(CABECERA_AUTORIZACION, PREFIJO_BEARER + acceso)
                .build()
        }

        private fun contarIntentos(response: Response): Int {
            var total = 1
            var previo = response.priorResponse
            while (previo != null) {
                total += 1
                previo = previo.priorResponse
            }
            return total
        }
    }
}
