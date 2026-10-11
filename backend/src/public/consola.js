/* Consola de operacion Cable Tartak. Sin dependencias: solo fetch. */
'use strict';

const $ = (sel) => document.querySelector(sel);
const estado = { resultados: null, tipo: 'clientes' };

/** Texto seguro: siemprevia textContent, nunca innerHTML con datos del servidor. */
function celda(fila, valor, clase) {
  const td = document.createElement('td');
  if (clase) td.className = clase;
  if (valor === null || valor === undefined || valor === '') {
    td.textContent = '-';
    td.classList.add('vacio-celda');
  } else {
    td.textContent = String(valor);
  }
  fila.appendChild(td);
  return td;
}

function pill(valor) {
  const td = document.createElement('td');
  const span = document.createElement('span');
  const limpio = String(valor || '').replace(/[^a-zA-Z_]/g, '');
  span.className = `pill pill-${limpio}`;
  span.textContent = valor || '-';
  td.appendChild(span);
  return td;
}

function tabla(columnas, filas,icol) {
  const t = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  columnas.forEach((c) => {
    const th = document.createElement('th');
    th.textContent = c;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  t.appendChild(thead);

const tbody = document.createElement('tbody');
  filas.forEach((fila) => {
    const tr = document.createElement('tr');
    columnas.forEach((col, i) => {
      const clase = (icol && icol[i]) || '';
      if (clase === 'accion') {
        const td = document.createElement('td');
        const sel = document.createElement('select');
        ESTADOS_TICKET.forEach((estado) => {
          const op = document.createElement('option');
          op.value = estado;
          op.textContent = estado.replace(/_/g, ' ');
          if (fila.estado === estado) op.selected = true;
          sel.appendChild(op);
        });
        const btn = document.createElement('button');
        btn.textContent = 'Guardar';
        btn.className = 'accion-btn';
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            await api(`/consola/api/tickets/${encodeURIComponent(fila.codigo)}`, {
              method: 'PATCH',
              body: JSON.stringify({ estado: sel.value })
            });
            fila.estado = sel.value;
            btn.textContent = 'Guardado';
            setTimeout(() => {
              btn.textContent = 'Guardar';
              btn.disabled = false;
            }, 1200);
          } catch (err) {
            btn.textContent = 'Error';
            btn.disabled = false;
            alert(err.message);
          }
        });
        td.appendChild(sel);
        td.appendChild(btn);
        tr.appendChild(td);
      } else if (clase === 'pill') tr.appendChild(pill(fila[col]));
      else celda(tr, fila[col], clase);
    });
    tbody.appendChild(tr);
  });
  t.appendChild(tbody);
  return t;
}

function seccion(titulo, elemento, tipo) {
  const h = document.createElement('h2');
  h.className = 'seccion';
  h.textContent = titulo;
  h.dataset.tipo = tipo;
  const frag = document.createDocumentFragment();
  frag.appendChild(h);
  frag.appendChild(elemento);
  return frag;
}

/** Estados del ciclo de vida de un ticket. Deben coincidir con ticket.service.js */
const ESTADOS_TICKET = [
  'Registrado',
  'Asignado',
  'En Proceso',
  'En Conciliacion',
  'Resuelto',
  'Cerrado',
'Cancelado'
];

function dinero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '-';
}

function fecha(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('es-VE');
}

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  });
  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }
  if (!respuesta.ok) {
    const err = new Error((cuerpo && cuerpo.mensaje) || `Error ${respuesta.status}`);
    err.estado = respuesta.status;
    throw err;
  }
  return cuerpo;
}

function pintarResumen(datos) {
  const cont = $('#resumen');
  cont.textContent = '';
  const tarjetas = [
    { valor: datos.clientes.total, rotulo: 'Clientes' },
    { valor: datos.solicitudesPendientes, rotulo: 'Solicitudes pendientes' },
    { valor: datos.pagosHoy[0].total, rotulo: 'Pagos hoy' },
    { valor: `$${Number(datos.pagosHoy[0].total_bs || 0).toFixed(2)}`, rotulo: 'Bs cobrados hoy' }
  ];
  (datos.ticketsPorEstado || []).forEach((t) => {
    tarjetas.push({ valor: t.total, rotulo: `Tickets ${t.estado.replace(/_/g, ' ')}` });
  });
  tarjetas.forEach((t) => {
    const div = document.createElement('div');
    div.className = 'tarjeta';
    const v = document.createElement('div');
    v.className = 'valor';
    v.textContent = t.valor;
    const r = document.createElement('div');
    r.className = 'rotulo';
    r.textContent = t.rotulo;
    div.appendChild(v);
    div.appendChild(r);
    cont.appendChild(div);
  });
}

