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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.VpnKey
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.repository.NetworkMode
import com.example.ui.theme.TartakAccentAmber
import com.example.ui.theme.TartakBlueDark
import com.example.ui.theme.TartakBluePrimary
import com.example.ui.theme.TartakElectricCyan
import com.example.ui.theme.TartakSuccessGreen
import com.example.ui.viewmodel.TartakUiState

@Composable
fun RegistroScreen(
    state: TartakUiState,
    onVerificarCedula: (String) -> Unit,
    onActivarCuenta: (clave: String, confirmarClave: String) -> Unit,
    onIniciarSesionDirecta: (cedula: String, clave: String) -> Unit,
    onToggleModoLogin: (Boolean) -> Unit,
    onResetPasos: () -> Unit,
    onAbrirAdminOficina: () -> Unit
) {
    var cedulaInput by remember { mutableStateOf("") }
    var claveInput by remember { mutableStateOf("") }
    var confirmarClaveInput by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
    ) {
        // Hero Brand Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(TartakBlueDark, TartakBluePrimary)
                    )
                )
                .padding(top = 32.dp, bottom = 28.dp, start = 20.dp, end = 20.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(TartakElectricCyan.copy(alpha = 0.2f))
                        .border(1.5.dp, TartakElectricCyan, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Speed,
                        contentDescription = "Logo",
                        tint = TartakElectricCyan,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "NEXFIBER Móvil",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )

                Text(
                    text = "Fibra Óptica Ultra Rápida • Portal de Clientes",
                    fontSize = 12.sp,
                    color = TartakElectricCyan.copy(alpha = 0.9f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Switch between "Activar Mi Contrato" and "Ya Tengo Clave"
                if (!state.isVerificado) {
                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = Color.White.copy(alpha = 0.12f),
                        modifier = Modifier.padding(horizontal = 8.dp)
                    ) {
                        Row(modifier = Modifier.padding(4.dp)) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (!state.isModoLoginDirecto) TartakElectricCyan else Color.Transparent)
                                    .clickable { onToggleModoLogin(false) }
                                    .padding(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = "Activar Contrato",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (!state.isModoLoginDirecto) TartakBlueDark else Color.White
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (state.isModoLoginDirecto) TartakElectricCyan else Color.Transparent)
                                    .clickable { onToggleModoLogin(true) }
                                    .padding(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = "Ya tengo Clave",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (state.isModoLoginDirecto) TartakBlueDark else Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        // Main Flow Container
        Card(
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(top = 16.dp, bottom = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.Start
            ) {
                // =============================================================
                // PASO A: REGISTRO / VALIDACIÓN INICIAL POR CÉDULA
                // =============================================================
                if (!state.isVerificado && !state.isModoLoginDirecto) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(TartakBluePrimary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "1",
                                fontWeight = FontWeight.Bold,
                                color = TartakBluePrimary,
                                fontSize = 14.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Paso 1: Validación de Contrato",
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Bienvenido. Introduce tu Cédula de Identidad precargada por la oficina de NEXFIBER:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    OutlinedTextField(
                        value = cedulaInput,
                        onValueChange = { cedulaInput = it },
                        label = { Text("Cédula de Identidad") },
                        placeholder = { Text("Ej: V-XXXXXXXX") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Badge,
                                contentDescription = "Cédula",
                                tint = TartakBluePrimary
                            )
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Text,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = { onVerificarCedula(cedulaInput) }
                        ),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TartakBluePrimary,
                            focusedLabelColor = TartakBluePrimary
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("cedula_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { onVerificarCedula(cedulaInput) },
                        enabled = !state.isLoading && cedulaInput.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("verificar_contrato_button")
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = Color.White,
                                strokeWidth = 2.5.dp
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Consultando Servidor...")
                        } else {
                            Text(
                                text = "Verificar Contrato",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedButton(
                        onClick = onAbrirAdminOficina,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Precargar cédula en este dispositivo",
                            fontSize = 13.sp
                        )
                    }
                }

                // =============================================================
                // PASO B: CREACIÓN DE CLAVE SI ES CLIENTE VÁLIDO
                // =============================================================
                if (state.isVerificado && !state.isModoLoginDirecto && state.currentCustomer != null) {
                    val customer = state.currentCustomer

                    // Si el servidor informa que la cuenta ya esta activada, el
                    // paso de crear clave no aplica: se ofrece iniciar sesion.
                    if (customer.isActivated) {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "Esta cédula ya tiene una clave creada",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Ingresa con tu cédula y contraseña para ver tu servicio.",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { onToggleModoLogin(true) },
                                colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                                    .testTag("ir_a_login_button")
                            ) {
                                Text(
                                    text = "Iniciar Sesión",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(TartakSuccessGreen.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = "Aprobado",
                                    tint = TartakSuccessGreen,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Paso 2: Activar Cuenta",
                                fontWeight = FontWeight.Bold,
                                fontSize = 17.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        IconButton(onClick = onResetPasos) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Cambiar cédula",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Verified Card Banner
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = TartakBluePrimary.copy(alpha = 0.08f)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "¡Hola, ${customer.nombre}!",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TartakBlueDark
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Cédula: ${customer.cedula}",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Speed,
                                    contentDescription = "Plan",
                                    tint = TartakBluePrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Plan asignado: ${customer.plan}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TartakBluePrimary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = "Crea una contraseña segura para acceder a tus servicios y reportar averías técnicas:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = claveInput,
                        onValueChange = { claveInput = it },
                        label = { Text("Crea tu contraseña secreta") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "Clave",
                                tint = TartakBluePrimary
                            )
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle password"
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("clave_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = confirmarClaveInput,
                        onValueChange = { confirmarClaveInput = it },
                        label = { Text("Confirma tu contraseña secreta") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.VpnKey,
                                contentDescription = "Confirmar",
                                tint = TartakBluePrimary
                            )
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("confirmar_clave_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { onActivarCuenta(claveInput, confirmarClaveInput) },
                        enabled = !state.isLoading && claveInput.isNotBlank() && confirmarClaveInput.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("activar_cuenta_button")
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = Color.White,
                                strokeWidth = 2.5.dp
                            )
                        } else {
                            Text(
                                text = "Activar Mi Cuenta",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    }
                }

                // =============================================================
                // MODO LOGIN DIRECTO (CLIENTES CON CLAVE YA CREADA)
                // =============================================================
                if (state.isModoLoginDirecto && !state.isVerificado) {
                    Text(
                        text = "Iniciar Sesión",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Ingresa con tu Cédula y contraseña de cliente NEXFIBER:",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = cedulaInput,
                        onValueChange = { cedulaInput = it },
                        label = { Text("Cédula") },
                        leadingIcon = {
                            Icon(Icons.Default.Badge, contentDescription = null, tint = TartakBluePrimary)
                        },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("login_cedula_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = claveInput,
                        onValueChange = { claveInput = it },
                        label = { Text("Contraseña") },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = TartakBluePrimary)
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle password"
                                )
                            }
                        },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("login_clave_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { onIniciarSesionDirecta(cedulaInput, claveInput) },
                        enabled = !state.isLoading && cedulaInput.isNotBlank() && claveInput.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = TartakBluePrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("login_button")
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = Color.White,
                                strokeWidth = 2.5.dp
                            )
                        } else {
                            Text(
                                text = "Ingresar a Mi Tartak",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    TextButton(
                        onClick = { onToggleModoLogin(false) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("¿Primera vez? Activa tu contrato con tu Cédula")
                    }
                }
            }
        }

        // Indicador de conexion con el servidor
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val conectado = state.redMode is NetworkMode.OnlineApi
            Icon(
                imageVector = Icons.Default.FiberManualRecord,
                contentDescription = null,
                tint = if (conectado) TartakSuccessGreen else TartakAccentAmber,
                modifier = Modifier.size(10.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = if (conectado) {
                    "Servidor API: ${state.apiUrl}"
                } else {
                    "Sin conexión con ${state.apiUrl}. Los datos mostrados son la copia local."
                },
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}
