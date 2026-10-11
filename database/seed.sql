-- Datos iniciales: catalogo de planes y contratos de demostracion.
-- Ejecutar tras las migraciones: npm run seed (desde backend/)
-- Las contrasenas NO se incluyen aqui. El seed de Node activa de forma
-- opcional los clientes de demostracion usando la variable SEED_PASSWORD.

INSERT INTO planes (id, nombre, descripcion, velocidad_down_mbps, velocidad_up_mbps, precio_usd)
VALUES
    ('p1', 'Plan Basico - 100 Mbps', 'Fibra optica FTTH para navegacion y streaming en HD.', 100, 100, 25.00),
    ('p2', 'Plan Plata - 200 Mbps',    'Fibra optica FTTH para hogares conectados.',      200, 200, 35.00),
    ('p3', 'Plan Oro - 300 Mbps',      'Fibra optica simetrica para streaming 4K.',     300, 300, 45.00),
    ('p4', 'Plan Gamer - 500 Mbps',    'Fibra optica de baja latencia para gaming.',     500, 500, 60.00)
ON CONFLICT (id) DO UPDATE
    SET nombre              = EXCLUDED.nombre,
        descripcion         = EXCLUDED.descripcion,
        velocidad_down_mbps = EXCLUDED.velocidad_down_mbps,
        velocidad_up_mbps   = EXCLUDED.velocidad_up_mbps,
        precio_usd          = EXCLUDED.precio_usd;

INSERT INTO clientes (cedula, nombre, plan_id, plan, servicio_activo, ont_serial, ip_asignada, potencia_optica_dbm, estado_fibra, mensualidad_usd, saldo_pendiente_usd, fecha_corte, direccion, telefono)
VALUES
    ('V-28000000', 'Cliente Demo Tartak',   'p3', 'Plan Oro - 300 Mbps',    TRUE, 'TK-ONT-0000', '186.95.42.88', -19.40, 'En Linea (Sincronizado)', 45.00,  0.00, '15 de cada mes', 'Sector Centro, Edif. Tartak', '0414-1234567'),
    ('V-28555123', 'Cliente Oficina Tartak', 'p2', 'Plan Plata - 200 Mbps',   TRUE, 'TK-ONT-5123', '186.95.42.12', -20.10, 'En Linea (Sincronizado)', 35.00,  0.00, '15 de cada mes', 'Sector Centro, Edif. Tartak', '0424-1234567')
ON CONFLICT (cedula) DO NOTHING;
