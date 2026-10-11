/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import AdminPanel, { type StaffAccount } from './AdminPanel';
import ClientPortal from './ClientPortal';
import ClientPayment from './ClientPayment';
import './index.css';

interface AuthUser {
  usuario: string;
  nombre: string;
  rol: 'dueño' | 'admin' | 'tecnico';
}

const serviceHighlights = [
  {
    title: 'Instalación FTTH',
    text: 'Cable drop, ONT, prueba de potencia óptica y activación de servicio para hogares y negocios.'
  },
  {
    title: 'Soporte técnico',
    text: 'Diagnóstico de conexión, despliegue de fibra, revisión de NAP, caja de distribución y cortes de servicio.'
  },
  {
    title: 'Cobranza y pagos',
    text: 'Validación de pago móvil, control de deuda, seguimiento de factura y cierre de caja en oficina.'
  },
  {
    title: 'Operación ISP',
    text: 'Inventario de materiales, reportes de averías, gestión de plan y control técnico del operador.'
  }
];

const fiberSteps = [
  'Registro del cliente y validación del plan',
  'Instalación del enlace FTTH con pruebas de potencia',
  'Activación del servicio y atención tech support',
  'Cobranza, mantenimiento y seguimiento del cliente'
];

function PublicLandingPage({
  needsOwner,
  username,
  password,
  displayName,
  authError,
  isSubmitting,
  setUsername,
  setPassword,
  setDisplayName,
  onLogin,
  onCreateOwner
}: {
  needsOwner: boolean;
  username: string;
  password: string;
  displayName: string;
  authError: string;
  isSubmitting: boolean;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setDisplayName: (value: string) => void;
  onLogin: (e: React.FormEvent) => Promise<void>;
  onCreateOwner: (e: React.FormEvent) => Promise<void>;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-black tracking-tight text-cyan-300">Cable Tartak</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Fibra óptica • Venezuela</div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a href="/cliente" className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-semibold text-cyan-200 hover:bg-cyan-500/20">Cliente</a>
            <a href="/pago" className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-200 hover:bg-emerald-500/20">Pago móvil</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
              ISP FTTH en operación
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">
              Conectividad fibra óptica con control total de operaciones y atención al cliente.
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-300 md:text-lg">
              Sistema pensado para operadores venezolanos: instalación, soporte técnico, cobranza, gestión de planes, inventario, cajas NAP, pagos móviles y coordinación en campo.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/cliente" className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400">Solicitar servicio</a>
              <a href="#admin-access" className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:border-slate-500 hover:bg-slate-800">Acceso administrativo</a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-300">
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2">Instalación FTTH</span>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2">Cobranza móvil</span>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2">Soporte y averías</span>
            </div>
          </div>

          <div id="admin-access" className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Acceso interno</p>
                <h2 className="mt-2 text-2xl font-black text-white">Panel administrativo</h2>
              </div>
              <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-cyan-200">
                {needsOwner ? 'Crear propietario' : 'Login'}
              </div>
            </div>

            <form onSubmit={needsOwner ? onCreateOwner : onLogin} className="space-y-4">
              {needsOwner && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Nombre completo</label>
                  <input type="text" placeholder="Nombre del propietario" value={displayName} onChange={event => setDisplayName(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" minLength={2} required />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Usuario</label>
                <input type="text" placeholder="usuario" value={username} onChange={event => setUsername(event.target.value.toLowerCase())} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" minLength={3} required />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Contraseña{needsOwner ? ' (mín. 10)' : ''}</label>
                <input type="password" placeholder="••••••••••" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" minLength={needsOwner ? 10 : undefined} required />
              </div>

              {authError && <p className="text-sm text-rose-400">{authError}</p>}

              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Procesando...' : needsOwner ? 'Crear propietario' : 'Entrar al panel'}
              </button>
            </form>
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {serviceHighlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-lg text-cyan-300">•</div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">Flujo operativo</p>
          <h2 className="mt-3 text-3xl font-black text-white">Cómo se estructura la operación FTTH</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {fiberSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-black text-emerald-300">0{index + 1}</div>
                <p className="text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Cobranza</p>
            <h3 className="mt-2 text-xl font-black text-white">Pagos móviles</h3>
            <p className="mt-2 text-sm text-slate-400">Recepción de comprobantes, validación del banco, referencia y monto antes de aprobar el pago o solicitar aclaratoria.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Técnico</p>
            <h3 className="mt-2 text-xl font-black text-white">Reparaciones en campo</h3>
            <p className="mt-2 text-sm text-slate-400">Control de averías, turno de trabajo, materiales utilizados y cierre de ticket con inventario descontado automáticamente.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Gestión</p>
            <h3 className="mt-2 text-xl font-black text-white">Planes y clientes</h3>
            <p className="mt-2 text-sm text-slate-400">Administración de clientes activos, nuevas solicitudes, contratos, planes de servicio y estados de deuda para cada sector.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [userRole, setUserRole] = useState<'dueño' | 'admin' | 'tecnico' | ''>('');
  const [userRealName, setUserRealName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [needsOwner, setNeedsOwner] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [displayName, setDisplayName] = useState('');

  const applyUser = (user: AuthUser) => {
    setUsername(user.usuario);
    setUserRole(user.rol);
    setUserRealName(user.nombre);
    setIsLogged(true);
  };

  const loadOwnerAccounts = async () => {
    const response = await fetch('/api/auth/accounts', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('No se pudieron cargar las cuentas autorizadas.');
    setAccounts(await response.json());
  };

  useEffect(() => {
    if (window.location.pathname === '/pago' || window.location.pathname === '/cliente') {
      setIsCheckingSession(false);
      return;
    }
    const restoreSession = async () => {
      try {
        const [statusResponse, sessionResponse] = await Promise.all([
          fetch('/api/auth/status', { credentials: 'same-origin' }),
          fetch('/api/auth/session', { credentials: 'same-origin' })
        ]);
        if (!statusResponse.ok) throw new Error('No se pudo consultar el servidor.');
        const status = await statusResponse.json();
        setNeedsOwner(Boolean(status.needsOwner));
        if (sessionResponse.ok) {
          const { user } = await sessionResponse.json();
          if (user) {
          applyUser(user);
          if (user.rol === 'dueño') await loadOwnerAccounts();
          }
        }
      } catch {
        setAuthError('No se pudo conectar con el servidor. Inicia la aplicación con npm run dev.');
      } finally {
        setIsCheckingSession(false);
      }
    };
    restoreSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username.trim(), clave: password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
      applyUser(data.user);
      setPassword('');
      if (data.user.rol === 'dueño') await loadOwnerAccounts();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');
    try {
      const response = await fetch('/api/auth/first-owner', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username.trim(), nombre: displayName.trim(), clave: password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la cuenta inicial.');
      applyUser(data.user);
      setPassword('');
      await loadOwnerAccounts();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async (account: StaffAccount): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/accounts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      const data = await response.json();
      if (!response.ok) return false;
      setAccounts(current => [...current, data]);
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdateAccount = async (id: number, updates: { nombre?: string; rol?: StaffAccount['rol']; activo?: boolean }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/accounts/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (!response.ok) return false;
      setAccounts(current => current.map(account => account.id === id ? data : account));
      return true;
    } catch {
      return false;
    }
  };

  const handleResetAccountPassword = async (id: number, nextPassword: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/accounts/${id}/password`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: nextPassword })
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleDeleteAccount = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/accounts/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!response.ok) return false;
      setAccounts(current => current.filter(account => account.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // La sesión del navegador se cierra aunque el servidor no responda.
    } finally {
      setIsLogged(false);
      setUserRole('');
      setUserRealName('');
      setAccounts([]);
      setUsername('');
      setPassword('');
    }
  };

  if (window.location.pathname === '/pago') return <ClientPayment />;
  if (window.location.pathname === '/cliente') return <ClientPortal />;

  if (isCheckingSession) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Conectando con Cable Tartak...</div>;
  }

  if (!isLogged) {
    return (
      <PublicLandingPage
        needsOwner={needsOwner}
        username={username}
        password={password}
        displayName={displayName}
        authError={authError}
        isSubmitting={isSubmitting}
        setUsername={setUsername}
        setPassword={setPassword}
        setDisplayName={setDisplayName}
        onLogin={handleLogin}
        onCreateOwner={handleCreateOwner}
      />
    );
  }

  return (
    <AdminPanel
      assignedRole={userRole}
      userRealName={userRealName}
      currentUsername={username}
      accounts={accounts}
      onCreateAccount={handleCreateAccount}
      onUpdateAccount={handleUpdateAccount}
      onResetAccountPassword={handleResetAccountPassword}
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout}
    />
  );
}
