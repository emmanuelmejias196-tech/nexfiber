# Entrega final para cliente: Cable Tartak

## Estado del proyecto

Este repositorio ya queda preparado como base funcional para un entregable empresarial con:

- panel administrativo para dueño y admin
- panel técnico para gestión de fallas e instalaciones
- portal para atención al cliente
- flujo de pago móvil validado por personal
- base de datos SQLite local con sesiones y cuentas
- configuración lista para despliegue en Render

## Estructura principal

- [src/App.tsx](../src/App.tsx): pantalla de autenticación y enrutado principal
- [src/AdminPanel.tsx](../src/AdminPanel.tsx): dashboard administrativo completo
- [src/ClientPortal.tsx](../src/ClientPortal.tsx): portal para clientes
- [src/ClientPayment.tsx](../src/ClientPayment.tsx): formulario de pago móvil
- [server/index.mjs](../server/index.mjs): API principal con autenticación y almacenamiento
- [render.yaml](../render.yaml): configuración de despliegue para Render
- [Dockerfile](../Dockerfile): imagen de producción

## Integración con Render y GitHub

Este workspace no tiene acceso directo a los repositorios externos de GitHub o Render, por lo que no se pueden sincronizar los cambios desde aquí con esos repos remotos. Sin embargo, la configuración del proyecto ya quedó alineada para que se despliegue sin fricción desde un repositorio público o privado:

1. El proyecto compila con `npm run build`.
2. El Dockerfile y render.yaml están preparados para Render.
3. La API sirve la web desde el mismo origen.
4. La base de datos se guarda en un volumen persistente en /app/data.
5. El archivo .env.example deja lista la configuración de despliegue.

## Variables de entorno recomendadas

```env
PORT=3000
NODE_ENV=production
CABLE_TARTAK_DB=./data/cable-tartak.sqlite
VITE_API_BASE=/api/admin
CLIENT_APP_URL=https://tu-app-cliente.example.com
CLIENT_APP_API=https://tu-api-cliente.example.com
```

## Checklist para entregar al cliente

- [ ] Crear repositorio GitHub limpio con este proyecto
- [ ] Conectar el repositorio a Render utilizando render.yaml
- [ ] Montar volumen persistente para la base SQLite
- [ ] Configurar dominio HTTPS en Render
- [ ] Revisar permisos de usuarios dueño/admin/técnico
- [ ] Probar login y flujo de compras/pagos
- [ ] Hacer copia de seguridad de la base SQLite
- [ ] Preparar la app del cliente como proyecto separado con la misma API base

## Preparación de la app del cliente

La aplicación del cliente debe reutilizar la misma API del proyecto central para:

- consultar planes
- reportar pago móvil
- enviar solicitudes de instalación
- abrir tickets de soporte
- consultar estado de servicio

En este repositorio se dejo un esqueleto base en [src/ClientAppShell.tsx](../src/ClientAppShell.tsx) para iniciar esa app cliente y conectarla con la misma capa central.

## Recomendación final

Para la entrega real al cliente:

- mantener este proyecto como backend + dashboard administrativo
- crear un segundo proyecto para la app móvil/web del cliente
- conectar ambos con la misma base SQLite o con una API centralizada
- dejar el panel administrativo como responsable de aprobar pagos y solicitudes

## Siguiente paso recomendado

El siguiente bloque ideal es:

1. separar la app cliente en un repositorio propio
2. conectar a la api central con JWT o sesiones de cookie
3. implementar perfil del cliente, historial de pagos y estado del servicio
4. dejar el panel administrativo como punto de control final

## Confirmación de validación

Se verificó que el proyecto compila correctamente con:

```bash
npm run build
```

Resultado confirmado: compilación exitosa.
