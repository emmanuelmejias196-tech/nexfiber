package com.example.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

/**
 * Contrato de la API de Cable Tartak.
 *
 * Las rutas bajo /api/app exigen cabecera `Authorization: Bearer <token>`.
 * Las rutas de la raiz (/verificar-cedula, /reportar-falla, /solicitar-cambio)
 * se conservan para las APK antiguas ya instaladas y quedan limitadas por tasa
 * en el servidor.
 */
interface TartakApiService {

    // ------------------------------------------------------------------
    // Sesion
    // ------------------------------------------------------------------

    @POST("api/app/verificar-cedula")
    suspend fun verificarCedula(
        @Body body: VerificarCedulaRequest
    ): Response<VerificarCedulaResponse>

    @POST("api/app/activar-usuario")
    suspend fun activarUsuario(
        @Body body: ActivarUsuarioRequest
    ): Response<SesionResponse>

    @POST("api/app/iniciar-sesion")
    suspend fun iniciarSesion(
        @Body body: CredencialesRequest
    ): Response<SesionResponse>

    @POST("api/app/refresh")
    suspend fun refrescarSesion(
        @Body body: RefreshRequest
    ): Response<RefreshResponse>

    @POST("api/app/logout")
    suspend fun cerrarSesionRemoto(
        @Body body: RefreshRequest
    ): Response<Unit>

    // ------------------------------------------------------------------
    // Catalogo y perfil
    // ------------------------------------------------------------------

    @GET("api/app/planes")
    suspend fun obtenerPlanes(): Response<PlanesResponse>

    @GET("api/app/mi-perfil")
    suspend fun obtenerPerfil(): Response<MiPerfilResponse>

    @GET("api/app/facturas")
    suspend fun obtenerFacturas(): Response<FacturasResponse>

    /**
     * Busqueda global sobre los datos del propio cliente (tickets, pagos,
     * solicitudes y facturas). El servidor nunca devuelve datos ajenos.
     */
    @GET("api/app/buscar")
    suspend fun buscar(
        @Query("q") consulta: String
    ): Response<BusquedaResponse>

    // ------------------------------------------------------------------
    // Tickets
    // ------------------------------------------------------------------

    @POST("api/app/crear-reporte")
    suspend fun crearReporte(
        @Body body: CrearReporteRequest
    ): Response<CrearReporteResponse>

    @GET("api/app/tickets")
    suspend fun obtenerTickets(
        @Query("limite") limite: Int = 100,
        @Query("offset") offset: Int = 0
    ): Response<TicketsResponse>

    // ------------------------------------------------------------------
    // Pagos y planes
    // ------------------------------------------------------------------

    @POST("api/app/reporte-pago")
    suspend fun registrarPago(
        @Body body: ReportePagoRequest
    ): Response<CrearReporteResponse>

    @POST("api/app/solicitar-cambio")
    suspend fun solicitarCambioPlan(
        @Body body: SolicitarCambioPlanRequest
    ): Response<SolicitarCambioPlanResponse>

    // ------------------------------------------------------------------
    // Rutas heredadas (APK anteriores). Sin token.
    // ------------------------------------------------------------------

    @POST("verificar-cedula")
    suspend fun verificarCedulaDirecto(
        @Body body: VerificarCedulaRequest
    ): Response<VerificarCedulaResponse>

    @POST("reportar-falla")
    suspend fun reportarFallaDirecto(
        @Body body: CrearReporteRequest
    ): Response<CrearReporteResponse>

    @POST("solicitar-cambio")
    suspend fun solicitarCambioPlanDirecto(
        @Body body: SolicitarCambioPlanRequest
    ): Response<SolicitarCambioPlanResponse>
}
