# ARQUITECTURA TÉCNICA E INTEGRACIÓN — NEXFIBER
**Integración de Plataforma Web, App Móvil, PostgreSQL en Render y Firebase Firestore**  
**Fecha:** 11 de Octubre de 2026  
**Marca:** NEXFIBER  

---

## 1. VISIÓN GENERAL DE LA ARQUITECTURA HÍBRIDA

La arquitectura de **NEXFIBER** responde de forma óptima a la necesidad operativa del negocio:
1. **La base de datos de la Web (Consola Administrativa / Backoffice) reside en PostgreSQL (Render):**
   * Es la **Fuente Única de Verdad (SSOT)** relacional, transaccional y financiera.
   * Maneja clientes, contratos, planes, Cajas NAP, inventario de fibra, auditoría y facturación con integridad referencial estricta y respaldos automáticos.
2. **La base de datos de la App Móvil (Clientes) reside en Firebase (Firestore + Auth):**
   * Proporciona respuesta ultrarrápida, arquitectura offline-first, notificaciones push nativas y sincronización reactiva en tiempo real para los clientes.
   * Colecciones dedicadas para consulta de saldo, facturas, comprobantes de pago y estado de tickets de avería.
3. **Capa de Conexión y Sincronización Bidireccional (NEXFIBER Sync Engine):**
   * El servicio central de backend conecta ambos mundos sin duplicidad caótica de datos.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ARQUITECTURA NEXFIBER                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ CONSOLA WEB ADMIN ]               [ SERVICIOS COMPLEMENTARIOS ]      [ APP MÓVIL CLIENTES ]
   (React + Leaflet)                      (POS / Comandera PWA)              (Android Compose)
          │                                        │                                │
          ▼                                        ▼                                ▼
 ┌─────────────────┐                      ┌─────────────────┐              ┌─────────────────┐
 │   RENDER API    │                      │  FIREBASE AUTH  │              │  FIREBASE AUTH  │
 │  (Express Core) │                      │   & FIRESTORE   │              │   & FIRESTORE   │
 └────────┬────────┘                      └────────┬────────┘              └────────┬────────┘
          │                                        │                                │
          ▼                                        └────────────────┬───────────────┘
 ┌─────────────────┐                                                │
 │   POSTGRESQL    │ ◄────────── [ SYNC SERVICE ] ──────────────────┘
 │ (Render DB 16)  │        (Sincronización Bidireccional)
 └─────────────────┘
