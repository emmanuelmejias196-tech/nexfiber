package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.TartakBluePrimary
import com.example.ui.theme.TartakErrorRed
import com.example.ui.theme.TartakSuccessGreen
import com.example.ui.viewmodel.TartakUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ReportarAveriaScreen(
    state: TartakUiState,
    onEnviarReporte: (detalle: String, categoria: String) -> Unit,
    onVerTickets: () -> Unit
) {
    var detalleInput by remember { mutableStateOf("") }
    var categoriaSeleccionada by remember { mutableStateOf("Luz roja LOS en router") }

    val scrollState = rememberScrollState()

    val sintomasRapidos = listOf(
        "Luz roja LOS en router",
        "Sin señal de internet",
        "Lentitud extrema",
        "Cable de fibra cortado",
        "Router no enciende",
        "Intermitencia constante",
        "Falla de WiFi interno"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // Warning / Intro Banner
        Card(
            colors = CardDefaults.cardColors(
                containerColor = TartakErrorRed.copy(alpha = 0.08f)
            ),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(TartakErrorRed.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Avería",
                        tint = TartakErrorRed,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "¿Tienes problemas con tu Fibra Óptica?",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = TartakErrorRed
                    )
                    Text(
                        text = "Genera un reporte técnico directo al NOC y cuadrillas de calle.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Pre-check Advice
        Card(
            colors = CardDefaults.cardColors(
                containerColor = TartakBluePrimary.copy(alpha = 0.05f)
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = TartakBluePrimary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Comprobaciones rápidas recomendadas:",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp,
                        color = TartakBluePrimary
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "• Verifica si la luz PON de la ONT está encendida en verde fijo.\n• Si la luz LOS parpadea en rojo, indica corte físico en la fibra óptica.\n• Reinicia la ONT desconectándola 10 segundos de la toma de corriente.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 16.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Symptom selector
        Text(
            text = "Selecciona el síntoma principal:",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )

        Spacer(modifier = Modifier.height(8.dp))

        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            sintomasRapidos.forEach { sintoma ->
                val isSelected = categoriaSeleccionada == sintoma
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(
                            if (isSelected) TartakErrorRed else MaterialTheme.colorScheme.surfaceVariant
                        )
                        .border(
                            width = 1.dp,
                            color = if (isSelected) TartakErrorRed else Color.Transparent,
                            shape = RoundedCornerShape(20.dp)
                        )
                        .clickable {
                            categoriaSeleccionada = sintoma
                            if (detalleInput.isBlank()) {
                                detalleInput = "Reporte: $sintoma"
                            }
                        }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = sintoma,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Detalle de la avería
        Text(
            text = "Detalle de la avería técnica:",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )

        Spacer(modifier = Modifier.height(6.dp))

        OutlinedTextField(
            value = detalleInput,
            onValueChange = { detalleInput = it },
            placeholder = { Text("Ej: Luz roja LOS parpadeando en el router / Sin señal de internet desde las 2:00 PM") },
            minLines = 3,
            maxLines = 6,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("falla_input")
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Button Reportar Avería
        Button(
            onClick = {
                onEnviarReporte(detalleInput, categoriaSeleccionada)
                detalleInput = ""
            },
            enabled = !state.isLoading && detalleInput.isNotBlank(),
            colors = ButtonDefaults.buttonColors(containerColor = TartakErrorRed),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .testTag("reportar_falla_button")
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Enviando reporte a Tartak...")
            } else {
                Icon(
                    imageVector = Icons.Default.Build,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Reportar Avería de Internet",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }

        // Recent Ticket Notification Card
        if (state.ticketRecienCreado != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = TartakSuccessGreen.copy(alpha = 0.1f)
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onVerTickets() }
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Ticket",
                        tint = TartakSuccessGreen,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Ticket generado: ${state.ticketRecienCreado.id}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = TartakSuccessGreen
                        )
                        Text(
                            text = "Estado: ${state.ticketRecienCreado.estado}. Toca para ver seguimiento.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
