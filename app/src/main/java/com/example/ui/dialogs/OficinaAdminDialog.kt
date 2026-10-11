package com.example.ui.dialogs

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun OficinaAdminDialog(
    onPreloadContract: (cedula: String, nombre: String, plan: String) -> Unit,
    onDismiss: () -> Unit
) {
    var cedula by remember { mutableStateOf("") }
    var nombre by remember { mutableStateOf("") }
    var plan by remember { mutableStateOf("Fibra Óptica 300 Mbps Simétrico") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Oficina NEXFIBER - Precargar Cliente",
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp
            )
        },
        text = {
            Column {
                Text(
                    text = "Registra un contrato para probar la validación por Cédula en ESTE dispositivo. " +
                        "Para darlo de alta en el servidor central se usa la consola de oficina (POST /api/admin/clientes " +
                        "con la clave de administración): la app nunca lleva esa clave incrustada.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = cedula,
                    onValueChange = { cedula = it },
                    label = { Text("Cédula (ej: V-28555123)") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("admin_cedula_input"),
                    shape = RoundedCornerShape(8.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = nombre,
                    onValueChange = { nombre = it },
                    label = { Text("Nombre Completo del Cliente") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("admin_nombre_input"),
                    shape = RoundedCornerShape(8.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = plan,
                    onValueChange = { plan = it },
                    label = { Text("Plan Asignado") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("admin_plan_input"),
                    shape = RoundedCornerShape(8.dp)
                )
            }
        },
        confirmButton = {
                Button(
                    onClick = {
                        if (cedula.isNotBlank() && nombre.isNotBlank()) {
                            onPreloadContract(cedula, nombre, plan)
                            onDismiss()
                        }
                    },
                    enabled = cedula.isNotBlank() && nombre.isNotBlank(),
                    modifier = Modifier.testTag("admin_guardar_button")
                ) {
                    Text("Guardar en el dispositivo")
                }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}
