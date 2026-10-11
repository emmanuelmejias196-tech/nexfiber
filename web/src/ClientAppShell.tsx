import { useMemo, useState } from 'react';

type ClientScreen = 'home' | 'install' | 'pay' | 'support';

export default function ClientAppShell() {
  const [screen, setScreen] = useState<ClientScreen>('home');
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');

  const statusText = useMemo(() => {
    switch (screen) {
      case 'install':
        return 'Solicitar instalación';
      case 'pay':
        return 'Pago móvil';
      case 'support':
        return 'Soporte técnico';
      default:
        return 'Portal del cliente';
    }
  }, [screen]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">NEXFIBER</p>
            <h1 className="mt-2 text-2xl font-black">App cliente</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-semibold">
            <button onClick={() => setScreen('home')} className={`rounded-xl px-3 py-2 ${screen === 'home' ? 'bg-cyan-600' : 'bg-slate-800'}`}>Inicio</button>
            <button onClick={() => setScreen('install')} className={`rounded-xl px-3 py-2 ${screen === 'install' ? 'bg-emerald-600' : 'bg-slate-800'}`}>Instalación</button>
            <button onClick={() => setScreen('pay')} className={`rounded-xl px-3 py-2 ${screen === 'pay' ? 'bg-blue-600' : 'bg-slate-800'}`}>Pago</button>
            <button onClick={() => setScreen('support')} className={`rounded-xl px-3 py-2 ${screen === 'support' ? 'bg-amber-600' : 'bg-slate-800'}`}>Soporte</button>
          </nav>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Módulo</p>
            <h2 className="mt-2 text-3xl font-black">{statusText}</h2>
            <p className="mt-3 max-w-xl text-sm text-slate-400">
              Esta vista es el punto de partida para la aplicación del cliente que se integrará con la web administrativa y la API central de NEXFIBER.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-300">
                Nombre
                <input value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0" placeholder="Juan Pérez" />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Cédula
                <input value={cedula} onChange={event => setCedula(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0" placeholder="V-12345678" />
              </label>
              <label className="block text-sm font-medium text-slate-300 sm:col-span-2">
                Teléfono
                <input value={phone} onChange={event => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0" placeholder="+58 412-1234567" />
              </label>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Sincronización</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Web administrativa</li>
              <li>• Portal del cliente</li>
              <li>• API central</li>
              <li>• App del cliente</li>
            </ul>
            <button className="mt-6 w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white">
              Conectar con el sistema central
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
