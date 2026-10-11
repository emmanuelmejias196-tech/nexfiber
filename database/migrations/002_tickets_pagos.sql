-- Migracion 002: tickets, solicitudes de plan, pagos C2P, facturacion y auditoria.
CREATE SEQUENCE IF NOT EXISTS ticket_codigo_seq START WITH 10001;

CREATE TABLE IF NOT EXISTS tickets (
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

CREATE TABLE IF NOT EXISTS solicitudes_cambio_plan (
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

CREATE TABLE IF NOT EXISTS pagos_c2p (
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

CREATE TABLE IF NOT EXISTS facturas (
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

CREATE TABLE IF NOT EXISTS auditoria (
    id          BIGSERIAL PRIMARY KEY,
    actor       VARCHAR(64) NOT NULL,
    accion      VARCHAR(64) NOT NULL,
    entidad     VARCHAR(48),
    entidad_id  VARCHAR(48),
    ip          VARCHAR(45),
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
