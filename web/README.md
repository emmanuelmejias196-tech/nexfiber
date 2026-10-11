# Cable Tartak

## Requisitos

- Node.js 24 o superior (usa `node:sqlite`).
- npm.

## Desarrollo

```powershell
npm install
npm run dev
```

Abre la URL que indique Vite. La primera vez, crea el dueño principal desde la pantalla de inicio. No hay credenciales públicas predeterminadas. Desde Gestión de Personal, los dueños pueden crear cuentas, cambiar sus roles, activar o desactivar accesos, restablecer contraseñas y eliminar cuentas; el sistema protege la última cuenta de dueño activa.

La API se ejecuta junto a Vite. Los datos operativos y las cuentas se guardan en `data/cable-tartak.sqlite`; las contraseñas se almacenan con hash y las sesiones usan cookies HttpOnly.

Los clientes pueden abrir `/pago` para enviar referencia, monto e imagen del comprobante. El pago queda pendiente y un dueño o administrador lo revisa con el banco antes de aprobarlo; el portal no verifica transacciones bancarias automáticamente.

## Producción

```powershell
npm run build
npm start
```

El servidor sirve la web y la API desde el mismo origen. Para uso en varios dispositivos, despliega este proceso en un servidor accesible por el equipo y configura almacenamiento persistente para el archivo SQLite. Haz copias de seguridad periódicas de la base de datos. No uses el servidor de desarrollo de Vite como alojamiento público.

La base inicial incluye datos ficticios de demostración. El primer arranque crea esa base si aún no existe.

### Docker

```powershell
docker build -t cable-tartak .
docker run --name cable-tartak -p 3000:3000 -v cable-tartak-data:/app/data cable-tartak
```

En un proveedor público, monta un volumen persistente en `/app/data`, configura HTTPS y apunta el dominio al servicio. No montes secretos ni la base SQLite dentro de la imagen.

Para Render, el archivo `render.yaml` configura el contenedor, el health check y un disco persistente de 1 GB. En Render crea un Blueprint desde este repositorio, espera a que termine el despliegue y agrega el dominio en la configuración del servicio. El disco persistente de Render requiere un plan pago; sin él la base SQLite puede perderse al reiniciar.

Después del primer despliegue, abre el dominio y crea la cuenta del dueño. No compartas el dominio público hasta completar esa configuración y revisar el acceso HTTPS.

## Entrega final para cliente

Este repositorio ya está preparado como base de entrega para un proyecto ISP completo:

- dashboard de dueño/admin y técnico
- portal de atención al cliente
- registro y validación de pagos móviles
- gestión de clientes, planes, instalaciones y tickets
- estructura final para despliegue en Render

La documentación de entrega se encuentra en [docs/entrega-cliente.md](docs/entrega-cliente.md). El esqueleto para la app del cliente queda en [src/ClientAppShell.tsx](src/ClientAppShell.tsx).

> No se puede sincronizar directamente con repositorios externos de GitHub o Render desde este workspace sin tener acceso a esos repos remotos, pero la configuración del proyecto ya está alineada para que se conecte fácilmente a un repo de producción y a Render.

Las notificaciones push a una app móvil requieren integrar el proyecto Firebase y el cliente Android/iOS: guardar tokens de instalación autenticados y configurar credenciales del servidor en el proveedor de alojamiento. Esos componentes no están incluidos en este repositorio y las claves privadas nunca deben guardarse en el código.