package com.example.data.network

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * La URL base decide contra que host se envian la cedula y la contrasena del
 * cliente: una validacion laxa permitiria enviar las credenciales a un servidor
 * cualquiera o, peor, por http en claro.
 */
class NetworkClientUrlTest {

    @Test
    fun `anade el protocolo https cuando falta`() {
        assertEquals(
            "https://cable-tartak-api.onrender.com/",
            NetworkClient.normalizarUrl("cable-tartak-api.onrender.com")
        )
    }

    @Test
    fun `conserva el protocolo y anade la barra final`() {
        assertEquals(
            "https://cable-tartak-api.onrender.com/",
            NetworkClient.normalizarUrl("https://cable-tartak-api.onrender.com")
        )
        assertEquals("http://10.0.2.2:3000/", NetworkClient.normalizarUrl("http://10.0.2.2:3000"))
    }

    @Test
    fun `no duplica la barra final`() {
        assertEquals(
            "https://api.example.com/",
            NetworkClient.normalizarUrl("https://api.example.com/")
        )
    }

    @Test(expected = IllegalArgumentException::class)
    fun `rechaza una url vacia`() {
        NetworkClient.normalizarUrl("   ")
    }

    @Test(expected = IllegalArgumentException::class)
    fun `rechaza una url sin host`() {
        NetworkClient.normalizarUrl("https://")
    }

    @Test
    fun `distingue el servidor local del remoto`() {
        assertTrue(NetworkClient.esServidorLocal("http://10.0.2.2:3000/"))
        assertTrue(NetworkClient.esServidorLocal("http://localhost:3000/"))
        assertFalse(NetworkClient.esServidorLocal("https://cable-tartak-api.onrender.com/"))
    }
}
