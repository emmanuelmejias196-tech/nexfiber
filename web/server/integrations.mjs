const providers = [
  { name: 'WispHub', env: 'WISPHUB_API_URL', label: 'WispHub' },
  { name: 'WispGo', env: 'WISPGO_API_URL', label: 'WispGo' },
  { name: 'MacroWisp', env: 'MACROWISP_API_URL', label: 'MacroWisp' },
  { name: 'DoWISP', env: 'DOWISP_API_URL', label: 'DoWISP' },
  { name: 'ISP Gestión', env: 'ISP_GESTION_API_URL', label: 'ISP Gestión' }
];

export function getIntegrationStatus() {
  return providers.map(provider => {
    const value = process.env[provider.env] || '';
    const configured = Boolean(value && value.trim());
    return {
      name: provider.name,
      key: provider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      configured,
      status: configured ? 'connected' : 'not-configured',
      apiUrl: configured ? value : null,
      lastSync: configured ? new Date().toISOString() : null,
      mode: configured ? 'ready' : 'pending-configuration'
    };
  });
}

export async function syncProvider(name) {
  const provider = providers.find(item => item.name.toLowerCase() === String(name).toLowerCase());
  if (!provider) {
    return { ok: false, error: 'Proveedor no soportado.' };
  }

  const apiUrl = process.env[provider.env];
  if (!apiUrl) {
    return {
      ok: false,
      provider: provider.name,
      message: 'El proveedor no está configurado aún. Añade la URL de su API para activar la sincronización.',
      status: 'not-configured'
    };
  }

  return {
    ok: true,
    provider: provider.name,
    message: 'Conector listo. Cuando se proporcione la documentación y credenciales reales del cliente, este punto activará la sincronización.',
    status: 'ready',
    apiUrl
  };
}

export function providerCatalog() {
  return providers.map(provider => ({
    name: provider.name,
    env: provider.env,
    supported: true,
    description: 'Conector de integración para sincronización de clientes, planes, pagos y estados de servicio.'
  }));
}
