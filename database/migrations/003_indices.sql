-- Migracion 003: indices para las consultas del portal de clientes y del NOC.
CREATE INDEX IF NOT EXISTS idx_clientes_activado        ON clientes (activado);
CREATE INDEX IF NOT EXISTS idx_clientes_plan            ON clientes (plan_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_cliente   ON refresh_tokens (cliente_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expira    ON refresh_tokens (expira_en);
CREATE INDEX IF NOT EXISTS idx_tickets_cliente_fecha    ON tickets (cliente_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_cedula_tipo      ON tickets (cedula, tipo);
CREATE INDEX IF NOT EXISTS idx_tickets_estado           ON tickets (estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado       ON solicitudes_cambio_plan (estado, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_c2p_cliente        ON pagos_c2p (cliente_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_actor_fecha    ON auditoria (actor, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_codigos_activacion_cli   ON codigos_activacion (cliente_id, expira_en);
