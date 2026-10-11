# Base de datos - Cable Tartak

Tercera carpeta del proyecto: esquema, migraciones y datos iniciales de PostgreSQL.

## Estructura

| Archivo | Proposito |
| --- | --- |
| `schema.sql` | Esquema consolidado de referencia (lectura humana) |
| `migrations/001_init_clientes.sql` | Planes, contratos de clientes, sesiones y codigos de activacion |
| `migrations/002_tickets_pagos.sql` | Tickets, solicitudes de plan, pagos C2P, facturacion y auditoria |
| `migrations/003_indices.sql` | Indices de las consultas del portal de clientes y del NOC |
| `seed.sql` | Catalogo de planes y dos contratos de demostracion |

## Convenciones

- La contrasena del cliente **nunca** se guarda en claro: solo el hash bcrypt en `clientes.clave_hash`.
- `clientes.cedula` es unica y se almacena normalizada (`V-12345678`), con restriccion de formato.
- `tickets.codigo` usa la secuencia `ticket_codigo_seq` (prefijo `TK-`, `PG-` o `DG-`).
- `pagos_c2p` tiene `UNIQUE (codigo_banco, referencia)`: es la defensa contra doble gasto y replay.
- `refresh_tokens.token_hash` almacena SHA-256 del token, nunca el token en si.

## Aplicar migraciones

```bash
cd backend
npm run migrate   # aplica database/migrations/*.sql en orden y registra en schema_migrations
npm run seed      # carga database/seed.sql y activa opcionalmente las cuentas demo
```

Las migraciones son idempotentes y se registran en la tabla `schema_migrations`.
