package com.example.data.security

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * La politica de contrasenas debe coincidir con la del servidor, o el usuario
 * aceptaria aqui una clave que el servidor rechaza despues.
 */
class PasswordPolicyTest {

    @Test
    fun `rechaza contrasena vacia`() {
        val errores = PasswordPolicy.requisitos("")
        assertTrue(errores.isNotEmpty())
        assertTrue(PasswordPolicy.requisitos(null).isNotEmpty())
    }

    @Test
    fun `rechaza contrasena demasiado corta`() {
        assertTrue(PasswordPolicy.requisitos("abc").isNotEmpty())
        assertFalse(PasswordPolicy.esValida("abc"))
    }

    @Test
    fun `rechaza espacios en los extremos`() {
        assertTrue(PasswordPolicy.requisitos("Tartak1 ").isNotEmpty())
        assertTrue(PasswordPolicy.requisitos(" Tartak1").isNotEmpty())
    }

    @Test
    fun `rechaza contrasena con menos de tres caracteres distintos`() {
        assertTrue(PasswordPolicy.requisitos("aaaaaa").isNotEmpty())
    }

    @Test
    fun `acepta una contrasena razonable`() {
        assertTrue(PasswordPolicy.esValida("Tartak2026"))
        assertEquals(emptyList<String>(), PasswordPolicy.requisitos("Tartak2026"))
    }

    @Test
    fun `respeta el minimo configurado`() {
        val largo = "a".repeat(PasswordPolicy.MINIMO - 1) + "b"
        assertFalse(PasswordPolicy.esValida(largo))
    }
}
