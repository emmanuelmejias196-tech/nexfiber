import { useEffect, useState } from 'react';

interface ClientPlan {
  id: string;
  nombre: string;
  velocidad: string;
  precio: number;
  activo: boolean;
}

interface CoverageStatus {
  status: 'available' | 'saturated' | 'survey-required';
  message: string;
  boxes: Array<{ id: string; nombre: string; puertosLibres: number }>;
}

interface ClientAccount {
  cedula: string;
  nombre: string;
  plan: string;
  telefono: string;
  activado: boolean;
  mensualidadUsd: number;
  servicioActivo: boolean;
  estadoServicio: string;
  napId?: string;
  napNombre?: string;
  puertoNap?: number;
  serialOnt?: string;
  potenciaOpticaDbm?: number;
  esClientePrueba?: boolean;
}

type ClientAction = 'home' | 'installation' | 'failure' | 'account';
type AccountStep = 'verify' | 'activate' | 'login' | 'profile';

export default function ClientPortal() {
  const [action, setAction] = useState<ClientAction>('home');
  const [plans, setPlans] = useState<ClientPlan[]>([]);
  const [fullName, setFullName] = useState('');
  const [identity, setIdentity] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [sector, setSector] = useState('');
  const [planId, setPlanId] = useState('');
  const [problem, setProblem] = useState('');
  const [message, setMessage] = useState('');
  const [coverageStatus, setCoverageStatus] = useState<CoverageStatus | null>(null);
  const [isCheckingCoverage, setIsCheckingCoverage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountStep, setAccountStep] = useState<AccountStep>('verify');
  const [accountIdentity, setAccountIdentity] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountClient, setAccountClient] = useState<ClientAccount | null>(null);
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    fetch('/api/client/plans')
      .then(response => response.ok ? response.json() : [])
      .then((data: ClientPlan[]) => setPlans(data))
      .catch(() => setPlans([]));
  }, []);

  const checkCoverage = async () => {
    if (sector.trim().length < 2) return;
    setIsCheckingCoverage(true);
    try {
      const response = await fetch(`/api/client/coverage?sector=${encodeURIComponent(sector.trim())}`);
      const status: CoverageStatus = await response.json();
      setCoverageStatus(status);
    } catch {
      setCoverageStatus({ status: 'survey-required', message: 'No se pudo consultar la cobertura; la oficina deberá confirmarla.', boxes: [] });
    } finally {
      setIsCheckingCoverage(false);
    }
  };

  const verifyAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setAccountError('');
    try {
      const response = await fetch('/api/client/verify-contract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: accountIdentity.trim(), telefono: accountPhone.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron validar los datos del titular.');
      setAccountClient(data);
      setAccountStep(data.activado ? 'login' : 'activate');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'No se pudo verificar la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAccountPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setAccountError('');
    try {
      if (accountStep === 'activate' && accountPassword !== confirmPassword) throw new Error('Las contraseñas no coinciden.');
      const endpoint = accountStep === 'activate' ? '/api/client/activate-account' : '/api/client/login';
      const payload = accountStep === 'activate'
        ? { cedula: accountIdentity.trim(), telefono: accountPhone.trim(), clave: accountPassword }
        : { cedula: accountIdentity.trim(), clave: accountPassword };
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo acceder a la cuenta.');
      setAccountClient(data);
      setAccountStep('profile');
      setAccountPassword('');
      setConfirmPassword('');
      setAccountPhone('');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'No se pudo activar la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    const payload = action === 'installation'
      ? { nombre: fullName.trim(), cedula: identity.trim(), telefono: phone.trim(), direccion: address.trim(), sector: sector.trim(), plan: planId }
      : { cedula: identity.trim(), telefono: phone.trim(), sector: sector.trim(), detalle: problem.trim() };

    try {
      const response = await fetch(`/api/client/${action === 'installation' ? 'service-requests' : 'failures'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo enviar la solicitud.');
      setMessage(data.message || (action === 'installation'
        ? `Solicitud ${data.id} recibida. La oficina revisará los datos y se comunicará contigo.`
        : `Avería ${data.id} registrada. Guarda este número para consultar con la oficina.`));
      if (data.sectorIncident) {
        setProblem('');
        return;
      }
      setIdentity('');
      setPhone('');
      setProblem('');
      if (action === 'installation') {
        setFullName('');
        setAddress('');
        setSector('');
        setPlanId('');
        setCoverageStatus(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">NEXFIBER</a>
        <header className="mb-8 mt-8 border-b border-slate-800 pb-5">
          <p className="text-xs font-bold uppercase text-cyan-300">Atención al cliente</p>
          <h1 className="mt-2 text-3xl font-black">¿Qué necesitas resolver?</h1>
          <p className="mt-2 text-sm text-slate-400">Elige una gestión y la oficina dará seguimiento a tu solicitud.</p>
        </header>

        {message && (
          <div role="status" className="mb-6 border-l-4 border-cyan-400 bg-slate-900 px-4 py-3 text-sm text-slate-200">
            {message}
          </div>
        )}

        {action === 'home' ? (
          <div className="divide-y divide-slate-800 border-y border-slate-800">
            <button type="button" onClick={() => { setAction('installation'); setMessage(''); }} className="flex w-full items-center justify-between gap-4 py-5 text-left hover:bg-slate-900/70">
              <span>
                <span className="block font-bold">Solicitar una instalación</span>
                <span className="mt-1 block text-sm text-slate-400">Consulta planes y deja tus datos para contratar el servicio.</span>
              </span>
              <span aria-hidden="true" className="text-xl text-cyan-300">›</span>
            </button>
            <button type="button" onClick={() => { setAction('failure'); setMessage(''); }} className="flex w-full items-center justify-between gap-4 py-5 text-left hover:bg-slate-900/70">
              <span>
                <span className="block font-bold">Reportar una avería</span>
                <span className="mt-1 block text-sm text-slate-400">Informa un problema de conexión para que el equipo lo revise.</span>
              </span>
              <span aria-hidden="true" className="text-xl text-cyan-300">›</span>
            </button>
            <a href="/pago" className="flex w-full items-center justify-between gap-4 py-5 hover:bg-slate-900/70">
              <span>
                <span className="block font-bold">Reportar un Pago Móvil</span>
                <span className="mt-1 block text-sm text-slate-400">Envía referencia y comprobante para revisión manual.</span>
              </span>
              <span aria-hidden="true" className="text-xl text-cyan-300">›</span>
            </a>
            <button type="button" onClick={() => { setAction('account'); setAccountStep('verify'); setAccountError(''); setAccountClient(null); }} className="flex w-full items-center justify-between gap-4 py-5 text-left hover:bg-slate-900/70">
              <span>
                <span className="block font-bold">Activar mi cuenta</span>
                <span className="mt-1 block text-sm text-slate-400">Crea tu acceso con los datos registrados en la oficina.</span>
              </span>
              <span aria-hidden="true" className="text-xl text-cyan-300">›</span>
            </button>
          </div>
        ) : action === 'account' ? (
          <section>
            <button type="button" onClick={() => { setAction('home'); setAccountError(''); }} className="mb-5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">← Todas las opciones</button>
            <h2 className="mb-2 text-xl font-bold">Cuenta de servicio</h2>

            {accountStep === 'verify' && (
              <form onSubmit={verifyAccount} className="grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2">
                <p className="text-sm text-slate-400 sm:col-span-2">Valida tu identidad con la cédula y el teléfono que registraste con la oficina.</p>
                <label className="text-sm font-semibold">Cédula<input value={accountIdentity} onChange={event => setAccountIdentity(event.target.value.toUpperCase())} required maxLength={20} autoComplete="username" placeholder="V-12345678" className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 font-mono text-sm font-normal text-white" /></label>
                <label className="text-sm font-semibold">Teléfono registrado<input type="tel" value={accountPhone} onChange={event => setAccountPhone(event.target.value)} required maxLength={24} autoComplete="tel" className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white" /></label>
                {accountError && <p role="alert" className="text-sm text-rose-300 sm:col-span-2">{accountError}</p>}
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50 sm:col-span-2">{isSubmitting ? 'Verificando...' : 'Verificar datos'}</button>
              </form>
            )}

            {(accountStep === 'activate' || accountStep === 'login') && accountClient && (
              <form onSubmit={submitAccountPassword} className="mt-4 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="font-bold text-white">{accountClient.nombre}</p>
                  <p className="text-xs text-slate-400">{accountClient.cedula} · {accountClient.plan}</p>
                </div>
                <label className="text-sm font-semibold sm:col-span-2">{accountStep === 'activate' ? 'Crea una contraseña (mínimo 8 caracteres)' : 'Contraseña'}
                  <input type="password" value={accountPassword} onChange={event => setAccountPassword(event.target.value)} required minLength={8} maxLength={128} autoComplete={accountStep === 'activate' ? 'new-password' : 'current-password'} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white" />
                </label>
                {accountStep === 'activate' && <label className="text-sm font-semibold sm:col-span-2">Repite la contraseña<input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white" /></label>}
                {accountError && <p role="alert" className="text-sm text-rose-300 sm:col-span-2">{accountError}</p>}
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50 sm:col-span-2">{isSubmitting ? 'Procesando...' : accountStep === 'activate' ? 'Activar cuenta' : 'Iniciar sesión'}</button>
                {accountStep === 'login' && <button type="button" onClick={() => { setAccountStep('verify'); setAccountPassword(''); setAccountError(''); }} className="text-xs font-semibold text-cyan-300 sm:col-span-2">Volver a verificar titularidad</button>}
              </form>
            )}

            {accountStep === 'profile' && accountClient && (
              <div className="mt-4 border-t border-slate-800 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">Hola, {accountClient.nombre}</p>
                    <p className="mt-1 text-sm text-slate-400">{accountClient.cedula} · {accountClient.plan}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${accountClient.esClientePrueba ? 'bg-amber-500/10 text-amber-200' : accountClient.servicioActivo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                    {accountClient.esClientePrueba ? 'Cuenta de prueba' : `Servicio ${accountClient.estadoServicio}`}
                  </span>
                </div>
                {accountClient.esClientePrueba && <p className="mt-4 border border-amber-500/30 bg-amber-500/5 p-3 text-xs font-bold text-amber-200">Cuenta de prueba: no reportes pagos reales.</p>}
                <div className="mt-5 grid gap-3 border-y border-slate-800 py-4 text-sm sm:grid-cols-2">
                  <p className="text-slate-400">Mensualidad<span className="block font-bold text-white">${accountClient.mensualidadUsd.toFixed(2)} USD</span></p>
                  <p className="text-slate-400">Equipo ONT<span className="block font-mono text-white">{accountClient.serialOnt || 'Pendiente de instalación'}</span></p>
                  <p className="text-slate-400">Caja NAP<span className="block text-white">{accountClient.napId ? `${accountClient.napNombre || accountClient.napId} · Puerto ${accountClient.puertoNap || '?'}` : 'Pendiente de asignación'}</span></p>
                  <p className="text-slate-400">Última potencia óptica<span className="block text-white">{typeof accountClient.potenciaOpticaDbm === 'number' ? `${accountClient.potenciaOpticaDbm} dBm` : 'Sin medición registrada'}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="/pago" className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Reportar pago móvil</a>
                  <button type="button" onClick={() => { setAccountClient(null); setAccountStep('verify'); setAccountPassword(''); setAccountIdentity(''); setAccountError(''); }} className="rounded-md border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900">Cerrar sesión</button>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section>
            <button type="button" onClick={() => { setAction('home'); setMessage(''); }} className="mb-5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">← Todas las opciones</button>
            <h2 className="mb-5 text-xl font-bold">{action === 'installation' ? 'Solicitud de instalación' : 'Reporte de avería'}</h2>
            <form onSubmit={submitRequest} className="grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2">
              {action === 'installation' && (
                <label className="block text-sm font-semibold sm:col-span-2">
                  Nombre completo
                  <input value={fullName} onChange={event => setFullName(event.target.value)} required minLength={2} maxLength={120} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white focus:border-cyan-400 focus:outline-none" />
                </label>
              )}
              <label className="block text-sm font-semibold">
                Cédula
                <input value={identity} onChange={event => setIdentity(event.target.value)} required maxLength={20} autoComplete="off" placeholder="V-12345678" className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white focus:border-cyan-400 focus:outline-none" />
              </label>
              <label className="block text-sm font-semibold">
                Teléfono de contacto
                <input type="tel" value={phone} onChange={event => setPhone(event.target.value)} required maxLength={24} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white focus:border-cyan-400 focus:outline-none" />
              </label>
              {action === 'installation' ? (
                <>
                  <label className="block text-sm font-semibold sm:col-span-2">
                    Dirección de instalación
                    <input value={address} onChange={event => setAddress(event.target.value)} required maxLength={240} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white focus:border-cyan-400 focus:outline-none" />
                  </label>
                  <label className="block text-sm font-semibold">
                    Sector o zona
                    <input value={sector} onChange={event => { setSector(event.target.value); setCoverageStatus(null); }} onBlur={() => { if (sector.trim().length >= 2) void checkCoverage(); }} required maxLength={120} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white focus:border-cyan-400 focus:outline-none" />
                    <button type="button" onClick={() => void checkCoverage()} disabled={isCheckingCoverage || sector.trim().length < 2} className="mt-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 disabled:opacity-50">
                      {isCheckingCoverage ? 'Consultando...' : 'Consultar disponibilidad'}
                    </button>
                    {coverageStatus && (
                      <span className={`mt-2 block text-xs font-medium ${coverageStatus.status === 'available' ? 'text-emerald-300' : coverageStatus.status === 'saturated' ? 'text-rose-300' : 'text-amber-300'}`}>
                        {coverageStatus.message}
                        {coverageStatus.boxes.length > 0 && <span className="block text-slate-500">{coverageStatus.boxes.map(box => `${box.id}: ${box.puertosLibres} libres`).join(' · ')}</span>}
                      </span>
                    )}
                  </label>
                  <label className="block text-sm font-semibold">
                    Plan solicitado
                    <select value={planId} onChange={event => setPlanId(event.target.value)} required className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none">
                      <option value="" disabled>Selecciona un plan</option>
                      {plans.filter(plan => plan.activo).map(plan => <option key={plan.id} value={plan.id}>{plan.nombre} · ${plan.precio}/mes</option>)}
                    </select>
                  </label>
                </>
              ) : (
                <label className="block text-sm font-semibold sm:col-span-2">
                  Describe el problema
                  <textarea value={problem} onChange={event => setProblem(event.target.value)} required minLength={10} maxLength={1000} rows={4} className="mt-1.5 w-full resize-y rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white focus:border-cyan-400 focus:outline-none" placeholder="¿Qué luces muestra el módem? ¿Cuándo comenzó?" />
                </label>
              )}
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-60 sm:col-span-2">
                {isSubmitting ? 'Enviando...' : action === 'installation' ? 'Enviar solicitud de instalación' : 'Enviar reporte de avería'}
              </button>
            </form>
          </section>
        )}

        <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
          Para consultar una solicitud, conserva el número que aparece al enviarla o comunícate con la oficina.
        </footer>
      </div>
    </main>
  );
}