```

---

## 2. DISTRIBUCIÓN DE BASES DE DATOS Y RESPONSABILIDADES

### 2.1. Base de Datos en Render (PostgreSQL 16) — Dominio Administrativo y Troncal
* **Consumidores directos:** Consola Web de Administración (`web/`), API Troncal (`backend/`), Técnicos de red.
* **Módulos y Tablas:**
  * `usuarios_sistema`: Personal operativo con roles (`dueño`, `admin`, `tecnico`).
  * `clientes`: Maestro oficial de suscriptores (cédula, nombres, contacto, IP fija/dinámica, MAC de ONU/ONT, coordenadas de domicilio).
  * `planes`: Catálogo oficial de anchos de banda y tarifas en USD y Bolívares.
  * `cajas_nap`: Georreferenciación de cajas NAP, splitters ópticos, puertos libres y ocupados.
  * `inventario_materiales` & `despachos`: Control físico de bobinas drop, conectores, herramientas y routers entregados a cuadrillas técnicas.
  * `facturas`: Documentos fiscales y estados de cuenta mensuales.
  * `pagos_c2p` & `pagos_transferencia`: Registro y conciliación bancaria.
  * `tickets`: Órdenes de trabajo y reportes de avería formalmente asignados a técnicos.
  * `auditoria`: Log inmutable de operaciones administrativas y financieras.

### 2.2. Base de Datos en Firebase (Cloud Firestore & Auth) — Dominio Móvil y Tiempo Real
* **Consumidores directos:** App Móvil Android de Clientes (`app/`), Portal PWA en campo.
* **Colecciones en Firestore:**
  * `customers/{clienteId}`: Datos de lectura rápida del cliente (nombre, plan activo, estado del servicio: *activo/suspendido*, saldo pendiente, fecha de corte).
  * `plans/{planId}`: Catálogo sincronizado de planes disponibles para solicitud de cambio.
  * `invoices/{facturaId}`: Facturas emitidas para que el cliente las consulte al instante sin saturar PostgreSQL.
  * `payment_reports/{pagoId}`: Pagos reportados por el cliente desde el teléfono (referencia, banco, monto, capture/comprobante) en espera de conciliación.
  * `service_tickets/{ticketId}`: Averías reportadas por el cliente con chat de seguimiento y estado en vivo (*abierto*, *técnico en camino*, *resuelto*).
  * `notifications/{notifId}`: Alertas de mantenimiento preventivo y avisos de corte de fibra en sectores específicos.

---

## 3. MECANISMO DE SINCRONIZACIÓN Y FLUJO DE DATOS ("TODO SE CONECTA")

Para garantizar consistencia sin bloqueos ni escrituras concurrentes conflictivas, se establecen **reglas estrictas de propiedad de datos (Data Ownership)**:

### Flujo 1: Render (PostgreSQL) ➔ Firebase (Firestore) [Event-Driven]
1. **Alta o Modificación de Cliente / Plan / Factura:**
   * El operador en la Web registra o edita un cliente en PostgreSQL.
   * El servicio de backend emite un evento `SYNC_CUSTOMER_TO_FIREBASE`.
   * Se crea/actualiza el documento en Firestore `customers/{clienteId}`.
2. **Actualización de Estado de Ticket o Avería:**
   * Un técnico resuelve una avería y cambia el estado en la Web.
   * El webhook interno actualiza el estado en Firestore; el cliente en la app móvil recibe inmediatamente una notificación en tiempo real.

### Flujo 2: Firebase (Firestore) ➔ Render (PostgreSQL) [Ingest & Reconcile]
1. **Reporte de Pago desde la App Móvil:**
   * El cliente realiza un Pago Móvil C2P o transferencia y registra los datos en la App Móvil (escritura en Firestore `payment_reports`).
   * El backend procesa el reporte mediante el validador bancario (`src/payments/c2p.js`), verifica la referencia y actualiza la factura en PostgreSQL como pagada.
   * Posteriormente, el backend confirma en Firestore que el pago fue aprobado y actualiza el saldo del cliente a 0.
2. **Apertura de Avería / Ticket desde la App:**
   * El cliente reporta que no tiene internet desde la app (Firestore).
   * El sincronizador inserta el ticket en PostgreSQL (`tickets`) para que aparezca en la bandeja de entrada del personal técnico en la Web.

---

## 4. ADAPTACIÓN DE LA CONSOLA WEB (`web/`) A POSTGRESQL EN RENDER

Para desacoplar la Web del SQLite local previo y conectarla al PostgreSQL de Render:
1. Las rutas de la consola web (`/api/admin/clientes`, `/api/admin/planes`, `/api/admin/inventario`, `/api/admin/cajas-nap`) se comunican con el backend central Express en Render.
2. Las entidades de Cajas NAP e inventario se incorporan formalmente al esquema relacional de PostgreSQL (mediante una migración dedicada `004_cajas_nap_inventario.sql`).
3. La interfaz web conserva el 100% de sus funcionalidades visuales: mapa Leaflet, formularios de carga, asignación de puertos y cierres de caja.

---

## 5. PLAN DE SEGURIDAD Y AISLAMIENTO DE CREDENCIALES

* **Credenciales de Firebase Admin SDK:** Se almacenan exclusivamente en las variables de entorno seguras de Render (`FIREBASE_SERVICE_ACCOUNT_KEY` o variables de proyecto) y nunca se envían al frontend.
* **Reglas de Seguridad de Firestore (`firestore.rules`):**
  * Cada cliente solo puede leer su propio documento (`request.auth.uid == resource.data.authUid`).
  * Los clientes pueden crear pagos y tickets solo con su propio identificador.
  * Solamente el backend autenticado con Firebase Admin tiene permisos de modificación global.
* **CORS y Rate Limiting:**
  * Dominios autorizados para la Web: la URL de despliegue en Render y los orígenes locales de desarrollo.
