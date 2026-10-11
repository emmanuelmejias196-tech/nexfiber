# AUDITORÍA INICIAL — PROYECTO NEXFIBER
**Consolidación y Auditoría Técnica de los Tres Proyectos Preexistentes**  
**Fecha de Auditoría:** 11 de Octubre de 2026  
**Estado:** Completado (Fase 1) — Operación de Solo Lectura / Sin Modificaciones Destructivas

---

## 1. RESUMEN EJECUTIVO Y LOCALIZACIÓN DE LOS PROYECTOS

Se ha realizado una inspección exhaustiva de los tres proyectos ubicados en el entorno de trabajo del usuario. Se confirmó la correspondencia física de cada proyecto sin suposiciones ni alteraciones en los entornos de producción:

| Proyecto | Carpeta Física Local | Nombre / Marca Original | Rol Funcional Principal |
| :--- | :--- | :--- | :--- |
| **Proyecto 1** | `C:\Users\Admin\OneDrive\Desktop\cable tartak web` | **Cable Tartak Web** | Consola Web Administrativa ISP (Backoffice), Gestión de Cajas NAP/Fibra, Inventario, y Portal Web de Autoservicio de Clientes. |
| **Proyecto 2** | `C:\Users\Admin\OneDrive\Desktop\cable-tartak` | **Cable Tartak (Mobile & Core API)** | Aplicación Android Nativa para Clientes (Kotlin + Compose) + API Central Node/Express + PostgreSQL desplegado en Render. |
| **Proyecto 3** | `C:\Users\Admin\OneDrive\Desktop\virgen-del-valle` | **Playa Buche — Inversiones Virgen del Valle** | Plataforma Web/PWA/Capacitor con arquitectura en Firebase (Firestore, Auth, Storage) y backend Express complementario en PostgreSQL. |

> [!NOTE]
> En el escritorio existían además las carpetas `cable-tartak-api` (un servidor mockup preliminar en memoria) y `app` (módulo Android espejo de `cable-tartak/app`). La base de código maestro integral del Proyecto 2 se encuentra consolidada en `cable-tartak` (el espacio de trabajo actual).

---

## 2. INVENTARIO DETALLADO DE TECNOLOGÍAS POR PROYECTO

### 2.1. Proyecto 1: Cable Tartak Web (`cable tartak web`)
* **Propósito:** Panel administrativo de ISP y portal de autoservicio web para clientes.
* **Frontend:**
  * Framework: React 18.3.1 con Vite 5.3.1 y TypeScript 5.2.2.
  * Estilos: Tailwind CSS v4.3.3.
  * Componentes Clave: Lucide React (iconografía), Leaflet 1.9.4 & React-Leaflet 4.2.1 (mapeo georreferenciado de infraestructura de fibra y cajas NAP), XLSX 0.18.5 (exportación a Excel).
* **Backend:**
  * Motor: Servidor HTTP nativo en Node.js 24 (`node:http`, `node:crypto`, `node:sqlite`), sin framework Express externo.
  * Arquitectura: `server/index.mjs` (enrutamiento manual y handlers) y `server/integrations.mjs` (conectores para software de gestión ISP).
* **Base de Datos y Almacenamiento:**
  * Motor: SQLite nativo (`node:sqlite`) con archivo persistente en `./data/cable-tartak.sqlite` (modo `WAL` activado).
  * Modelo de Datos: Híbrido relacional/documental. Tablas relacionales para autenticación (`users`, `sessions`, `client_credentials`) y una tabla almacén documental tipo clave-valor (`records`) para colecciones operativas (`clientes`, `planes`, `cajas_nap`, `inventario`, etc.).
* **Despliegue y Configuración:**
  * Dockerfile optimizado multi-stage (`node:24-bookworm-slim`).
  * `render.yaml` configurado con servicio web Docker (plan Starter en Oregon) con disco persistente montado en `/app/data` (1 GB).
* **Control de Versiones:**
  * **Sin inicializar en Git** (no existe carpeta `.git`).

