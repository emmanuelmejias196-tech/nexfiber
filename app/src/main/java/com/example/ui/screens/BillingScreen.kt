package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Customer
import com.example.data.model.Factura
import com.example.ui.theme.TartakBluePrimary
import com.example.ui.theme.TartakSuccessGreen

data class FacturaItem(
    val mes: String,
    val monto: String,
    val status: String
)

@Composable
fun BillingScreen(
    customer: Customer,
    pagoExitoso: Boolean,
    facturas: List<Factura> = emptyList(),
    onReportarPagoMovil: (banco: String, referencia: String, monto: String, comprobanteUrl: String) -> Unit
) {
    // Controladores solicitados en el diseño
    var banco by remember { mutableStateOf("Banesco") }
    var referencia by remember { mutableStateOf("") }
    var monto by remember { mutableStateOf(String.format(java.util.Locale.US, "%.2f", customer.mensualidadUsd)) }

    // Referencia del comprobante. La app todavia no sube archivos: el bloque
    // informa de la verdad en lugar de simular una imagen adjunta.

    val listaFacturas: List<FacturaItem> = remember(facturas) {
        if (facturas.isNotEmpty()) {
            facturas.map { FacturaItem(it.periodo, it.montoFormateado, "${it.estado} ✔") }
        } else {
            emptyList()
        }
    }
    var facturaSeleccionadaParaDescarga by remember { mutableStateOf<FacturaItem?>(null) }

    val scrollState = rememberScrollState()

    fun reportarPagoMovilAccion() {
        if (referencia.isBlank() || monto.isBlank()) return

        onReportarPagoMovil(banco, referencia, monto, "")
        referencia = ""
        monto = ""
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // Balance Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = TartakBluePrimary),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Estado de Cuenta",
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(TartakSuccessGreen)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "SOLVENTE",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Monto a Pagar",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.85f)
                )

                Row(
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "$${customer.mensualidadUsd}0",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "USD / mes",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Plan: ${customer.plan}",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.9f)
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Fecha de Corte: ${customer.fechaCorte}",
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                    Text(
                        text = "Tasa BCV Oficial",
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // MÓDULO SOLICITADO: Reportar Pago Móvil / Transferencia con simulación de imagen
        Card(
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
            modifier = Modifier.fillMaxWidth().testTag("modulo_pago_card")
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "🗂️ Reportar Pago Móvil / Transferencia",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Datos Tartak: RIF J-40891234-5 | Teléfono 0414-9988776 | Banesco (0134)",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Banco Emisor
                OutlinedTextField(
                    value = banco,
                    onValueChange = { banco = it },
                    label = { Text("Banco Emisor (Ej: Banesco)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("banco_emisor_input")
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Referencia
                OutlinedTextField(
                    value = referencia,
                    onValueChange = { referencia = it },
                    label = { Text("Últimos 4 números de Referencia") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("referencia_input")
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Monto en Dólares
                OutlinedTextField(
                    value = monto,
                    onValueChange = { monto = it },
                    label = { Text("Monto en Dólares ($)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("monto_dolares_input")
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .border(1.dp, TartakBluePrimary.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Image,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Captura de Comprobante",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "La app todavía no sube imágenes. Envía la captura al WhatsApp de la oficina para una conciliación más rápida.",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(TartakBluePrimary.copy(alpha = 0.1f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Opcional",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = TartakBluePrimary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(15.dp))

                // Botón Enviar Comprobante (solicitado con icono attach_money y color verde)
                Button(
                    onClick = { reportarPagoMovilAccion() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)), // Colors.green
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("enviar_comprobante_button")
                ) {
                    Icon(Icons.Default.AttachMoney, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Enviar Comprobante",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color.White
                    )
                }

                if (pagoExitoso) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(TartakSuccessGreen.copy(alpha = 0.12f))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = TartakSuccessGreen,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "💰 ¡Pago reportado! Administración validará tu transacción.",
                            fontSize = 12.sp,
                            color = TartakSuccessGreen,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // =========================================================================
        // WIDGET SOLICITADO: historialFacturas()
        // Card con ListView de meses pagados, icono PDF en rojo, monto en verde,
        // status en negrita y evento onTap para descargar PDF
        // =========================================================================
        Card(
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("card_historial_facturas")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📄 Mis Facturas Anteriores",
                        style = TextStyle(fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (listaFacturas.isEmpty()) {
                    Text(
                        text = "Todavía no hay facturas registradas en el servidor.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                listaFacturas.forEachIndexed { index, factura ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                facturaSeleccionadaParaDescarga = factura
                            }
                            .padding(vertical = 10.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.PictureAsPdf,
                                contentDescription = "PDF",
                                tint = Color.Red,
                                modifier = Modifier.size(26.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = factura.mes,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = factura.monto,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFF2E7D32) // Colors.green
                                )
                            }
                        }

                        Text(
                            text = factura.status,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TartakSuccessGreen
                        )
                    }

                    if (index < listaFacturas.size - 1) {
                        HorizontalDivider(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            thickness = 0.8.dp
                        )
                    }
                }
            }
        }
    }

    // Diálogo de descarga de PDF al tocar la factura
    if (facturaSeleccionadaParaDescarga != null) {
        val fact = facturaSeleccionadaParaDescarga!!
        AlertDialog(
            onDismissRequest = { facturaSeleccionadaParaDescarga = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = Color.Red)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Descargar Factura")
                }
            },
            text = {
                Text(
                    "La factura ${fact.mes} ($${fact.monto}) se solicita al servidor de NEXFIBER. " +
                        "Cuando el documento fiscal esté disponible se descargará desde el portal de clientes."
                )
            },
            confirmButton = {
                Button(
                    onClick = { facturaSeleccionadaParaDescarga = null },
                    colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary)
                ) {
                    Text("Aceptar")
                }
            }
        )
    }

    // Alerta de confirmacion del pago (solo si el servidor lo recibio)
    if (pagoExitoso) {
        AlertDialog(
            onDismissRequest = { },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = TartakSuccessGreen)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Comprobante recibido")
                }
            },
            text = {
                Text("El comprobante llegó al servidor de NEXFIBER. Administración validará la transacción.")
            },
            confirmButton = {
                Button(
                    onClick = { },
                    colors = ButtonDefaults.buttonColors(containerColor = TartakSuccessGreen)
                ) {
                    Text("Aceptar")
                }
            }
        )
    }
}
