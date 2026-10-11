package com.example.data.security

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * La normalizacion debe coincidir exactamente con la del servidor
 * (backend/src/utils/cedula.js). Si divergen, el cliente consulta una cedula
 * distinta a la que el usuario escribio.
 */
class CedulaFormatterTest {

    @Test
    fun `normaliza cedulas con y sin prefijo`() {
        assertEquals("V-28000000", CedulaFormatter.normalizar("28000000"))
        assertEquals("V-28000000", CedulaFormatter.normalizar("V-28000000"))
        assertEquals("V-28000000", CedulaFormatter.normalizar("v-28000000"))
        assertEquals("V-28000000", CedulaFormatter.normalizar("  28000000  "))
    }

    @Test
    fun `respeta los prefijos E y J`() {
        assertEquals("E-12345678", CedulaFormatter.normalizar("E-12345678"))
        assertEquals("J-9999999", CedulaFormatter.normalizar("j-9999999"))
    }

    @Test
    fun `rechaza entradas invalidas`() {
        assertNull(CedulaFormatter.normalizar(""))
        assertNull(CedulaFormatter.normalizar("abc"))
        assertNull(CedulaFormatter.normalizar("V-12"))
        assertNull(CedulaFormatter.normalizar("X-12345678"))
        assertNull(CedulaFormatter.normalizar(null))
    }

    @Test
    fun `esValida delega en normalizar`() {
        assertTrue(CedulaFormatter.esValida("28000000"))
        assertFalse(CedulaFormatter.esValida("abc"))
    }
}
