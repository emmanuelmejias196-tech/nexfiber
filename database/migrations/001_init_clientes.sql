-- Migracion 001: catalogos, contratos de clientes y sesiones.

CREATE TABLE IF NOT EXISTS planes (
    id                  VARCHAR(32) PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL,
    descripcion         TEXT,
    velocidad_down_mbps INTEGER NOT NULL CHECK (velocidad_down_mbps > 0),
    velocidad_up_mbps   INTEGER NOT NULL CHECK (velocidad_up_mbps > 0),
    precio_usd          NUMERIC(10, 2) NOT NULL CHECK (precio_usd >= 0),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
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

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           UUID PRIMARY KEY,
    cliente_id   BIGINT NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL UNIQUE,
    expira_en    TIMESTAMPTZ NOT NULL,
    revocado_en  TIMESTAMPTZ,
    user_agent   TEXT,
    ip           VARCHAR(45),
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS codigos_activacion (
    id           BIGSERIAL PRIMARY KEY,
    cliente_id   BIGINT NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
    codigo_hash  TEXT NOT NULL,
    expira_en    TIMESTAMPTZ NOT NULL,
    consumido_en  TIMESTAMPTZ,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