function pintarResultado(busqueda) {
  estado.resultados = busqueda.resultados;
  const cont = $('#resultados');
  cont.textContent = '';

  const r = busqueda.resultados;
  const total = busqueda.total;
  if (total === 0) {
    const v = document.createElement('div');
    v.className = 'vacio';
    v.textContent = `Sin resultados para "${busqueda.consulta}".`;
    cont.appendChild(v);
  } else {
    if (r.clientes.length) {
      cont.appendChild(
        seccion(
          `Clientes (${r.clientes.length})`,
          tabla(
            ['Cedula', 'Nombre', 'Plan', 'Estado', 'Fibra', 'Mensualidad', 'Saldo', 'Telefono', 'Direccion'],
            r.clientes.map((c) => ({
              cedula: c.cedula,
              nombre: c.nombre,
              plan: c.plan,
              estado: c.activado ? 'Activado' : 'Desactivado',
              fibra: c.estadoFibra,
              mensualidad: dinero(c.mensualidadUsd),
              saldo: dinero(c.saldoPendienteUsd),
              telefono: c.telefono,
              direccion: c.direccion
            })),
            ['mono', '', '', 'pill', '', '', '', '', '']
          ),
          'clientes'
        )
      );
    }
if (r.tickets.length) {
      cont.appendChild(
        seccion(
          `Tickets (${r.tickets.length})`,
          tabla(
            ['Codigo', 'Cedula', 'Tipo', 'Categoria', 'Detalle', 'Estado', 'Nota tecnica', 'Creado', 'Accion'],
            r.tickets.map((t) => ({ ...t, accion: t.codigo })),
            ['mono', 'mono', '', '', '', 'pill', '', '', 'accion']
          ),
          'tickets'
        )
      );
    }
    if (r.pagos.length) {
      cont.appendChild(
        seccion(
          `Pagos C2P (${r.pagos.length})`,
          tabla(
            ['Referencia', 'Cedula', 'Banco', 'Transaccion', 'Monto Bs', 'Estado', 'Cod. banco', 'Fecha'],
            r.pagos.map((p) => ({ ...p, monto: Number(p.montoBs).toFixed(2) })),
            ['mono', 'mono', '', 'mono', '', 'pill', 'mono', '']
          ),
          'pagos'
        )
      );
    }
    if (r.solicitudes.length) {
      cont.appendChild(
        seccion(
          `Solicitudes de plan (${r.solicitudes.length})`,
          tabla(
            ['ID', 'Cedula', 'Plan actual', 'Plan nuevo', 'Monto', 'Estado', 'Nota', 'Creado'],
            r.solicitudes,
            ['', 'mono', '', '', '', 'pill', '', '']
          ),
          'solicitudes'
        )
      );
    }
    if (r.facturas.length) {
      cont.appendChild(
        seccion(
          `Facturas (${r.facturas.length})`,
          tabla(
            ['ID', 'Periodo', 'Monto', 'Estado', 'Pagada', 'PDF'],
            r.facturas.map((f) => ({ ...f, monto: dinero(f.montoUsd) })),
            ['', '', '', 'pill', '', '']
          ),
          'facturas'
        )
      );
    }
  }

  $('#filtros').hidden = total === 0;
  $('#pista').textContent = `${total} coincidencia(s) para "${busqueda.consulta}".`;
}

async function buscar() {
  const q = $('#q').value.trim();
  if (q.length < 2) {
    $('#pista').textContent = 'Escribe al menos 2 caracteres.';
    return;
  }
  $('#pista').textContent = 'Buscando...';
  try {
    pintarResultado(await api(`/consola/api/buscar?q=${encodeURIComponent(q)}&limite=50`));
  } catch (err) {
    $('#pista').textContent = err.message;
  }
}

function mostrarApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;
  api('/consola/api/resumen').then(pintarResumen).catch(() => {});
  $('#q').focus();
}

$('#login-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const error = $('#login-error');
  error.hidden = true;
  try {
    await api('/consola/login', {
      method: 'POST',
      body: JSON.stringify({ clave: $('#clave').value })
    });
    $('#clave').value = '';
    mostrarApp();
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
  }
});

$('#salir').addEventListener('click', async () => {
  await api('/consola/logout', { method: 'POST' }).catch(() => {});
  location.reload();
});

$('#form-buscar').addEventListener('submit', (ev) => {
  ev.preventDefault();
  buscar();
});

$('#filtros').addEventListener('click', (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#filtros button').forEach((b) => b.classList.remove('activo'));
  btn.classList.add('activo');
  const tipo = btn.dataset.tipo;
  document.querySelectorAll('.seccion').forEach((h) => {
    h.nextElementSibling.style.display = h.dataset.tipo === tipo ? '' : 'none';
  });
});

setInterval(() => {
  $('#reloj').textContent = new Date().toLocaleString('es-VE');
}, 1000);

api('/consola/sesion')
  .then((s) => {
    if (s.success) mostrarApp();
    else if (!s.habilitada) $('#login-error').textContent = 'Consola deshabilitada: falta ADMIN_API_KEY en el servidor.';
  })
  .catch(() => {});

