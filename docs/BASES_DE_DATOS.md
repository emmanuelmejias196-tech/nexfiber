# ESPECIFICACIÓN DE BASES DE DATOS — NEXFIBER
**Distribución de Modelos de Datos: Render (PostgreSQL) y Firebase (Cloud Firestore)**  
**Fecha:** 11 de Octubre de 2026  
**Marca:** NEXFIBER  

---

## 1. POSTGRESQL EN RENDER (BASE DE DATOS CANÓNICA DE LA WEB Y BACKOFFICE)

La base de datos relacional alojada en Render (`cable-tartak-db` / PostgreSQL 16) actúa como el núcleo transaccional del ISP.

### Esquema Canónico de Tablas:

```sql
-- 1. Usuarios del sistema / Personal
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('dueño', 'admin', 'tecnico')),
    password_hash VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catálogo de planes de internet
CREATE TABLE IF NOT EXISTS planes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    velocidad_mbps INT NOT NULL,
    precio_usd NUMERIC(10, 2) NOT NULL,
    precio_bs NUMERIC(12, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clientes y contratos
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    correo VARCHAR(120),
    direccion TEXT,
    sector VARCHAR(80),
    plan_id INT REFERENCES planes(id),
    activo BOOLEAN DEFAULT TRUE,
    saldo_pendiente NUMERIC(10, 2) DEFAULT 0.00,
    ip_asignada VARCHAR(45),
    mac_onu VARCHAR(30),
    caja_nap_id INT,
    puerto_nap INT,
    firebase_uid VARCHAR(128),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Infraestructura de fibra óptica: Cajas NAP
CREATE TABLE IF NOT EXISTS cajas_nap (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    sector VARCHAR(80) NOT NULL,
    latitud NUMERIC(10, 7) NOT NULL,
    longitud NUMERIC(10, 7) NOT NULL,
    capacidad_puertos INT NOT NULL DEFAULT 16,
    estado VARCHAR(20) DEFAULT 'operativa' CHECK(estado IN ('operativa', 'mantenimiento', 'llena', 'inactiva')),
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventario de materiales
CREATE TABLE IF NOT EXISTS inventario_materiales (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'bobina_fibra', 'ont_router', 'conector_rapido', 'herramienta'
    unidad_medida VARCHAR(20) NOT NULL, -- 'metros', 'unidades', 'paquetes'
    cantidad_disponible NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(10, 2) DEFAULT 5,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Despachos a técnicos
CREATE TABLE IF NOT EXISTS despachos_materiales (
    id SERIAL PRIMARY KEY,
    tecnico_id INT REFERENCES usuarios_sistema(id),
    material_id INT REFERENCES inventario_materiales(id),
    cantidad NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(100), -- 'instalacion_nueva', 'reparacion_averia'
    fecha_despacho TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Facturación mensual
CREATE TABLE IF NOT EXISTS facturas (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE RESTRICT,
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    monto_usd NUMERIC(10, 2) NOT NULL,
    monto_bs NUMERIC(12, 2) NOT NULL,
    pagada BOOLEAN DEFAULT FALSE,
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    fecha_pago TIMESTAMPTZ
);

-- 8. Pagos móviles C2P y transferencias
CREATE TABLE IF NOT EXISTS pagos_c2p (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id),
    factura_id INT REFERENCES facturas(id),
    referencia VARCHAR(50) UNIQUE NOT NULL,
    banco_origen VARCHAR(20) NOT NULL,
    telefono_pagador VARCHAR(20) NOT NULL,
    monto_bs NUMERIC(12, 2) NOT NULL,
    tasa_bcv NUMERIC(10, 4) NOT NULL,
    monto_usd NUMERIC(10, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobado', 'rechazado')),
    codigo_aprobacion VARCHAR(50),
    fecha_pago TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tickets de averías y soporte técnico
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    cliente_id INT REFERENCES clientes(id),
    asunto VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'abierto' CHECK(estado IN ('abierto', 'en_proceso', 'resuelto', 'cerrado')),
    prioridad VARCHAR(20) DEFAULT 'media' CHECK(prioridad IN ('baja', 'media', 'alta', 'critica')),
    tecnico_asignado INT REFERENCES usuarios_sistema(id),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Auditoría inmutable de cambios
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT NOT NULL,
    accion VARCHAR(20) NOT NULL,
    usuario VARCHAR(50),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. CLOUD FIRESTORE EN FIREBASE (BASE DE DATOS EN TIEMPO REAL PARA LA APP MÓVIL)

La base de datos de Firebase (`playa-buche-pos` o el proyecto Firebase asignado a NEXFIBER) está estructurada para permitir lecturas y escrituras seguras en la app móvil.

### Estructura de Colecciones:

#### 1. `customers/{clienteId}`
Documento representativo de cada suscriptor para acceso instantáneo sin consultar PostgreSQL:
```json
{
  "cedula": "V-12345678",
  "nombreCompleto": "Juan Pérez",
  "telefono": "04121234567",
  "plan": {
    "nombre": "Plan Fibra Plus - 150 Mbps",
    "velocidad": 150,
    "precioUsd": 25.00
  },
  "estadoServicio": "activo",
  "saldoPendienteUsd": 0.00,
  "fechaCorte": "2026-11-01",
  "cajaNapAsignada": "NAP-CENTRO-01",
  "ultimaSincronizacion": "2026-10-11T12:00:00Z"
}
```

#### 2. `invoices/{facturaId}`
Facturas emitidas para que el cliente consulte sus consumos y periodos vencidos:
```json
{
  "clienteId": 142,
  "cedula": "V-12345678",
  "periodo": "2026-10",
  "montoUsd": 25.00,
  "montoBs": 1362.50,
  "tasaBcv": 54.50,
  "estado": "pendiente",
  "fechaVencimiento": "2026-10-25"
}
```

#### 3. `payment_reports/{reporteId}`
Creado por el cliente desde la app móvil al pagar:
```json
{
  "clienteId": 142,
  "cedula": "V-12345678",
  "metodo": "pago_movil_c2p",
  "referencia": "87654321",
  "bancoOrigen": "0102 - Banco de Venezuela",
  "telefono": "04121234567",
  "montoBs": 1362.50,
  "fechaReporte": "2026-10-11T14:30:00Z",
  "estado": "en_validacion"
}
```

#### 4. `service_tickets/{ticketId}`
Tickets de soporte creados o consultados por el cliente:
```json
{
  "ticketId": "TK-2026-0045",
  "clienteId": 142,
  "asunto": "Luz LOS roja en el router",
  "descripcion": "Desde las 2 PM se cayó la señal y parpadea en rojo.",
  "estado": "abierto",
  "fechaCreacion": "2026-10-11T14:35:00Z",
  "historialRespuestas": [
    {
      "autor": "Soporte NEXFIBER",
      "mensaje": "Hemos asignado un técnico a tu sector.",
      "fecha": "2026-10-11T14:40:00Z"
    }
  ]
}
```

---

## 3. SERVICIO DE SINCRONIZACIÓN Y REGLAS DE INTEGRACIÓN

1. **Prioridad y Conflictos:**
   * En finanzas, saldo y facturas, **PostgreSQL (Render) siempre manda**. Si hay discrepancia, Firestore se sobreescribe con los datos de PostgreSQL.
2. **Idempotencia:**
   * Cada reporte de pago incluye la referencia bancaria como clave única (`referencia`). No se pueden procesar pagos duplicados en ninguno de los dos sistemas.
3. **Manejo de Errores y Caídas:**
   * Si Firebase no está disponible temporalmente, PostgreSQL almacena las operaciones en cola y las envía cuando el servicio responda.
   * Si PostgreSQL está en mantenimiento, la app móvil puede seguir consultando la última copia de su saldo en Firestore en modo solo lectura.
