-- =====================================================================
-- Cable Tartak - Esquema base de datos (PostgreSQL 14+)
-- Carpeta: database/
-- Este archivo es la version consolidada del esquema. Las migraciones
-- incrementales de database/migrations/ son la fuente de verdad para
-- desplegar; este documento sirve como referencia legible.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Catalogo de planes comercializados
-- ---------------------------------------------------------------------
CREATE TABLE planes (
    id                  VARCHAR(32) PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL,
    descripcion         TEXT,
    velocidad_down_mbps INTEGER NOT NULL CHECK (velocidad_down_mbps > 0),
    velocidad_up_mbps   INTEGER NOT NULL CHECK (velocidad_up_mbps > 0),
    precio_usd          NUMERIC(10, 2) NOT NULL CHECK (precio_usd >= 0),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Contratos de clientes (backend/postgres)
-- Nota: NUNCA se guarda la contrasena en claro. Solo el hash bcrypt.
-- El formato de la cedula se valida en la capa de aplicacion
-- (backend/src/utils/cedula.js) para devolver mensajes claros al cliente;
-- aqui solo se garantiza unicidad.
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    id                  BIGSERIAL PRIMARY KEY,
    cedula              VARCHAR(16) NOT NULL UNIQUE,
    nombre              VARCHAR(160) NOT NULL,
    plan_id             VARCHAR(32) REFERENCES planes (id) ON DELETE SET NULL,
    plan                VARCHAR(120) NOT NULL,
    clave_hash          TEXT,
    activado            BOOLEAN NOT NULL DEFAULT FALSE,
    servicio_activo     BOOLEAN NOT NULL DEFAULT TRUE,
    ont_serial          VARCHAR(64),
    ip_asignada         VARCHAR(45),
    potencia_optica_dbm NUMERIC(6, 2),
    estado_fibra        VARCHAR(64) NOT NULL DEFAULT 'En Linea (Sincronizado)',
    mensualidad_usd     NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
    saldo_pendiente_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fecha_corte         VARCHAR(64) NOT NULL DEFAULT '15 de cada mes',
    direccion           TEXT,
    telefono            VARCHAR(24),
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Tokens de refresco (rotacion). Se guarda el hash SHA-256 del token.
-- ---------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY,
    cliente_id   BIGINT NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL UNIQUE,
    expira_en    TIMESTAMPTZ NOT NULL,
    revocado_en  TIMESTAMPTZ,
    user_agent   TEXT,
    ip           VARCHAR(45),
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Codigos de activacion de un solo uso (opcionales, ver ACTIVATION_REQUIRES_OTP)
CREATE TABLE codigos_activacion (
    id           BIGSERIAL PRIMARY KEY,
    cliente_id   BIGINT NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
    codigo_hash  TEXT NOT NULL,
    expira_en    TIMESTAMPTZ NOT NULL,
    consumido_en  TIMESTAMPTZ,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Tickets: averias, pagos y diagnosticos
-- ---------------------------------------------------------------------
CREATE SEQUENCE ticket_codigo_seq START WITH 10001;

CREATE TABLE tickets (
    id              BIGSERIAL PRIMARY KEY,
    codigo          VARCHAR(16) NOT NULL UNIQUE,
    cliente_id      BIGINT REFERENCES clientes (id) ON DELETE SET NULL,
    cedula          VARCHAR(16) NOT NULL,
    tipo            VARCHAR(16) NOT NULL CHECK (tipo IN ('falla', 'pago', 'diagnostico')),
    categoria       VARCHAR(160) NOT NULL,
    detalle         TEXT NOT NULL,
    comprobante_url TEXT,
    estado          VARCHAR(48) NOT NULL DEFAULT 'Registrado',
    nota_tecnica    TEXT,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Solicitudes de cambio de plan
-- ---------------------------------------------------------------------
CREATE TABLE solicitudes_cambio_plan (
    id                  BIGSERIAL PRIMARY KEY,
    cliente_id          BIGINT REFERENCES clientes (id) ON DELETE SET NULL,
    cedula              VARCHAR(16) NOT NULL,
    plan_actual         VARCHAR(120),
    plan_nuevo_id       VARCHAR(32),
    plan_nuevo_nombre   VARCHAR(120),
    monto_usd           NUMERIC(10, 2),
    estado              VARCHAR(24) NOT NULL DEFAULT 'Pendiente',
    nota                TEXT,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Pagos C2P. La restriccion UNIQUE evita el doble gasto / replay.
-- ---------------------------------------------------------------------
CREATE TABLE pagos_c2p (
    id                BIGSERIAL PRIMARY KEY,
    cliente_id        BIGINT REFERENCES clientes (id) ON DELETE SET NULL,
    cedula            VARCHAR(16),
    telefono          VARCHAR(20) NOT NULL,
    codigo_banco      VARCHAR(4) NOT NULL,
    banco_nombre      VARCHAR(80) NOT NULL,
    referencia        VARCHAR(20) NOT NULL,
    monto_bs          NUMERIC(14, 2) NOT NULL CHECK (monto_bs > 0),
    estado            VARCHAR(32) NOT NULL,
    codigo_respuesta  VARCHAR(48) NOT NULL,
    mensaje           TEXT,
    transaccion_id    VARCHAR(64) UNIQUE,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pagos_c2p_referencia_unica UNIQUE (codigo_banco, referencia)
);

-- ---------------------------------------------------------------------
-- Historial de facturacion
-- ---------------------------------------------------------------------
CREATE TABLE facturas (
    id            BIGSERIAL PRIMARY KEY,
    cliente_id    BIGINT NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
    periodo       VARCHAR(16) NOT NULL,
    monto_usd     NUMERIC(10, 2) NOT NULL,
    estado        VARCHAR(24) NOT NULL DEFAULT 'Pagado',
    pdf_url       TEXT,
    pagado_en     TIMESTAMPTZ,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT facturas_periodo_unico UNIQUE (cliente_id, periodo)
);

-- ---------------------------------------------------------------------
-- Auditoria de acciones sensibles
-- ---------------------------------------------------------------------
CREATE TABLE auditoria (
    id          BIGSERIAL PRIMARY KEY,
    actor       VARCHAR(64) NOT NULL,
    accion      VARCHAR(64) NOT NULL,
    entidad     VARCHAR(48),
    entidad_id  VARCHAR(48),
    ip          VARCHAR(45),
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
