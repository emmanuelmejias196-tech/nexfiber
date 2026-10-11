package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.dialogs.ConfigApiDialog
import com.example.ui.dialogs.OficinaAdminDialog
import com.example.ui.screens.DashboardScreen
import com.example.ui.screens.RegistroScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.TartakViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                CableTartakApp()
            }
        }
    }
}

@Composable
fun CableTartakApp(viewModel: TartakViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showConfigApiDialog by remember { mutableStateOf(false) }
    var showOficinaAdminDialog by remember { mutableStateOf(false) }

    // Listen to alerts / success messages when on RegistroScreen
    LaunchedEffect(state.mensajeAlerta, state.mensajeExito) {
        val msg = state.mensajeAlerta ?: state.mensajeExito
        if (msg != null && !state.isLogueado) {
            snackbarHostState.showSnackbar(msg)
            viewModel.limpiarMensaje()
        }
    }

    // Android back button handling
    BackHandler(enabled = state.isLogueado || state.isVerificado) {
        if (state.isLogueado) {
            viewModel.cerrarSesion()
        } else if (state.isVerificado) {
            viewModel.resetPasosVerificacion()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            if (!state.isLogueado) {
                RegistroScreen(
                    state = state,
                    onVerificarCedula = { cedula -> viewModel.verificarIdentidadCliente(cedula) },
                    onActivarCuenta = { clave, confirmar -> viewModel.registrarContrasenaYActivar(clave, confirmar) },
                    onIniciarSesionDirecta = { ced, pass -> viewModel.iniciarSesionDirecta(ced, pass) },
                    onToggleModoLogin = { directo -> viewModel.toggleModoLoginDirecto(directo) },
                    onResetPasos = { viewModel.resetPasosVerificacion() },
                    onAbrirAdminOficina = { showOficinaAdminDialog = true }
                )
            } else {
                DashboardScreen(
                    state = state,
                    onEnviarReporte = { detalle, categoria -> viewModel.enviarReporteFalla(detalle, categoria) },
                    onEjecutarDiagnostico = { viewModel.ejecutarDiagnosticoRed() },
                    onEjecutarPruebaVelocidad = { viewModel.ejecutarPruebaVelocidad() },
                    onReportarPagoMovil = { banco, ref, monto, url -> viewModel.reportarPagoMovil(banco, ref, monto, url) },
                    onCambiarPlan = { nuevoPlan, monto -> viewModel.cambiarPlan(nuevoPlan, monto) },
                    onSolicitarCambioPlan = { id, nombre, monto -> viewModel.solicitarCambioPlan(id, nombre, monto) },
                    onAbrirConfigApi = { showConfigApiDialog = true },
                    onAbrirAdminOficina = { showOficinaAdminDialog = true },
                    onBuscar = { consulta -> viewModel.buscar(consulta) },
                    onCerrarBusqueda = { viewModel.cerrarBusqueda() },
                    onCerrarSesion = { viewModel.cerrarSesion() },
                    onLimpiarMensaje = { viewModel.limpiarMensaje() }
                )
            }        }
    }

    // Configuration Dialogs
    if (showConfigApiDialog) {
        ConfigApiDialog(
            currentUrl = state.apiUrl,
            onSaveUrl = { newUrl -> viewModel.actualizarApiUrl(newUrl) },
            onDismiss = { showConfigApiDialog = false }
        )
    }

    if (showOficinaAdminDialog) {
        OficinaAdminDialog(
            onPreloadContract = { cedula, nombre, plan ->
                viewModel.precargarNuevoContratoOficina(cedula, nombre, plan)
            },
            onDismiss = { showOficinaAdminDialog = false }
        )
    }
}