### 2.2. Proyecto 2: Cable Tartak Core & Android (`cable-tartak`)
* **Propósito:** Sistema central de backend del ISP con procesamiento de pagos bancarios C2P y aplicación móvil Android nativa para clientes.
* **Frontend Móvil (Android):**
  * Lenguaje: Kotlin con Jetpack Compose.
  * Arquitectura: MVVM + Repository Pattern.
  * Persistencia Local: Room Database (cifrado local de sesión y credenciales).
  * Red: Retrofit 2 + OkHttp 3 con interceptores de autenticación Bearer JWT.
  * Compilación: Gradle Kotlin DSL (`build.gradle.kts`), SDK 36.
  * Id de Aplicación: `com.aistudio.cabletartak.vzapp`.
* **Backend (API):**
  * Framework: Node.js (>=20) con Express 4.21.2.
  * Seguridad y Utilidades: Helmet 8.0, CORS 2.8.5, Zod 3.24.1 (validación estricta de esquemas), Bcryptjs 2.4.3 (hash de contraseñas coste 12), JsonWebToken 9.0.2 (access tokens y refresh tokens con rotación), Compression, Express-Rate-Limit 7.5.0.
  * Módulo Especializado: `c2p-pago-movil.js` y `src/payments/c2p.js` para validación y conciliación de Pago Móvil interbancario C2P venezolano.
* **Base de Datos:**
  * Motor: **PostgreSQL 16** desplegado en **Render** (`cable-tartak-db`, región Frankfurt).
  * Conexión: `pg` Pool (PostgreSQL nativo con soporte SSL autofirmado de Render).
  * Esquema: Modelo relacional normalizado con claves foráneas, índices y migraciones SQL secuenciales en `database/migrations/`.
* **Despliegue y Configuración:**
  * `render.yaml` tipo monorepositorio con servicio web Node (`cable-tartak-api`) y base de datos gestionada (`cable-tartak-db`).
* **Control de Versiones:**
  * Repositorio Git local existente, pero **sin repositorios remotos configurados** (`git remote -v` vacío). Existen archivos locales pendientes de commit (staged/unstaged).

### 2.3. Proyecto 3: Virgen del Valle / Playa Buche (`virgen-del-valle`)
* **Propósito:** Plataforma operativa multi-rol (POS, comandera, cocina KDS, inventario, excursiones y caja) y aplicación móvil PWA/Capacitor.
* **Frontend:**
  * Framework: React 19 + Vite + TypeScript.
  * Capa Móvil: Capacitor (generación de APK/AAB y sincronización nativa).
  * PWA: Service Workers con Workbox y manifiesto PWA.
* **Servicios de Backend y Cloud (Firebase & PostgreSQL):**
  * **Firebase Authentication:** Login de personal y clientes con email/password, tokens de sesión y gestión de roles.
  * **Cloud Firestore:** Base de datos NoSQL documental en tiempo real (`playa-buche-pos`), con sincronización reactiva vía `onSnapshot` para actualización instantánea de comandas, estados y stock.
  * **Firebase Storage:** Bucket configurado (`playa-buche-pos.firebasestorage.app`).
  * **Firebase Hosting:** Configurado en `firebase.json` con rewrites para SPA.
  * **Servidor Node/Express Secundario:** Ubicado en `server/index.js`, con conexión PostgreSQL en Render (`server/db.js`), migraciones (`server/migrate.js`) e integración de IA con Google GenAI SDK (`@google/genai`).
* **Despliegue:**
  * `render.yaml` con servicio web `virgen-del-valle-api` y sitio estático `virgen-del-valle-web` (región Virginia).
* **Control de Versiones:**
  * Repositorio Git vinculado a cuenta remota anterior: `https://github.com/oscar12198512-ui/virgen-del-valle.git` (rama `main`).

---

