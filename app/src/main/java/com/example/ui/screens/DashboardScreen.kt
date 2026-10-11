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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material.icons.filled.Router
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Customer
import com.example.data.model.PlanOferta
import com.example.data.repository.NetworkMode
import com.example.data.security.CedulaFormatter.NO_DISPONIBLE
import com.example.ui.components.TartakTopBar
import com.example.ui.theme.TartakAccentAmber
import com.example.ui.theme.TartakBlueDark
import com.example.ui.theme.TartakBluePrimary
import com.example.ui.theme.TartakElectricCyan
import com.example.ui.theme.TartakErrorRed
import com.example.ui.theme.TartakSuccessGreen
import com.example.ui.viewmodel.TartakUiState

@Composable
fun DashboardScreen(
    state: TartakUiState,
    onEnviarReporte: (detalle: String, categoria: String) -> Unit,
    onEjecutarDiagnostico: () -> Unit,
    onEjecutarPruebaVelocidad: () -> Unit,
    onReportarPagoMovil: (banco: String, referencia: String, monto: String, comprobanteUrl: String) -> Unit,
    onCambiarPlan: (nuevoPlan: String, nuevoMontoUsd: Double) -> Unit,
    onSolicitarCambioPlan: (planId: String, nombrePlan: String, nuevoMontoUsd: Double) -> Unit = { _, n, m -> onCambiarPlan(n, m) },
    onAbrirConfigApi: () -> Unit,
    onAbrirAdminOficina: () -> Unit,
    onBuscar: (String) -> Unit = {},
    onCerrarBusqueda: () -> Unit = {},
    onCerrarSesion: () -> Unit,
    onLimpiarMensaje: () -> Unit
) {
    val customer = state.currentCustomer ?: return
    var selectedTab by remember { mutableIntStateOf(0) }
    var mostrarBusqueda by remember { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.mensajeAlerta, state.mensajeExito) {
        val msg = state.mensajeAlerta ?: state.mensajeExito
        if (msg != null) {
            snackbarHostState.showSnackbar(msg)
            onLimpiarMensaje()
        }
    }

    Scaffold(
        topBar = {
            TartakTopBar(
                title = "Tartak Fibra",
                subtitle = customer.nombre,
                isOnline = state.redMode is NetworkMode.OnlineApi,
                onOpenSearch = { mostrarBusqueda = true },
                onOpenSettings = onAbrirConfigApi,
                onOpenAdmin = onAbrirAdminOficina,
                onLogout = onCerrarSesion
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Mi Fibra") },
                    label = { Text("Mi Fibra", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = TartakBluePrimary,
                        selectedTextColor = TartakBluePrimary,
                        indicatorColor = TartakBluePrimary.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.testTag("tab_mi_fibra")
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Speed, contentDescription = "Planes") },
                    label = { Text("Planes", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = TartakBluePrimary,
                        selectedTextColor = TartakBluePrimary,
                        indicatorColor = TartakBluePrimary.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.testTag("tab_planes")
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Warning, contentDescription = "Averías") },
                    label = { Text("Avería", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = TartakErrorRed,
                        selectedTextColor = TartakErrorRed,
                        indicatorColor = TartakErrorRed.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.testTag("tab_reportar_averia")
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.SupportAgent, contentDescription = "Tickets") },
                    label = { Text("Tickets", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = TartakBluePrimary,
                        selectedTextColor = TartakBluePrimary,
                        indicatorColor = TartakBluePrimary.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.testTag("tab_tickets")
                )
                NavigationBarItem(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    icon = { Icon(Icons.Default.Receipt, contentDescription = "Facturación") },
                    label = { Text("Pagos", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = TartakBluePrimary,
                        selectedTextColor = TartakBluePrimary,
                        indicatorColor = TartakBluePrimary.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.testTag("tab_facturacion")
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (selectedTab) {
                0 -> MiFibraOverviewTab(
                    customer = customer,
                    state = state,
                    onIrAReportarAveria = { selectedTab = 2 },
                    onIrAPlanes = { selectedTab = 1 },
                    onEjecutarDiagnostico = onEjecutarDiagnostico,
                    onEjecutarPruebaVelocidad = onEjecutarPruebaVelocidad,
                    onSolicitarCambioPlan = onSolicitarCambioPlan
                )
                1 -> PlanesScreen(
                    customer = customer,
                    planesDisponibles = state.planes,
                    onSolicitarCambioPlan = onSolicitarCambioPlan
                )
                2 -> ReportarAveriaScreen(
                    state = state,
                    onEnviarReporte = onEnviarReporte,
                    onVerTickets = { selectedTab = 3 }
                )
                3 -> TicketsScreen(
                    tickets = state.tickets,
                    onNuevoReporte = { selectedTab = 2 }
                )
                4 -> BillingScreen(
                    customer = customer,
                    pagoExitoso = state.pagoRegistradoExitoso,
                    facturas = state.facturas,
                    onReportarPagoMovil = onReportarPagoMovil
                )
            }
        }
    }

    if (mostrarBusqueda) {
        BusquedaDialog(
            state = state,
            onBuscar = onBuscar,
            onCerrar = {
                mostrarBusqueda = false
                onCerrarBusqueda()
            }
        )
    }
}

@Composable
fun MiFibraOverviewTab(
    customer: Customer,
    state: TartakUiState,
    onIrAReportarAveria: () -> Unit,
    onIrAPlanes: () -> Unit,
    onEjecutarDiagnostico: () -> Unit,
    onEjecutarPruebaVelocidad: () -> Unit,
    onSolicitarCambioPlan: (planId: String, nombrePlan: String, nuevoMontoUsd: Double) -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // =========================================================================
        // PASO C EXACTO DEL FLUTTER SNIPPET:
        // Card(color: Colors.blue[50], child: Column: Servicio: Activo ✔, Plan Contratado)
        // =========================================================================
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFE3F2FD)), // Colors.blue[50]
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("card_servicio_activo")
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Servicio: Activo ✔",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TartakSuccessGreen,
                            fontSize = 17.sp
                        )
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(TartakSuccessGreen.copy(alpha = 0.15f))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "GPON PON OK",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = TartakSuccessGreen
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Plan Contratado:",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = customer.plan,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = TartakBlueDark,
                                fontSize = 15.sp
                            )
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(TartakBluePrimary)
                            .clickable { onIrAPlanes() }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Ver Planes ➔",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Network & ONT specs. Si el servidor no los envia se muestra
                // "No disponible" en lugar de un valor inventado.
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = "IP Asignada:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(
                            text = customer.ipAsignada.ifBlank { NO_DISPONIBLE },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (customer.ipAsignada.isBlank()) MaterialTheme.colorScheme.onSurfaceVariant else Color.Unspecified
                        )
                    }
                    Column {
                        Text(text = "Potencia Óptica:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(
                            text = customer.potenciaOptica.ifBlank { NO_DISPONIBLE },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (customer.potenciaOptica.isBlank()) MaterialTheme.colorScheme.onSurfaceVariant else TartakSuccessGreen
                        )
                    }
                    Column {
                        Text(text = "Serial ONT:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(
                            text = customer.ontSerial.ifBlank { NO_DISPONIBLE },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (customer.ontSerial.isBlank()) MaterialTheme.colorScheme.onSurfaceVariant else Color.Unspecified
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // =========================================================================
        // WIDGET SOLICITADO: catalogoYCambioPlan()
        // Permite explorar ofertas de velocidad y registrar la solicitud en /solicitar-cambio
        // =========================================================================
        CatalogoYCambioPlan(
            customer = customer,
            planesDisponibles = state.planes,
            onSolicitarCambio = onSolicitarCambioPlan
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Quick Action: Report Outage (From Flutter requirement)
        Card(
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "¿Tienes problemas con tu Fibra Óptica?",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Si tienes luz roja LOS en tu router o no tienes navegación, envía un reporte técnico inmediato.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(14.dp))
                Button(
                    onClick = onIrAReportarAveria,
                    colors = ButtonDefaults.buttonColors(containerColor = TartakErrorRed),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("reportar_averia_action_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Reportar Avería de Internet",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // =========================================================================
        // MÓDULO INTERACTIVO SOLICITADO: Medidor de Estabilidad y Velocidad de Cable Tartak
        // Simula descarga/latencia óptica (3s), detecta megas (~145.6 Mbps) y guarda reporte
        // =========================================================================
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("modulo_medidor_velocidad")
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
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(TartakBluePrimary.copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = null,
                                tint = TartakBluePrimary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Medidor de Estabilidad",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Prueba de Red Óptica FTTH Tartak",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    if (state.midiendoVelocidad) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.5.dp, color = TartakBluePrimary)
                    } else if (state.megasDetectados > 0.0) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(TartakSuccessGreen.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "ESTABLE ✔",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = TartakSuccessGreen
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Display central de velocidad detectada de la ONT
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(
                                    TartakBluePrimary.copy(alpha = 0.08f),
                                    TartakElectricCyan.copy(alpha = 0.04f)
                                )
                            )
                        )
                        .border(
                            1.dp,
                            if (state.midiendoVelocidad) TartakElectricCyan else TartakBluePrimary.copy(alpha = 0.2f),
                            RoundedCornerShape(12.dp)
                        )
                        .padding(vertical = 16.dp, horizontal = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = if (state.midiendoVelocidad) "Midiendo latencia y ancho de banda óptico..." else "Megas Detectados en ONT",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Medium
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                text = if (state.megasDetectados == 0.0 && !state.midiendoVelocidad) "---" else "${state.megasDetectados}",
                                fontSize = 38.sp,
                                fontWeight = FontWeight.Black,
                                color = if (state.megasDetectados > 0.0) TartakBluePrimary else MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Mbps",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = TartakBlueDark,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                        }

                        if (state.midiendoVelocidad) {
                            Spacer(modifier = Modifier.height(10.dp))
                            LinearProgressIndicator(
                                progress = { state.velocidadProgreso },
                                modifier = Modifier
                                    .fillMaxWidth(0.85f)
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = TartakElectricCyan,
                                trackColor = TartakBluePrimary.copy(alpha = 0.2f)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Comprobando potencia óptica y paquetes...",
                                fontSize = 10.sp,
                                color = TartakBluePrimary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Botón para iniciar prueba interactiva
                Button(
                    onClick = onEjecutarPruebaVelocidad,
                    enabled = !state.midiendoVelocidad,
                    colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                        .testTag("iniciar_prueba_velocidad_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.RocketLaunch,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (state.midiendoVelocidad) "Midiendo Red Óptica (3s)..." else "Medir Estabilidad de Internet",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                // Notificación de reporte automático guardado en el servidor
                if (state.ultimoTestVelocidad != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = TartakSuccessGreen.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = TartakSuccessGreen,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Registro Automático en Servidor:",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TartakSuccessGreen
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = state.ultimoTestVelocidad ?: "",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface,
                                lineHeight = 15.sp
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Live Diagnostic Widget
        Card(
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.NetworkCheck,
                            contentDescription = null,
                            tint = TartakBluePrimary,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Diagnóstico de Línea en Vivo",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }

                    if (state.diagnostico.enProgreso) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(TartakBluePrimary.copy(alpha = 0.1f))
                                .clickable { onEjecutarDiagnostico() }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(12.dp), tint = TartakBluePrimary)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Medir", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TartakBluePrimary)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    DiagnosticMetricItem(
                        title = "Bajada",
                        value = if (state.diagnostico.bajadaMbps > 0) "${state.diagnostico.bajadaMbps} Mbps" else "Pendiente",
                        color = TartakBluePrimary
                    )
                    DiagnosticMetricItem(
                        title = "Subida",
                        value = if (state.diagnostico.subidaMbps > 0) "${state.diagnostico.subidaMbps} Mbps" else "Pendiente",
                        color = TartakElectricCyan
                    )
                    DiagnosticMetricItem(
                        title = "Ping NOC",
                        value = if (state.diagnostico.pingMs > 0) "${state.diagnostico.pingMs} ms" else "Pendiente",
                        color = TartakSuccessGreen
                    )
                    DiagnosticMetricItem(
                        title = "Pérdida",
                        value = "${state.diagnostico.paquetesPerdidos}%",
                        color = TartakSuccessGreen
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = if (state.diagnostico.esMedicionEnviadaAlServidor) {
                        "Medición registrada en el servidor central de NEXFIBER."
                    } else {
                        "Estimación realizada en este dispositivo. No es una medición del centro de operaciones."
                    },
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun DiagnosticMetricItem(title: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = title, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = color)
    }
}

data class PlanOfertaVelocidad(
    val id: String,
    val nombre: String,
    val precio: String,
    val montoUsd: Double
)

/**
 * Catalogo de planes con opcion de solicitar el cambio.
 *
 * Los planes llegan del servidor (`GET /api/app/planes`). Si no hay conexion se
 * muestra el catalogo de respaldo para que la pantalla siga siendo utilizable,
 * indicando que la solicitud require conexion.
 */
@Composable
fun CatalogoYCambioPlan(
    customer: Customer,
    planesDisponibles: List<PlanOferta> = emptyList(),
    onSolicitarCambio: (planId: String, nombrePlan: String, nuevoMontoUsd: Double) -> Unit
) {
    val planes = if (planesDisponibles.isNotEmpty()) {
        planesDisponibles.map {
            PlanOfertaVelocidad(it.id, it.nombre, it.precioFormateado, it.precioUsd)
        }
    } else {
        listOf(
            PlanOfertaVelocidad("p2", "Plan Plata - 200 Mbps", "\$35/mes", 35.0),
            PlanOfertaVelocidad("p3", "Plan Oro - 300 Mbps", "\$45/mes", 45.0),
            PlanOfertaVelocidad("p4", "Plan Gamer - 500 Mbps", "\$60/mes", 60.0)
        )
    }
    val sinConexion = planesDisponibles.isEmpty()

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("catalogo_cambio_plan_card")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "🚀 ¿Deseas más velocidad? Cambia tu plan",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            )

            if (sinConexion) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Catálogo de respaldo: conéctate para ver las ofertas y enviar solicitudes.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Column {
                planes.forEachIndexed { index, plan ->
                    val esPlanActual = customer.plan.equals(plan.nombre, ignoreCase = true) ||
                        customer.planId == plan.id

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = "Velocidad",
                                tint = Color.Blue,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = plan.nombre,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = plan.precio,
                                    fontSize = 12.sp,
                                    color = TartakBluePrimary,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        Button(
                            onClick = {
                                onSolicitarCambio(plan.id, plan.nombre, plan.montoUsd)
                            },
                            enabled = !esPlanActual,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (esPlanActual) MaterialTheme.colorScheme.surfaceVariant else TartakBluePrimary
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.testTag("solicitar_plan_${plan.id}")
                        ) {
                            Text(
                                text = if (esPlanActual) "Activo" else "Solicitar",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (esPlanActual) MaterialTheme.colorScheme.onSurfaceVariant else Color.White
                            )
                        }
                    }

                    if (index < planes.size - 1) {
                        HorizontalDivider(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            thickness = 0.8.dp
                        )
                    }
                }
            }
        }
    }

}
