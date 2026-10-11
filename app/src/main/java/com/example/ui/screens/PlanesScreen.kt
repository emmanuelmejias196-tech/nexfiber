package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.Gamepad
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Customer
import com.example.data.model.PlanOferta
import com.example.data.security.CedulaFormatter.NO_DISPONIBLE
import com.example.ui.theme.TartakAccentAmber
import com.example.ui.theme.TartakBlueDark
import com.example.ui.theme.TartakBlueLight
import com.example.ui.theme.TartakBluePrimary
import com.example.ui.theme.TartakElectricCyan
import com.example.ui.theme.TartakSuccessGreen

data class PlanFibraDetalle(
    val id: String,
    val nombre: String,
    val velocidadMbps: Int,
    val precioUsd: Double,
    val etiqueta: String? = null,
    val icon: ImageVector = Icons.Default.Speed,
    val colorAcento: Color = TartakBluePrimary,
    val dispositivosRecomendados: String,
    val descripcion: String,
    val beneficios: List<String>
)

val planesDisponiblesTartak = listOf(
    PlanFibraDetalle(
        id = "plan_150",
        nombre = "Fibra Hogar 150 Mbps Simétrico",
        velocidadMbps = 150,
        precioUsd = 22.0,
        etiqueta = "ECONÓMICO",
        icon = Icons.Default.Wifi,
        colorAcento = Color(0xFF00897B),
        dispositivosRecomendados = "1 a 5 Dispositivos",
        descripcion = "Excelente rendimiento para streaming HD, videollamadas y navegación cotidiana en el hogar.",
        beneficios = listOf(
            "150 Mbps de descarga y 150 Mbps de subida garantizados",
            "Conexión FTTH pura (Fibra Óptica directa a tu hogar)",
            "ONT con WiFi Dual Band 2.4 GHz y 5 GHz",
            "Sin límites de consumo mensual de datos",
            "Atención técnica por NOC y soporte telefónico"
        )
    ),
    PlanFibraDetalle(
        id = "plan_300",
        nombre = "Fibra Óptica 300 Mbps Simétrico",
        velocidadMbps = 300,
        precioUsd = 30.0,
        etiqueta = "MÁS POPULAR",
        icon = Icons.Default.Speed,
        colorAcento = TartakBluePrimary,
        dispositivosRecomendados = "5 a 10 Dispositivos",
        descripcion = "El plan predilecto de las familias: múltiples pantallas 4K simultáneas y descargas ultra veloces.",
        beneficios = listOf(
            "300 Mbps simétricos reales con latencia ultrabaja",
            "Streaming 4K Ultra HD en múltiples TVs sin buffer",
            "ONT Gigabit con puertos LAN de 1000 Mbps",
            "Optimizado para teletrabajo y conferencias Zoom/Meet",
            "Soporte técnico prioritario NOC Tartak"
        )
    ),
    PlanFibraDetalle(
        id = "plan_600",
        nombre = "Fibra Tartak Gamer 600 Mbps Ultra",
        velocidadMbps = 600,
        precioUsd = 45.0,
        etiqueta = "GAMING & STREAMING",
        icon = Icons.Default.Gamepad,
        colorAcento = Color(0xFF7C4DFF),
        dispositivosRecomendados = "10 a 20 Dispositivos",
        descripcion = "Rutas de enrutamiento gamer optimizadas internacionalmente con el menor ping a servidores de juego.",
        beneficios = listOf(
            "600 Mbps simétricos con prioridad QoS en la red",
            "Ping mínimo optimizado a servidores de USA y Europa (<25ms)",
            "Transmisión en directo (Twitch / YouTube) en 1080p60 sin pérdidas",
            "Descarga de parches masivos de juegos en pocos minutos",
            "Atención técnica especializada en gaming"
        )
    ),
    PlanFibraDetalle(
        id = "plan_1000",
        nombre = "Fibra Tartak Gamer Pro 1 Gbps Dedicado",
        velocidadMbps = 1000,
        precioUsd = 70.0,
        etiqueta = "MÁXIMA VELOCIDAD",
        icon = Icons.Default.RocketLaunch,
        colorAcento = TartakElectricCyan,
        dispositivosRecomendados = "Dispositivos Ilimitados",
        descripcion = "La cúspide de velocidad en fibra óptica: 1 Gigabit por segundo para los usuarios más exigentes.",
        beneficios = listOf(
            "1000 Mbps simétricos dedicados (1 Gbps real)",
            "ONT WiFi 6 de última generación con cobertura extendida",
            "Ideal para creadores de contenido, NAS y streaming 8K",
            "Subida instantánea de archivos pesados a la nube",
            "Asignación de cuadrilla prioritaria en menos de 12 horas"
        )
    ),
    PlanFibraDetalle(
        id = "plan_2000",
        nombre = "Fibra Negocios 1 Gbps Dedicado",
        velocidadMbps = 1000,
        precioUsd = 70.0,
        etiqueta = "EMPRESARIAL",
        icon = Icons.Default.Bolt,
        colorAcento = TartakAccentAmber,
        dispositivosRecomendados = "Oficinas y Comercios",
        descripcion = "Conectividad corporativa de alta disponibilidad con SLA de 99.9% para empresas y comercios.",
        beneficios = listOf(
            "1 Gbps dedicado simétrico para oficinas",
            "SLA de servicio garantizado del 99.9%",
            "Monitoreo proactivo 24/7 desde el Centro de Red NOC",
            "Facturación jurídica con crédito fiscal",
            "Soporte corporativo dedicado y cuadrilla VIP"
        )
    )
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PlanesScreen(
    customer: Customer,
    planesDisponibles: List<PlanOferta> = emptyList(),
    onSolicitarCambioPlan: (planId: String, nombrePlan: String, nuevoMontoUsd: Double) -> Unit
) {
    var planParaConfirmar by remember { mutableStateOf<PlanFibraDetalle?>(null) }
    var planServidorParaConfirmar by remember { mutableStateOf<PlanOferta?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header Section
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = TartakBlueDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Planes de Fibra Óptica",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(TartakElectricCyan.copy(alpha = 0.2f))
                                .border(1.dp, TartakElectricCyan, RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "FTTH 100% SIMÉTRICO",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = TartakElectricCyan
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Consulta las especificaciones de tu plan activo o solicita el cambio a un plan de mayor velocidad en cualquier momento.",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Card Mi Plan Actual
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE3F2FD)), // Soft blue
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("card_mi_plan_actual")
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(TartakSuccessGreen.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = "Activo",
                                    tint = TartakSuccessGreen,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "MI PLAN ACTUAL",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TartakSuccessGreen,
                                    letterSpacing = 0.5.sp
                                )
                                Text(
                                    text = customer.plan,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = TartakBlueDark
                                )
                            }
                        }

                        // Price tag
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = formatearUsd(customer.mensualidadUsd),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                                color = TartakBluePrimary
                            )
                            Text(
                                text = "USD / mes",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Plan Specs Grid
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White)
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        PlanMetricMiniItem(
                            label = "Estado",
                            value = if (customer.servicioActivo) "Activo ✔" else "Suspendido",
                            color = if (customer.servicioActivo) TartakSuccessGreen else MaterialTheme.colorScheme.error
                        )
                        PlanMetricMiniItem(
                            label = "Corte",
                            value = customer.fechaCorte.ifBlank { NO_DISPONIBLE },
                            color = TartakBluePrimary
                        )
                        PlanMetricMiniItem(
                            label = "Potencia Óptica",
                            value = customer.potenciaOptica.ifBlank { NO_DISPONIBLE },
                            color = TartakSuccessGreen
                        )
                    }
                }
            }
        }

        // =====================================================================
        // Catalogo oficial: lo que realmente ofrece el servidor central.
        // =====================================================================
        if (planesDisponibles.isNotEmpty()) {
            item {
                Text(
                    text = "Planes oficiales del servidor (${planesDisponibles.size})",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            items(planesDisponibles, key = { "srv-" + it.id }) { plan ->
                val esElPlanActual = customer.planId == plan.id ||
                    customer.plan.equals(plan.nombre, ignoreCase = true)

                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (esElPlanActual) Color(0xFFF1F8FE) else MaterialTheme.colorScheme.surface
                    ),
                    border = if (esElPlanActual) androidx.compose.foundation.BorderStroke(2.dp, TartakBluePrimary) else null,
                    elevation = CardDefaults.cardElevation(defaultElevation = if (esElPlanActual) 3.dp else 1.5.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = plan.nombre,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                if (plan.descripcion.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = plan.descripcion,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        lineHeight = 16.sp
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = formatearUsd(plan.precioUsd),
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = TartakBluePrimary
                                )
                                Text(
                                    text = "USD / mes",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${plan.velocidadDownMbps} Mbps bajada / ${plan.velocidadUpMbps} Mbps subida",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TartakBluePrimary
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        if (esElPlanActual) {
                            OutlinedButton(
                                onClick = { },
                                enabled = false,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = TartakSuccessGreen, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Plan Actual en Uso",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = TartakSuccessGreen
                                )
                            }
                        } else {
                            Button(
                                onClick = { planServidorParaConfirmar = plan },
                                colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(44.dp)
                                    .testTag("servidor_plan_${plan.id}_button")
                            ) {
                                Icon(Icons.Default.RocketLaunch, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Solicitar ${formatearUsd(plan.precioUsd)}/mes",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // Section Title: Catálogo de Planes
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Catálogo de Planes Disponibles (${planesDisponiblesTartak.size})",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        }

        // List of all available plans
        items(planesDisponiblesTartak, key = { it.id }) { plan ->
            val esElPlanActual = customer.planId == plan.id ||
                customer.plan.equals(plan.nombre, ignoreCase = true) ||
                customer.plan.contains(plan.velocidadMbps.toString()) ||
                (plan.id == "plan_1000" && customer.plan.contains("1 Gbps", ignoreCase = true))

            PlanItemCard(
                plan = plan,
                esPlanActual = esElPlanActual,
                onSolicitarCambio = { planParaConfirmar = plan }
            )
        }
    }

    // Dialogo de confirmacion para los planes del catalogo local detallado
    if (planParaConfirmar != null) {
        val plan = planParaConfirmar!!
        AlertDialog(
            onDismissRequest = { planParaConfirmar = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = plan.icon,
                        contentDescription = null,
                        tint = plan.colorAcento,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Cambiar a ${plan.nombre}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            text = {
                Column {
                    Text(
                        text = "¿Deseas enviar una solicitud para cambiar tu suscripción a este plan?",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = "• Velocidad: ${plan.velocidadMbps} Mbps Simétrico",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "• Nueva Tarifa: ${formatearUsd(plan.precioUsd)} USD / mes",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TartakBluePrimary
                            )
                            Text(
                                text = "• Dispositivos: ${plan.dispositivosRecomendados}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Tu plan actual se mantendrá hasta que el servidor confirme el cambio.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSolicitarCambioPlan(plan.id, plan.nombre, plan.precioUsd)
                        planParaConfirmar = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.testTag("confirmar_cambio_plan_button")
                ) {
                    Text("Enviar solicitud")
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { planParaConfirmar = null },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Cancelar")
                }
            }
        )
    }

    // Dialogo de confirmacion para los planes oficiales del servidor
    if (planServidorParaConfirmar != null) {
        val plan = planServidorParaConfirmar!!
        AlertDialog(
            onDismissRequest = { planServidorParaConfirmar = null },
            title = {
                Text(text = "Cambiar a ${plan.nombre}", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            },
            text = {
                Column {
                    Text(
                        text = "¿Deseas enviar una solicitud de cambio a este plan oficial?",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "• Velocidad: ${plan.velocidadDownMbps} Mbps de bajada / ${plan.velocidadUpMbps} Mbps de subida",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "• Nueva tarifa: ${formatearUsd(plan.precioUsd)} USD / mes",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TartakBluePrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Tu plan actual se mantendrá hasta que el servidor confirme el cambio.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSolicitarCambioPlan(plan.id, plan.nombre, plan.precioUsd)
                        planServidorParaConfirmar = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.testTag("confirmar_cambio_plan_servidor_button")
                ) {
                    Text("Enviar solicitud")
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { planServidorParaConfirmar = null },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}

/** Formato monetario uniforme: 45 -> "$45.00", 45.5 -> "$45.50". */
fun formatearUsd(monto: Double): String = "$" + String.format(java.util.Locale.US, "%.2f", monto)

@Composable
fun PlanItemCard(
    plan: PlanFibraDetalle,
    esPlanActual: Boolean,
    onSolicitarCambio: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (esPlanActual) Color(0xFFF1F8FE) else MaterialTheme.colorScheme.surface
        ),
        border = if (esPlanActual) androidx.compose.foundation.BorderStroke(2.dp, TartakBluePrimary) else null,
        elevation = CardDefaults.cardElevation(defaultElevation = if (esPlanActual) 3.dp else 1.5.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Top Row: Tag & Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (plan.etiqueta != null) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(plan.colorAcento.copy(alpha = 0.15f))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = plan.etiqueta,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = plan.colorAcento
                        )
                    }
                } else {
                    Spacer(modifier = Modifier.width(1.dp))
                }

                if (esPlanActual) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(TartakSuccessGreen)
                            .padding(horizontal = 10.dp, vertical = 3.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "TU PLAN ACTUAL",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Plan Title & Speed
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = plan.nombre,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = plan.descripcion,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 16.sp
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Price display
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                    text = formatearUsd(plan.precioUsd),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = TartakBluePrimary
                )
                    Text(
                        text = "USD / mes",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Devices and Speed Indicators
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Devices,
                    contentDescription = null,
                    tint = TartakBluePrimary,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Recomendado: ${plan.dispositivosRecomendados}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Benefits bullets
            plan.beneficios.forEach { beneficio ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = TartakSuccessGreen,
                        modifier = Modifier
                            .size(14.dp)
                            .padding(top = 2.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = beneficio,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 15.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Action Button
            if (esPlanActual) {
                OutlinedButton(
                    onClick = { /* Already active */ },
                    enabled = false,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = TartakSuccessGreen, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Plan Actual en Uso",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = TartakSuccessGreen
                    )
                }
            } else {
                Button(
                    onClick = onSolicitarCambio,
                    colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("cambiar_plan_${plan.id}_button")
                ) {
                    Icon(Icons.Default.RocketLaunch, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                            text = "Cambiar a este Plan (${formatearUsd(plan.precioUsd)}/mes)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun PlanMetricMiniItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = color)
    }
}