## 3. MAPA DE BASES DE DATOS Y ENTIDADES

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               MAPA DE DATOS NEXFIBER                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ PROYECTO 1: SQLite ]               [ PROYECTO 2: PostgreSQL (Render) ]     [ PROYECTO 3: Firestore + PG ]
  (cable tartak web)                   (cable-tartak core)                     (virgen-del-valle)
  • users (staff/auth)                 • clientes                              • app_users (Firebase Auth)
  • sessions                           • planes                                • menu_items / spots
  • client_credentials                 • facturas                              • orders (Firestore en vivo)
  • records (JSON document store):     • pagos_c2p                             • audit_logs
    - clientes                         • tickets (fallas/soporte)              • arena_supplies (inventario)
    - cajas_nap (fibra óptica)         • codigos_activacion                    • PostgreSQL en Render:
    - inventario_materiales            • refresh_tokens                          - app_users
    - despachos                        • solicitudes_cambio_plan                 - app_state / flags
    - cierres_caja                     • auditoria
```

### Análisis de Entidades y Coincidencias entre Proyectos:
1. **Clientes y Usuarios:**
   * **Proyecto 1** maneja usuarios administrativos (`dueño`, `admin`, `tecnico`) en tabla relacional `users`, y datos de clientes en `client_credentials` y el documento `records:clientes`.
   * **Proyecto 2** posee la estructura más robusta y segura de clientes en PostgreSQL (`clientes`: cédula normalizada, teléfono, correo, dirección, sector, estado, IP asignada, MAC de ONT, saldo pendiente, plan_id con FK a `planes`).
   * **Proyecto 3** maneja usuarios mediante Firebase Auth UID y documentos en `app_users` (Firestore).
2. **Planes de Internet y Catálogos:**
   * **Proyecto 1** define planes en documentos JSON (`PlanInternet`: megas, precio en dólares, precio en bolívares, tipo).
   * **Proyecto 2** define planes como tabla relacional primaria (`planes`: id, código, nombre, velocidad_mbps, precio_usd, precio_bs, activo).
3. **Facturación, Pagos y Conciliación:**
   * **Proyecto 1** registra pagos reportados en la tabla `records` y cierres de caja diarios para oficina.
   * **Proyecto 2** implementa el flujo transaccional bancario completo en PostgreSQL: `facturas` mensuales por cliente y `pagos_c2p` (con teléfono pagador, referencia, banco emisor, tasa oficial BCV, validación de código de aprobación).
4. **Infraestructura de Red (NAP, Fibra e Inventario):**
   * **Solo existe en Proyecto 1 (`cable tartak web`):** Este proyecto contiene la lógica especializada de fibra óptica: cajas NAP, puertos libres/ocupados, coordenadas geográficas en mapa interactivo Leaflet, despachos de bobinas de cable drop y conectores a técnicos en calle.
5. **Comandas, Pedidos y Tiempo Real:**
   * **Solo existe en Proyecto 3 (`virgen-del-valle`):** Lógica reactiva de pedidos en tiempo real con Firestore y sincronización PWA offline-first.

---

## 4. INVENTARIO DE FUNCIONALIDADES EXISTENTES

### En Proyecto 1 (`cable tartak web`):
- [x] Autenticación administrativa local con roles (`dueño`, `admin`, `tecnico`) y protección de la última cuenta de dueño.
- [x] Portal de autoservicio web para clientes (verificación por cédula, consulta de contrato, reporte de pagos y fallas).
- [x] Gestión visual de Cajas NAP con asignación de puertos por cliente y mapa interactivo con Leaflet.
- [x] Control de inventario físico (routers, bobinas, conectores) y módulo de despacho de materiales a técnicos.
- [x] Cierre de caja diaria con balance en efectivo USD, Bolívares y métodos digitales.
- [x] Conectores de integración con software externo ISP (WispHub, WispGo, MacroWisp, DoWisp, ISP Gestión) en `integrations.mjs`.

### En Proyecto 2 (`cable-tartak`):
- [x] Aplicación nativa Android (Jetpack Compose) completa para clientes con diseño moderno.
- [x] Autenticación robusta de clientes mediante cédula y PIN/contraseña con hashing Bcrypt (coste 12).
- [x] Manejo de sesiones JWT con Access Tokens (1800s) y Refresh Tokens revocables con rotación.
- [x] Activación guiada de cuentas de clientes nuevos mediante código de validación.
- [x] Consulta de estado de cuenta, facturas pendientes y desglose de consumo del plan.
- [x] Módulo transaccional de Pago Móvil interbancario C2P con cálculo automático según tasa BCV.
- [x] Sistema formal de tickets de soporte y fallas técnicas con historial de estados y asignación.
- [x] Middleware estricto de Rate Limiting por IP (global, autenticación y escritura) y sanitización Zod.
- [x] Registro estructurado de auditoría transaccional en PostgreSQL.
- [x] Suite de pruebas automatizadas con `node --test`, `supertest` y `pg-mem`.

### En Proyecto 3 (`virgen-del-valle`):
- [x] Aplicación React 19 compilada como PWA instalable y empaquetada como APK/AAB con Capacitor.
- [x] Autenticación delegada en Firebase Authentication.
- [x] Sincronización en vivo de estado y pedidos usando Cloud Firestore (`onSnapshot`).
- [x] Conversión y cálculo dinámico multimoneda (USD / Bolívares a tasa oficial BCV).
- [x] Registro de auditoría de acciones de usuarios en Firestore.
- [x] Arquitectura de doble backend: soporte para Firestore y para PostgreSQL en Render.

---

## 5. ERRORES DETECTADOS Y RIESGOS TÉCNICOS

### 5.1. Riesgos de Seguridad y Secretos
1. **Credenciales de Firebase expuestas en código y repositorio:**
   * En `virgen-del-valle/src/config/firebase.ts`, `scripts/seed-firebase.mjs` y `render.yaml` se encuentran hardcodeadas API Keys y App IDs del proyecto Firebase `playa-buche-pos`.
   * En `virgen-del-valle/render.yaml` se exponen datos personales directos (nombre del propietario, teléfono y correo electrónico privado).
2. **Mockup inseguro con contraseñas en texto plano:**
   * En `cable-tartak-api/server.js` se encontraba la credencial predeterminada `tartak2026` para el usuario `enmanuel` sin hash.
3. **CORS demasiado permisivo:**
   * En `cable-tartak/backend/src/app.js` y `render.yaml`, `CORS_ORIGINS` está fijado por defecto en `*`. Esto es aceptable para la aplicación móvil, pero para consolas web requiere restricción por dominio.
4. **Falta de Git y control de versiones en Proyecto 1:**
   * `cable tartak web` no está versionado en Git, lo que expone el código a pérdidas accidentales o falta de trazabilidad.

### 5.2. Inconsistencias Arquitectónicas y Mantenimiento
1. **Fragmentación de la información de clientes:**
   * Existen dos representaciones de clientes y planes: una en el SQLite de `cable tartak web` (con datos no estructurados en JSON) y otra en el PostgreSQL de `cable-tartak` (con integridad referencial estricta). Si un cliente se registra en la web, actualmente no se refleja en la app móvil ni en la base de datos de Render.
2. **Dependencia de `node:sqlite` sin abstracción:**
   * `cable tartak web` depende de módulos recientes de Node 24 (`node:sqlite`). Aunque es rápido y ligero, requiere un volumen de disco persistente en Render (`sizeGB: 1`), el cual tiene un costo mensual en planes pagos o se destruye si el contenedor se reconstruye sin volumen montado.
3. **Diferencias de frameworks y dependencias:**
   * Proyecto 1 usa React 18 + Tailwind v4 + Vite.
   * Proyecto 2 usa Kotlin + Jetpack Compose para móvil y Express para backend.
   * Proyecto 3 usa React 19 + Tailwind + Vite + Firebase SDK.

---

## 6. DEPENDENCIAS ENTRE PROYECTOS Y PLAN DE INTEGRACIÓN

### Conexión Natural Identificada:
* El **Proyecto 2 (API central Express + PostgreSQL en Render)** debe ser la **Única Fuente de Verdad (Single Source of Truth - SSOT)** para todas las operaciones de telecomunicaciones e ISP de **NEXFIBER**:
  - Clientes, contratos, planes, facturas, tickets de soporte y pagos C2P.
* El **Proyecto 1 (`cable tartak web`)** debe transformarse en la **Consola Web Unificada de NEXFIBER (Backoffice + Portal Web)**:
  - Mantener sus módulos estelares (Mapeo de Cajas NAP con Leaflet, Gestión de Fibra Óptica, Inventario y Despachos a técnicos, Cierres de Caja de Oficina).
  - Conectar sus vistas de clientes, planes y facturas directamente a la API central de PostgreSQL de NEXFIBER en lugar de persistirlos aisladamente en SQLite.
* La **App Android de Proyecto 2 (`cable-tartak/app`)** se convertirá en la **App Móvil Oficial NEXFIBER para Clientes**:
  - Se conecta a la misma API central de PostgreSQL de NEXFIBER.
* El **Proyecto 3 (`virgen-del-valle`)**:
  - Aporta su experiencia probada en **PWA/Capacitor**, **sincronización reactiva con Firebase** y **automatización con Firebase Auth**.
  - Si el usuario requiere mantener el servicio gastronómico/turístico o convertirlo en un módulo de servicios complementarios bajo NEXFIBER, sus datos de Firebase deben aislarse en su propio contexto sin mezclarlos con las tablas troncales de telecomunicaciones del ISP.

---

## 7. FUNCIONES CRÍTICAS QUE DEBEN CONSERVARSE

1. **Gestión de Infraestructura de Fibra (NAP):** Mapeo con Leaflet, gestión de puertos libres/ocupados y georreferenciación (Proyecto 1).
2. **Logística e Inventario:** Control de bobinas, routers ONT y despacho de materiales a técnicos (Proyecto 1).
3. **Flujo de Pago Móvil Bancario C2P:** Validación de pagos móviles en tiempo real con tasa BCV y códigos de referencia (Proyecto 2).
4. **Experiencia Móvil Nativa Android:** App para clientes con Jetpack Compose, Room offline y gestión de tickets (Proyecto 2).
5. **Seguridad y Auditoría:** Sistema de roles, tokens revocables, esquemas Zod y tablas de auditoría en PostgreSQL (Proyecto 2).
6. **Capacidades Reactivas en Vivo:** Sincronización en tiempo real vía Firebase para notificaciones de incidencias y estado operativo (Proyecto 3).

---

## 8. PREGUNTAS Y ACCESOS REQUERIDOS AL USUARIO

Para proceder con las siguientes fases de integración y despliegue sin bloqueos:

1. **Nueva Cuenta de GitHub:**
   * ¿Cuál es el nombre de usuario de la nueva cuenta de GitHub donde publicaremos los repositorios de NEXFIBER?
2. **Estructura de Repositorio Preferida (Fase 2):**
   * ¿Prefieres un **Monorepositorio NEXFIBER** (que contenga `web/`, `mobile/`, `backend/`) o repositorios independientes interconectados por API? *(Nuestra recomendación técnica es un Monorepositorio limpio o estructura modular organizada).*
3. **Destino de la Base de Datos SQLite del Proyecto 1:**
   * ¿Deseas que unifiquemos la información de clientes y planes de SQLite para que se lean y escriban directamente en el PostgreSQL de Render de NEXFIBER, manteniendo SQLite únicamente como caché/fallback local?
4. **Alcance del Proyecto 3 (`virgen-del-valle`):**
   * ¿Deseas que este proyecto opere como un módulo independiente de servicios (por ejemplo, punto de venta o servicios de playa) dentro del ecosistema NEXFIBER, o conservamos su código en una rama/carpeta independiente?
5. **Credenciales y Secretos de Producción:**
   * Una vez autorizada la fase de despliegue, requeriremos configurar las variables en el panel de Render y Firebase Console sin subirlas a Git.

---
*Fin del informe de auditoría inicial — NEXFIBER Fase 1.*
