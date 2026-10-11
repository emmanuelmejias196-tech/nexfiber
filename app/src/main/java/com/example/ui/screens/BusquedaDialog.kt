package com.example.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.RequestQuote
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.repository.BusquedaResultado
import com.example.data.repository.PagoRegistrado
import com.example.data.repository.SolicitudCambio
import com.example.ui.viewmodel.TartakUiState
import java.util.Locale

/**
 * Busqueda global del cliente: tickets, pagos, solicitudes de plan y facturas.
 *
 * La consulta viaja al servidor, que solo devuelve datos del propio contrato.
 * Si no hay conexion se avisa en vez de mostrar "0 resultados", que seria una
 * respuesta falsa.
 */
@Composable
fun BusquedaDialog(
    state: TartakUiState,
    onBuscar: (String) -> Unit,
    onCerrar: () -> Unit
) {
    var texto by remember { mutableStateOf(state.consultaBusqueda) }

    AlertDialog(
        onDismissRequest = onCerrar,
        confirmButton = {
            TextButton(
                onClick = { onBuscar(texto) },
                enabled = texto.trim().length >= 2 && !state.buscando
            ) { Text("Buscar") }
        },
        dismissButton = { TextButton(onClick = onCerrar) { Text("Cerrar") } },
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Search, contentDescription = null)
                Text("Buscar en mi cuenta", modifier = Modifier.padding(start = 8.dp))
            }
        },
        text = {
            Column {
                OutlinedTextField(
                    value = texto,
                    onValueChange = { texto = it },
                    label = { Text("Cédula, ticket, referencia, plan o periodo") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                val resultado = state.resultadoBusqueda
                when {
                    state.buscando -> Row(
                        modifier = Modifier.padding(top = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(modifier = Modifier.heightIn(max = 22.dp))
                        Text("Consultando al servidor...", modifier = Modifier.padding(start = 12.dp))
                    }

                    state.busquedaSinConexion -> Aviso(
                        "Sin conexión con el servidor. No se puede buscar el historial completo.",
                        MaterialTheme.colorScheme.error
                    )

                    resultado != null -> Column {
                        Text(
                            "${resultado.total} resultado(s) para \"${resultado.consulta}\"",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 12.dp)
                        )
                        if (resultado.total == 0) {
                            Text(
                                "No encontramos nada con ese texto.",
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        } else {
                            ListaResultados(resultado)
                        }
                    }

                    else -> Text(
                        "Escribe al menos 2 caracteres. Se buscan tickets, pagos, solicitudes de plan y facturas.",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 12.dp)
                    )
                }
            }
        }
    )
}

@Composable
private fun Aviso(texto: String, color: androidx.compose.ui.graphics.Color) {
    Surface(
        color = color.copy(alpha = 0.10f),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp)
    ) {
        Text(texto, color = color, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(10.dp))
    }
}

@Composable
private fun ListaResultados(resultado: BusquedaResultado) {
    LazyColumn(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 320.dp)
            .padding(top = 8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        items(resultado.tickets, key = { "t-${it.id}" }) { ticket ->
            Fila(
                icono = Icons.Default.SupportAgent,
                titulo = ticket.id,
                subtitulo = "${ticket.categoria} · ${ticket.estado}"
            )
        }
        items(resultado.pagos, key = { "p-${it.referencia}" }) { pago ->
            FilaPago(pago)
        }
        items(resultado.solicitudes, key = { "s-${it.planNuevo}-${it.fecha}" }) { solicitud ->
            FilaSolicitud(solicitud)
        }
        items(resultado.facturas, key = { "f-${it.periodo}" }) { factura ->
            Fila(
                icono = Icons.Default.ReceiptLong,
                titulo = "Factura ${factura.periodo}",
                subtitulo = String.format(Locale.US, "$%.2f · %s", factura.montoUsd, factura.estado)
            )
        }
    }
}

@Composable
private fun FilaPago(pago: PagoRegistrado) {
    Fila(
        icono = Icons.Default.RequestQuote,
        titulo = "Pago ${pago.referencia}",
        subtitulo = String.format(
            Locale.US,
            "Bs. %.2f · %s · %s",
            pago.montoBs,
            pago.banco.ifBlank { "Banco" },
            pago.estado
        )
    )
}

@Composable
private fun FilaSolicitud(solicitud: SolicitudCambio) {
    Fila(
        icono = Icons.Default.SwapHoriz,
        titulo = "${solicitud.planActual.ifBlank { "Plan actual" }} → ${solicitud.planNuevo}",
        subtitulo = solicitud.estado
    )
}

@Composable
private fun Fila(
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    titulo: String,
    subtitulo: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icono,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(end = 10.dp)
        )
        Column {
            Text(titulo, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Text(subtitulo, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
        }
    }
}