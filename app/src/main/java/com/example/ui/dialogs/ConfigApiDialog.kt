package com.example.ui.dialogs

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ConfigApiDialog(
    currentUrl: String,
    onSaveUrl: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var urlText by remember { mutableStateOf(currentUrl) }
    var errorText by remember { mutableStateOf<String?>(null) }

    // El trafico en claro solo esta permitido hacia el emulador y el host local
    // (ver res/xml/network_security_config.xml). En cualquier otro host la app
    // exige HTTPS.
    fun validar(): String? {
        val limpia = urlText.trim()
        if (limpia.isEmpty()) return "Escribe la URL del servidor."
        if (!limpia.startsWith("http://") && !limpia.startsWith("https://")) {
            if (limpia.contains(".")) return null
            return "URL no válida."
        }
        val esLocal = listOf("10.0.2.2", "localhost", "127.0.0.1").any { limpia.contains(it) }
        if (limpia.startsWith("http://") && !esLocal) {
            return "Solo se permite http:// contra el emulador o el host local. Usa https:// en producción."
        }
        return null
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Configuración del Servidor API",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        },
        text = {
            Column {
                Text(
                    text = "Indica la URL de la API del servidor central (Render en producción o local en desarrollo).",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = urlText,
                    onValueChange = { urlText = it; errorText = null },
                    label = { Text("URL Base del Servidor") },
                    isError = errorText != null,
                    supportingText = errorText?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("api_url_input"),
                    shape = RoundedCornerShape(8.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Accesos rápidos:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Column(modifier = Modifier.fillMaxWidth()) {
                    SuggestionChip(
                        onClick = { urlText = "https://cable-tartak-api.onrender.com/" },
                        label = { Text("Render: cable-tartak-api.onrender.com", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp)
                    )
                    Row(modifier = Modifier.fillMaxWidth()) {
                        SuggestionChip(
                            onClick = { urlText = "http://10.0.2.2:3000/" },
                            label = { Text("Emulador (10.0.2.2)", fontSize = 10.sp) },
                            modifier = Modifier.padding(end = 4.dp)
                        )
                        SuggestionChip(
                            onClick = { urlText = "http://localhost:3000/" },
                            label = { Text("Localhost", fontSize = 10.sp) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val error = validar()
                    if (error != null) {
                        errorText = error
                    } else {
                        onSaveUrl(urlText.trim())
                        onDismiss()
                    }
                },
                modifier = Modifier.testTag("save_api_url_button")
            ) {
                Text("Guardar URL")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}
