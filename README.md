# NEXFIBER — Plataforma Integral de Telecomunicaciones y Servicios

Solución tecnológica profesional bajo la marca **NEXFIBER**, diseñada para la gestión integral de proveedores de servicios de internet (ISP) por fibra óptica y ecosistemas de servicios conectados.

---

## 🏛️ Estructura del Monorepositorio

Este repositorio consolida en una arquitectura profesional y desacoplada los componentes del ecosistema NEXFIBER:

```
nexfiber/
├── web/                           # Consola Web Backoffice (React 18 + Vite + Leaflet)
│   ├── src/                       # Gestión de Cajas NAP, mapa de fibra, inventario y personal
│   ├── server/                    # Servidor web y conectores con software ISP
│   └── Dockerfile                 # Contenedor de producción para despliegue web
│
├── backend/                       # API Central Troncal (Node.js + Express)
│   ├── src/                       # Controladores, servicios, middleware (Zod, JWT, Rate Limiting)
│   ├── src/payments/              # Conciliación y validación de Pago Móvil bancario C2P
│   └── tests/                     # Suite de pruebas automatizadas
│
├── database/                      # Base de Datos Relacional PostgreSQL (Render)
│   ├── schema.sql                 # Esquema canónico de base de datos
│   └── migrations/                # Migraciones SQL versionadas
│
├── app/                           # Aplicación Móvil Android Nativa para Clientes
│   ├── src/main/java/             # Kotlin + Jetpack Compose + MVVM + Room
│   └── build.gradle.kts           # Configuración de compilación Android (SDK 36)
│
├── services/                      # Servicios Complementarios y Módulos de Extensión
│   └── pos-virgen-del-valle/      # Sistema POS / Comandera en tiempo real (Firebase Firestore & PWA)
│
└── docs/                          # Documentación Técnica y de Arquitectura
    ├── AUDITORIA_INICIAL.md       # Auditoría técnica completa de los tres proyectos
    ├── ARQUITECTURA_NEXFIBER.md   # Especificación de arquitectura y flujo de datos
    └── VARIABLES_DE_ENTORNO.md    # Guía de variables de entorno para Render y Firebase
```

---

## 🚀 Módulos y Capacidades Principales

### 1. Panel de Control y Operaciones ISP (`web/`)
- **Gestión de Fibra Óptica y Cajas NAP:** Mapeo georreferenciado e interactivo con Leaflet de puertos, splitters y cajas NAP de distribución.
- **Inventario Físico y Despachos:** Control de stock de bobinas de cable drop, routers ONT, conectores rápidos y despacho firmado a cuadrillas técnicas.
- **Personal y Roles:** Gestión de cuentas administrativas (`dueño`, `admin`, `tecnico`) con protección de la cuenta principal.
- **Cierre de Caja Diario:** Conciliación de caja en efectivo multimoneda (USD y Bolívares).
- **Conectores ISP Externos:** Compatibilidad de sincronización con WispHub, WispGo, MacroWisp, DoWisp e ISP Gestión.

### 2. Núcleo Backend y Pagos (`backend/` & `database/`)
- **Fuente Única de Verdad (SSOT):** Base de datos relacional PostgreSQL con integridad referencial estricta.
- **Pasarela de Pago Móvil C2P:** Procesamiento bancario directo de pagos móviles venezolanos con cálculo a tasa oficial del Banco Central de Venezuela (BCV).
- **Seguridad Robusta:** Autenticación JWT con rotación de refresh tokens, hash Bcrypt (coste 12), protección de encabezados con Helmet y limitación de peticiones (Rate Limiting) por IP.
- **Sistema de Tickets:** Flujo estructurado de soporte técnico para reporte y resolución de averías de clientes.

### 3. Aplicación Móvil para Clientes (`app/`)
- **Interfaz Moderna:** Desarrollada 100% en Kotlin con Jetpack Compose y Material Design 3.
- **Gestión de Autoservicio:** Consulta de consumo de ancho de banda, histórico de facturas, cambio de plan y reporte de averías con fotos.
- **Modo Desconectado:** Persistencia local cifrada con Android Room.

### 4. Módulo POS en Tiempo Real (`services/pos-virgen-del-valle/`)
- **Sincronización Reactiva:** Cloud Firestore con listeners `onSnapshot` para actualización instantánea de comandas y estado.
- **Multi-plataforma:** Web PWA instalable y ejecutable en Android mediante Capacitor.

---

## 🔒 Reglas de Seguridad y Configuración

1. **Gestión de Secretos:** Los archivos `.env` reales, certificados `.keystore`/`.jks` y credenciales privadas **nunca** se versionan en Git. Cada componente incluye su respectivo archivo `.env.example`.
2. **Entornos de Despliegue:**
   - **Render:** PostgreSQL gestionado (`database/`) y Web Service Node (`backend/` y `web/`).
   - **Firebase:** Proyecto Cloud Firestore y Authentication para el módulo reactivo en tiempo real.

---

## 📖 Documentación

Para consultar los detalles de la auditoría inicial de los proyectos y las especificaciones técnicas completas, revisa los documentos en la carpeta [`docs/`](file:///c:/Users/Admin/OneDrive/Desktop/cable-tartak/docs/):
- [docs/AUDITORIA_INICIAL.md](file:///c:/Users/Admin/OneDrive/Desktop/cable-tartak/docs/AUDITORIA_INICIAL.md)
