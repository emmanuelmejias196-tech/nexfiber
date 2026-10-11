-- Migración 004: Infraestructura de Cajas NAP e Inventario de Fibra Óptica (NEXFIBER)
-- Integra los modelos operativos de la Consola Web a PostgreSQL en Render

-- Cajas NAP para distribución de fibra óptica
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

CREATE INDEX IF NOT EXISTS idx_cajas_nap_sector ON cajas_nap(sector);
CREATE INDEX IF NOT EXISTS idx_cajas_nap_codigo ON cajas_nap(codigo);

-- Enlace de cliente a Caja NAP y Puerto
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS caja_nap_id INT REFERENCES cajas_nap(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS puerto_nap INT,
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128);

-- Inventario de materiales (bobinas drop, conectores, ONUs/ONTs)
CREATE TABLE IF NOT EXISTS inventario_materiales (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    cantidad_disponible NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(10, 2) DEFAULT 5,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Despachos de materiales a cuadrillas técnicas
CREATE TABLE IF NOT EXISTS despachos_materiales (
    id SERIAL PRIMARY KEY,
    tecnico_id INT,
    material_id INT REFERENCES inventario_materiales(id),
    cantidad NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(100),
    fecha_despacho TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
