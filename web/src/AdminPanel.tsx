// =========================================================================
// PROYECTO 2: PANEL DE CONTROL MULTI-ROL (DUEÑO, ADMIN, TÉCNICO) - REACT
// CABLE TARTAK WEB - PLATAFORMA DE GESTIÓN ISP FIBRA ÓPTICA (FTTH)
// =========================================================================
import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import {
  Users,
  Wrench,
  BarChart3,
  LogOut,
  Wifi,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Server,
  Activity,
  Phone,
  MapPin,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Zap,
  UserCheck,
  CreditCard,
  DollarSign,
  Receipt,
  FileText,
  Edit3,
  Trash2,
  Layers,
  Tag,
  Sliders,
  Download,
  Smartphone,
  Send,
  Bell,
  FileSpreadsheet,
  Eye,
  AlertOctagon,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Home
} from 'lucide-react';
import { parseNapCoordinates } from './napCoordinates';

const NapMap = lazy(() => import('./NapMap'));

// URL del Servidor Central (permite endpoint relativo para preview cloud o absoluto para Proyecto 1)
const DEFAULT_API_URL = '/api/admin';

export interface StaffAccount {
  id?: number;
  usuario: string;
  clave?: string;
  rol: 'dueño' | 'admin' | 'tecnico';
  nombre: string;
  activo?: boolean;
}

interface PlanInternet {
  id: string;
  nombre: string;
  velocidad: string;
  precio: number;
  descripcion: string;
  activo: boolean;
  color?: string;
}

interface PagoFactura {
  id: string;
  monto: number;
  fecha: string;
  metodo: string;
  recibidoPor: string;
  numeroComprobante: string;
  notas?: string;
  registradoPorId?: number;
  registradoPorUsuario?: string;
  fechaContable?: string;
}

interface CierreCaja {
  id: string;
  fecha: string;
  administradorId: number;
  administradorUsuario: string;
  administradorNombre: string;
  cantidadPagos: number;
  totalEfectivoSistema: number;
  efectivoContado: number;
  diferenciaEfectivo: number;
  totalDigital: number;
  totalCobrado: number;
  notas?: string;
  cerradoEn: string;
}

interface ResumenCajaDiaria {
  fecha: string;
  cantidadPagos: number;
  totalEfectivo: number;
  totalDigital: number;
  totalCobrado: number;
}

interface PagoVirtual {
  id: string;
  cedula: string;
  nombreCliente: string;
  banco: string;
  referencia: string;
  monto: number;
  telefono: string;
  fecha: string;
  hora: string;
  comprobanteUrl: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  motivoRechazo?: string;
  fechaProcesado?: string;
  procesadoPor?: string;
}

interface AlertaMasiva {
  id: string;
  zona: string;
  activo: boolean;
  motivo: string;
  fecha: string;
  declaradoPor: string;
  postesAfectados?: string;
}

interface ItemInventario {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'Cable Drop' | 'Conectores' | 'Equipos ONT' | 'Pasivos FTTH';
  cantidad: number;
  unidad: string;
  umbralMinimoAlerta: number;
  alertaCompra: boolean;
  ubicacion: string;
  ultimoReabastecimiento: string;
}

interface DespachoMaterial {
  id: string;
  fecha: string;
  ticketId?: string;
  tecnico: string;
  cableGastado: number;
  conectoresGastados: number;
  ontCambiada?: boolean;
  ontSerial?: string;
  motivo?: string;
}

interface Cliente {
  id?: string;
  cedula: string;
  nombre: string;
  plan: string;
  estado?: 'Activo' | 'Suspendido' | 'Pendiente';
  fechaRegistro?: string;
  telefono?: string;
  direccion?: string;
  sector?: string;
  ipAsignada?: string;
  potenciaOpticaDbm?: number;
  historialOptico?: Array<{ fecha: string; potenciaOpticaDbm: number; ticketId?: string; tecnico?: string }>;
  alertaOptica?: boolean;
  napId?: string;
  napNombre?: string;
  puertoNap?: number;
  serialOnt?: string;
  macOnt?: string;
  oltNombre?: string;
  oltFrame?: string;
  oltSlot?: string;
  oltPon?: string;
  onuId?: string;
  montoDeuda?: number;
  costoMensualPlan?: number;
  estadoPago?: 'Al Día' | 'Pendiente' | 'En Mora';
  fechaUltimoPago?: string;
  historialPagos?: PagoFactura[];
  esClientePrueba?: boolean;
 }

interface DiagnosticoCliente {
  cedula: string;
  nombre: string;
  estadoServicio: string;
  esClientePrueba: boolean;
  sector: string;
  napId: string;
  napNombre: string;
  puertoNap: number | null;
  estadoNap: string;
  serialOnt: string;
  olt: string;
  estadoOntEnVivo: string;
  potenciaOpticaDbm: number | null;
  fechaUltimaMedicion: string;
  historialOptico: Array<{ fecha: string; potenciaOpticaDbm: number; tecnico?: string }>;
  alertaOptica: boolean;
  recomendacion: string;
}

interface Falla {
  id?: string;
  cedula: string;
  nombreCliente?: string;
  detalle: string;
  prioridad?: 'Alta' | 'Media' | 'Baja' | 'Crítica';
  clasificacion?: string;
  estado?: 'Pendiente' | 'En Revisión' | 'Resuelto';
  fechaReporte?: string;
  sector?: string;
  direccionCasa?: string;
  telefonoCliente?: string;
  potenciaOpticaDbm?: number;
  tecnicoAsignado?: string;
  notasTecnico?: string;
  fechaResolucion?: string;
}

interface CajaNap {
  id: string;
  nombre: string;
  sector: string;
  ubicacionPoste: string;
  coordenadas?: string;
  puertosTotales: number;
  puertosOcupados: number;
  potenciaEntradaDbm: number;
  estado: 'Operativa' | 'Mantenimiento' | 'Saturada' | 'Con Falla';
  notas?: string;
  asignacionesPuertos?: AsignacionPuertoNap[];
}

interface AsignacionPuertoNap {
  puerto: number;
  estado: 'Ocupado' | 'Libre';
  clienteId?: string;
  cedula?: string;
  nombreCliente?: string;
  serialOnt?: string;
  macOnt?: string;
  oltNombre?: string;
  frame?: string;
  slot?: string;
  pon?: string;
  onuId?: string;
  potenciaOpticaDbm?: number | null;
  asignadoEn?: string;
  legado?: boolean;
}

interface NotificacionTecnico {
  id: string;
  tipo: 'NUEVA_INSTALACION' | 'AVERIA_URGENTE';
  titulo: string;
  nombreCliente: string;
  telefonoCliente: string;
  direccionCasa: string;
  sectorNap: string;
  planCliente: string;
  fecha: string;
  hora: string;
  leida: boolean;
  estado: 'Pendiente' | 'En Ruta' | 'Completado';
}

interface OrdenInstalacion {
  id: string;
  cedula: string;
  nombreCliente: string;
  telefonoCliente: string;
  direccionCasa: string;
  sectorNap: string;
  plan: string;
  fecha: string;
  estado: 'Pendiente Por Instalar' | 'En Progreso' | 'Instalado';
  tecnicoAsignado?: string;
  tecnicoNombre?: string;
  metrosDropUsados?: number;
  conectoresUsados?: number;
  napId?: string;
  napNombre?: string;
  puertoNap?: number;
  serialOnt?: string;
  macOnt?: string;
  oltNombre?: string;
  oltFrame?: string;
  oltSlot?: string;
  oltPon?: string;
  onuId?: string;
}

function puertosDeCaja(caja: CajaNap): AsignacionPuertoNap[] {
  const storedPorts = new Map((caja.asignacionesPuertos || []).map(port => [Number(port.puerto), port]));
  return Array.from({ length: Number(caja.puertosTotales) || 0 }, (_, index) => storedPorts.get(index + 1) || ({
    puerto: index + 1,
    estado: !caja.asignacionesPuertos?.length && index < Number(caja.puertosOcupados || 0) ? 'Ocupado' as const : 'Libre' as const,
    legado: !caja.asignacionesPuertos?.length && index < Number(caja.puertosOcupados || 0)
  }));
}

function puertosLibres(caja?: CajaNap): AsignacionPuertoNap[] {
  return caja ? puertosDeCaja(caja).filter(port => port.estado === 'Libre') : [];
}

interface SolicitudServicio {
  id: string;
  tipo: 'INSTALACION';
  cedula: string;
  nombre: string;
  telefono: string;
  direccion: string;
  sector: string;
  planId: string;
  planNombre: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fecha: string;
  motivoRechazo?: string;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AdminPanelProps {
  assignedRole: 'dueño' | 'admin' | 'tecnico' | '';
  userRealName?: string;
  currentUsername: string;
  accounts: StaffAccount[];
  onCreateAccount: (account: StaffAccount) => Promise<boolean>;
  onUpdateAccount: (id: number, updates: { nombre?: string; rol?: StaffAccount['rol']; activo?: boolean }) => Promise<boolean>;
  onResetAccountPassword: (id: number, password: string) => Promise<boolean>;
  onDeleteAccount: (id: number) => Promise<boolean>;
  onLogout: () => void;
}

const SECTION_PERMISSIONS: Record<'dueño' | 'admin' | 'tecnico', Array<'registrar' | 'tareas' | 'dashboard' | 'cobranzas' | 'planes' | 'inicio' | 'pagos' | 'inventario' | 'cajas-nap' | 'personal' | 'reportes' | 'solicitudes' | 'integraciones' | 'sitio-web'>> = {
  dueño: ['dashboard', 'registrar', 'cobranzas', 'planes', 'tareas', 'pagos', 'inventario', 'cajas-nap', 'personal', 'reportes', 'solicitudes', 'integraciones', 'sitio-web', 'inicio'],
  admin: ['registrar', 'cobranzas', 'planes', 'pagos', 'inventario', 'cajas-nap', 'reportes', 'solicitudes', 'integraciones', 'sitio-web', 'inicio'],
  tecnico: ['tareas', 'inventario', 'reportes', 'inicio']
};

const defaultSectionForRole = (role: 'dueño' | 'admin' | 'tecnico' | ''): 'registrar' | 'tareas' | 'dashboard' | 'cobranzas' | 'planes' | 'inicio' | 'pagos' | 'inventario' | 'cajas-nap' | 'personal' | 'reportes' | 'solicitudes' | 'integraciones' | 'sitio-web' => {
  const sections = {
    dueño: 'dashboard' as const,
    admin: 'registrar' as const,
    tecnico: 'tareas' as const,
    '': 'inicio' as const,
  };

  return sections[role || ''];
};

export default function AdminPanel({ assignedRole, userRealName = 'Operador', currentUsername, accounts, onCreateAccount, onUpdateAccount, onResetAccountPassword, onDeleteAccount, onLogout }: AdminPanelProps) {
  const [isLogged, setIsLogged] = useState(Boolean(assignedRole));
  const [userRole, setUserRole] = useState<'dueño' | 'admin' | 'tecnico' | ''>(assignedRole);
  const [integrationsStatus, setIntegrationsStatus] = useState<Array<{name:string; configured:boolean; status:string; apiUrl:string|null; lastSync:string|null}>>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newAccountRole, setNewAccountRole] = useState<StaffAccount['rol']>('admin');
  const [accountPasswordDrafts, setAccountPasswordDrafts] = useState<Record<number, string>>({});
  const [seccionActual, setSeccionActual] = useState<'registrar' | 'tareas' | 'dashboard' | 'cobranzas' | 'planes' | 'inicio' | 'pagos' | 'inventario' | 'cajas-nap' | 'personal' | 'reportes' | 'solicitudes' | 'integraciones' | 'sitio-web'>(() => defaultSectionForRole(assignedRole));

  useEffect(() => {
    setUserRole(assignedRole);
    setIsLogged(Boolean(assignedRole));
    setSeccionActual(defaultSectionForRole(assignedRole));
  }, [assignedRole]);

  const hasAccessToSection = (section: 'registrar' | 'tareas' | 'dashboard' | 'cobranzas' | 'planes' | 'inicio' | 'pagos' | 'inventario' | 'cajas-nap' | 'personal' | 'reportes' | 'solicitudes' | 'integraciones' | 'sitio-web') => {
    if (!userRole) return section === 'inicio';
    return SECTION_PERMISSIONS[userRole].includes(section);
  };

  useEffect(() => {
    if (!userRole) {
      setSeccionActual('inicio');
      return;
    }

    if (!hasAccessToSection(seccionActual)) {
      setSeccionActual(defaultSectionForRole(userRole));
    }
  }, [userRole, seccionActual]);

  // Módulo de Inventario de Materiales Ópticos (Cable Drop, Conectores Fast, ONTs, Pasivos)
  const [inventario, setInventario] = useState<ItemInventario[]>([
    {
      id: 'INV-001',
      codigo: 'DROP-1H-FTTH',
      nombre: 'Bobina Cable Drop Fibra Óptica (1 Hilo G.657A2 Auto-soportado)',
      categoria: 'Cable Drop',
      cantidad: 620, // metros restantes; si baja de 500 entra en alerta roja crítica de compra
      unidad: 'metros',
      umbralMinimoAlerta: 500,
      alertaCompra: false,
      ubicacion: 'Almacén Central Higuerote',
      ultimoReabastecimiento: '2026-09-20'
    },
    {
      id: 'INV-002',
      codigo: 'FAST-SC-APC',
      nombre: 'Conectores Mecánicos Rápidos Fast SC/APC (Verde)',
      categoria: 'Conectores',
      cantidad: 74,
      unidad: 'unidades',
      umbralMinimoAlerta: 20,
      alertaCompra: false,
      ubicacion: 'Almacén Central & Móviles',
      ultimoReabastecimiento: '2026-09-18'
    },
    {
      id: 'INV-003',
      codigo: 'ONT-GPON-WIFI',
      nombre: 'Módem ONT GPON Huawei EchoLife Dual Band Gigabit',
      categoria: 'Equipos ONT',
      cantidad: 14,
      unidad: 'unidades',
      umbralMinimoAlerta: 5,
      alertaCompra: false,
      ubicacion: 'Almacén Central Higuerote',
      ultimoReabastecimiento: '2026-09-15'
    },
    {
      id: 'INV-004',
      codigo: 'ROSET-FTTH-01',
      nombre: 'Rosetas Ópticas de Pared FTTH para Abonado',
      categoria: 'Pasivos FTTH',
      cantidad: 48,
      unidad: 'piezas',
      umbralMinimoAlerta: 15,
      alertaCompra: false,
      ubicacion: 'Almacén Central Higuerote',
      ultimoReabastecimiento: '2026-09-22'
    },
    {
      id: 'INV-005',
      codigo: 'TENS-PEZ-DROP',
      nombre: 'Tensores Tipo Pez para Cable Drop en Postes',
      categoria: 'Pasivos FTTH',
      cantidad: 110,
      unidad: 'unidades',
      umbralMinimoAlerta: 25,
      alertaCompra: false,
      ubicacion: 'Almacén Central Higuerote',
      ultimoReabastecimiento: '2026-09-12'
    },
    {
      id: 'INV-006',
      codigo: 'PATCH-SC-2M',
      nombre: 'Patch Cord Monomodo SC/APC a SC/APC (2 metros)',
      categoria: 'Pasivos FTTH',
      cantidad: 36,
      unidad: 'unidades',
      umbralMinimoAlerta: 10,
      alertaCompra: false,
      ubicacion: 'Almacén Central Higuerote',
      ultimoReabastecimiento: '2026-09-10'
    }
  ]);
  const [despachosMateriales, setDespachosMateriales] = useState<DespachoMaterial[]>([
    {
      id: 'DESP-101',
      fecha: '2026-09-27 15:30',
      ticketId: 'INC-001',
      tecnico: 'Técnico Martínez',
      cableGastado: 45,
      conectoresGastados: 2,
      motivo: 'Acometida cortada en poste sector Las Acacias'
    },
    {
      id: 'DESP-102',
      fecha: '2026-09-26 11:15',
      ticketId: 'INC-002',
      tecnico: 'Técnico Pérez',
      cableGastado: 80,
      conectoresGastados: 2,
      ontCambiada: false,
      motivo: 'Reubicación de roseta y tendido de drop nuevo'
    }
  ]);
  const [ticketMaterialesAbierto, setTicketMaterialesAbierto] = useState<string | null>(null);
  const [filtroCategoriaMaterial, setFiltroCategoriaMaterial] = useState('todas');

  // Módulo de revisión manual de comprobantes de Pago Móvil
  const [pagosVirtuales, setPagosVirtuales] = useState<PagoVirtual[]>([]);
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<'todos' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>('PENDIENTE');
  const [comprobanteModal, setComprobanteModal] = useState<string | null>(null);

  // Módulo de Alertas Masivas (Congelamiento de Zonas Afectadas en Postes)
  const [alertasMasivas, setAlertasMasivas] = useState<AlertaMasiva[]>([
    {
      id: 'ALR-801',
      zona: 'Los Pinos (NAP-08)',
      activo: true,
      motivo: 'Falla de Energía en Nodo Central y ruptura de línea en poste 18',
      fecha: '2026-09-27 09:00',
      declaradoPor: 'Dueño / SuperAdmin Tartak',
      postesAfectados: 'Postes #14 al #22'
    }
  ]);
  const [zonaAveriaInput, setZonaAveriaInput] = useState('');
  const [motivoAveriaInput, setMotivoAveriaInput] = useState('Falla de Energía en Nodo Central');

  // Estado de exportación Excel / CSV
  const [isExporting, setIsExporting] = useState(false);

  // Módulo de Gestión de Planes (Dueño y Administradores)
  const [planes, setPlanes] = useState<PlanInternet[]>([]);
  const [mostrarModalCrearPlan, setMostrarModalCrearPlan] = useState(false);
  const [nuevoPlanNombre, setNuevoPlanNombre] = useState('');
  const [nuevoPlanVelocidad, setNuevoPlanVelocidad] = useState('');
  const [nuevoPlanPrecio, setNuevoPlanPrecio] = useState('');
  const [nuevoPlanDescripcion, setNuevoPlanDescripcion] = useState('');
  const [nuevoPlanColor, setNuevoPlanColor] = useState('blue');

  const [planAEditar, setPlanAEditar] = useState<PlanInternet | null>(null);
  const [editPlanNombre, setEditPlanNombre] = useState('');
  const [editPlanVelocidad, setEditPlanVelocidad] = useState('');
  const [editPlanPrecio, setEditPlanPrecio] = useState('');
  const [editPlanDescripcion, setEditPlanDescripcion] = useState('');
  const [editPlanActivo, setEditPlanActivo] = useState(true);
  const [editPlanColor, setEditPlanColor] = useState('blue');
  const [editPlanActualizarClientes, setEditPlanActualizarClientes] = useState(true);

  const [planAEliminar, setPlanAEliminar] = useState<PlanInternet | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Módulo de Consulta de Deuda y Cobranza en Oficina
  const [cedulaConsulta, setCedulaConsulta] = useState('');
  const [clienteConsultado, setClienteConsultado] = useState<Cliente | null>(null);
  const [isConsultingDebt, setIsConsultingDebt] = useState(false);
  const [deudaError, setDeudaError] = useState<string | null>(null);

  // Modal para registrar pago en oficina
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('Efectivo en Taquilla (Oficina)');
  const [pagoNotas, setPagoNotas] = useState('');
  const [isProcessingPago, setIsProcessingPago] = useState(false);
  const [ultimoComprobante, setUltimoComprobante] = useState<PagoFactura | null>(null);
  const [resumenCaja, setResumenCaja] = useState<ResumenCajaDiaria | null>(null);
  const [cierreCajaHoy, setCierreCajaHoy] = useState<CierreCaja | null>(null);
  const [cierresCaja, setCierresCaja] = useState<CierreCaja[]>([]);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [notasCierreCaja, setNotasCierreCaja] = useState('');
  const [isClosingCash, setIsClosingCash] = useState(false);

  // Configuración de API
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  // Datos provenientes de la API
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fallas, setFallas] = useState<Falla[]>([]);
  
  // Campos del Formulario de registro (Pre-carga)
  const [nuevaCedula, setNuevaCedula] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPlan, setNuevoPlan] = useState('Plan Bronce - 100 Mbps');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoSector, setNuevoSector] = useState('Las Acacias (NAP-04)');

  // Búsqueda y filtrado
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('todos');
  const [busquedaFalla, setBusquedaFalla] = useState('');
  const [filtroEstadoFalla, setFiltroEstadoFalla] = useState('todos');

  // Modal para resolver avería (Técnicos)
  const [fallaAResolver, setFallaAResolver] = useState<Falla | null>(null);
  const [solucionDetalle, setSolucionDetalle] = useState('');
  const [potenciaFinalMedida, setPotenciaFinalMedida] = useState('');
  const [resolverMetrosDrop, setResolverMetrosDrop] = useState(0);
  const [resolverConectores, setResolverConectores] = useState(2);
  const [resolverOntCambiada, setResolverOntCambiada] = useState(false);

  // Modal para crear avería manual
  const [mostrarCrearFalla, setMostrarCrearFalla] = useState(false);
  const [fallaCedulaNueva, setFallaCedulaNueva] = useState('');
  const [fallaDetalleNuevo, setFallaDetalleNuevo] = useState('');
  const [fallaPrioridadNueva, setFallaPrioridadNueva] = useState<'Alta' | 'Media' | 'Baja' | 'Crítica'>('Alta');

  // Sistema de Notificaciones Toast
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Notificaciones y Órdenes de Instalación de Fibra Óptica para Técnicos (Avisos de Nuevos Clientes)
  const [notificacionesTecnicos, setNotificacionesTecnicos] = useState<NotificacionTecnico[]>([
    {
      id: 'NOTIF-INST-101',
      tipo: 'NUEVA_INSTALACION',
      titulo: '¡NUEVA INSTALACIÓN DE FIBRA ÓPTICA PENDIENTE!',
      nombreCliente: 'Ricardo Gómez',
      telefonoCliente: '+58 412-8877665',
      direccionCasa: 'Sector El Parque, Av. 3, Casa #88 (frente al bodegón)',
      sectorNap: 'El Parque (NAP-02)',
      planCliente: 'Plan Plata - 200 Mbps',
      fecha: '2026-09-28',
      hora: '09:30 AM',
      leida: false,
      estado: 'Pendiente'
    }
  ]);
  const [ordenesInstalacion, setOrdenesInstalacion] = useState<OrdenInstalacion[]>([
    {
      id: 'INST-101',
      cedula: 'V-28991204',
      nombreCliente: 'Ricardo Gómez',
      telefonoCliente: '+58 412-8877665',
      direccionCasa: 'Sector El Parque, Av. 3, Casa #88 (frente al bodegón)',
      sectorNap: 'El Parque (NAP-02)',
      plan: 'Plan Plata - 200 Mbps',
      fecha: '2026-09-28',
      estado: 'Pendiente Por Instalar',
      tecnicoAsignado: 'Equipo de Campo FTTH'
    }
  ]);
  const [solicitudesServicio, setSolicitudesServicio] = useState<SolicitudServicio[]>([]);
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState<Array<{ usuario: string; nombre: string }>>([]);
  const [mostrarNotificacionesModal, setMostrarNotificacionesModal] = useState(false);

  // Módulo de Cajas NAP (Terminales Ópticas en Postes)
  const [cajasNap, setCajasNap] = useState<CajaNap[]>([
    {
      id: 'NAP-01',
      nombre: 'NAP-01 Centro Norte',
      sector: 'Centro Norte (NAP-01)',
      ubicacionPoste: 'Poste #12 - Av. Bolívar cruce con Calle 4',
      coordenadas: '10.4901, -66.1095',
      puertosTotales: 16,
      puertosOcupados: 14,
      potenciaEntradaDbm: -18.2,
      estado: 'Operativa',
      notas: 'Splitter 1x16 balanceado. Señal estable.'
    },
    {
      id: 'NAP-02',
      nombre: 'NAP-02 El Parque',
      sector: 'El Parque (NAP-02)',
      ubicacionPoste: 'Poste #25 - Frente a Plaza Brión',
      coordenadas: '10.4875, -66.1120',
      puertosTotales: 16,
      puertosOcupados: 8,
      potenciaEntradaDbm: -19.0,
      estado: 'Operativa',
      notas: '8 puertos libres disponibles para altas nuevas.'
    },
    {
      id: 'NAP-04',
      nombre: 'NAP-04 Las Acacias',
      sector: 'Las Acacias (NAP-04)',
      ubicacionPoste: 'Poste #08 - Esquina Calle Los Almendros',
      coordenadas: '10.4842, -66.1054',
      puertosTotales: 16,
      puertosOcupados: 12,
      potenciaEntradaDbm: -18.8,
      estado: 'Operativa',
      notas: 'Acometidas aéreas en excelente estado.'
    },
    {
      id: 'NAP-08',
      nombre: 'NAP-08 Los Pinos',
      sector: 'Los Pinos (NAP-08)',
      ubicacionPoste: 'Poste #18 - Troncal Higuerote Este',
      coordenadas: '10.4790, -66.0980',
      puertosTotales: 16,
      puertosOcupados: 15,
      potenciaEntradaDbm: -26.4,
      estado: 'Con Falla',
      notas: 'Atenuación alta por curvatura en sangría de fibra troncal.'
    }
  ]);

  // Modal y controles para Cajas NAP (Terminales FTTH: Crear, Editar, Eliminar)
  const [cajaAEditar, setCajaAEditar] = useState<CajaNap | null>(null);
  const [mostrarModalCajaNap, setMostrarModalCajaNap] = useState(false);
  const [modoModalCajaNap, setModoModalCajaNap] = useState<'crear' | 'editar'>('editar');
  const [cajaAEliminar, setCajaAEliminar] = useState<CajaNap | null>(null);
  const [isDeletingNap, setIsDeletingNap] = useState(false);
  const [busquedaNap, setBusquedaNap] = useState('');
  const [filtroEstadoNap, setFiltroEstadoNap] = useState<string>('todos');
  const [cajaFormId, setCajaFormId] = useState('');
  const [cajaFormNombre, setCajaFormNombre] = useState('');
  const [cajaFormSector, setCajaFormSector] = useState('');
  const [cajaFormPoste, setCajaFormPoste] = useState('');
  const [cajaFormCoordenadas, setCajaFormCoordenadas] = useState('');
  const [cajaFormPuertosTotales, setCajaFormPuertosTotales] = useState(16);
  const [cajaFormPuertosOcupados, setCajaFormPuertosOcupados] = useState(0);
  const [cajaFormPotenciaDbm, setCajaFormPotenciaDbm] = useState(-19.0);
  const [cajaFormEstado, setCajaFormEstado] = useState<'Operativa' | 'Mantenimiento' | 'Saturada' | 'Con Falla'>('Operativa');
  const [cajaFormNotas, setCajaFormNotas] = useState('');
  const [isSavingNap, setIsSavingNap] = useState(false);
  const [ordenACompletar, setOrdenACompletar] = useState<OrdenInstalacion | null>(null);
  const [napInstalacionId, setNapInstalacionId] = useState('');
  const [puertoInstalacion, setPuertoInstalacion] = useState('');
  const [serialOntInstalacion, setSerialOntInstalacion] = useState('');
  const [macOntInstalacion, setMacOntInstalacion] = useState('');
  const [oltNombreInstalacion, setOltNombreInstalacion] = useState('');
  const [frameInstalacion, setFrameInstalacion] = useState('');
  const [slotInstalacion, setSlotInstalacion] = useState('');
  const [ponInstalacion, setPonInstalacion] = useState('');
  const [onuIdInstalacion, setOnuIdInstalacion] = useState('');
  const [potenciaInstalacion, setPotenciaInstalacion] = useState('');
  const [metrosInstalacion, setMetrosInstalacion] = useState('45');
  const [conectoresInstalacion, setConectoresInstalacion] = useState('2');
  const [isSavingInstallation, setIsSavingInstallation] = useState(false);
  const [diagnosticoCedula, setDiagnosticoCedula] = useState('');
  const [diagnosticoCliente, setDiagnosticoCliente] = useState<DiagnosticoCliente | null>(null);
  const [diagnosticoError, setDiagnosticoError] = useState('');
  const [isConsultingDiagnostic, setIsConsultingDiagnostic] = useState(false);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const consultarDiagnosticoCliente = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsConsultingDiagnostic(true);
    setDiagnosticoError('');
    setDiagnosticoCliente(null);
    try {
      const response = await fetch(`${apiUrl}/diagnostico-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: diagnosticoCedula.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo consultar el diagnóstico.');
      setDiagnosticoCliente(data.cliente);
    } catch (error) {
      setDiagnosticoError(error instanceof Error ? error.message : 'Error al consultar al servidor.');
    } finally {
      setIsConsultingDiagnostic(false);
    }
  };

  const handleCreateStaffAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = newAccountName.trim();
    const cleanUsername = newAccountUsername.trim().toLowerCase();
    const cleanPassword = newAccountPassword.trim();

    if (!cleanName || !cleanUsername || cleanPassword.length < 10) {
      addToast('Complete todos los campos. La contraseña debe tener al menos 10 caracteres.', 'error');
      return;
    }
    if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
      addToast('El usuario debe tener de 3 a 32 caracteres: letras sin acento, números, punto, guion o guion bajo.', 'error');
      return;
    }
    if (accounts.some(account => account.usuario.toLowerCase() === cleanUsername)) {
      addToast('Ese nombre de usuario ya está registrado.', 'error');
      return;
    }

    const saved = await onCreateAccount({
      usuario: cleanUsername,
      clave: cleanPassword,
      rol: newAccountRole,
      nombre: cleanName
    });
    if (!saved) {
      addToast('No se pudo crear la cuenta. Revise los datos o la conexión con el servidor.', 'error');
      return;
    }

    setNewAccountName('');
    setNewAccountUsername('');
    setNewAccountPassword('');
    setNewAccountRole('admin');
    addToast(`Acceso creado para ${cleanName}.`, 'success');
  };

  const handleUpdateStaffAccount = async (account: StaffAccount, updates: { rol?: StaffAccount['rol']; activo?: boolean }) => {
    if (!account.id) return;
    const saved = await onUpdateAccount(account.id, updates);
    if (!saved) {
      addToast('No se pudo actualizar la cuenta. La protección puede impedir dejar el sistema sin dueños.', 'error');
      return;
    }
    addToast('Permisos de la cuenta actualizados.', 'success');
  };

  const handleResetStaffPassword = async (account: StaffAccount) => {
    if (!account.id) return;
    const nextPassword = accountPasswordDrafts[account.id]?.trim() || '';
    if (nextPassword.length < 10) {
      addToast('La nueva contraseña debe tener al menos 10 caracteres.', 'error');
      return;
    }
    if (!await onResetAccountPassword(account.id, nextPassword)) {
      addToast('No se pudo restablecer la contraseña.', 'error');
      return;
    }
    setAccountPasswordDrafts(current => ({ ...current, [account.id!]: '' }));
    addToast(`Contraseña restablecida para @${account.usuario}.`, 'success');
  };

  const handleDeleteStaffAccount = async (account: StaffAccount) => {
    if (!account.id || account.usuario === currentUsername) return;
    if (!window.confirm(`¿Eliminar la cuenta @${account.usuario}? Se cerrarán sus sesiones.`)) return;
    if (!await onDeleteAccount(account.id)) {
      addToast('No se pudo eliminar la cuenta. Debe quedar al menos un dueño activo.', 'error');
      return;
    }
    addToast(`Cuenta @${account.usuario} eliminada.`, 'success');
  };

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations/status', { credentials: 'same-origin' });
        if (!response.ok) return;
        const data = await response.json();
        setIntegrationsStatus(data.providers || []);
      } catch {
        setIntegrationsStatus([]);
      }
    };

    loadIntegrations();
  }, []);

  // Cargar datos reales desde el servidor central cuando cambian las secciones
  const cargarDatosServidor = async (urlToUse = apiUrl) => {
    if (!urlToUse.trim()) {
      setApiOnline(false);
      if (clientes.length === 0 || planes.length === 0) cargarDatosSemillaLocales();
      return;
    }
    setIsSyncing(true);
    try {
      // Intenta conectar al endpoint configurado
      if (userRole !== 'tecnico') {
        const resClientes = await fetch(`${urlToUse}/clientes`);
        if (!resClientes.ok) throw new Error(`HTTP ${resClientes.status} en /clientes`);
        setClientes(await resClientes.json());
      }

      const resFallas = await fetch(`${urlToUse}/fallas`);
      if (!resFallas.ok) throw new Error(`HTTP ${resFallas.status} en /fallas`);
      const dataFallas = await resFallas.json();
      setFallas(dataFallas);

      // Cargar catálogo de planes disponibles
      if (userRole !== 'tecnico') {
        try {
          const resPlanes = await fetch(`${urlToUse}/planes`);
          if (resPlanes.ok) setPlanes(await resPlanes.json());
        } catch {
          // Ignora si el endpoint de planes no respondió y usa fallback si es necesario
        }
      }

      // Cargar pagos entrantes en Taquilla Virtual
      if (userRole !== 'tecnico') {
        try {
          const resPagos = await fetch(`${urlToUse}/taquilla-virtual`);
          if (resPagos.ok) setPagosVirtuales(await resPagos.json());
        } catch {
          // Ignora error si offline
        }

        try {
          const resCaja = await fetch(`${urlToUse}/cierres-caja`);
          if (resCaja.ok) {
            const cajaData = await resCaja.json();
            setResumenCaja(cajaData.resumen);
            setCierreCajaHoy(cajaData.cierreHoy);
            setCierresCaja(cajaData.cierres || []);
          }
        } catch {
          // Ignora error si offline
        }
      }

      // Las alertas masivas solo se consultan en la sesión del dueño.
      if (userRole === 'dueño') {
        try {
          const resAlertas = await fetch(`${urlToUse}/alerta-masiva`);
          if (resAlertas.ok) {
            const dataAlertas = await resAlertas.json();
            setAlertasMasivas(dataAlertas);
          }
        } catch {
          // Ignora error si offline
        }
      }

      // Cargar inventario de materiales ópticos
      try {
        const resInv = await fetch(`${urlToUse}/inventario`);
        if (resInv.ok) {
          const dataInv = await resInv.json();
          if (dataInv.inventario) setInventario(dataInv.inventario);
          if (dataInv.despachos) setDespachosMateriales(dataInv.despachos);
        }
      } catch {
        // Ignora error si offline
      }

      // Técnicos consultan disponibilidad para reservar un puerto durante la instalación.
      try {
        const resCajas = await fetch(`${urlToUse}/cajas-nap`);
        if (resCajas.ok) setCajasNap(await resCajas.json());
      } catch {
        // Ignora error si offline
      }

      // Cargar Notificaciones y Órdenes de Instalación de Técnicos
      try {
        const resNotifs = await fetch(`${urlToUse}/notificaciones-tecnicos`);
        if (resNotifs.ok) {
          const dataNotifs = await resNotifs.json();
          setNotificacionesTecnicos(dataNotifs);
        }
        const resOrdenes = await fetch(`${urlToUse}/ordenes-instalacion`);
        if (resOrdenes.ok) {
          const dataOrdenes = await resOrdenes.json();
          setOrdenesInstalacion(dataOrdenes);
        }
        if (userRole !== 'tecnico') {
          const resTecnicos = await fetch(`${urlToUse}/tecnicos`);
          if (resTecnicos.ok) setTecnicosDisponibles(await resTecnicos.json());
          const resSolicitudes = await fetch(`${urlToUse}/solicitudes-servicio`);
          if (resSolicitudes.ok) setSolicitudesServicio(await resSolicitudes.json());
        }
      } catch {
        // Ignora error si offline
      }

      setApiOnline(true);
    } catch {
      // Si falló una URL absoluta externa (ej. http://localhost:3000/api/admin al estar en sandbox cloud),
      // intentamos automáticamente el endpoint relativo integrado '/api/admin'
      if (urlToUse !== '/api/admin') {
        try {
          const resClientes = await fetch(`/api/admin/clientes`);
          if (resClientes.ok) {
            const dataClientes = await resClientes.json();
            setClientes(dataClientes);
            const resFallas = await fetch(`/api/admin/fallas`);
            if (resFallas.ok) {
              const dataFallas = await resFallas.json();
              setFallas(dataFallas);
            }
            const resPlanes = await fetch(`/api/admin/planes`);
            if (resPlanes.ok) {
              const dataPlanes = await resPlanes.json();
              setPlanes(dataPlanes);
            }
            const resPagos = await fetch(`/api/admin/taquilla-virtual`);
            if (resPagos.ok) {
              const dataPagos = await resPagos.json();
              setPagosVirtuales(dataPagos);
            }
            const resAlertas = await fetch(`/api/admin/alerta-masiva`);
            if (resAlertas.ok) {
              const dataAlertas = await resAlertas.json();
              setAlertasMasivas(dataAlertas);
            }
            try {
              const resCajas = await fetch(`/api/admin/cajas-nap`);
              if (resCajas.ok) setCajasNap(await resCajas.json());
              const resNotifs = await fetch(`/api/admin/notificaciones-tecnicos`);
              if (resNotifs.ok) setNotificacionesTecnicos(await resNotifs.json());
              const resOrdenes = await fetch(`/api/admin/ordenes-instalacion`);
              if (resOrdenes.ok) setOrdenesInstalacion(await resOrdenes.json());
            } catch {
              // fallback
            }
            setApiUrl('/api/admin');
            setApiOnline(true);
            return;
          }
        } catch {
          // continuar con fallback de datos seguros
        }
      }

      setApiOnline(false);
      // Mantenemos datos seguros para que el operador nunca tenga una pantalla en blanco
      if (clientes.length === 0 || planes.length === 0) {
        cargarDatosSemillaLocales();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Datos semilla de contingencia en caso de desconexión
  const cargarDatosSemillaLocales = () => {
    const fallbackClientes: Cliente[] = [
      {
        id: 'CLI-001',
        cedula: 'V-20145892',
        nombre: 'Carlos Mendoza',
        plan: 'Plan Oro - 300 Mbps',
        estado: 'Activo',
        fechaRegistro: '2026-01-15',
        telefono: '+58 414-5550192',
        direccion: 'Sector Las Acacias, Calle 4, Casa #12',
        sector: 'Las Acacias (NAP-04)',
        ipAsignada: '10.20.104.15',
        potenciaOpticaDbm: -19.4,
        montoDeuda: 0.00,
        costoMensualPlan: 50.00,
        estadoPago: 'Al Día',
        fechaUltimoPago: '2026-09-05',
        historialPagos: [
          {
            id: 'PAG-901',
            monto: 50.00,
            fecha: '2026-09-05 10:30',
            metodo: 'Efectivo en Taquilla (Oficina)',
            recibidoPor: 'Oficina Central (Admin)',
            numeroComprobante: 'REC-00192',
            notas: 'Pago mensualidad Septiembre 2026'
          }
        ]
      },
      {
        id: 'CLI-002',
        cedula: 'V-18765432',
        nombre: 'María Valentina Ríos',
        plan: 'Plan Plata - 200 Mbps',
        estado: 'Activo',
        fechaRegistro: '2026-02-03',
        telefono: '+58 412-8889921',
        direccion: 'Av. Libertador, Edif. Torre Azul, Apto 5-B',
        sector: 'Centro Norte (NAP-01)',
        ipAsignada: '10.20.101.44',
        potenciaOpticaDbm: -21.2,
        montoDeuda: 35.00,
        costoMensualPlan: 35.00,
        estadoPago: 'Pendiente',
        fechaUltimoPago: '2026-08-01',
        historialPagos: [
          {
            id: 'PAG-850',
            monto: 35.00,
            fecha: '2026-08-01 11:20',
            metodo: 'Punto de Venta (Oficina)',
            recibidoPor: 'Oficina Central (Admin)',
            numeroComprobante: 'REC-00140',
            notas: 'Pago mensualidad Agosto 2026'
          }
        ]
      },
      {
        id: 'CLI-003',
        cedula: 'V-25678901',
        nombre: 'José Gregorio Ramos',
        plan: 'Plan Bronce - 100 Mbps',
        estado: 'Activo',
        fechaRegistro: '2026-02-20',
        telefono: '+58 416-3331122',
        direccion: 'Urb. Los Pinos, Vereda 8, Casa 15',
        sector: 'Los Pinos (NAP-08)',
        ipAsignada: '10.20.108.92',
        potenciaOpticaDbm: -27.8,
        montoDeuda: 50.00,
        costoMensualPlan: 25.00,
        estadoPago: 'En Mora',
        fechaUltimoPago: '2026-07-28',
        historialPagos: []
      },
      {
        id: 'CLI-004',
        cedula: 'V-14552109',
        nombre: 'Daniela Salazar',
        plan: 'Plan Oro - 300 Mbps',
        estado: 'Activo',
        fechaRegistro: '2026-03-10',
        telefono: '+58 424-7776655',
        direccion: 'Residencias El Parque, Torre C, Piso 3',
        sector: 'El Parque (NAP-02)',
        ipAsignada: '10.20.102.18',
        potenciaOpticaDbm: -18.6,
        montoDeuda: 0.00,
        costoMensualPlan: 50.00,
        estadoPago: 'Al Día',
        fechaUltimoPago: '2026-09-12',
        historialPagos: [
          {
            id: 'PAG-920',
            monto: 50.00,
            fecha: '2026-09-12 15:45',
            metodo: 'Transferencia / Pago Móvil',
            recibidoPor: 'Oficina Central (Admin)',
            numeroComprobante: 'REC-00210'
          }
        ]
      },
      {
        id: 'CLI-005',
        cedula: 'V-22445566',
        nombre: 'Roberto Fernández',
        plan: 'Plan Plata - 200 Mbps',
        estado: 'Suspendido',
        fechaRegistro: '2026-03-12',
        telefono: '+58 412-4443322',
        direccion: 'Sector San José, Calle Bolívar #45',
        sector: 'San José (NAP-05)',
        ipAsignada: '10.20.105.77',
        potenciaOpticaDbm: -23.1,
        montoDeuda: 70.00,
        costoMensualPlan: 35.00,
        estadoPago: 'En Mora',
        fechaUltimoPago: '2026-06-30',
        historialPagos: []
      }
    ];

    const fallbackFallas: Falla[] = [
      {
        id: 'INC-101',
        cedula: 'V-25678901',
        nombreCliente: 'José Gregorio Ramos',
        detalle: 'Luz LOS en rojo en router Huawei ONT. Sin servicio de internet desde las 8:00 AM.',
        prioridad: 'Crítica',
        estado: 'Pendiente',
        fechaReporte: '2026-09-27 08:30',
        sector: 'Los Pinos (NAP-08)',
        potenciaOpticaDbm: -32.5
      },
      {
        id: 'INC-102',
        cedula: 'V-20145892',
        nombreCliente: 'Carlos Mendoza',
        detalle: 'Atenuación intermitente. Cable drop doblado por rama de árbol en acometida exterior.',
        prioridad: 'Alta',
        estado: 'En Revisión',
        fechaReporte: '2026-09-27 10:15',
        sector: 'Las Acacias (NAP-04)',
        potenciaOpticaDbm: -26.9,
        tecnicoAsignado: 'Técnico Pérez'
      }
    ];

    const fallbackPlanes: PlanInternet[] = [
      {
        id: 'PLAN-001',
        nombre: 'Plan Bronce - 100 Mbps',
        velocidad: '100 Mbps',
        precio: 25.00,
        descripcion: 'Navegación fluida, streaming HD y teletrabajo para 1-4 dispositivos.',
        activo: true,
        color: 'amber'
      },
      {
        id: 'PLAN-002',
        nombre: 'Plan Plata - 200 Mbps',
        velocidad: '200 Mbps',
        precio: 35.00,
        descripcion: 'Ideal para familias activas, múltiples transmisiones y videollamadas fluidas.',
        activo: true,
        color: 'blue'
      },
      {
        id: 'PLAN-003',
        nombre: 'Plan Oro - 300 Mbps',
        velocidad: '300 Mbps',
        precio: 50.00,
        descripcion: 'Ultra velocidad simétrica, streaming 4K y gaming sin latencia ni cortes.',
        activo: true,
        color: 'emerald'
      },
      {
        id: 'PLAN-004',
        nombre: 'Plan Platino - 500 Mbps',
        velocidad: '500 Mbps',
        precio: 75.00,
        descripcion: 'Máxima potencia para creadores de contenido, descargas masivas y hogares hiperconectados.',
        activo: true,
        color: 'cyan'
      },
      {
        id: 'PLAN-005',
        nombre: 'Plan Dedicado Pyme - 1 Gbps',
        velocidad: '1 Gbps',
        precio: 120.00,
        descripcion: 'Enlace simétrico empresarial dedicado con IP pública fija y prioridad de tráfico.',
        activo: true,
        color: 'purple'
      }
    ];

    setClientes(fallbackClientes);
    setFallas(fallbackFallas);
    setPlanes(fallbackPlanes);
  };

  useEffect(() => {
    if (isLogged) {
      if (apiUrl.trim()) cargarDatosServidor();
      else if (clientes.length === 0 || planes.length === 0) cargarDatosSemillaLocales();
    }
  }, [isLogged, seccionActual, apiUrl]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() !== '123') {
      addToast("Clave incorrecta. Use: 123", "error");
      return;
    }
    const cleanUser = username
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Normaliza acentos como 'dueño' -> 'dueno' / 'tecnico' -> 'tecnico'

    let normalizedRole: 'dueño' | 'admin' | 'tecnico' | null = null;
    if (cleanUser === 'dueno' || cleanUser === 'dueño') {
      normalizedRole = 'dueño';
    } else if (cleanUser === 'admin' || cleanUser === 'administrador') {
      normalizedRole = 'admin';
    } else if (cleanUser === 'tecnico' || cleanUser === 'técnico') {
      normalizedRole = 'tecnico';
    }

    if (normalizedRole) {
      setUserRole(normalizedRole);
      setIsLogged(true);
      setSeccionActual(normalizedRole === 'tecnico' ? 'tareas' : normalizedRole === 'dueño' ? 'dashboard' : 'registrar');
      addToast(`Bienvenido al sistema Cable Tartak como [${normalizedRole.toUpperCase()}]`, "success");
    } else {
      addToast("Usuario inválido. Escriba: dueño, admin, o tecnico", "error");
    }
  };

  // Atajo rápido para pruebas (Dueño / Admin / Técnico)
  const handleQuickLogin = (role: 'dueño' | 'admin' | 'tecnico') => {
    setUsername(role);
    setPassword('123');
    setUserRole(role);
    setIsLogged(true);
    setSeccionActual(role === 'tecnico' ? 'tareas' : role === 'dueño' ? 'dashboard' : 'registrar');
    addToast(`Acceso directo como [${role.toUpperCase()}] autorizado`, "success");
  };

  // =========================================================================
  // GESTIÓN DE PLANES: DUEÑO Y ADMINISTRADORES
  // =========================================================================

  // Anexar nuevo plan al catálogo
  const handleCrearPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPlanNombre.trim()) {
      addToast("El nombre del plan es obligatorio", "error");
      return;
    }
    const precioNum = parseFloat(nuevoPlanPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      addToast("Ingrese un precio válido mayor a 0", "error");
      return;
    }

    setIsSavingPlan(true);
    try {
      const res = await fetch(`${apiUrl}/planes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoPlanNombre.trim(),
          velocidad: nuevoPlanVelocidad.trim() || '100 Mbps',
          precio: precioNum,
          descripcion: nuevoPlanDescripcion.trim() || 'Conexión FTTH simétrica de fibra óptica.',
          color: nuevoPlanColor
        })
      });

      if (res.ok) {
        const data = await res.json();
        addToast(data.mensaje || `¡Plan "${nuevoPlanNombre}" anexado exitosamente!`, "success");
        setMostrarModalCrearPlan(false);
        setNuevoPlanNombre('');
        setNuevoPlanVelocidad('');
        setNuevoPlanPrecio('');
        setNuevoPlanDescripcion('');
        cargarDatosServidor();
      } else {
        const err = await res.json();
        addToast(err.error || "Error al anexar el plan", "error");
      }
    } catch {
      // Fallback local
      const planLocal: PlanInternet = {
        id: `PLAN-${Math.floor(100 + Math.random() * 900)}`,
        nombre: nuevoPlanNombre.trim(),
        velocidad: nuevoPlanVelocidad.trim() || '100 Mbps',
        precio: precioNum,
        descripcion: nuevoPlanDescripcion.trim() || 'Conexión FTTH simétrica de fibra óptica.',
        activo: true,
        color: nuevoPlanColor
      };
      setPlanes(prev => [...prev, planLocal]);
      addToast(`¡Plan "${planLocal.nombre}" anexado exitosamente!`, "success");
      setMostrarModalCrearPlan(false);
      setNuevoPlanNombre('');
      setNuevoPlanVelocidad('');
      setNuevoPlanPrecio('');
      setNuevoPlanDescripcion('');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Modificar precio, nombre y detalles de un plan
  const handleEditarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planAEditar) return;

    if (!editPlanNombre.trim()) {
      addToast("El nombre del plan no puede estar vacío", "error");
      return;
    }
    const precioNum = parseFloat(editPlanPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      addToast("Ingrese un precio válido mayor a 0", "error");
      return;
    }

    setIsSavingPlan(true);
    try {
      const res = await fetch(`${apiUrl}/planes/${planAEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editPlanNombre.trim(),
          velocidad: editPlanVelocidad.trim(),
          precio: precioNum,
          descripcion: editPlanDescripcion.trim(),
          activo: editPlanActivo,
          color: editPlanColor,
          actualizarClientesExistentes: editPlanActualizarClientes
        })
      });

      if (res.ok) {
        const data = await res.json();
        addToast(data.mensaje || "Tarifa y datos del plan actualizados con éxito", "success");
        setPlanAEditar(null);
        cargarDatosServidor();
      } else {
        const err = await res.json();
        addToast(err.error || "No se pudo actualizar el plan", "error");
      }
    } catch {
      // Fallback local
      const oldNombre = planAEditar.nombre;
      setPlanes(prev => prev.map(p => {
        if (p.id === planAEditar.id) {
          return {
            ...p,
            nombre: editPlanNombre.trim(),
            velocidad: editPlanVelocidad.trim(),
            precio: precioNum,
            descripcion: editPlanDescripcion.trim(),
            activo: editPlanActivo,
            color: editPlanColor
          };
        }
        return p;
      }));

      if (editPlanActualizarClientes) {
        setClientes(prev => prev.map(c => {
          if (c.plan === oldNombre || c.plan.toLowerCase().includes(oldNombre.toLowerCase())) {
            return {
              ...c,
              plan: editPlanNombre.trim(),
              costoMensualPlan: precioNum
            };
          }
          return c;
        }));
      }

      addToast(`Tarifa de "${editPlanNombre.trim()}" actualizada a $${precioNum.toFixed(2)} USD`, "success");
      setPlanAEditar(null);
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Quitar / eliminar plan del catálogo
  const handleEliminarPlan = async () => {
    if (!planAEliminar) return;

    setIsSavingPlan(true);
    try {
      const res = await fetch(`${apiUrl}/planes/${planAEliminar.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const data = await res.json();
        addToast(data.mensaje || `Plan "${planAEliminar.nombre}" eliminado`, "success");
        setPlanAEliminar(null);
        cargarDatosServidor();
      } else {
        const err = await res.json();
        addToast(err.error || "Error al eliminar el plan", "error");
      }
    } catch {
      // Fallback local
      const planId = planAEliminar.id;
      const planNombre = planAEliminar.nombre;
      const altPlan = planes.find(p => p.id !== planId && p.activo) || planes.find(p => p.id !== planId);
      
      setPlanes(prev => prev.filter(p => p.id !== planId));
      if (altPlan) {
        setClientes(prev => prev.map(c => {
          if (c.plan === planNombre || c.plan.toLowerCase().includes(planNombre.toLowerCase())) {
            return {
              ...c,
              plan: altPlan.nombre,
              costoMensualPlan: altPlan.precio
            };
          }
          return c;
        }));
      }
      addToast(`Plan "${planNombre}" eliminado del catálogo`, "success");
      setPlanAEliminar(null);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCedula.trim() || !nuevoNombre.trim()) {
      addToast("Rellene todos los campos obligatorios (Cédula y Nombre)", "error");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/pre-cargar-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: nuevaCedula.trim().toUpperCase(),
          nombre: nuevoNombre.trim(),
          plan: nuevoPlan,
          sector: nuevoSector,
          telefono: nuevoTelefono || '+58 412-0000000',
          direccion: nuevaDireccion || 'Dirección de abonado en sector'
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.mensaje || "Cliente pre-cargado con éxito", "success");
        // Notificación automática a los técnicos con nombre, teléfono y dirección
        const notifNueva: NotificacionTecnico = {
          id: `NOTIF-INST-${Date.now()}`,
          tipo: 'NUEVA_INSTALACION',
          titulo: '¡NUEVA INSTALACIÓN DE FIBRA ÓPTICA PENDIENTE!',
          nombreCliente: nuevoNombre.trim(),
          telefonoCliente: nuevoTelefono || '+58 412-0000000',
          direccionCasa: nuevaDireccion || 'Dirección de abonado en sector',
          sectorNap: nuevoSector,
          planCliente: nuevoPlan,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leida: false,
          estado: 'Pendiente'
        };
        setNotificacionesTecnicos(prev => [notifNueva, ...prev]);

        const ordenNueva: OrdenInstalacion = {
          id: `INST-${Math.floor(100 + Math.random() * 900)}`,
          cedula: nuevaCedula.trim().toUpperCase(),
          nombreCliente: nuevoNombre.trim(),
          telefonoCliente: nuevoTelefono || '+58 412-0000000',
          direccionCasa: nuevaDireccion || 'Dirección de abonado en sector',
          sectorNap: nuevoSector,
          plan: nuevoPlan,
          fecha: new Date().toISOString().split('T')[0],
          estado: 'Pendiente Por Instalar',
          tecnicoAsignado: 'Equipo de Campo FTTH'
        };
        setOrdenesInstalacion(prev => [ordenNueva, ...prev]);

        setNuevaCedula('');
        setNuevoNombre('');
        setNuevoTelefono('');
        setNuevaDireccion('');
        cargarDatosServidor();
      } else {
        addToast(data.error || "Error al procesar la solicitud", "error");
      }
    } catch (e) {
      console.warn("Error al conectar con la API, registrando en memoria local:", e);
      const planFound = planes.find(p => p.nombre === nuevoPlan || p.id === nuevoPlan);
      let costoPlan = planFound ? planFound.precio : 25.00;
      if (!planFound) {
        if (nuevoPlan.includes('Plata')) costoPlan = 35.00;
        else if (nuevoPlan.includes('Oro')) costoPlan = 50.00;
        else if (nuevoPlan.includes('Platino')) costoPlan = 75.00;
        else if (nuevoPlan.includes('Pyme') || nuevoPlan.includes('1 Gbps')) costoPlan = 120.00;
      }

      // Respaldo local
      const nuevoObj: Cliente = {
        id: `CLI-LOCAL-${Date.now()}`,
        cedula: nuevaCedula.trim().toUpperCase(),
        nombre: nuevoNombre.trim(),
        plan: nuevoPlan,
        estado: 'Activo',
        fechaRegistro: new Date().toISOString().split('T')[0],
        sector: nuevoSector,
        telefono: nuevoTelefono || '+58 412-0000000',
        direccion: nuevaDireccion || 'Dirección de fibra',
        ipAsignada: '10.20.100.' + (Math.floor(Math.random() * 200) + 10),
        potenciaOpticaDbm: -19.8,
        montoDeuda: 0.00,
        costoMensualPlan: costoPlan,
        estadoPago: 'Al Día',
        fechaUltimoPago: new Date().toISOString().split('T')[0],
        historialPagos: []
      };
      setClientes(prev => [nuevoObj, ...prev]);

      // Notificación inmediata para los técnicos en modo contingencia
      const notifNueva: NotificacionTecnico = {
        id: `NOTIF-INST-${Date.now()}`,
        tipo: 'NUEVA_INSTALACION',
        titulo: '¡NUEVA INSTALACIÓN DE FIBRA ÓPTICA PENDIENTE!',
        nombreCliente: nuevoObj.nombre,
        telefonoCliente: nuevoObj.telefono || '+58 412-0000000',
        direccionCasa: nuevoObj.direccion || 'Dirección de abonado en sector',
        sectorNap: nuevoObj.sector || nuevoSector,
        planCliente: nuevoObj.plan,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        leida: false,
        estado: 'Pendiente'
      };
      setNotificacionesTecnicos(prev => [notifNueva, ...prev]);

      const ordenNueva: OrdenInstalacion = {
        id: `INST-${Math.floor(100 + Math.random() * 900)}`,
        cedula: nuevoObj.cedula,
        nombreCliente: nuevoObj.nombre,
        telefonoCliente: nuevoObj.telefono || '+58 412-0000000',
        direccionCasa: nuevoObj.direccion || 'Dirección de abonado en sector',
        sectorNap: nuevoObj.sector || nuevoSector,
        plan: nuevoObj.plan,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'Pendiente Por Instalar',
        tecnicoAsignado: 'Equipo de Campo FTTH'
      };
      setOrdenesInstalacion(prev => [ordenNueva, ...prev]);

      addToast(`Cliente ${nuevoObj.nombre} registrado y orden de instalación creada para el equipo técnico.`, "success");
      setNuevaCedula('');
      setNuevoNombre('');
      setNuevoTelefono('');
      setNuevaDireccion('');
    }
  };

  // Consultar Deuda de Usuario por Cédula (Admin / Dueño)
  const handleConsultarDeuda = async (e?: React.FormEvent, cedulaForzada?: string) => {
    if (e) e.preventDefault();
    const cedulaToSearch = (cedulaForzada || cedulaConsulta).trim().toUpperCase();
    if (!cedulaToSearch) {
      addToast("Ingrese el número de cédula del cliente para consultar.", "error");
      return;
    }

    setIsConsultingDebt(true);
    setDeudaError(null);

    try {
      const res = await fetch(`${apiUrl}/consulta-deuda/${encodeURIComponent(cedulaToSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setClienteConsultado(data.cliente);
        setPagoMonto((data.cliente.montoDeuda || 0).toString());
        addToast(`Abonado ${data.cliente.nombre} encontrado. Deuda: $${(data.cliente.montoDeuda || 0).toFixed(2)}`, "info");
      } else {
        const errData = await res.json();
        // Buscar localmente si la API no lo encontró o si está sin conexión
        const localMatch = clientes.find(c => {
          const c1 = c.cedula.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const c2 = cedulaToSearch.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          return c.cedula.toUpperCase() === cedulaToSearch || c1 === c2 || c1.endsWith(c2) || c2.endsWith(c1);
        });

        if (localMatch) {
          setClienteConsultado(localMatch);
          setPagoMonto((localMatch.montoDeuda || 0).toString());
          addToast(`Abonado ${localMatch.nombre} encontrado localmente. Deuda: $${(localMatch.montoDeuda || 0).toFixed(2)}`, "info");
        } else {
          setClienteConsultado(null);
          setDeudaError(errData.error || `No se encontró ningún abonado con la cédula "${cedulaToSearch}".`);
          addToast(`No se encontró cliente con cédula ${cedulaToSearch}`, "error");
        }
      }
    } catch (err) {
      // Fallback local en caso de error de red
      const localMatch = clientes.find(c => {
        const c1 = c.cedula.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const c2 = cedulaToSearch.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        return c.cedula.toUpperCase() === cedulaToSearch || c1 === c2 || c1.endsWith(c2) || c2.endsWith(c1);
      });

      if (localMatch) {
        setClienteConsultado(localMatch);
        setPagoMonto((localMatch.montoDeuda || 0).toString());
        addToast(`Abonado ${localMatch.nombre} cargado desde memoria.`, "info");
      } else {
        setClienteConsultado(null);
        setDeudaError(`No se encontró ningún abonado registrado con la cédula "${cedulaToSearch}".`);
        addToast(`No se encontró abonado con la cédula ${cedulaToSearch}`, "error");
      }
    } finally {
      setIsConsultingDebt(false);
    }
  };

  // Registrar Pago en Oficina (Taquilla / Caja)
  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteConsultado) return;

    const montoNum = parseFloat(pagoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      addToast("Ingrese un monto válido a pagar mayor a cero.", "error");
      return;
    }

    setIsProcessingPago(true);

    try {
      const res = await fetch(`${apiUrl}/registrar-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: clienteConsultado.cedula,
          monto: montoNum,
          metodo: pagoMetodo,
          notas: pagoNotas || 'Pago de mensualidad fibra en taquilla de oficina',
          usuarioCobrador: userRole === 'dueño' ? 'Dueño / Dirección' : 'Administrador'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUltimoComprobante(data.comprobante);
        setMostrarModalPago(false);
        addToast(data.mensaje || "Pago registrado exitosamente en oficina.", "success");

        // Actualizar estado del cliente consultado en pantalla
        setClienteConsultado(prev => {
          if (!prev) return null;
          const nuevaDeuda = data.deudaRestante ?? Math.max(0, (prev.montoDeuda || 0) - montoNum);
          return {
            ...prev,
            montoDeuda: nuevaDeuda,
            estadoPago: nuevaDeuda === 0 ? 'Al Día' : 'Pendiente',
            fechaUltimoPago: new Date().toISOString().split('T')[0],
            historialPagos: [data.comprobante, ...(prev.historialPagos || [])]
          };
        });

        // Recargar clientes del servidor para sincronizar todo el panel
        cargarDatosServidor();
      } else {
        const err = await res.json();
        addToast(err.error || "Error al procesar el cobro en el servidor.", "error");
      }
    } catch (error) {
      addToast(error instanceof Error ? `Pago no registrado: ${error.message}` : 'Pago no registrado: error de conexión con el servidor.', 'error');
    } finally {
      setIsProcessingPago(false);
    }
  };

  const handleCerrarCaja = async (event: React.FormEvent) => {
    event.preventDefault();
    const countedCash = Number(efectivoContado);
    if (!Number.isFinite(countedCash) || countedCash < 0) {
      addToast('Ingresa el efectivo contado; puede ser cero si no hubo efectivo.', 'error');
      return;
    }
    setIsClosingCash(true);
    try {
      const response = await fetch(`${apiUrl}/cierres-caja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ efectivoContado: countedCash, notas: notasCierreCaja })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cerrar la caja.');
      setCierreCajaHoy(data.cierre);
      setNotasCierreCaja('');
      addToast(`Caja del ${data.cierre.fecha} cerrada y guardada.`, 'success');
      await cargarDatosServidor();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo cerrar la caja.', 'error');
    } finally {
      setIsClosingCash(false);
    }
  };

  // Resolver falla técnica
  const handleResolverFalla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallaAResolver || !fallaAResolver.id) return;

    try {
      const res = await fetch(`${apiUrl}/fallas/${fallaAResolver.id}/resolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solucion: solucionDetalle || 'Empalme de fibra reparado y señal verificada en ONT.',
          tecnico: userRole === 'tecnico' ? 'Técnico de Campo (Sesión Actual)' : 'Técnico Certificado Tartak',
          potenciaFinal: potenciaFinalMedida
        })
      });

      if (res.ok) {
        if (resolverMetrosDrop > 0 || resolverConectores > 0 || resolverOntCambiada) {
          const dispatched = await descontarMaterialesLocal(Number(resolverMetrosDrop), Number(resolverConectores), fallaAResolver.id, resolverOntCambiada);
          if (!dispatched) return;
        }
        addToast(`Avería ${fallaAResolver.id} marcada como Resuelta`, "success");
        setFallaAResolver(null);
        setSolucionDetalle('');
        setResolverMetrosDrop(0);
        setResolverConectores(2);
        setResolverOntCambiada(false);
        cargarDatosServidor();
      } else {
        const data = await res.json();
        addToast(data.error || "No se pudo actualizar la avería", "error");
      }
    } catch (e) {
      // Fallback local
      setFallas(prev => prev.map(f => {
        if (f.id === fallaAResolver.id) {
          return {
            ...f,
            estado: 'Resuelto',
            notasTecnico: solucionDetalle || 'Empalme de fibra reparado y señal verificada en ONT.',
            tecnicoAsignado: 'Técnico de Campo',
            fechaResolucion: new Date().toISOString().replace('T', ' ').substring(0, 16),
            potenciaOpticaDbm: parseFloat(potenciaFinalMedida) || -19.5
          };
        }
        return f;
      }));
      addToast(`Avería ${fallaAResolver.id} resuelta en modo local`, "success");
      setFallaAResolver(null);
      setSolucionDetalle('');
    }
  };

  // Crear avería nueva
  const handleCrearFalla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallaCedulaNueva.trim() || !fallaDetalleNuevo.trim()) {
      addToast("Cédula y detalle de falla son requeridos", "error");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/fallas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: fallaCedulaNueva.trim().toUpperCase(),
          detalle: fallaDetalleNuevo.trim(),
          prioridad: fallaPrioridadNueva
        })
      });
      if (res.ok) {
        addToast("Avería registrada y despachada a campo", "success");
        setMostrarCrearFalla(false);
        setFallaCedulaNueva('');
        setFallaDetalleNuevo('');
        cargarDatosServidor();
      } else {
        const data = await res.json();
        addToast(data.error || "Error al crear orden", "error");
      }
    } catch (e) {
      const nuevaFalla: Falla = {
        id: `INC-LOCAL-${Date.now()}`,
        cedula: fallaCedulaNueva.trim().toUpperCase(),
        nombreCliente: clientes.find(c => c.cedula === fallaCedulaNueva.trim().toUpperCase())?.nombre || 'Cliente Cable Tartak',
        detalle: fallaDetalleNuevo.trim(),
        prioridad: fallaPrioridadNueva,
        estado: 'Pendiente',
        fechaReporte: new Date().toISOString().replace('T', ' ').substring(0, 16),
        sector: 'Sector Central',
        potenciaOpticaDbm: -31.0
      };
      setFallas(prev => [nuevaFalla, ...prev]);
      addToast("Avería registrada en modo contingencia", "success");
      setMostrarCrearFalla(false);
      setFallaCedulaNueva('');
      setFallaDetalleNuevo('');
    }
  };

  // Clientes filtrados
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const matchBusqueda =
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        c.cedula.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        (c.sector && c.sector.toLowerCase().includes(busquedaCliente.toLowerCase()));
      const matchPlan = filtroPlan === 'todos' || c.plan.toLowerCase().includes(filtroPlan.toLowerCase());
      return matchBusqueda && matchPlan;
    });
  }, [clientes, busquedaCliente, filtroPlan]);

  // Fallas filtradas
  const fallasFiltradas = useMemo(() => {
    return fallas.filter(f => {
      const matchBusqueda =
        f.cedula.toLowerCase().includes(busquedaFalla.toLowerCase()) ||
        f.detalle.toLowerCase().includes(busquedaFalla.toLowerCase()) ||
        (f.nombreCliente && f.nombreCliente.toLowerCase().includes(busquedaFalla.toLowerCase()));
      const matchEstado =
        filtroEstadoFalla === 'todos' ||
        (filtroEstadoFalla === 'pendientes' && f.estado !== 'Resuelto') ||
        (filtroEstadoFalla === 'resueltos' && f.estado === 'Resuelto');
      return matchBusqueda && matchEstado;
    });
  }, [fallas, busquedaFalla, filtroEstadoFalla]);

  const incidentesPorSector = useMemo(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const grouped = new Map<string, Falla[]>();
    fallas.filter(failure => {
      const createdAt = Date.parse(failure.fechaReporte || '');
      return failure.estado !== 'Resuelto' && createdAt >= cutoff && Boolean(failure.sector?.trim());
    }).forEach(failure => {
      const sectorKey = failure.sector!.trim().toLocaleLowerCase();
      grouped.set(sectorKey, [...(grouped.get(sectorKey) || []), failure]);
    });
    return Array.from(grouped.entries())
      .filter(([, reports]) => reports.length >= 2)
      .map(([sector, reports]) => ({ sector: reports[0].sector || sector, reports }))
      .sort((left, right) => right.reports.length - left.reports.length);
  }, [fallas]);

  const clientesConSenalCritica = useMemo(() => clientes.filter(client =>
    client.estado !== 'Suspendido' && typeof client.potenciaOpticaDbm === 'number' && client.potenciaOpticaDbm <= -27
  ), [clientes]);

  // =========================================================================
  // GESTIÓN DE AVERÍAS MASIVAS (CONGELAMIENTO DE ZONAS EN POSTES) - ROL DUEÑO
  // =========================================================================

  // Colocar dentro del menú del Dueño en React
  const declararAveriaMasiva = async (zona: string, motivoPersonalizado?: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de declarar Alerta Masiva de Fibra en la zona: ${zona}?`);
    if (!confirmacion) return;

    const motivoFinal = motivoPersonalizado || motivoAveriaInput || "Falla de Energía en Nodo Central";

    try {
      const res = await fetch(`${apiUrl}/alerta-masiva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zona: zona, activo: true, motivo: motivoFinal })
      });
      if (res.ok) {
        alert("🚨 Alerta emitida. Los clientes de esa zona verán un aviso en sus aplicaciones.");
        addToast(`🚨 Alerta Masiva activada en ${zona}`, "error");
        cargarDatosServidor();
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      // Fallback para rutas relativas en caso de restricciones de puerto o preview cloud
      try {
        const resFallback = await fetch(`/api/admin/alerta-masiva`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zona: zona, activo: true, motivo: motivoFinal })
        });
        if (resFallback.ok) {
          alert("🚨 Alerta emitida. Los clientes de esa zona verán un aviso en sus aplicaciones.");
          addToast(`🚨 Alerta Masiva activada en ${zona}`, "error");
          cargarDatosServidor();
          return;
        }
      } catch {}
      alert("Error de red");
    }
  };

  // Levantar alerta masiva / descongelar zona
  const levantarAveriaMasiva = async (idOrZona: string) => {
    try {
      const res = await fetch(`${apiUrl}/alerta-masiva/${encodeURIComponent(idOrZona)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addToast(`Alerta en ${idOrZona} levantada con éxito. Zona normalizada.`, "success");
        cargarDatosServidor();
      }
    } catch {
      setAlertasMasivas(prev => prev.filter(a => a.id !== idOrZona && a.zona !== idOrZona));
      addToast(`Alerta levantada en ${idOrZona}`, "info");
    }
  };

  // =========================================================================
  // GESTIÓN DE COMPROBANTES DE PAGO MÓVIL
  // =========================================================================

  // Aprobar comprobante de pago móvil
  const handleAprobarPagoVirtual = async (pago: PagoVirtual) => {
    try {
      const res = await fetch(`${apiUrl}/taquilla-virtual/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pago.id, cedula: pago.cedula })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo aprobar el pago.');
      alert("Pago aprobado y registrado.");
      addToast(`Pago de ${pago.cedula} aprobado y guardado.`, "success");
      cargarDatosServidor();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo aprobar el pago.', 'error');
    }
  };

  // Rechazar comprobante de pago móvil
  const handleRechazarPagoVirtual = async (pago: PagoVirtual) => {
    try {
      const res = await fetch(`${apiUrl}/taquilla-virtual/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pago.id, motivo: "Comprobante rechazado por administración" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo rechazar el pago.');
      addToast(`Pago de ${pago.cedula} rechazado y guardado.`, "info");
      cargarDatosServidor();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo rechazar el pago.', 'error');
    }
  };

  // =========================================================================
  // EXPORTACIÓN DE DATOS (AVERÍAS RESUELTAS POR EL EQUIPO TÉCNICO EN LA SEMANA)
  // =========================================================================

  const exportarAveriasResueltasSemana = async (formato: 'xlsx' | 'csv' = 'xlsx') => {
    setIsExporting(true);
    try {
      const averiasResueltas = fallas.filter(f => f.estado === 'Resuelto');
      if (averiasResueltas.length === 0) {
        addToast("No hay averías resueltas en el registro semanal para exportar.", "info");
        setIsExporting(false);
        return;
      }

      const datosFormateados = averiasResueltas.map(f => ({
        "ID Ticket": f.id,
        "Cédula Abonado": f.cedula,
        "Nombre Cliente": f.nombreCliente || 'Abonado Tartak',
        "Sector / NAP": f.sector || 'Red Troncal',
        "Prioridad": f.prioridad,
        "Incidente Reportado": f.detalle,
        "Solución Técnica": f.notasTecnico || 'Empalme de fibra reparado y señal normalizada',
        "Técnico Asignado": f.tecnicoAsignado || 'Equipo Técnico',
        "Potencia Medida Final": f.potenciaOpticaDbm ? `${f.potenciaOpticaDbm} dBm` : '-19.5 dBm',
        "Fecha Reporte": f.fechaReporte,
        "Fecha Resolución": f.fechaResolucion || 'Esta semana'
      }));

      if (formato === 'xlsx') {
        try {
          const XLSX = await import('xlsx');
          const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Averías Resueltas");
          
          worksheet['!cols'] = [
            { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 20 },
            { wch: 12 }, { wch: 45 }, { wch: 45 }, { wch: 20 },
            { wch: 20 }, { wch: 18 }, { wch: 18 }
          ];

          XLSX.writeFile(workbook, `averias_resueltas_semana_cable_tartak_${new Date().toISOString().split('T')[0]}.xlsx`);
          addToast("¡Reporte Excel (XLSX) descargado exitosamente!", "success");
        } catch (xlsxErr) {
          console.warn("Fallo importación XLSX, usando fallback CSV:", xlsxErr);
          generarDescargaCsv(datosFormateados);
        }
      } else {
        generarDescargaCsv(datosFormateados);
      }
    } catch (err: any) {
      addToast(`Error al exportar: ${err.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const generarDescargaCsv = (datos: any[]) => {
    if (!datos || datos.length === 0) return;
    const encabezados = Object.keys(datos[0]);
    const lineas = [
      encabezados.join(','),
      ...datos.map(fila =>
        encabezados
          .map(campo => `"${String(fila[campo] || '').replace(/"/g, '""')}"`)
          .join(',')
      )
    ];
    const blob = new Blob([`\uFEFF${lineas.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `averias_resueltas_semana_cable_tartak_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast("¡Archivo CSV descargado exitosamente!", "success");
  };

  // =========================================================================
  // BOTÓN DINÁMICO DE RUTA EN MAPAS (TÉCNICOS)
  // =========================================================================
  // Colocar dentro de la tarjeta de la falla técnica en React
  const abrirUbicacionCliente = (direccionCompleta: string) => {
    // Codifica la dirección de texto para que sea compatible con un enlace web seguro
    const urlMapas = `https://google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`;
    // Abre una nueva pestaña del navegador directamente en Google Maps
    window.open(urlMapas, '_blank');
  };

  // =========================================================================
  // GESTIÓN DE INVENTARIO DE MATERIALES ÓPTICOS (DESCUENTOS & REABASTECIMIENTO)
  // =========================================================================

  const descontarMaterialesLocal = async (
    cable: number,
    conectores: number,
    ticketId?: string,
    ontCambiada?: boolean,
    asignacionPuerto?: { napId: string; puerto: number; serialOnt: string; macOnt: string; oltNombre: string; frame: string; slot: string; pon: string; onuId: string; potenciaOpticaDbm: string }
  ): Promise<boolean> => {
    const mCable = Number(cable) || 0;
    const mConectores = Number(conectores) || 0;
    try {
      const response = await fetch(`${apiUrl}/despachar-materiales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cableGastado: mCable, conectoresGastados: mConectores, ticketId, ontCambiada, asignacionPuerto })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el despacho.');
      setInventario(data.inventario);
      setDespachosMateriales(data.despachos);
      if (data.fallas) setFallas(data.fallas);
      if (data.ordenesInstalacion) setOrdenesInstalacion(data.ordenesInstalacion);
      if (data.cajasNap) setCajasNap(data.cajasNap);
      if (data.clientes) setClientes(data.clientes);
      return true;
    } catch {
      addToast('No se registró el consumo de materiales. Verifique la conexión y el inventario.', 'error');
      return false;
    }
  };

  const handleReabastecerStock = async (id: string, cantidadSumar: number) => {
    try {
      const res = await fetch(`${apiUrl}/inventario/reabastecer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, cantidadSumar })
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.mensaje || "Stock reabastecido", "success");
        cargarDatosServidor();
        return;
      }
    } catch {
      // fallback
    }
    setInventario(prev => prev.map(item => {
      if (item.id === id) {
        const nuevo = item.cantidad + cantidadSumar;
        return {
          ...item,
          cantidad: nuevo,
          alertaCompra: nuevo < item.umbralMinimoAlerta,
          ultimoReabastecimiento: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));
    addToast(`Stock de material reabastecido (+${cantidadSumar})`, "success");
  };

  // =========================================================================
  // PROYECTO 2: COMPONENTE DE CIERRE TÉCNICO CON INVENTARIO
  // =========================================================================
  // Componente de React para el cierre técnico del ticket
  function CierreTicketMateriales({
    ticketId,
    onFinalizado
  }: {
    ticketId?: string;
    onFinalizado?: () => void;
  } = {}) {
    const [metrosCable, setMetrosCable] = useState<number | string>(0);
    const [conectores, setConectores] = useState<number | string>(2);
    const [ontCambio, setOntCambio] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const finalizarTrabajoConInventario = async () => {
      setIsSending(true);
      const saved = await descontarMaterialesLocal(Number(metrosCable), Number(conectores), ticketId, ontCambio);
      setIsSending(false);
      if (!saved) return;

      alert("¡Ticket cerrado y materiales descontados del inventario de Cable Tartak!");
      if (onFinalizado) {
        onFinalizado();
      }
    };

    return (
      <div className="bg-slate-50 p-4 rounded-xl border mt-4 space-y-3 text-slate-800 shadow-inner">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <span>🛠️ Reporte de Materiales Utilizados:</span>
          </h4>
          {ticketId && (
            <span className="text-[11px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
              {ticketId}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Metros Drop Usados:</label>
            <input 
              type="number" 
              value={metrosCable} 
              onChange={e => setMetrosCable(e.target.value)} 
              className="w-full border p-1 rounded text-sm bg-white text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500" 
              min="0"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Conectores Mecánicos:</label>
            <input 
              type="number" 
              value={conectores} 
              onChange={e => setConectores(e.target.value)} 
              className="w-full border p-1 rounded text-sm bg-white text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500" 
              min="0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
          <input 
            type="checkbox" 
            id={`chk-ont-${ticketId || 'form'}`} 
            checked={ontCambio} 
            onChange={e => setOntCambio(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor={`chk-ont-${ticketId || 'form'}`} className="text-xs text-gray-600 cursor-pointer">
            ¿Se cambió equipo ONT / Módem GPON al cliente? (-1 unidad de stock)
          </label>
        </div>

        <button 
          onClick={finalizarTrabajoConInventario} 
          disabled={isSending}
          className="w-full bg-emerald-600 text-white text-xs py-2 rounded font-bold hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
        >
          {isSending ? 'Inventariando y Cerrando...' : 'Cerrar Avería e Inventariar'}
        </button>
      </div>
    );
  }

  // =========================================================================
  // GESTIÓN Y EDICIÓN DE PUNTOS DE CAJAS NAP (CREAR, EDITAR, ELIMINAR)
  // =========================================================================
  const handleAbrirCrearCajaNap = () => {
    setCajaAEditar(null);
    setModoModalCajaNap('crear');
    let maxNum = 0;
    cajasNap.forEach(c => {
      const match = c.id.match(/NAP-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextId = `NAP-${String(maxNum + 1).padStart(2, '0')}`;
    setCajaFormId(nextId);
    setCajaFormNombre(`${nextId} Nuevo Sector`);
    setCajaFormSector('');
    setCajaFormPoste('Poste #');
    setCajaFormCoordenadas('');
    setCajaFormPuertosTotales(16);
    setCajaFormPuertosOcupados(0);
    setCajaFormPotenciaDbm(-19.0);
    setCajaFormEstado('Operativa');
    setCajaFormNotas('Splitter óptico balanceado en poste principal.');
    setMostrarModalCajaNap(true);
  };

  const handleAbrirEditarCajaNap = (caja: CajaNap) => {
    setCajaAEditar(caja);
    setModoModalCajaNap('editar');
    setCajaFormId(caja.id);
    setCajaFormNombre(caja.nombre);
    setCajaFormSector(caja.sector);
    setCajaFormPoste(caja.ubicacionPoste);
    setCajaFormCoordenadas(caja.coordenadas || '');
    setCajaFormPuertosTotales(caja.puertosTotales || 16);
    setCajaFormPuertosOcupados(caja.puertosOcupados || 0);
    setCajaFormPotenciaDbm(caja.potenciaEntradaDbm || -19.0);
    setCajaFormEstado(caja.estado || 'Operativa');
    setCajaFormNotas(caja.notas || '');
    setMostrarModalCajaNap(true);
  };

  const handleGuardarCajaNap = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNap(true);
    if (cajaFormCoordenadas.trim() && !parseNapCoordinates(cajaFormCoordenadas)) {
      addToast('Las coordenadas deben tener latitud y longitud válidas, por ejemplo: 10.52, -66.10.', 'error');
      setIsSavingNap(false);
      return;
    }

    if (modoModalCajaNap === 'crear') {
      const fallbackId = cajaFormId.trim().toUpperCase() || `NAP-${String(cajasNap.length + 1).padStart(2, '0')}`;
      const nuevaCajaPayload = {
        id: fallbackId,
        nombre: cajaFormNombre.trim(),
        sector: cajaFormSector.trim(),
        ubicacionPoste: cajaFormPoste.trim() || 'Poste sin registrar',
        coordenadas: cajaFormCoordenadas.trim(),
        puertosTotales: Number(cajaFormPuertosTotales) || 16,
        puertosOcupados: Math.min(Number(cajaFormPuertosOcupados) || 0, Number(cajaFormPuertosTotales) || 16),
        potenciaEntradaDbm: Number(cajaFormPotenciaDbm) || -19.0,
        estado: cajaFormEstado,
        notas: cajaFormNotas.trim()
      };

      try {
        const res = await fetch(`${apiUrl}/cajas-nap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaCajaPayload)
        });
        const data = await res.json();
        if (res.ok && data.caja) {
          setCajasNap(prev => [...prev, data.caja]);
          addToast(`¡Caja NAP "${data.caja.nombre}" (${data.caja.id}) agregada con éxito!`, "success");
        } else {
          const fallbackCaja: CajaNap = {
            ...nuevaCajaPayload
          };
          setCajasNap(prev => [...prev, fallbackCaja]);
          addToast(`Caja NAP "${fallbackCaja.nombre}" agregada exitosamente`, "success");
        }
      } catch (err) {
        console.warn("Agregando caja NAP localmente:", err);
        const fallbackCaja: CajaNap = {
          ...nuevaCajaPayload
        };
        setCajasNap(prev => [...prev, fallbackCaja]);
        addToast(`Caja NAP "${fallbackCaja.nombre}" registrada`, "success");
      }
    } else {
      if (!cajaAEditar) {
        setIsSavingNap(false);
        return;
      }
      const updatedCaja: CajaNap = {
        ...cajaAEditar,
        nombre: cajaFormNombre.trim(),
        sector: cajaFormSector.trim(),
        ubicacionPoste: cajaFormPoste.trim(),
        coordenadas: cajaFormCoordenadas.trim(),
        puertosTotales: Number(cajaFormPuertosTotales) || 16,
        puertosOcupados: cajaAEditar.asignacionesPuertos
          ? cajaAEditar.asignacionesPuertos.filter(port => port.estado === 'Ocupado').length
          : Math.min(Number(cajaFormPuertosOcupados) || 0, Number(cajaFormPuertosTotales) || 16),
        asignacionesPuertos: cajaAEditar.asignacionesPuertos
          ? puertosDeCaja({ ...cajaAEditar, puertosTotales: Number(cajaFormPuertosTotales) || 16 })
          : undefined,
        potenciaEntradaDbm: Number(cajaFormPotenciaDbm) || -19.0,
        estado: cajaFormEstado,
        notas: cajaFormNotas.trim()
      };

      try {
        const res = await fetch(`${apiUrl}/cajas-nap/${encodeURIComponent(cajaAEditar.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCaja)
        });
        if (res.ok) {
          addToast(`Caja NAP "${updatedCaja.nombre}" actualizada con éxito`, "success");
        }
      } catch (err) {
        console.warn("Actualizando localmente caja NAP:", err);
      }

      setCajasNap(prev => prev.map(c => c.id === cajaAEditar.id ? updatedCaja : c));
      addToast(`Puntos de la Caja NAP ${updatedCaja.id} modificados exitosamente`, "success");
    }

    setIsSavingNap(false);
    setMostrarModalCajaNap(false);
    setCajaAEditar(null);
  };

  const handleConfirmarEliminarCajaNap = (caja: CajaNap) => {
    setCajaAEliminar(caja);
  };

  const handleEjecutarEliminarCajaNap = async () => {
    if (!cajaAEliminar) return;
    setIsDeletingNap(true);
    const idToDelete = cajaAEliminar.id;
    const nombreToDelete = cajaAEliminar.nombre;

    try {
      const res = await fetch(`${apiUrl}/cajas-nap/${encodeURIComponent(idToDelete)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar la caja NAP.');
      addToast(`Caja NAP "${nombreToDelete}" eliminada correctamente`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'No se pudo eliminar la caja NAP.', 'error');
      setIsDeletingNap(false);
      return;
    }

    setCajasNap(prev => prev.filter(c => c.id !== idToDelete));
    setIsDeletingNap(false);
    setCajaAEliminar(null);
    addToast(`Caja NAP ${idToDelete} removida del sistema`, "info");
  };

  const cajasNapFiltradas = useMemo(() => {
    return cajasNap.filter(caja => {
      const matchBusqueda =
        !busquedaNap.trim() ||
        caja.nombre.toLowerCase().includes(busquedaNap.toLowerCase()) ||
        caja.id.toLowerCase().includes(busquedaNap.toLowerCase()) ||
        caja.sector.toLowerCase().includes(busquedaNap.toLowerCase()) ||
        caja.ubicacionPoste.toLowerCase().includes(busquedaNap.toLowerCase());

      const matchEstado = filtroEstadoNap === 'todos' || caja.estado === filtroEstadoNap;

      return matchBusqueda && matchEstado;
    });
  }, [cajasNap, busquedaNap, filtroEstadoNap]);

  const handleAsignarTecnicoOrden = async (ordenId: string, tecnicoUsuario: string) => {
    try {
      const response = await fetch(`${apiUrl}/ordenes-instalacion/${encodeURIComponent(ordenId)}/asignar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tecnicoUsuario })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo asignar la orden.');
      setOrdenesInstalacion(current => current.map(order => order.id === ordenId ? data.orden : order));
      addToast(tecnicoUsuario ? 'Instalación asignada al técnico.' : 'Instalación devuelta a la cola general.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo asignar la orden.', 'error');
      cargarDatosServidor();
    }
  };

  const handleIniciarOrdenInstalacion = async (ordenId: string) => {
    try {
      const response = await fetch(`${apiUrl}/ordenes-instalacion/${encodeURIComponent(ordenId)}/iniciar`, { method: 'PUT' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar la instalación.');
      setOrdenesInstalacion(current => current.map(order => order.id === ordenId ? data.orden : order));
      addToast(`Trabajo iniciado para la orden ${ordenId}.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo iniciar la instalación.', 'error');
    }
  };

  const handleCompletarOrdenInstalacion = async (ordenId: string) => {
    const order = ordenesInstalacion.find(item => item.id === ordenId);
    if (!order) return;
    const matchingBox = cajasNap.find(box => box.estado === 'Operativa' && (
      order.sectorNap.toLowerCase().includes(box.id.toLowerCase()) ||
      box.sector.toLowerCase() === order.sectorNap.toLowerCase()
    ));
    setOrdenACompletar(order);
    setNapInstalacionId(matchingBox?.id || '');
    setPuertoInstalacion('');
    setSerialOntInstalacion('');
    setMacOntInstalacion('');
    setOltNombreInstalacion('');
    setFrameInstalacion('');
    setSlotInstalacion('');
    setPonInstalacion('');
    setOnuIdInstalacion('');
    setPotenciaInstalacion('');
    setMetrosInstalacion('45');
    setConectoresInstalacion('2');
  };

  const guardarInstalacionFisica = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ordenACompletar) return;
    if (!napInstalacionId || !puertoInstalacion || serialOntInstalacion.trim().length < 6) {
      addToast('Selecciona una NAP, un puerto libre e indica el serial de la ONT.', 'error');
      return;
    }
    setIsSavingInstallation(true);
    const saved = await descontarMaterialesLocal(
      Number(metrosInstalacion),
      Number(conectoresInstalacion),
      ordenACompletar.id,
      false,
      {
        napId: napInstalacionId,
        puerto: Number(puertoInstalacion),
        serialOnt: serialOntInstalacion.trim(),
        macOnt: macOntInstalacion.trim(),
        oltNombre: oltNombreInstalacion.trim(),
        frame: frameInstalacion.trim(),
        slot: slotInstalacion.trim(),
        pon: ponInstalacion.trim(),
        onuId: onuIdInstalacion.trim(),
        potenciaOpticaDbm: potenciaInstalacion
      }
    );
    setIsSavingInstallation(false);
    if (!saved) return;
    addToast(`Instalación guardada: ${ordenACompletar.nombreCliente}, ${napInstalacionId} puerto ${puertoInstalacion}.`, 'success');
    setOrdenACompletar(null);
  };

  const handleAprobarSolicitudServicio = async (requestId: string) => {
    try {
      const response = await fetch(`${apiUrl}/solicitudes-servicio/${encodeURIComponent(requestId)}/aprobar`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo aprobar la solicitud.');
      setSolicitudesServicio(current => current.map(request => request.id === requestId ? data.solicitud : request));
      setClientes(current => [data.cliente, ...current]);
      setOrdenesInstalacion(current => [data.orden, ...current]);
      setNotificacionesTecnicos(current => [data.notificacion, ...current]);
      addToast(`Solicitud aprobada. Cliente y orden ${data.orden.id} creados.`, 'success');
      cargarDatosServidor();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo aprobar la solicitud.', 'error');
    }
  };

  const handleRechazarSolicitudServicio = async (requestId: string) => {
    const reason = window.prompt('Motivo del rechazo (opcional):');
    if (reason === null) return;
    try {
      const response = await fetch(`${apiUrl}/solicitudes-servicio/${encodeURIComponent(requestId)}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo rechazar la solicitud.');
      setSolicitudesServicio(current => current.map(request => request.id === requestId ? data.solicitud : request));
      addToast('Solicitud rechazada y guardada.', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo rechazar la solicitud.', 'error');
    }
  };

  // Cálculos estadísticos para el panel de Dueño
  const estadisticas = useMemo(() => {
    const clientesOperativos = clientes.filter(c => !c.esClientePrueba);
    const totalClientes = clientesOperativos.length;
    const activos = clientesOperativos.filter(c => c.estado !== 'Suspendido').length;
    const suspendidos = clientesOperativos.filter(c => c.estado === 'Suspendido').length;
    const totalFallas = fallas.length;
    const fallasPendientes = fallas.filter(f => f.estado !== 'Resuelto').length;
    const fallasResueltas = fallas.filter(f => f.estado === 'Resuelto').length;
    
    // Distribución dinámica por plan
    const distribucionPlanes = planes.map(p => {
      const cantidad = clientesOperativos.filter(c =>
        c.plan.toLowerCase() === p.nombre.toLowerCase() ||
        c.plan.toLowerCase().includes(p.nombre.toLowerCase()) ||
        p.nombre.toLowerCase().includes(c.plan.toLowerCase())
      ).length;
      return {
        ...p,
        cantidad,
        ingresosPlan: cantidad * p.precio
      };
    });

    const bronce = clientesOperativos.filter(c => c.plan.includes('Bronce')).length;
    const plata = clientesOperativos.filter(c => c.plan.includes('Plata')).length;
    const oro = clientesOperativos.filter(c => c.plan.includes('Oro')).length;

    // Métricas de cobranza en oficina y deuda acumulada
    const totalDeudaPorCobrar = clientesOperativos.reduce((acc, c) => acc + (c.montoDeuda || 0), 0);
    const totalCobradoOficina = clientesOperativos.reduce((acc, c) => {
      const pagosCli = (c.historialPagos || []).reduce((pAcc, p) => pAcc + (p.monto || 0), 0);
      return acc + pagosCli;
    }, 0);

    // Ingresos mensuales contratados dinámicos sumando la mensualidad de cada cliente
    const ingresosMensuales = clientesOperativos.reduce((acc, c) => acc + (c.costoMensualPlan || 25), 0);

    return {
      totalClientes,
      activos,
      suspendidos,
      totalFallas,
      fallasPendientes,
      fallasResueltas,
      bronce,
      plata,
      oro,
      distribucionPlanes,
      ingresosMensuales,
      totalDeudaPorCobrar,
      totalCobradoOficina
    };
  }, [clientes, fallas, planes]);

  // Render para usuarios no autenticados (Login simulación)
  if (!isLogged) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
        {/* Fondo decorativo fibra óptica */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-cyan-500 rounded-full blur-[140px]" />
        </div>

        {/* Toasts */}
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-3 ${
                t.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
                  : t.type === 'error'
                  ? 'bg-rose-950/90 text-rose-200 border-rose-700/50'
                  : 'bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === 'info' && <Radio className="w-4 h-4 text-blue-400 shrink-0" />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/20 mb-3">
              <Wifi className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
              NEXFIBER WEB
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Plataforma Central de Gestión ISP FTTH & OLT
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800/80 space-y-5"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Usuario del Sistema
                </label>
                <span className="text-[11px] text-blue-400">dueño / admin / tecnico</span>
              </div>
              <input
                type="text"
                placeholder="Ej: dueño, admin, tecnico"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                className="w-full bg-slate-950/80 border border-slate-700/80 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contraseña
                </label>
                <span className="text-[11px] text-amber-400 font-mono">Clave fija: 123</span>
              </div>
              <input
                type="password"
                placeholder="Contraseña (123)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar al Sistema</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Selector rápido de perfiles de demostración */}
            <div className="pt-3 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 text-center mb-2.5 font-medium">
                Acceso Rápido con 1 Clic (Modo Demo):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('dueño')}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold py-2 px-2 rounded-lg border border-slate-700 transition-all text-center cursor-pointer hover:border-amber-500/50"
                >
                  👑 Dueño
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold py-2 px-2 rounded-lg border border-slate-700 transition-all text-center cursor-pointer hover:border-blue-500/50"
                >
                  💼 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('tecnico')}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold py-2 px-2 rounded-lg border border-slate-700 transition-all text-center cursor-pointer hover:border-emerald-500/50"
                >
                  🛠️ Técnico
                </button>
              </div>
            </div>
          </form>

          <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Servidor Central FTTH Listo • NEXFIBER v2.4</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden min-h-0">
      {/* ================================================================= */}
      {/* MENÚ LATERAL DE ACCESO SEGÚN ROL */}
      {/* ================================================================= */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none overflow-y-auto min-h-0">
        <div>
          {/* Header Marca */}
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl shadow-md shadow-blue-500/20 text-white">
                <Wifi className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wider text-white">
                  NEXFIBER
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  Fiber ISP Network
                </span>
              </div>
            </div>

            {/* Insignia de Sesión */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  userRole === 'dueño' ? 'bg-amber-400' : userRole === 'admin' ? 'bg-blue-400' : 'bg-emerald-400'
                }`} />
                <span className="text-xs text-slate-300 font-medium capitalize">
                  {userRealName || userRole}
                </span>
              </div>
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md font-bold ${
                userRole === 'dueño'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : userRole === 'admin'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {userRole === 'dueño' ? 'Acceso Total' : userRole === 'admin' ? 'Oficina' : 'Campo'}
              </span>
            </div>
          </div>

          {/* Navegación por Roles */}
          <nav className="p-4 space-y-1.5">
            {/* Solo Dueño tiene acceso a vista de métricas completas */}
            {userRole === 'dueño' && (
              <>
                <button
                  onClick={() => setSeccionActual('dashboard')}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    seccionActual === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>📊 Panel General (Dueño)</span>
                </button>

                <button
                  onClick={() => setSeccionActual('personal')}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    seccionActual === 'personal'
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>👑 Gestión de Personal</span>
                </button>
              </>
            )}

            {(userRole === 'admin' || userRole === 'dueño') && (
              <>
                <p className="px-3 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Comercial</p>
                <button
                  onClick={() => setSeccionActual('sitio-web')}
                  className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    seccionActual === 'sitio-web'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>Sitio web</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Planes y cobertura</span>
                </button>
              </>
            )}

            {/* Admin y Dueño pueden Cargar Clientes */}
            {(userRole === 'admin' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('registrar')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'registrar'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>👥 Cargar Clientes</span>
                </div>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {clientes.length}
                </span>
              </button>
            )}

            {(userRole === 'admin' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('solicitudes')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'solicitudes'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-3"><Bell className="h-4 w-4 text-cyan-300" />Solicitudes</span>
                {solicitudesServicio.filter(request => request.estado === 'PENDIENTE').length > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {solicitudesServicio.filter(request => request.estado === 'PENDIENTE').length}
                  </span>
                )}
              </button>
            )}

            {(userRole === 'admin' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('integraciones')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'integraciones'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 shrink-0 text-violet-400" />
                  <span>🔌 Integraciones</span>
                </div>
                <span className="text-[11px] bg-slate-800 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  {integrationsStatus.filter(item => item.configured).length}/{integrationsStatus.length || 5}
                </span>
              </button>
            )}

            {/* Admin y Dueño: Módulo de Consulta de Deuda y Cobranza en Oficina */}
            {(userRole === 'admin' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('cobranzas')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'cobranzas'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>💳 Consulta Deuda / Caja</span>
                </div>
                {clientes.filter(c => (c.montoDeuda || 0) > 0).length > 0 && (
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    {clientes.filter(c => (c.montoDeuda || 0) > 0).length} pendientes
                  </span>
                )}
              </button>
            )}

            {/* Admin y Dueño: módulo de revisión manual de comprobantes */}
            {(userRole === 'admin' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('pagos')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'pagos'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>📱 Taquilla Virtual (Pagos)</span>
                </div>
                {pagosVirtuales.filter(p => p.estado === 'PENDIENTE').length > 0 && (
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                    {pagosVirtuales.filter(p => p.estado === 'PENDIENTE').length} nuevos
                  </span>
                )}
              </button>
            )}

            {/* Admin y Dueño: Módulo de Gestión de Planes (Precios, Nombres, Quitar o Anexar) */}
            {(userRole === 'admin' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('planes')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'planes'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>⚡ Gestión de Planes</span>
                </div>
                <span className="text-[11px] bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  {planes.length}
                </span>
              </button>
            )}

            {/* Técnico y Dueño pueden ver Órdenes Técnicas */}
            {(userRole === 'tecnico' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('tareas')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'tareas'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>🛠️ Órdenes Técnicas</span>
                </div>
                {fallas.filter(f => f.estado !== 'Resuelto').length > 0 && (
                  <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                    {fallas.filter(f => f.estado !== 'Resuelto').length}
                  </span>
                )}
              </button>
            )}

            {/* Módulo de Inventario de Materiales Ópticos (Dueño, Admin y Técnico) */}
            {(userRole === 'admin' || userRole === 'dueño' || userRole === 'tecnico') && (
              <button
                onClick={() => setSeccionActual('inventario')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'inventario'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>📊 Inventario Óptico</span>
                </div>
                {(inventario.find(i => i.categoria === 'Cable Drop')?.cantidad || 0) < 500 ? (
                  <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse shadow-md shadow-red-600/40">
                    🚨 ALERTA
                  </span>
                ) : (
                  <span className="text-[11px] bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    {inventario.find(i => i.categoria === 'Cable Drop')?.cantidad || 0}m
                  </span>
                )}
              </button>
            )}

            {/* Admin y Dueño: Módulo de Cajas NAP (Puntos y Terminales Ópticas) */}
            {(userRole === 'admin' || userRole === 'dueño') && (
              <button
                onClick={() => setSeccionActual('cajas-nap')}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  seccionActual === 'cajas-nap'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>🌐 Cajas NAP (Puntos)</span>
                </div>
                <span className="text-[11px] bg-slate-800 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  {cajasNap.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setSeccionActual('reportes')}
              className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                seccionActual === 'reportes'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-cyan-300" />
              <span>📄 Reportes</span>
            </button>
          </nav>
        </div>

        {/* Footer Menú Lateral: Estado Conexión & Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Indicador de Conexión Servidor */}
          <div
            onClick={() => setShowApiModal(true)}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
            title="Haga clic para ver o cambiar la URL del servidor API"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="truncate">
                <p className="text-[11px] font-semibold text-slate-300 truncate">
                  {!apiUrl ? 'Modo Local' : apiUrl.startsWith('/') ? 'Servidor Integrado' : 'Servidor Central'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{apiUrl || 'Sin conexión API configurada'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
          </div>

          <button
            onClick={() => {
              onLogout();
              addToast('Sesión finalizada', 'info');
            }}
            className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-300 hover:text-white p-2.5 rounded-xl text-xs font-bold transition-all border border-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      {/* ================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-950 overflow-hidden">
        {/* Barra superior de estado y acciones */}
        <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {seccionActual === 'dashboard' && '📊 Panel Central del Dueño'}
              {seccionActual === 'sitio-web' && '🌐 Gestión del Sitio Web'}
              {seccionActual === 'solicitudes' && '📬 Solicitudes: clientes nuevos y pagos móviles'}
              {seccionActual === 'integraciones' && '🔌 Integraciones con software de cobranza y gestión'}
              {seccionActual === 'registrar' && '👥 Oficina Central: Cargar Clientes y Pre-carga de Contratos'}
              {seccionActual === 'cobranzas' && '💳 Taquilla de Oficina: Consulta de Deuda y Cobranza'}
              {seccionActual === 'pagos' && '📱 Validación de Taquilla Virtual (Comprobantes Móviles)'}
              {seccionActual === 'planes' && '⚡ Catálogo de Planes y Tarifas FTTH'}
              {seccionActual === 'tareas' && '🛠️ Módulo de Reparación en Campo (FTTH)'}
              {seccionActual === 'inventario' && '📦 Tablero de Control de Inventario de Materiales Ópticos'}
              {seccionActual === 'cajas-nap' && '🌐 Gestión de Cajas NAP (Puntos y Splitters Ópticos)'}
              {seccionActual === 'reportes' && '📄 Reportes de averías'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Campana de Notificaciones para Técnicos y Administradores */}
            <button
              onClick={() => setMostrarNotificacionesModal(true)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center border border-slate-700 cursor-pointer"
              title="Notificaciones de Clientes Nuevos (Instalación de Fibra)"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {ordenesInstalacion.filter(o => o.estado !== 'Instalado').length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                  {ordenesInstalacion.filter(o => o.estado !== 'Instalado').length}
                </span>
              )}
            </button>
            <button
              onClick={() => cargarDatosServidor()}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
              title="Sincronizar datos con el servidor central"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Actualizar'}</span>
            </button>

            {/* Botón rápido para reportar falla */}
            <button
              onClick={() => setMostrarCrearFalla(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Reportar Avería</span>
            </button>

          </div>
        </header>

        {/* Notificaciones Toasts flotantes */}
        <div className="fixed top-20 right-8 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 border transition-all animate-in fade-in slide-in-from-top-3 ${
                t.type === 'success'
                  ? 'bg-emerald-950 text-emerald-200 border-emerald-700/60 shadow-emerald-950/40'
                  : t.type === 'error'
                  ? 'bg-rose-950 text-rose-200 border-rose-700/60 shadow-rose-950/40'
                  : 'bg-slate-900 text-slate-200 border-slate-700 shadow-black/40'
              }`}
            >
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === 'info' && <Radio className="w-4 h-4 text-cyan-400 shrink-0" />}
              <span className="flex-1">{t.message}</span>
            </div>
          ))}
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 p-8 overflow-y-auto">
          {seccionActual === 'solicitudes' && (
            <section className="mx-auto max-w-7xl space-y-6">
              <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Solicitudes</p>
                    <h1 className="mt-2 text-2xl font-black text-white">Clientes nuevos y pagos móviles</h1>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSeccionActual('registrar')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Cliente nuevo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeccionActual('pagos')}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                    >
                      Revisar pago móvil
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  Aquí centralizas lo que llega desde el portal del cliente: alta de servicio para nuevos clientes y comprobantes de pago móvil en revisión.
                </p>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Solicitudes pendientes</p>
                  <h2 className="mt-3 text-3xl font-black text-white">{solicitudesServicio.filter(r => r.estado === 'PENDIENTE').length}</h2>
                  <p className="mt-2 text-xs text-slate-400">Altas de instalación por revisar.</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pagos pendientes</p>
                  <h2 className="mt-3 text-3xl font-black text-white">{pagosVirtuales.filter(p => p.estado === 'PENDIENTE').length}</h2>
                  <p className="mt-2 text-xs text-slate-400">Comprobantes esperando validación.</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Acciones rápidas</p>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => setSeccionActual('registrar')}
                      className="flex w-full items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-left text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
                    >
                      <span>Registrar cliente nuevo</span>
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeccionActual('pagos')}
                      className="flex w-full items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-left text-sm font-semibold text-blue-200 hover:bg-blue-500/20"
                    >
                      <span>Validar pago móvil</span>
                      <Receipt className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Solicitudes de instalación</h3>
                    <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      {solicitudesServicio.filter(r => r.estado === 'PENDIENTE').length} pendientes
                    </span>
                  </div>

                  {solicitudesServicio.filter(r => r.estado === 'PENDIENTE').length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
                      No hay solicitudes nuevas por revisar.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {solicitudesServicio.filter(r => r.estado === 'PENDIENTE').map(request => (
                        <div key={request.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">{request.id}</p>
                              <h4 className="mt-1 text-base font-bold text-white">{request.nombre}</h4>
                            </div>
                            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-200">
                              {request.estado}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2 text-sm text-slate-300">
                            <p className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-400" /> Cédula: {request.cedula}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-400" /> {request.telefono}</p>
                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-400" /> {request.direccion}</p>
                            <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-blue-400" /> {request.planNombre}</p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAprobarSolicitudServicio(request.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRechazarSolicitudServicio(request.id)}
                              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Pagos móviles en revisión</h3>
                    <span className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                      {pagosVirtuales.filter(p => p.estado === 'PENDIENTE').length} pendientes
                    </span>
                  </div>

                  {pagosVirtuales.filter(p => p.estado === 'PENDIENTE').length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
                      No hay comprobantes de pago móvil pendientes.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pagosVirtuales.filter(p => p.estado === 'PENDIENTE').map(pago => (
                        <div key={pago.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">{pago.id}</p>
                              <h4 className="mt-1 text-base font-bold text-white">{pago.nombreCliente}</h4>
                            </div>
                            <span className="text-lg font-black text-emerald-400">${pago.monto.toFixed(2)}</span>
                          </div>

                          <div className="mt-3 space-y-2 text-sm text-slate-300">
                            <p className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-400" /> {pago.banco} • Ref. {pago.referencia}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-400" /> C.I. {pago.cedula}</p>
                            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-400" /> {pago.fecha} • {pago.hora}</p>
                          </div>

                          {pago.comprobanteUrl && (
                            <div className="mt-3">
                              <img
                                src={pago.comprobanteUrl}
                                alt={`Comprobante ${pago.id}`}
                                className="h-32 w-full rounded-lg border border-slate-700 object-cover"
                              />
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAprobarPagoVirtual(pago)}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRechazarPagoVirtual(pago)}
                              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {seccionActual === 'sitio-web' && (userRole === 'dueño' || userRole === 'admin') && (
            <section className="mx-auto max-w-7xl space-y-6">
              <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Contenido comercial</p>
                  <h1 className="mt-2 text-2xl font-black text-white">Sitio web y atención al cliente</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">
                    Los precios salen del catálogo de planes y las zonas se basan en las cajas NAP registradas. Administra ambos desde aquí sin duplicar información.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="/cliente" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver portal cliente
                  </a>
                  <a href="/pago" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver pagos
                  </a>
                </div>
              </header>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="border-l-2 border-amber-400 bg-slate-900/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Planes activos</p>
                  <p className="mt-2 text-3xl font-black text-white">{planes.filter(plan => plan.activo).length}</p>
                  <p className="mt-1 text-xs text-slate-500">Publicables en solicitud de instalación</p>
                  <button type="button" onClick={() => setSeccionActual('planes')} className="mt-4 text-xs font-bold text-amber-300 hover:text-amber-200">Administrar precios</button>
                </div>
                <div className="border-l-2 border-cyan-400 bg-slate-900/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Zonas con NAP</p>
                  <p className="mt-2 text-3xl font-black text-white">{new Set(cajasNap.map(box => box.sector.trim()).filter(Boolean)).size}</p>
                  <p className="mt-1 text-xs text-slate-500">Sectores registrados en la red</p>
                  <button type="button" onClick={() => setSeccionActual('cajas-nap')} className="mt-4 text-xs font-bold text-cyan-300 hover:text-cyan-200">Administrar cobertura</button>
                </div>
                <div className="border-l-2 border-emerald-400 bg-slate-900/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Puertos disponibles</p>
                  <p className="mt-2 text-3xl font-black text-white">{cajasNap.reduce((total, box) => total + Math.max(0, box.puertosTotales - box.puertosOcupados), 0)}</p>
                  <p className="mt-1 text-xs text-slate-500">Capacidad registrada en cajas NAP</p>
                </div>
                <div className="border-l-2 border-blue-400 bg-slate-900/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Solicitudes pendientes</p>
                  <p className="mt-2 text-3xl font-black text-white">{solicitudesServicio.filter(request => request.estado === 'PENDIENTE').length}</p>
                  <p className="mt-1 text-xs text-slate-500">Nuevas instalaciones por revisar</p>
                  <button type="button" onClick={() => setSeccionActual('solicitudes')} className="mt-4 text-xs font-bold text-blue-300 hover:text-blue-200">Revisar solicitudes</button>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">Planes y precios</h2>
                      <p className="mt-1 text-xs text-slate-400">Fuente: catálogo de planes</p>
                    </div>
                    <button type="button" onClick={() => setSeccionActual('planes')} className="text-xs font-bold text-amber-300 hover:text-amber-200">Editar planes</button>
                  </div>
                  <div className="mt-4 divide-y divide-slate-800">
                    {planes.filter(plan => plan.activo).map(plan => (
                      <div key={plan.id} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{plan.nombre}</p>
                          <p className="text-xs text-slate-400">{plan.velocidad}</p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-emerald-300">${plan.precio.toFixed(2)} <span className="text-xs font-medium text-slate-500">/ mes</span></p>
                      </div>
                    ))}
                    {planes.filter(plan => plan.activo).length === 0 && <p className="py-5 text-sm text-slate-400">No hay planes activos para mostrar.</p>}
                  </div>
                </section>

                <section className="border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">Cobertura registrada</h2>
                      <p className="mt-1 text-xs text-slate-400">Disponibilidad según capacidad de cada NAP</p>
                    </div>
                    <button type="button" onClick={() => setSeccionActual('cajas-nap')} className="text-xs font-bold text-cyan-300 hover:text-cyan-200">Editar NAP</button>
                  </div>
                  <div className="mt-4 max-h-72 divide-y divide-slate-800 overflow-y-auto">
                    {cajasNap.map(box => {
                      const freePorts = Math.max(0, box.puertosTotales - box.puertosOcupados);
                      return (
                        <div key={box.id} className="flex items-center justify-between gap-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{box.sector || box.nombre}</p>
                            <p className="text-xs text-slate-400">{box.nombre} · {box.estado}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${freePorts > 0 && box.estado === 'Operativa' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                            {freePorts} puertos libres
                          </span>
                        </div>
                      );
                    })}
                    {cajasNap.length === 0 && <p className="py-5 text-sm text-slate-400">Registra las cajas NAP para organizar la cobertura por sector.</p>}
                  </div>
                </section>
              </div>

              <div className="border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-slate-300">
                Teléfono de atención y testimonios de clientes quedan pendientes de datos reales y autorizados. No se publican datos de ejemplo como si fueran información de la empresa.
              </div>
            </section>
          )}

          {seccionActual === 'integraciones' && (
            <section className="mx-auto max-w-6xl space-y-6">
              <header className="rounded-2xl border border-violet-800/60 bg-slate-900/90 p-6 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Integraciones</p>
                <h1 className="mt-2 text-2xl font-black text-white">Conectores de cobranza y gestión externa</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Esta capa permite preparar la conexión con sistemas como WispHub, WispGo, MacroWisp, DoWISP o ISP Gestión, sin depender todavía del software exacto que use el cliente.
                </p>
              </header>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {['WispHub', 'WispGo', 'MacroWisp', 'DoWISP', 'ISP Gestión'].map(provider => {
                  const current = integrationsStatus.find(item => item.name === provider);
                  const configured = Boolean(current?.configured);
                  return (
                    <div key={provider} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-white">{provider}</h3>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${configured ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                          {configured ? 'Listo' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">
                        {configured
                          ? `API configurada: ${current?.apiUrl || 'sin URL detectada'}`
                          : 'Falta la URL de la API del cliente para activar esta integración.'}
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/integrations/sync', {
                              method: 'POST',
                              credentials: 'same-origin',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ provider })
                            });
                            const data = await response.json();
                            if (!response.ok) throw new Error(data.message || 'No se pudo preparar la integración.');
                            alert(`${provider}: ${data.message}`);
                            const next = await fetch('/api/integrations/status', { credentials: 'same-origin' });
                            const status = await next.json();
                            setIntegrationsStatus(status.providers || []);
                          } catch (error) {
                            alert(error instanceof Error ? error.message : 'No se pudo preparar la integración.');
                          }
                        }}
                        className="mt-4 w-full rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/20"
                      >
                        Preparar conexión
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {seccionActual === 'reportes' && (
            <section className="mx-auto max-w-5xl space-y-6">
              <header>
                <h1 className="text-2xl font-black text-white">Reportes de averías</h1>
                <p className="mt-1 text-sm text-slate-400">Descarga las averías que el equipo técnico ya marcó como resueltas.</p>
              </header>

              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-800 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">Averías resueltas</p>
                  <p className="text-xs text-slate-400">{fallas.filter(falla => falla.estado === 'Resuelto').length} registros disponibles</p>
                </div>
                <span className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">Periodo semanal</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col items-start gap-4 border border-slate-800 bg-slate-900/70 p-5">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h2 className="font-bold text-white">Libro de Excel</h2>
                    <p className="mt-1 text-xs text-slate-400">Descarga el detalle de las averías resueltas en formato XLSX.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportarAveriasResueltasSemana('xlsx')}
                    disabled={isExporting || fallas.every(falla => falla.estado !== 'Resuelto')}
                    className="mt-auto rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isExporting ? 'Preparando...' : 'Descargar Excel (.xlsx)'}
                  </button>
                </div>

                <div className="flex flex-col items-start gap-4 border border-slate-800 bg-slate-900/70 p-5">
                  <Download className="h-5 w-5 text-cyan-400" />
                  <div>
                    <h2 className="font-bold text-white">Archivo CSV</h2>
                    <p className="mt-1 text-xs text-slate-400">Formato tabular compatible con hojas de cálculo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportarAveriasResueltasSemana('csv')}
                    disabled={isExporting || fallas.every(falla => falla.estado !== 'Resuelto')}
                    className="mt-auto rounded-md border border-slate-600 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Descargar CSV
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN 1: PRE-CARGA DE CONTRATOS (ADMIN / DUEÑO) */}
          {/* ============================================================= */}
          {seccionActual === 'registrar' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Oficina: Pre-carga de Contratos de Fibra
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Ingrese los datos del abonado para aprovisionar su plan en la OLT central y habilitar el puerto GPON.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Registro */}
                <form
                  onSubmit={handleGuardarCliente}
                  className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 h-fit sticky top-0"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Plus className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Nuevo Abonado</h3>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Cédula / Identificación *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: V-29881234"
                      value={nuevaCedula}
                      onChange={e => setNuevaCedula(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Laura Sofía Colmenares"
                      value={nuevoNombre}
                      onChange={e => setNuevoNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Plan de Velocidad *
                      </label>
                      <button
                        type="button"
                        onClick={() => setSeccionActual('planes')}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Gestionar Tarifas</span>
                      </button>
                    </div>
                    <select
                      value={nuevoPlan}
                      onChange={e => setNuevoPlan(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {planes.filter(p => p.activo).length === 0 ? (
                        <option value="Plan Bronce - 100 Mbps">Plan Bronce - 100 Mbps ($25.00/mes)</option>
                      ) : (
                        planes.filter(p => p.activo).map(p => (
                          <option key={p.id} value={p.nombre}>
                            ⚡ {p.nombre} ({p.velocidad}) - ${p.precio.toFixed(2)} USD/mes
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Campos adicionales de operación ISP */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Caja NAP / Sector
                      </label>
                      <select
                        value={nuevoSector}
                        onChange={e => setNuevoSector(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="Las Acacias (NAP-04)">Las Acacias (NAP-04)</option>
                        <option value="Centro Norte (NAP-01)">Centro Norte (NAP-01)</option>
                        <option value="El Parque (NAP-02)">El Parque (NAP-02)</option>
                        <option value="Los Pinos (NAP-08)">Los Pinos (NAP-08)</option>
                        <option value="San José (NAP-05)">San José (NAP-05)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Teléfono Contacto
                      </label>
                      <input
                        type="text"
                        placeholder="+58 412-..."
                        value={nuevoTelefono}
                        onChange={e => setNuevoTelefono(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Dirección de Instalación
                    </label>
                    <input
                      type="text"
                      placeholder="Calle, número de casa, punto de referencia"
                      value={nuevaDireccion}
                      onChange={e => setNuevaDireccion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Cliente</span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    Envía payload a: <span className="font-mono text-slate-400">/api/admin/pre-cargar-cliente</span>
                  </p>
                </form>

                {/* Lista de Clientes en el Sistema */}
                <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <span>Clientes en el sistema</span>
                        <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono">
                          {clientes.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Base de datos centralizada de suscriptores FTTH
                      </p>
                    </div>

                    {/* Filtros de búsqueda */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Buscar por cédula o nombre..."
                          value={busquedaCliente}
                          onChange={e => setBusquedaCliente(e.target.value)}
                          className="bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
                        />
                      </div>

                      <select
                        value={filtroPlan}
                        onChange={e => setFiltroPlan(e.target.value)}
                        className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer max-w-[150px]"
                      >
                        <option value="todos">Todos los planes</option>
                        {planes.map(p => (
                          <option key={p.id} value={p.nombre}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Listado con scroll */}
                  <div className="mt-4 divide-y divide-slate-800/80 overflow-y-auto max-h-[600px] pr-1">
                    {clientesFiltrados.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No se encontraron clientes</p>
                        <p className="text-xs mt-1">Verifique el filtro o registre un nuevo abonado en el formulario lateral.</p>
                      </div>
                    ) : (
                      clientesFiltrados.map((c, i) => (
                        <div
                          key={c.id || i}
                          className="py-3.5 px-3 rounded-xl hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0 mt-0.5">
                              {c.nombre.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                  {c.cedula}
                                </span>
                                <h4 className="font-bold text-sm text-white">{c.nombre}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  c.estado === 'Suspendido'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {c.estado || 'Activo'}
                                </span>
                                {c.esClientePrueba && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-200">Prueba · no facturar</span>}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1 text-blue-300 font-medium">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  {c.plan}
                                </span>
                                {c.sector && (
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <MapPin className="w-3 h-3 text-slate-500" />
                                    {c.sector}
                                  </span>
                                )}
                                {c.napId && <span className="font-mono text-cyan-300">{c.napId} · Puerto {c.puertoNap}</span>}
                                {c.serialOnt && <span className="font-mono text-slate-500">ONT {c.serialOnt}</span>}
                                {c.potenciaOpticaDbm && (
                                  <span className={`font-mono text-[11px] ${
                                    c.potenciaOpticaDbm < -27 ? 'text-rose-400' : 'text-emerald-400'
                                  }`}>
                                    Señal: {c.potenciaOpticaDbm} dBm
                                  </span>
                                )}
                                {c.historialOptico && c.historialOptico.length > 0 && (
                                  <span className="text-[10px] text-slate-500" title={c.historialOptico.slice(0, 5).map(reading => `${reading.fecha}: ${reading.potenciaOpticaDbm} dBm`).join('\n')}>
                                    {c.historialOptico.length} lecturas
                                  </span>
                                )}
                                {c.alertaOptica && <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">Revisar señal</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {/* Monto de deuda visible */}
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1 ${
                              (c.montoDeuda || 0) > 0
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              <DollarSign className="w-3 h-3" />
                              {(c.montoDeuda || 0) > 0 ? `Debe $${(c.montoDeuda || 0).toFixed(2)}` : 'Al Día ($0.00)'}
                            </span>

                            {/* Botón rápido para ir a cobrar en taquilla */}
                            <button
                              onClick={() => {
                                setCedulaConsulta(c.cedula);
                                setSeccionActual('cobranzas');
                                handleConsultarDeuda(undefined, c.cedula);
                              }}
                              className="text-xs bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Consultar factura y registrar pago en taquilla"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span className="hidden sm:inline">Cobrar</span>
                            </button>

                            {c.ipAsignada && (
                              <span className="font-mono text-[11px] text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 hidden md:inline">
                                {c.ipAsignada}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setFallaCedulaNueva(c.cedula);
                                setMostrarCrearFalla(true);
                              }}
                              className="text-xs bg-slate-800 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reportar avería técnica para este cliente"
                            >
                              <Wrench className="w-3 h-3" />
                              <span className="hidden sm:inline">Ticket</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN 2: ÓRDENES TÉCNICAS EN CAMPO (TÉCNICO / DUEÑO) */}
          {/* ============================================================= */}
          {seccionActual === 'tareas' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Módulo de Reparación en Campo</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      FTTH Field Tech
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Atención de cortes de fibra, luces LOS en rojo, rotura de acometidas drop y atenuación óptica.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar por cédula o detalle..."
                      value={busquedaFalla}
                      onChange={e => setBusquedaFalla(e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
                    />
                  </div>

                  <select
                    value={filtroEstadoFalla}
                    onChange={e => setFiltroEstadoFalla(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Todas las averías</option>
                    <option value="pendientes">Pendientes / En curso</option>
                    <option value="resueltos">Resueltas</option>
                  </select>

                </div>
              </div>

              <section className="border border-slate-800 bg-slate-900/70">
                <header className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">Diagnóstico rápido</h2>
                    <p className="mt-1 text-xs text-slate-400">Consulta la ficha de red del cliente por cédula.</p>
                  </div>
                  <form onSubmit={consultarDiagnosticoCliente} className="flex w-full gap-2 sm:max-w-md">
                    <input
                      value={diagnosticoCedula}
                      onChange={event => setDiagnosticoCedula(event.target.value.toUpperCase())}
                      maxLength={20}
                      required
                      placeholder="Cédula del cliente"
                      className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white placeholder:font-sans placeholder:text-slate-500"
                    />
                    <button type="submit" disabled={isConsultingDiagnostic} className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50">
                      <Search className="h-3.5 w-3.5" />
                      {isConsultingDiagnostic ? 'Consultando...' : 'Consultar'}
                    </button>
                  </form>
                </header>

                {diagnosticoError && <p role="alert" className="px-5 py-3 text-sm text-rose-300">{diagnosticoError}</p>}
                {diagnosticoCliente && (
                  <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-white">{diagnosticoCliente.nombre}</h3>
                        <span className="font-mono text-xs text-cyan-300">{diagnosticoCliente.cedula}</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${diagnosticoCliente.estadoServicio === 'Activo' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                          {diagnosticoCliente.esClientePrueba ? 'Cliente de prueba' : `Servicio ${diagnosticoCliente.estadoServicio}`}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <p className="text-slate-400">Zona <span className="block font-semibold text-white">{diagnosticoCliente.sector || 'Sin sector'}</span></p>
                        <p className="text-slate-400">Conexión física <span className="block font-semibold text-white">{diagnosticoCliente.napId ? `${diagnosticoCliente.napNombre || diagnosticoCliente.napId} · Puerto ${diagnosticoCliente.puertoNap || '?'}` : 'Sin NAP asignada'}</span></p>
                        <p className="text-slate-400">Estado NAP <span className="block font-semibold text-white">{diagnosticoCliente.estadoNap}</span></p>
                        <p className="text-slate-400">Serial ONT <span className="block font-mono font-semibold text-white">{diagnosticoCliente.serialOnt || 'No registrado'}</span></p>
                        <p className="text-slate-400 sm:col-span-2">OLT <span className="block font-mono text-xs text-slate-200">{diagnosticoCliente.olt || 'Posición lógica no registrada'}</span></p>
                      </div>
                      <div className="mt-4 border-l-2 border-amber-400 bg-amber-500/5 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Estado en vivo</p>
                        <p className="mt-1 text-xs text-slate-300">{diagnosticoCliente.estadoOntEnVivo}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Última potencia registrada</p>
                          <p className={`mt-1 text-2xl font-black ${diagnosticoCliente.potenciaOpticaDbm === null ? 'text-slate-500' : diagnosticoCliente.alertaOptica ? 'text-rose-300' : diagnosticoCliente.potenciaOpticaDbm <= -24 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {diagnosticoCliente.potenciaOpticaDbm === null ? 'Sin medición' : `${diagnosticoCliente.potenciaOpticaDbm} dBm`}
                          </p>
                        </div>
                        {diagnosticoCliente.fechaUltimaMedicion && <span className="text-[10px] text-slate-500">{new Date(diagnosticoCliente.fechaUltimaMedicion).toLocaleString('es-VE')}</span>}
                      </div>
                      {diagnosticoCliente.historialOptico.length > 1 && (
                        <div className="mt-2">
                          <svg viewBox="0 0 240 64" role="img" aria-label="Tendencia de mediciones ópticas recientes" className="h-20 w-full overflow-visible">
                            <line x1="0" y1="16" x2="240" y2="16" stroke="#334155" strokeDasharray="3 4" />
                            <line x1="0" y1="48" x2="240" y2="48" stroke="#334155" strokeDasharray="3 4" />
                            <polyline
                              fill="none"
                              stroke={diagnosticoCliente.alertaOptica ? '#fb7185' : '#34d399'}
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              points={[...diagnosticoCliente.historialOptico].reverse().map((reading, index, readings) => {
                                const x = readings.length === 1 ? 120 : index / (readings.length - 1) * 240;
                                const y = 8 + Math.min(48, Math.max(0, (-15 - reading.potenciaOpticaDbm) / 20 * 48));
                                return `${x},${y}`;
                              }).join(' ')}
                            />
                          </svg>
                          <p className="text-[10px] text-slate-500">Mediciones registradas, de más antigua a más reciente</p>
                        </div>
                      )}
                      <p className={`mt-3 text-xs ${diagnosticoCliente.alertaOptica ? 'text-rose-200' : 'text-slate-300'}`}>{diagnosticoCliente.recomendacion}</p>
                      <p className="mt-2 text-[10px] text-slate-500">La lectura proviene de una medición guardada por el técnico; no es telemetría automática.</p>
                    </div>
                  </div>
                )}
              </section>

              {/* ========================================================================= */}
              {/* NOTIFICACIONES DE NUEVOS CLIENTES PARA COLOCACIÓN DE FIBRA ÓPTICA (TÉCNICOS) */}
              {/* ========================================================================= */}
              <div className="bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-700/60 p-5 rounded-2xl shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-900/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600/20 text-cyan-400 border border-blue-500/30 rounded-xl">
                      <Bell className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base flex items-center gap-2">
                        <span>Avisos de Nuevas Instalaciones de Fibra Óptica</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                          {ordenesInstalacion.filter(o => o.estado !== 'Instalado').length} Pendientes
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        Cada vez que el Administrador agrega un nuevo cliente, se notifica de inmediato aquí con Nombre, Teléfono y Dirección para tender la fibra.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {ordenesInstalacion.map(orden => {
                    const isCompletado = orden.estado === 'Instalado';
                    const isEnProgreso = orden.estado === 'En Progreso';
                    return (
                      <div
                        key={orden.id}
                        className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between gap-3 ${
                          isCompletado
                            ? 'bg-slate-950/60 border-slate-800 opacity-75'
                            : isEnProgreso
                            ? 'bg-blue-950/60 border-blue-700/50 shadow-lg shadow-blue-950/20'
                            : 'bg-slate-900/95 border-cyan-700/50 shadow-lg shadow-cyan-950/20'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {orden.id} • {orden.cedula}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                              isCompletado
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isEnProgreso
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            }`}>
                              {orden.estado}
                            </span>
                          </div>

                          {userRole === 'dueño' || userRole === 'admin' ? (
                            <label className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                              <span className="shrink-0">Técnico asignado</span>
                              <select
                                value={orden.tecnicoAsignado && orden.tecnicoAsignado !== 'Equipo de Campo FTTH' ? orden.tecnicoAsignado : ''}
                                disabled={orden.estado !== 'Pendiente Por Instalar'}
                                onChange={event => handleAsignarTecnicoOrden(orden.id, event.target.value)}
                                className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white disabled:opacity-50"
                              >
                                <option value="">Cola general</option>
                                {tecnicosDisponibles.map(technician => (
                                  <option key={technician.usuario} value={technician.usuario}>{technician.nombre}</option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <p className="pt-1 text-[11px] text-slate-400">
                              Asignado a: <span className="text-cyan-300">{orden.tecnicoNombre || orden.tecnicoAsignado || 'Cola general'}</span>
                            </p>
                          )}

                          <div className="pt-1">
                            <span className="text-slate-400">👤 Nombre del Cliente:</span>{' '}
                            <strong className="text-white text-sm">{orden.nombreCliente}</strong>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">📞 Número de Contacto:</span>
                            <a 
                              href={`tel:${orden.telefonoCliente}`}
                              className="font-mono text-cyan-300 font-bold hover:underline flex items-center gap-1 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40"
                            >
                              <Phone className="w-3 h-3 text-cyan-400" />
                              <span>{orden.telefonoCliente}</span>
                            </a>
                          </div>

                          <div>
                            <span className="text-slate-400">🏠 Dirección de la Casa:</span>{' '}
                            <span className="text-slate-100 font-medium">{orden.direccionCasa}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 text-blue-300">
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>{orden.plan}</span>
                            </span>
                            <span>📍 {orden.sectorNap}</span>
                            <span>📅 {orden.fecha}</span>
                          </div>
                          {isCompletado && orden.napId && (
                            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-emerald-200">
                              {orden.napId} · Puerto {orden.puertoNap} · ONT {orden.serialOnt}
                              {orden.oltPon && <span className="block text-slate-400">OLT {orden.oltNombre || ''} · Frame {orden.oltFrame || '-'} / Slot {orden.oltSlot || '-'} / PON {orden.oltPon} / ONU {orden.onuId || '-'}</span>}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          {/* Botón dinámico solicitado: Abrir ubicación cliente en Google Maps */}
                          <button 
                            onClick={() => abrirUbicacionCliente(`${orden.direccionCasa}, ${orden.sectorNap}, Higuerote, Miranda`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            title="Abrir mapa de ruta en Google Maps"
                          >
                            <span>📍</span>
                            <span>Ver Mapa de Ruta</span>
                          </button>

                          {!isCompletado && !isEnProgreso ? (
                            <button
                              onClick={() => handleIniciarOrdenInstalacion(orden.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-md shadow-blue-600/20"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Iniciar trabajo</span>
                            </button>
                          ) : isEnProgreso ? (
                            <button
                              onClick={() => handleCompletarOrdenInstalacion(orden.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-md shadow-emerald-600/20"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Completar instalación</span>
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Fibra Instalada</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Fallas Técnicas */}
              <div className="space-y-4">
                {fallasFiltradas.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 p-12 rounded-2xl text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
                    <p className="text-base font-bold text-white">No hay averías de fibra reportadas</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                      La red de fibra óptica opera sin incidencias críticas en este momento.
                    </p>
                  </div>
                ) : (
                  fallasFiltradas.map((f, i) => {
                    const isResuelta = f.estado === 'Resuelto';
                    const isCritica = f.prioridad === 'Crítica';

                    return (
                      <div
                        key={f.id || i}
                        className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl transition-all ${
                          isResuelta
                            ? 'border-slate-800 border-l-4 border-l-emerald-500'
                            : isCritica
                            ? 'border-rose-900/60 border-l-4 border-l-rose-500 bg-rose-950/10'
                            : 'border-slate-800 border-l-4 border-l-amber-500'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-slate-950 text-cyan-400 px-2 py-0.5 rounded border border-slate-800">
                                {f.id || `INC-#${i + 1}`}
                              </span>
                              <span className="font-bold text-sm text-white">
                                Cédula Reportante: <strong className="text-cyan-300 font-mono">{f.cedula}</strong>
                              </span>
                              {f.nombreCliente && (
                                <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                                  {f.nombreCliente}
                                </span>
                              )}
                              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                                isResuelta
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : f.estado === 'En Revisión'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                              }`}>
                                {f.estado || 'Pendiente'}
                              </span>
                              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md font-bold ${
                                f.prioridad === 'Crítica'
                                  ? 'bg-rose-600 text-white'
                                  : f.prioridad === 'Alta'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-700 text-slate-200'
                              }`}>
                                Prioridad: {f.prioridad || 'Alta'}
                              </span>
                              {f.clasificacion && <span className="rounded-full border border-cyan-700/40 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-bold text-cyan-200">{f.clasificacion}</span>}
                            </div>

                            {/* Detalle del problema (exactamente como lo requiere el prompt) */}
                            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-sm">
                              <p className="text-slate-300">
                                <span className="text-slate-500 font-semibold mr-1">Detalle del problema:</span>
                                "{f.detalle}"
                              </p>
                              {f.notasTecnico && (
                                <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Solución técnica: {f.notasTecnico}</span>
                                </div>
                              )}
                            </div>

                            {/* Dirección de la casa donde se presenta la falla (Requerimiento Técnico) */}
                            {(() => {
                              const clienteAsoc = clientes.find(c => c.cedula === f.cedula);
                              const dirCasaFalla = f.direccionCasa || clienteAsoc?.direccion || (f.sector ? `${f.sector}, Higuerote` : 'Dirección del abonado en Higuerote');
                              const telCasaFalla = f.telefonoCliente || clienteAsoc?.telefono;
                              return (
                                <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
                                  <div className="flex items-start sm:items-center gap-2">
                                    <Home className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                                    <div>
                                      <span className="text-amber-400 font-bold mr-1.5">
                                        📍 Dirección de la casa con falla:
                                      </span>
                                      <span className="text-white font-medium">
                                        {dirCasaFalla}
                                      </span>
                                    </div>
                                  </div>
                                  {telCasaFalla && (
                                    <a
                                      href={`tel:${telCasaFalla}`}
                                      className="text-cyan-300 font-mono text-[11px] bg-slate-900/90 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                                      title="Llamar al cliente que reportó la falla"
                                    >
                                      <Phone className="w-3 h-3 text-cyan-400" />
                                      <span>{telCasaFalla}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Metadatos técnicos de campo */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
                              {f.sector && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{f.sector}</span>
                                </span>
                              )}
                              {f.potenciaOpticaDbm && (
                                <span className={`flex items-center gap-1 font-mono ${
                                  f.potenciaOpticaDbm < -27 ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                  <Activity className="w-3.5 h-3.5" />
                                  <span>Potencia Óptica: {f.potenciaOpticaDbm} dBm</span>
                                </span>
                              )}
                              {f.fechaReporte && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Reportado: {f.fechaReporte}</span>
                                </span>
                              )}
                              {f.tecnicoAsignado && (
                                <span className="flex items-center gap-1 text-blue-400 font-medium">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Técnico: {f.tecnicoAsignado}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Acciones para Técnicos */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0">
                            {/* Botón dinámico solicitado: Abrir ubicación cliente en Google Maps */}
                            <button 
                              onClick={() => {
                                const clienteAsoc = clientes.find(c => c.cedula === f.cedula);
                                const dirCompleta = clienteAsoc?.direccion 
                                  ? `${clienteAsoc.direccion}, ${f.sector || 'Higuerote, Miranda'}` 
                                  : (f.sector ? `${f.sector}, Higuerote, Miranda` : "Cable Tartak Sector El Centro, Calle 4, Higuerote, Miranda");
                                abrirUbicacionCliente(dirCompleta);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 shadow-md shadow-blue-600/20 transition cursor-pointer"
                              title="Abrir localización en Google Maps para llegar a la dirección del cliente"
                            >
                              <span>📍</span>
                              <span>Ver Mapa de Ruta</span>
                            </button>

                            {!isResuelta ? (
                              <>
                                <button
                                  onClick={() => {
                                    setFallaAResolver(f);
                                    setSolucionDetalle('Fibra drop re-fusionada con empalmadora de arco. Pérdida 0.02 dB.');
                                    setPotenciaFinalMedida('');
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Resolver en Campo</span>
                                </button>
                                <button
                                  onClick={() => setTicketMaterialesAbierto(ticketMaterialesAbierto === f.id ? null : (f.id || 'falla'))}
                                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Reportar consumo de materiales y cerrar ticket"
                                >
                                  <Package className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{ticketMaterialesAbierto === f.id ? 'Ocultar Insumos' : '📦 Reportar Materiales'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    addToast(`Simulando prueba OTDR en puerto del abonado ${f.cedula}: Enlace OK a 412 metros.`, 'info');
                                  }}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Probar reflectometría óptica"
                                >
                                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Test Señal ONT</span>
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Ticket Cerrado</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Formulario del Técnico al Cerrar una Avería (CierreTicketMateriales) */}
                        {ticketMaterialesAbierto === f.id && !isResuelta && (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <CierreTicketMateriales 
                              ticketId={f.id} 
                              onFinalizado={() => {
                                setTicketMaterialesAbierto(null);
                                cargarDatosServidor();
                              }} 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN 3: DASHBOARD GENERAL (DUEÑO) */}
          {/* ============================================================= */}
          {seccionActual === 'personal' && userRole === 'dueño' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">👑 Gestión de Personal</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Solo los dueños pueden crear y autorizar cuentas de acceso.
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4">Crear cuenta</h3>
                  <form className="space-y-3" onSubmit={handleCreateStaffAccount}>
                    <input type="text" placeholder="Nombre y apellido" value={newAccountName} onChange={event => setNewAccountName(event.target.value)} className="w-full border border-slate-700 bg-slate-950 p-2.5 rounded-lg text-sm text-white" required />
                    <input type="text" placeholder="Nombre de usuario" value={newAccountUsername} onChange={event => setNewAccountUsername(event.target.value)} autoComplete="off" className="w-full border border-slate-700 bg-slate-950 p-2.5 rounded-lg text-sm text-white" required />
                    <input type="password" placeholder="Contraseña (mínimo 10 caracteres)" value={newAccountPassword} onChange={event => setNewAccountPassword(event.target.value)} autoComplete="new-password" minLength={10} className="w-full border border-slate-700 bg-slate-950 p-2.5 rounded-lg text-sm text-white" required />
                    <select value={newAccountRole} onChange={event => setNewAccountRole(event.target.value as StaffAccount['rol'])} className="w-full border border-slate-700 bg-slate-950 p-2.5 rounded-lg text-sm text-white">
                      <option value="admin">Administrador (Oficina)</option>
                      <option value="tecnico">Técnico de Calle</option>
                      <option value="dueño">Dueño / Socio</option>
                    </select>
                    <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-lg text-sm transition">
                      Autorizar cuenta
                    </button>
                  </form>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold text-white">Cuentas autorizadas</h3>
                    <span className="text-xs text-slate-400">{accounts.length} cuentas</span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {accounts.map(account => (
                      <div key={account.id || account.usuario} className="grid gap-3 py-4 lg:grid-cols-[minmax(140px,1fr)_150px_120px_minmax(220px,1.4fr)_90px] lg:items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{account.nombre}</p>
                          <p className="text-xs text-slate-400">@{account.usuario}</p>
                        </div>
                        <select
                          value={account.rol}
                          disabled={!account.id || account.usuario === currentUsername}
                          onChange={event => handleUpdateStaffAccount(account, { rol: event.target.value as StaffAccount['rol'] })}
                          aria-label={`Rol de ${account.usuario}`}
                          className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white disabled:opacity-50"
                        >
                          <option value="dueño">Dueño</option>
                          <option value="admin">Administrador</option>
                          <option value="tecnico">Técnico</option>
                        </select>
                        <button
                          type="button"
                          disabled={!account.id || account.usuario === currentUsername}
                          onClick={() => handleUpdateStaffAccount(account, { activo: account.activo === false })}
                          className={`rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50 ${account.activo === false ? 'bg-slate-700 text-slate-200' : 'bg-emerald-500/15 text-emerald-300'}`}
                          title={account.usuario === currentUsername ? 'No puedes desactivar tu propia cuenta' : ''}
                        >
                          {account.activo === false ? 'Desactivada' : 'Activa'}
                        </button>
                        <form className="flex gap-2" onSubmit={event => { event.preventDefault(); handleResetStaffPassword(account); }}>
                          <input
                            type="password"
                            autoComplete="new-password"
                            minLength={10}
                            disabled={!account.id || account.usuario === currentUsername}
                            value={account.id ? accountPasswordDrafts[account.id] || '' : ''}
                            onChange={event => account.id && setAccountPasswordDrafts(current => ({ ...current, [account.id!]: event.target.value }))}
                            placeholder="Nueva clave (mín. 10)"
                            aria-label={`Nueva contraseña de ${account.usuario}`}
                            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white disabled:opacity-50"
                          />
                          <button type="submit" disabled={!account.id || account.usuario === currentUsername} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                            Restablecer
                          </button>
                        </form>
                        <button
                          type="button"
                          disabled={!account.id || account.usuario === currentUsername}
                          onClick={() => handleDeleteStaffAccount(account)}
                          className="rounded-md border border-rose-500/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                          title={account.usuario === currentUsername ? 'No puedes eliminar tu propia cuenta' : 'Eliminar acceso y cerrar sesiones'}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {seccionActual === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Supervisión de Operaciones y Facturación</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      Vista Dueño
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Resumen de abonados, cobranza, averías, capacidad FTTH y mediciones reportadas por el equipo.
                  </p>
                </div>

              </div>

              {/* Alertas manuales internas y detección por reportes de clientes */}
              <div className="bg-slate-900/90 border border-rose-900/40 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        Incidencias de sector y alertas internas
                      </h3>
                      <p className="text-xs text-slate-400">
                        Los reportes agrupados ayudan a revisar primero una posible incidencia común; el origen eléctrico debe confirmarse en campo.
                      </p>
                    </div>
                  </div>

                  {alertasMasivas.filter(a => a.activo).length > 0 && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{alertasMasivas.filter(a => a.activo).length} ALERTAS INTERNAS</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Sectores con reportes recientes</p>
                  {incidentesPorSector.length === 0 ? (
                    <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-500">No hay concentración de reportes en los últimos 30 minutos.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {incidentesPorSector.map(incident => (
                        <div key={incident.sector} className="border border-amber-500/30 bg-amber-950/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm text-white">{incident.sector}</strong>
                            <span className="text-[10px] font-bold uppercase text-amber-300">{incident.reports.length} reportes</span>
                          </div>
                          <p className="mt-1 text-xs text-amber-200">Posible incidencia de zona; verificar suministro eléctrico y red antes de despachar varias cuadrillas.</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">La detección usa reportes de clientes, no estado en línea de la OLT.</p>
                </div>

                {/* Formulario personalizado */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!zonaAveriaInput.trim()) {
                      addToast("Especifique la zona o sector a congelar", "error");
                      return;
                    }
                    declararAveriaMasiva(zonaAveriaInput.trim(), motivoAveriaInput.trim());
                    setZonaAveriaInput('');
                  }}
                  className="pt-2 flex flex-col sm:flex-row gap-3 items-end bg-slate-950/60 p-4 rounded-xl border border-slate-800"
                >
                  <div className="flex-1 w-full">
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Zona / Sector Personalizado:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Sector La Floresta (Poste #32 al #48)"
                      value={zonaAveriaInput}
                      onChange={e => setZonaAveriaInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Motivo de la Falla Masiva:
                    </label>
                    <input
                      type="text"
                      placeholder="Falla de Energía en Nodo Central"
                      value={motivoAveriaInput}
                      onChange={e => setMotivoAveriaInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Declarar Alerta Masiva</span>
                  </button>
                </form>

                {/* Listado de zonas con alerta masiva activa */}
                {alertasMasivas.filter(a => a.activo).length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Alertas internas activas:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {alertasMasivas.filter(a => a.activo).map(alerta => (
                        <div
                          key={alerta.id}
                          className="p-3.5 bg-rose-950/30 border border-rose-800/60 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{alerta.zona}</span>
                              <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                ALERTA INTERNA
                              </span>
                            </div>
                            <p className="text-slate-300 mt-1">{alerta.motivo}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Emitida: {alerta.fecha} • {alerta.declaradoPor}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => levantarAveriaMasiva(alerta.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow cursor-pointer shrink-0 ml-3"
                            title="Cerrar esta alerta interna"
                          >
                            Cerrar alerta
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tarjetas KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Abonados</p>
                    <h3 className="text-3xl font-black text-white mt-1">{estadisticas.totalClientes}</h3>
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{estadisticas.activos} activos en fibra</span>
                    </p>
                  </div>
                  <div className="p-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Facturación</p>
                    <h3 className="text-3xl font-black text-emerald-400 mt-1">${estadisticas.ingresosMensuales}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Estimado mes fibra</p>
                  </div>
                  <div className="p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-2xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-amber-900/40 p-5 rounded-2xl shadow-xl flex items-center justify-between bg-amber-950/10">
                  <div>
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Deuda Por Cobrar</p>
                    <h3 className="text-3xl font-black text-amber-300 mt-1">${estadisticas.totalDeudaPorCobrar.toFixed(2)}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Pendiente en abonados</p>
                  </div>
                  <div className="p-3 bg-amber-600/10 text-amber-400 border border-amber-600/20 rounded-2xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Averías en Curso</p>
                    <h3 className="text-3xl font-black text-rose-400 mt-1">{estadisticas.fallasPendientes}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">{estadisticas.fallasResueltas} resueltas hoy</p>
                  </div>
                  <div className="p-3 bg-rose-600/10 text-rose-400 border border-rose-600/20 rounded-2xl">
                    <Wrench className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Señal óptica crítica</p>
                    <h3 className="text-3xl font-black text-cyan-400 mt-1">{clientesConSenalCritica.length}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Lectura registrada ≤ -27 dBm</p>
                  </div>
                  <div className="p-3 bg-cyan-600/10 text-cyan-400 border border-cyan-600/20 rounded-2xl">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Gráficos / Tablas de Resumen */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribución de Planes */}
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Distribución de Planes de Fibra</span>
                    </h3>
                    <button
                      onClick={() => setSeccionActual('planes')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ajustar Precios</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {estadisticas.distribucionPlanes.map(p => {
                      const porcentaje = (p.cantidad / (estadisticas.totalClientes || 1)) * 100;
                      return (
                        <div key={p.id}>
                          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{p.nombre}</span>
                              <span className="text-emerald-400 font-mono">(${p.precio.toFixed(2)}/mes)</span>
                            </span>
                            <span className="font-bold text-cyan-300 font-mono">
                              {p.cantidad} clientes • ${(p.ingresosPlan || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.max(porcentaje, p.cantidad > 0 ? 5 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <button
                      onClick={() => setSeccionActual('planes')}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Modificar Tarifas, Nombres o Anexar Planes →</span>
                    </button>
                  </div>
                </div>

                {/* Acceso Rápido y Estado de Enlace */}
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400" />
                      <span>Puertos OLT & Cajas NAP Activas</span>
                    </h3>
                    <button
                      onClick={() => setSeccionActual('cajas-nap')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Gestionar Puntos NAP ({cajasNap.length}) →</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {cajasNap.map(caja => {
                      const isSaturada = caja.puertosOcupados >= caja.puertosTotales || caja.estado === 'Saturada';
                      const isFalla = caja.estado === 'Con Falla';
                      return (
                        <div key={caja.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between gap-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">{caja.nombre}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isFalla 
                                  ? 'bg-rose-500/20 text-rose-300' 
                                  : isSaturada 
                                  ? 'bg-amber-500/20 text-amber-300' 
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {caja.estado}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">{caja.ubicacionPoste}</p>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {caja.puertosOcupados} / {caja.puertosTotales} puntos ocupados ({caja.puertosTotales - caja.puertosOcupados} libres)
                            </span>
                          </div>
                          <button
                            onClick={() => handleAbrirEditarCajaNap(caja)}
                            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white py-1 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition border border-slate-700 cursor-pointer self-start"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span>Editar Puntos NAP</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* ========================================================================= */}
              {/* TABLA EXCLUSIVA PARA EL ROL DE DUEÑO: MATERIALES RESTANTES DEL INVENTARIO */}
              {/* ========================================================================= */}
              {userRole === 'dueño' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
                  <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <Package className="w-5 h-5 text-amber-400" />
                          <span>Tablero de Control de Inventario de Materiales Ópticos</span>
                        </h3>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                          Exclusivo Rol Dueño
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Monitoreo de insumos restantes. Se activa alerta de compra crítica en color rojo si las bobinas bajan de 500 metros.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const itemDrop = inventario.find(i => i.categoria === 'Cable Drop' || i.id === 'INV-001');
                          if (itemDrop) handleReabastecerStock(itemDrop.id, 1000);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                        title="Comprar y añadir una bobina de 1,000m de cable Drop"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Bobina Drop (1,000m)</span>
                      </button>

                      <button
                        onClick={() => {
                          const itemConectores = inventario.find(i => i.categoria === 'Conectores' || i.id === 'INV-002');
                          if (itemConectores) handleReabastecerStock(itemConectores.id, 100);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                        title="Añadir caja de 100 conectores rápidos Fast SC/APC"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ 100 Conectores Fast</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (await descontarMaterialesLocal(150, 4)) {
                            addToast("Consumo registrado: -150m Drop y -4 Conectores Fast", "info");
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        title="Simular descuento para probar la alerta roja si baja de 500m"
                      >
                        <span>🧪 Simular Consumo (-150m)</span>
                      </button>
                    </div>
                  </div>

                  {/* Banner de alerta de compra en rojo si las bobinas bajan de 500 metros */}
                  {(() => {
                    const bobinaDrop = inventario.find(i => i.categoria === 'Cable Drop' || i.id === 'INV-001');
                    const metrosRestantes = bobinaDrop ? bobinaDrop.cantidad : 0;
                    if (metrosRestantes < 500) {
                      return (
                        <div className="mx-5 p-4 bg-red-950/90 border-2 border-red-500 rounded-2xl text-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse shadow-xl shadow-red-950/60">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/40 shrink-0">
                              <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm uppercase tracking-wider text-red-200 flex items-center gap-2">
                                <span>🚨 ¡ALERTA DE COMPRA URGENTE DE BOBINAS!</span>
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  Stock Crítico: {metrosRestantes} m
                                </span>
                              </h4>
                              <p className="text-xs text-red-300 mt-0.5">
                                Las bobinas de Cable Drop han bajado de los <strong>500 metros</strong> reglamentarios. Ordenar nueva bobina inmediatamente para no paralizar a los técnicos en campo.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (bobinaDrop) handleReabastecerStock(bobinaDrop.id, 1000);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-lg shadow-red-600/40 shrink-0 flex items-center gap-2 cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Comprar Bobina (1,000 m)</span>
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Tabla exclusiva con cambio de color a rojo si las bobinas bajan de 500 metros */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4 font-bold">Material / Insumo</th>
                          <th className="py-3.5 px-4 font-bold">Categoría</th>
                          <th className="py-3.5 px-4 font-bold">Stock Restante</th>
                          <th className="py-3.5 px-4 font-bold">Umbral Mínimo</th>
                          <th className="py-3.5 px-4 font-bold">Estado / Alerta</th>
                          <th className="py-3.5 px-4 font-bold">Ubicación</th>
                          <th className="py-3.5 px-4 font-bold text-right">Reposición Dueño</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {inventario.map(item => {
                          const isDrop = item.categoria === 'Cable Drop' || item.codigo.includes('DROP') || item.id === 'INV-001';
                          const alertaBobinaRoja = isDrop && item.cantidad < 500;
                          const alertaGeneral = item.cantidad < item.umbralMinimoAlerta;

                          return (
                            <tr 
                              key={item.id}
                              className={`transition-colors ${
                                alertaBobinaRoja
                                  ? 'bg-red-950/80 hover:bg-red-900/70 border-l-4 border-l-red-500 text-red-100'
                                  : alertaGeneral
                                  ? 'bg-amber-950/30 hover:bg-amber-900/40 border-l-4 border-l-amber-500'
                                  : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-white flex items-center gap-2">
                                  {alertaBobinaRoja ? (
                                    <span className="text-red-400 text-sm animate-bounce">🚨</span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">📦</span>
                                  )}
                                  <span className={alertaBobinaRoja ? 'text-red-200 font-black' : ''}>{item.nombre}</span>
                                </div>
                                <span className="font-mono text-[10px] text-cyan-400">{item.codigo}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                                  alertaBobinaRoja ? 'bg-red-900/80 text-red-200 border border-red-500/50' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {item.categoria}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-baseline gap-1.5">
                                  <span className={`font-mono ${
                                    alertaBobinaRoja 
                                      ? 'text-2xl font-black text-red-400 animate-pulse' 
                                      : alertaGeneral 
                                      ? 'text-lg font-bold text-amber-400' 
                                      : 'text-base font-black text-emerald-400'
                                  }`}>
                                    {item.cantidad.toLocaleString()}
                                  </span>
                                  <span className={`text-xs font-semibold ${alertaBobinaRoja ? 'text-red-200' : 'text-slate-400'}`}>{item.unidad}</span>
                                </div>
                                {alertaBobinaRoja && (
                                  <span className="text-[10px] text-red-300 font-black block mt-0.5 uppercase tracking-wide">
                                    ⚠️ ¡BAJÓ DE 500M! ALERTA DE COMPRA
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-slate-300 font-medium">
                                  {item.umbralMinimoAlerta} {item.unidad}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {alertaBobinaRoja ? (
                                  <span className="inline-flex items-center gap-1 bg-red-600 text-white font-black px-2.5 py-1 rounded-full text-[10px] uppercase shadow-lg shadow-red-600/50 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Alerta de Compra</span>
                                  </span>
                                ) : alertaGeneral ? (
                                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                                    <span>Stock Bajo</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium px-2.5 py-0.5 rounded-full text-[10px]">
                                    <Check className="w-3 h-3" />
                                    <span>Stock Abundante</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-400">
                                <span>{item.ubicacion}</span>
                                {item.ultimoReabastecimiento && (
                                  <span className="block text-[10px] text-slate-500 font-mono">
                                    Último: {item.ultimoReabastecimiento}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    const incremento = isDrop ? 1000 : (item.categoria === 'Conectores' ? 100 : 10);
                                    handleReabastecerStock(item.id, incremento);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer ${
                                    alertaBobinaRoja
                                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ {isDrop ? '1,000m' : (item.categoria === 'Conectores' ? '100 uds' : '10 uds')}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN 4: CONSULTA DE DEUDA Y COBRANZA EN OFICINA (ADMIN / DUEÑO) */}
          {/* ============================================================= */}
          {seccionActual === 'cobranzas' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <section className="space-y-5 rounded-2xl border border-emerald-900/50 bg-slate-900/90 p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white">Cierre diario de caja</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Movimientos atribuidos a {userRealName} · {resumenCaja?.fecha || 'cargando fecha'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${cierreCajaHoy ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                    {cierreCajaHoy ? 'Caja cerrada' : 'Caja abierta'}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Efectivo esperado', amount: cierreCajaHoy?.totalEfectivoSistema ?? resumenCaja?.totalEfectivo ?? 0 },
                    { label: 'Pagos digitales', amount: resumenCaja?.totalDigital ?? 0 },
                    { label: 'Total cobrado', amount: resumenCaja?.totalCobrado ?? 0 },
                    { label: 'Cantidad de pagos', count: resumenCaja?.cantidadPagos ?? 0 }
                  ].map(item => (
                    <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
                      <p className="mt-1 text-xl font-black text-white">
                        {item.amount !== undefined ? `$${item.amount.toFixed(2)}` : item.count}
                      </p>
                    </div>
                  ))}
                </div>

                {cierreCajaHoy ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm">
                    <p className="text-slate-300">Efectivo contado: <strong className="text-white">${cierreCajaHoy.efectivoContado.toFixed(2)}</strong></p>
                    <p className={cierreCajaHoy.diferenciaEfectivo === 0 ? 'text-emerald-300' : 'text-amber-300'}>
                      Diferencia: <strong>${cierreCajaHoy.diferenciaEfectivo.toFixed(2)}</strong>
                    </p>
                    {cierreCajaHoy.notas && <p className="w-full text-xs text-slate-400">Nota: {cierreCajaHoy.notas}</p>}
                  </div>
                ) : (
                  <form onSubmit={handleCerrarCaja} className="grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-[minmax(180px,0.7fr)_minmax(220px,1.3fr)_auto] md:items-end">
                    <label className="block text-xs font-semibold text-slate-300">
                      Efectivo contado físicamente
                      <input type="number" min="0" step="0.01" required value={efectivoContado} onChange={event => setEfectivoContado(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" placeholder="0.00" />
                    </label>
                    <label className="block text-xs font-semibold text-slate-300">
                      Nota de cierre (opcional)
                      <input type="text" maxLength={500} value={notasCierreCaja} onChange={event => setNotasCierreCaja(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" placeholder="Observaciones o referencia del depósito" />
                    </label>
                    <button type="submit" disabled={isClosingCash} className="rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                      {isClosingCash ? 'Guardando...' : 'Cerrar caja de hoy'}
                    </button>
                  </form>
                )}

                {userRole === 'dueño' && (
                  <div className="border-t border-slate-800 pt-4">
                    <h3 className="mb-3 text-sm font-bold text-white">Cierres de administradores y dueños</h3>
                    {cierresCaja.length === 0 ? (
                      <p className="text-xs text-slate-500">Todavía no hay cierres guardados.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-xs">
                          <thead className="text-[10px] uppercase text-slate-500">
                            <tr>
                              <th className="pb-2 pr-3">Fecha</th>
                              <th className="pb-2 pr-3">Cuenta</th>
                              <th className="pb-2 pr-3">Pagos</th>
                              <th className="pb-2 pr-3">Efectivo esperado</th>
                              <th className="pb-2 pr-3">Contado</th>
                              <th className="pb-2 pr-3">Digital</th>
                              <th className="pb-2">Diferencia</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300">
                            {cierresCaja.map(closing => (
                              <tr key={closing.id}>
                                <td className="py-2 pr-3">{closing.fecha}</td>
                                <td className="py-2 pr-3">{closing.administradorNombre} <span className="text-slate-500">@{closing.administradorUsuario}</span></td>
                                <td className="py-2 pr-3">{closing.cantidadPagos}</td>
                                <td className="py-2 pr-3">${closing.totalEfectivoSistema.toFixed(2)}</td>
                                <td className="py-2 pr-3">${closing.efectivoContado.toFixed(2)}</td>
                                <td className="py-2 pr-3">${closing.totalDigital.toFixed(2)}</td>
                                <td className={closing.diferenciaEfectivo === 0 ? 'py-2 text-emerald-300' : 'py-2 text-amber-300'}>${closing.diferenciaEfectivo.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Taquilla de Oficina: Consulta de Deuda y Cobranza</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      Caja Central
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Ingrese únicamente el número de cédula del abonado para verificar su saldo pendiente y registrar el pago inmediato de la factura en oficina.
                  </p>
                </div>
              </div>

              {/* Barra de Búsqueda rápida por Cédula */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <form onSubmit={handleConsultarDeuda} className="space-y-4">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Consulta de Estado de Cuenta por Cédula:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        placeholder="Ejemplo: V-25678901, 18765432 o 20145892"
                        value={cedulaConsulta}
                        onChange={e => setCedulaConsulta(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isConsultingDebt}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <DollarSign className={`w-4 h-4 ${isConsultingDebt ? 'animate-bounce' : ''}`} />
                      <span>{isConsultingDebt ? 'Buscando...' : 'Consultar Deuda'}</span>
                    </button>
                  </div>

                  {/* Atajos de cédulas de prueba */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-500">Cédulas de prueba rápida:</span>
                    {clientes.slice(0, 5).map(c => (
                      <button
                        key={c.cedula}
                        type="button"
                        onClick={() => {
                          setCedulaConsulta(c.cedula);
                          handleConsultarDeuda(undefined, c.cedula);
                        }}
                        className={`font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          (c.montoDeuda || 0) > 0
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {c.cedula} ({(c.montoDeuda || 0) > 0 ? `Debe $${c.montoDeuda}` : '$0'})
                      </button>
                    ))}
                  </div>
                </form>

                {/* Mensaje de error si la cédula no existe */}
                {deudaError && (
                  <div className="mt-4 p-4 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{deudaError}</span>
                  </div>
                )}
              </div>

              {/* Resultado de la Consulta de Deuda */}
              {clienteConsultado && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                  {/* Tarjeta de Resumen Financiero y Pago */}
                  <div className={`p-6 rounded-2xl border shadow-2xl space-y-5 lg:col-span-1 flex flex-col justify-between ${
                    (clienteConsultado.montoDeuda || 0) > 0
                      ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-amber-700/50'
                      : 'bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-700/50'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                          Estado de Cuenta
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          (clienteConsultado.montoDeuda || 0) > 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {clienteConsultado.estadoPago || ((clienteConsultado.montoDeuda || 0) > 0 ? 'Con Deuda' : 'Al Día')}
                        </span>
                      </div>

                      <div className="mt-5 text-center">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Total a Pagar en Oficina</p>
                        <div className="mt-1 flex items-baseline justify-center gap-1">
                          <span className={`text-4xl font-black font-mono tracking-tight ${
                            (clienteConsultado.montoDeuda || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            ${(clienteConsultado.montoDeuda || 0).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-500 font-bold">USD</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Tarifa mensual: ${(clienteConsultado.costoMensualPlan || 25).toFixed(2)} USD
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Abonado:</span>
                          <strong className="text-white">{clienteConsultado.nombre}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cédula:</span>
                          <span className="font-mono text-cyan-400 font-bold">{clienteConsultado.cedula}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Plan contratado:</span>
                          <span className="text-blue-300 font-medium">{clienteConsultado.plan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Estado servicio:</span>
                          <span className={`font-bold ${clienteConsultado.estado === 'Suspendido' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {clienteConsultado.estado || 'Activo'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Último pago registrado:</span>
                          <span className="text-slate-300 font-mono">{clienteConsultado.fechaUltimoPago || 'Sin registros'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón Principal para Cobrar en Oficina */}
                    <div className="pt-4 border-t border-slate-800">
                      {(clienteConsultado.montoDeuda || 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPagoMonto((clienteConsultado.montoDeuda || 0).toString());
                            setMostrarModalPago(true);
                          }}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Pagar Factura en Oficina</span>
                        </button>
                      ) : (
                        <div className="text-center py-2 space-y-2">
                          <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>El cliente se encuentra completamente al día</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setPagoMonto((clienteConsultado.costoMensualPlan || 25).toString());
                              setMostrarModalPago(true);
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Adelantar Pago del Mes Próximo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalle del Abonado y Historial de Pagos en Oficina */}
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>Ficha Técnica y Ubicación del Abonado</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div>
                          <p className="text-slate-500">Sector / Caja NAP:</p>
                          <p className="text-white font-semibold mt-0.5">{clienteConsultado.sector || 'Sector Central'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Teléfono:</p>
                          <p className="text-white font-semibold mt-0.5">{clienteConsultado.telefono || 'Sin teléfono'}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-slate-500">Dirección física:</p>
                          <p className="text-white font-semibold mt-0.5">{clienteConsultado.direccion || 'Sin dirección registrada'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Historial de Comprobantes de Pago en Oficina */}
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2 mb-3">
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <span>Comprobantes y Pagos Realizados en Oficina</span>
                      </h3>

                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-72 overflow-y-auto">
                        {!clienteConsultado.historialPagos || clienteConsultado.historialPagos.length === 0 ? (
                          <div className="p-8 text-center text-slate-500">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">No hay registros de pagos previos en taquilla para este abonado.</p>
                          </div>
                        ) : (
                          clienteConsultado.historialPagos.map((pago, idx) => (
                            <div key={pago.id || idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/60 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                                    {pago.numeroComprobante || pago.id}
                                  </span>
                                  <span className="font-bold text-white">${pago.monto.toFixed(2)} USD</span>
                                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                                    {pago.metodo}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[11px]">{pago.notas || 'Pago de mensualidad de fibra'}</p>
                                <p className="text-[10px] text-slate-500">Recibido por: {pago.recibidoPor} • {pago.fecha}</p>
                              </div>
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">
                                APROBADO
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN 5: GESTIÓN DE PLANES (DUEÑO Y ADMINISTRADORES) */}
          {/* ============================================================= */}
          {seccionActual === 'planes' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header de la sección */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-400" />
                    <span>Catálogo y Tarifas de Planes de Fibra Óptica</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      {userRole === 'dueño' ? 'Dueño' : 'Administrador'}
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Cambie los precios, modifique los nombres, gestione la velocidad y anexe o quite los planes disponibles para contratación en Cable Tartak.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setNuevoPlanNombre('');
                      setNuevoPlanVelocidad('250 Mbps');
                      setNuevoPlanPrecio('40');
                      setNuevoPlanDescripcion('Conexión simétrica de fibra óptica con baja latencia.');
                      setNuevoPlanColor('cyan');
                      setMostrarModalCrearPlan(true);
                    }}
                    className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Anexar Nuevo Plan</span>
                  </button>
                </div>
              </div>

              {/* Indicadores KPI de Planes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planes Disponibles</p>
                    <h3 className="text-2xl font-black text-white mt-1">{planes.length}</h3>
                    <p className="text-[11px] text-amber-400 mt-1 font-medium">
                      {planes.filter(p => p.activo).length} habilitados para alta
                    </p>
                  </div>
                  <div className="p-3 bg-amber-600/10 text-amber-400 border border-amber-600/20 rounded-2xl">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rango de Precios</p>
                    <h3 className="text-2xl font-black text-emerald-400 mt-1">
                      ${planes.length > 0 ? Math.min(...planes.map(p => p.precio)).toFixed(0) : '0'} - ${planes.length > 0 ? Math.max(...planes.map(p => p.precio)).toFixed(0) : '0'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">Dólares USD mensuales</p>
                  </div>
                  <div className="p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-2xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Abonados Activos</p>
                    <h3 className="text-2xl font-black text-blue-400 mt-1">{clientes.length}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Suscritos en la red FTTH</p>
                  </div>
                  <div className="p-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-2xl">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturación Mensual</p>
                    <h3 className="text-2xl font-black text-cyan-400 mt-1">
                      ${estadisticas.ingresosMensuales.toFixed(2)}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">Ingreso estimado mensual</p>
                  </div>
                  <div className="p-3 bg-cyan-600/10 text-cyan-400 border border-cyan-600/20 rounded-2xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Grid de Planes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planes.map(p => {
                  const clientesConPlan = clientes.filter(c =>
                    c.plan.toLowerCase() === p.nombre.toLowerCase() ||
                    c.plan.toLowerCase().includes(p.nombre.toLowerCase()) ||
                    p.nombre.toLowerCase().includes(c.plan.toLowerCase())
                  );
                  const totalGenerado = clientesConPlan.length * p.precio;

                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
                    >
                      <div className="space-y-4">
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                              {p.id}
                            </span>
                            <h3 className="font-extrabold text-lg text-white mt-1 group-hover:text-amber-300 transition-colors">
                              {p.nombre}
                            </h3>
                          </div>
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                            p.activo
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {p.activo ? 'Habilitado' : 'Deshabilitado'}
                          </span>
                        </div>

                        {/* Tarifa Oficial y Velocidad */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tarifa Mensual</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-3xl font-black font-mono text-emerald-400">
                                ${p.precio.toFixed(2)}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">USD/mes</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Velocidad</span>
                            <span className="text-sm font-bold text-amber-400 font-mono flex items-center justify-end gap-1 mt-0.5">
                              <Zap className="w-3.5 h-3.5" />
                              {p.velocidad}
                            </span>
                          </div>
                        </div>

                        {/* Descripción */}
                        <p className="text-xs text-slate-400 min-h-[36px] line-clamp-2">
                          {p.descripcion || 'Servicio de fibra óptica simétrica de alta disponibilidad.'}
                        </p>

                        {/* Abonados suscritos */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <strong className="text-white">{clientesConPlan.length}</strong> abonados
                          </span>
                          <span className="font-mono text-slate-300">
                            Ingreso: <strong className="text-emerald-400">${totalGenerado.toFixed(2)}</strong>/mes
                          </span>
                        </div>
                      </div>

                      {/* Botones de acción: Cambiar Precio/Nombre y Quitar Plan */}
                      <div className="pt-5 mt-4 border-t border-slate-800 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPlanAEditar(p);
                            setEditPlanNombre(p.nombre);
                            setEditPlanVelocidad(p.velocidad);
                            setEditPlanPrecio(p.precio.toString());
                            setEditPlanDescripcion(p.descripcion);
                            setEditPlanActivo(p.activo);
                            setEditPlanColor(p.color || 'blue');
                            setEditPlanActualizarClientes(true);
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-700 hover:border-amber-500/40 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Cambiar Precio / Nombre</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlanAEliminar(p)}
                          className="bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all border border-rose-500/30 flex items-center justify-center cursor-pointer"
                          title={`Quitar ${p.nombre}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN 6: VALIDACIÓN MANUAL DE COMPROBANTES */}
          {/* ============================================================= */}
          {seccionActual === 'pagos' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Barra de control superior para el Administrador */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Revisión de comprobantes de Pago Móvil</h3>
                    <p className="text-xs text-slate-400">El cliente informa su pago; el personal confirma el movimiento directamente con el banco.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Selector de filtros */}
                  <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
                    {(['todos', 'PENDIENTE', 'APROBADO', 'RECHAZADO'] as const).map(estado => (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => setFiltroEstadoPago(estado)}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          filtroEstadoPago === estado
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {estado === 'todos' ? 'Todos' : estado === 'PENDIENTE' ? 'Pendientes' : estado === 'APROBADO' ? 'Aprobados' : 'Rechazados'}
                        {estado === 'PENDIENTE' && pagosVirtuales.filter(p => p.estado === 'PENDIENTE').length > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] rounded-full font-bold">
                            {pagosVirtuales.filter(p => p.estado === 'PENDIENTE').length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <a href="/pago" target="_blank" rel="noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir portal de pagos</span>
                  </a>
                </div>
              </div>

              {/* Render de Taquilla Virtual */}
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Validación de Taquilla Virtual</h1>
                <p className="text-gray-500 mb-6">Comprobantes recibidos desde el portal de pago. Cada operación requiere verificación bancaria manual.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pagosVirtuales
                    .filter(p => filtroEstadoPago === 'todos' || p.estado === filtroEstadoPago)
                    .map(pago => (
                      /* Tarjeta de pago pendiente */
                      <div key={pago.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              pago.estado === 'PENDIENTE'
                                ? 'bg-amber-100 text-amber-800'
                                : pago.estado === 'APROBADO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {pago.estado === 'PENDIENTE'
                                ? 'PENDIENTE DE REVISIÓN'
                                : pago.estado === 'APROBADO'
                                ? 'PAGO APROBADO'
                                : 'RECHAZADO'}
                            </span>
                            <span className="text-xs text-gray-400">{pago.fecha}, {pago.hora}</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <h3 className="font-bold text-lg text-slate-800">Cliente CI: {pago.cedula}</h3>
                            <span className="text-xs text-gray-500 font-medium">{pago.nombreCliente}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 bg-slate-50 p-3 rounded font-mono">
                            Banco: {pago.banco} | Ref: {pago.referencia} | Monto: ${pago.monto.toFixed(2)}
                          </p>
                          
                          <div className="mt-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Comprobante</p>
                            {pago.comprobanteUrl ? (
                              <>
                                <button type="button" onClick={() => setComprobanteModal(pago.comprobanteUrl)} className="mb-2 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver ampliado</span>
                                </button>
                                <img src={pago.comprobanteUrl} alt={`Comprobante ${pago.referencia}`} onClick={() => setComprobanteModal(pago.comprobanteUrl)} className="w-full h-40 object-contain bg-slate-100 rounded-lg border border-gray-200 cursor-pointer" />
                              </>
                            ) : (
                              <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">No se adjuntó comprobante.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          {pago.estado === 'PENDIENTE' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => handleRechazarPagoVirtual(pago)}
                                className="bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                              >
                                Rechazar
                              </button>
                              <button 
                                onClick={() => handleAprobarPagoVirtual(pago)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                              >
                                Aprobar Pago
                              </button>
                            </div>
                          ) : pago.estado === 'APROBADO' ? (
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center space-y-1">
                              <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Pago aprobado y deuda actualizada</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
                              <p className="text-xs font-bold text-rose-800">Comprobante Rechazado</p>
                              <p className="text-[11px] text-rose-600 mt-0.5">{pago.motivoRechazo || 'Rechazo registrado'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {pagosVirtuales.filter(p => filtroEstadoPago === 'todos' || p.estado === filtroEstadoPago).length === 0 && (
                    <p className="md:col-span-2 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No hay comprobantes para este filtro.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN 8: TABLERO DE CONTROL DE INVENTARIO DE MATERIALES ÓPTICOS */}
          {/* ============================================================= */}
          {seccionActual === 'inventario' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Tablero de Control de Inventario de Materiales Ópticos</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      FTTH Cable Tartak
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Control centralizado de insumos de fibra óptica: bobinas de cable drop, conectores mecánicos Fast SC/APC, ONTs y herrajes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => {
                      const itemDrop = inventario.find(i => i.categoria === 'Cable Drop' || i.id === 'INV-001');
                      if (itemDrop) handleReabastecerStock(itemDrop.id, 1000);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Bobina Drop (1,000m)</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (await descontarMaterialesLocal(150, 4)) {
                        addToast("Consumo registrado: -150m Drop y -4 Conectores Fast", "info");
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-2 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title="Simular descuento para probar la alerta roja si baja de 500m"
                  >
                    <span>🧪 Simular Gasto (-150m)</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards del Almacén de Insumos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const dropItem = inventario.find(i => i.categoria === 'Cable Drop' || i.id === 'INV-001');
                  const dropMetros = dropItem ? dropItem.cantidad : 0;
                  const isAlertaRoja = dropMetros < 500;
                  return (
                    <div className={`p-5 rounded-2xl shadow-xl flex items-center justify-between border transition-all ${
                      isAlertaRoja
                        ? 'bg-red-950/80 border-red-500 animate-pulse text-red-100'
                        : 'bg-slate-900/90 border-slate-800 text-white'
                    }`}>
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isAlertaRoja ? 'text-red-300' : 'text-slate-400'}`}>
                          Bobinas Drop FTTH
                        </p>
                        <h3 className={`text-3xl font-black mt-1 ${isAlertaRoja ? 'text-red-400' : 'text-white'}`}>
                          {dropMetros.toLocaleString()} m
                        </h3>
                        <p className={`text-[11px] mt-1 font-bold ${isAlertaRoja ? 'text-red-300' : 'text-emerald-400'}`}>
                          {isAlertaRoja ? '🚨 ¡Alerta Compra (< 500m)!' : 'Stock Óptimo (> 500m)'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-2xl ${isAlertaRoja ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-blue-600/10 text-blue-400 border border-blue-600/20'}`}>
                        <Package className="w-6 h-6" />
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conectores Fast SC/APC</p>
                    <h3 className="text-3xl font-black text-white mt-1">
                      {inventario.find(i => i.categoria === 'Conectores' || i.id === 'INV-002')?.cantidad || 0} uds
                    </h3>
                    <p className="text-[11px] text-emerald-400 mt-1">Mecánicos con gel óptico</p>
                  </div>
                  <div className="p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-2xl">
                    <Boxes className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Módems / ONTs GPON</p>
                    <h3 className="text-3xl font-black text-cyan-400 mt-1">
                      {inventario.find(i => i.categoria === 'Equipos ONT' || i.id === 'INV-003')?.cantidad || 0} uds
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">EchoLife Dual Band</p>
                  </div>
                  <div className="p-3 bg-cyan-600/10 text-cyan-400 border border-cyan-600/20 rounded-2xl">
                    <Radio className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Despachos en Campo</p>
                    <h3 className="text-3xl font-black text-amber-400 mt-1">{despachosMateriales.length}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Averías con consumo</p>
                  </div>
                  <div className="p-3 bg-amber-600/10 text-amber-400 border border-amber-600/20 rounded-2xl">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* TABLA EXCLUSIVA PARA EL ROL DE DUEÑO */}
              {userRole === 'dueño' ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
                  <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <Package className="w-5 h-5 text-amber-400" />
                          <span>Tabla Exclusiva de Materiales Restantes (Rol Dueño)</span>
                        </h3>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                          Vista Dueño
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        La fila de bobinas de cable drop cambia automáticamente de color a rojo como alerta de compra si baja de 500 metros.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Filtrar:</span>
                      <select 
                        value={filtroCategoriaMaterial} 
                        onChange={e => setFiltroCategoriaMaterial(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white rounded-lg p-1.5 font-medium"
                      >
                        <option value="todas">Todas las categorías</option>
                        <option value="Cable Drop">Cable Drop</option>
                        <option value="Conectores">Conectores</option>
                        <option value="Equipos ONT">Equipos ONT</option>
                        <option value="Pasivos FTTH">Pasivos FTTH</option>
                      </select>
                    </div>
                  </div>

                  {/* Banner de alerta de compra si baja de 500 metros */}
                  {(() => {
                    const bobinaDrop = inventario.find(i => i.categoria === 'Cable Drop' || i.id === 'INV-001');
                    const metrosRestantes = bobinaDrop ? bobinaDrop.cantidad : 0;
                    if (metrosRestantes < 500) {
                      return (
                        <div className="mx-5 p-4 bg-red-950/90 border-2 border-red-500 rounded-2xl text-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse shadow-xl shadow-red-950/60">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/40 shrink-0">
                              <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm uppercase tracking-wider text-red-200 flex items-center gap-2">
                                <span>🚨 ¡ALERTA DE COMPRA URGENTE DE BOBINAS!</span>
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {metrosRestantes} metros restantes
                                </span>
                              </h4>
                              <p className="text-xs text-red-300 mt-0.5">
                                El stock de bobinas de cable drop está por debajo de los 500 metros reglamentarios. Se debe realizar compra de insumos inmediatamente al proveedor.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (bobinaDrop) handleReabastecerStock(bobinaDrop.id, 1000);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-lg shadow-red-600/40 shrink-0 flex items-center gap-2 cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Comprar Bobina (1,000 m)</span>
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Tabla con estilo en Rojo para alerta de compra si baja de 500m */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4 font-bold">Material / Insumo Óptico</th>
                          <th className="py-3.5 px-4 font-bold">Categoría</th>
                          <th className="py-3.5 px-4 font-bold">Stock Restante</th>
                          <th className="py-3.5 px-4 font-bold">Umbral Mínimo</th>
                          <th className="py-3.5 px-4 font-bold">Estado / Alerta</th>
                          <th className="py-3.5 px-4 font-bold">Ubicación</th>
                          <th className="py-3.5 px-4 font-bold text-right">Acción Compra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {inventario
                          .filter(i => filtroCategoriaMaterial === 'todas' || i.categoria === filtroCategoriaMaterial)
                          .map(item => {
                            const isDrop = item.categoria === 'Cable Drop' || item.codigo.includes('DROP') || item.id === 'INV-001';
                            const alertaBobinaRoja = isDrop && item.cantidad < 500;
                            const alertaGeneral = item.cantidad < item.umbralMinimoAlerta;

                            return (
                              <tr 
                                key={item.id}
                                className={`transition-colors ${
                                  alertaBobinaRoja
                                    ? 'bg-red-950/80 hover:bg-red-900/70 border-l-4 border-l-red-500 text-red-100'
                                    : alertaGeneral
                                    ? 'bg-amber-950/30 hover:bg-amber-900/40 border-l-4 border-l-amber-500'
                                    : 'hover:bg-slate-800/40'
                                }`}
                              >
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-white flex items-center gap-2">
                                    {alertaBobinaRoja ? (
                                      <span className="text-red-400 text-sm animate-bounce">🚨</span>
                                    ) : (
                                      <span className="text-slate-400 text-xs">📦</span>
                                    )}
                                    <span className={alertaBobinaRoja ? 'text-red-200 font-black' : ''}>{item.nombre}</span>
                                  </div>
                                  <span className="font-mono text-[10px] text-cyan-400">{item.codigo}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                                    alertaBobinaRoja ? 'bg-red-900/80 text-red-200 border border-red-500/50' : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {item.categoria}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className={`font-mono ${
                                      alertaBobinaRoja 
                                        ? 'text-2xl font-black text-red-400 animate-pulse' 
                                        : alertaGeneral 
                                        ? 'text-lg font-bold text-amber-400' 
                                        : 'text-base font-black text-emerald-400'
                                    }`}>
                                      {item.cantidad.toLocaleString()}
                                    </span>
                                    <span className={`text-xs font-semibold ${alertaBobinaRoja ? 'text-red-200' : 'text-slate-400'}`}>{item.unidad}</span>
                                  </div>
                                  {alertaBobinaRoja && (
                                    <span className="text-[10px] text-red-300 font-black block mt-0.5 uppercase tracking-wide">
                                      ⚠️ ¡BAJÓ DE 500 METROS! ALERTA DE COMPRA
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-mono text-slate-300 font-medium">
                                    {item.umbralMinimoAlerta} {item.unidad}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  {alertaBobinaRoja ? (
                                    <span className="inline-flex items-center gap-1 bg-red-600 text-white font-black px-2.5 py-1 rounded-full text-[10px] uppercase shadow-lg shadow-red-600/50 animate-pulse">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Alerta de Compra (Crítica)</span>
                                    </span>
                                  ) : alertaGeneral ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                                      <span>Stock Bajo</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium px-2.5 py-0.5 rounded-full text-[10px]">
                                      <Check className="w-3 h-3" />
                                      <span>Stock Abundante</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-slate-400">
                                  <span>{item.ubicacion}</span>
                                  {item.ultimoReabastecimiento && (
                                    <span className="block text-[10px] text-slate-500 font-mono">
                                      Último: {item.ultimoReabastecimiento}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => {
                                      const incremento = isDrop ? 1000 : (item.categoria === 'Conectores' ? 100 : 10);
                                      handleReabastecerStock(item.id, incremento);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer ${
                                      alertaBobinaRoja
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                    }`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ {isDrop ? '1,000m' : (item.categoria === 'Conectores' ? '100 uds' : '10 uds')}</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base">Tabla Exclusiva para el Rol de Dueño</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    El inventario general de materiales de fibra óptica y las alertas de compra de bobinas están reservados para la supervisión y control del Dueño de Cable Tartak.
                  </p>
                </div>
              )}

              {/* Formulario Técnico al Cerrar Avería (CierreTicketMateriales) Standalone para Pruebas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    <span>Formulario de Descarga de Materiales para Técnicos de Campo</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Utilice este módulo para descargar insumos directamente al almacén central tras una reparación:
                  </p>
                  <CierreTicketMateriales 
                    ticketId="TICKET-MANUAL"
                    onFinalizado={() => cargarDatosServidor()}
                  />
                </div>

                {/* Historial de Despachos en Averías */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span>Historial de Consumo de Materiales en Campo</span>
                  </h3>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {despachosMateriales.map(d => (
                      <div key={d.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{d.tecnico}</span>
                            <span className="font-mono text-[10px] text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded">
                              {d.ticketId}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">{d.motivo}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{d.fecha}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-amber-400 block">{d.cableGastado}m drop</span>
                          <span className="font-mono text-emerald-400 text-[11px]">{d.conectoresGastados} conectores</span>
                          {d.ontCambiada && (
                            <span className="text-[10px] text-cyan-300 block font-bold">+1 ONT</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECCIÓN: GESTIÓN Y EDICIÓN DE PUNTOS DE CAJAS NAP */}
          {/* ============================================================= */}
          {seccionActual === 'cajas-nap' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header con botón para Agregar Nueva Caja NAP */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                      <Server className="w-6 h-6" />
                    </div>
                    <span>Gestión de Cajas NAP & Puntos de Red Óptica</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Administre la cobertura FTTH: agregue nuevas cajas terminales en postes, edite splitters/potencias o elimine puntos en desuso.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAbrirCrearCajaNap}
                    className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer transition active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Agregar Nueva Caja NAP</span>
                  </button>
                </div>
              </div>

              {/* Métricas y resumen operativo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-semibold block">Total Cajas Instaladas</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white font-mono">{cajasNap.length}</span>
                    <span className="text-xs text-cyan-400 font-medium">Terminales</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-semibold block">Puntos Ópticos Ocupados</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {cajasNap.reduce((acc, c) => acc + c.puertosOcupados, 0)}
                    </span>
                    <span className="text-xs text-slate-500">
                      / {cajasNap.reduce((acc, c) => acc + c.puertosTotales, 0)} totales
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-semibold block">Puntos Libres Disponibles</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-cyan-300 font-mono">
                      {Math.max(0, cajasNap.reduce((acc, c) => acc + (c.puertosTotales - c.puertosOcupados), 0))}
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">para abonados</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-semibold block">En Alerta / Falla</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-rose-400 font-mono">
                      {cajasNap.filter(c => c.estado === 'Con Falla' || c.estado === 'Saturada').length}
                    </span>
                    <span className="text-xs text-rose-400/80 font-medium">requieren atención</span>
                  </div>
                </div>
              </div>

              <Suspense fallback={<div className="flex h-48 items-center justify-center border border-slate-800 text-sm text-slate-400">Cargando mapa de red...</div>}>
                <NapMap boxes={cajasNapFiltradas} />
              </Suspense>

              {/* Barra de Búsqueda y Filtros */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaNap}
                    onChange={e => setBusquedaNap(e.target.value)}
                    placeholder="Buscar por ID, nombre, sector o poste..."
                    className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {busquedaNap && (
                    <button
                      onClick={() => setBusquedaNap('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-400 shrink-0">Filtrar Estado:</span>
                  <select
                    value={filtroEstadoNap}
                    onChange={e => setFiltroEstadoNap(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Estados ({cajasNap.length})</option>
                    <option value="Operativa">Operativa</option>
                    <option value="Saturada">Saturada</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Con Falla">Con Falla</option>
                  </select>
                </div>
              </div>

              {/* Grid de Cajas NAP Filtradas */}
              {cajasNapFiltradas.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">No se encontraron Cajas NAP</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {busquedaNap || filtroEstadoNap !== 'todos'
                        ? 'No hay cajas que coincidan con los criterios de búsqueda o filtro seleccionados.'
                        : 'No hay cajas NAP registradas en la red FTTH actualmente.'}
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    {(busquedaNap || filtroEstadoNap !== 'todos') && (
                      <button
                        onClick={() => { setBusquedaNap(''); setFiltroEstadoNap('todos'); }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl cursor-pointer"
                      >
                        Limpiar Filtros
                      </button>
                    )}
                    <button
                      onClick={handleAbrirCrearCajaNap}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Nueva Caja NAP</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cajasNapFiltradas.map(caja => {
                    const libres = Math.max(0, caja.puertosTotales - caja.puertosOcupados);
                    const porcentajeOcupado = Math.round((caja.puertosOcupados / caja.puertosTotales) * 100);
                    const isSaturada = caja.puertosOcupados >= caja.puertosTotales;

                    return (
                      <div 
                        key={caja.id} 
                        className={`bg-slate-900 border rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
                          caja.estado === 'Con Falla' 
                            ? 'border-rose-700/60 bg-rose-950/10' 
                            : isSaturada 
                            ? 'border-amber-700/60' 
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-slate-950 text-cyan-400 px-2 py-0.5 rounded border border-slate-800">
                                {caja.id}
                              </span>
                              <h3 className="font-bold text-base text-white">{caja.nombre}</h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{caja.sector} • {caja.ubicacionPoste}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                              caja.estado === 'Operativa'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : caja.estado === 'Con Falla'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                                : caja.estado === 'Saturada'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {caja.estado}
                            </span>

                            {/* Botón rápido para eliminar en cabecera */}
                            <button
                              onClick={() => handleConfirmarEliminarCajaNap(caja)}
                              title="Eliminar esta Caja NAP"
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Medición de Potencia y Coordenadas */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Potencia de Entrada</span>
                            <span className={`font-mono font-bold text-sm ${
                              caja.potenciaEntradaDbm < -25 ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              {caja.potenciaEntradaDbm} dBm
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Coordenadas GPS</span>
                            <span className="font-mono text-cyan-300 text-xs truncate block" title={caja.coordenadas}>
                              {caja.coordenadas || '10.4850, -66.1100'}
                            </span>
                          </div>
                        </div>

                        {/* Visualización de Puntos / Puertos de Fibra */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                              <span>Ocupación de Puntos Ópticos:</span>
                              <span className="font-bold text-white font-mono">{caja.puertosOcupados} / {caja.puertosTotales}</span>
                            </span>
                            <span className={`font-mono font-bold ${libres === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {libres} puntos libres
                            </span>
                          </div>

                          {/* Barra de progreso */}
                          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSaturada ? 'bg-rose-500' : porcentajeOcupado > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${porcentajeOcupado}%` }}
                            />
                          </div>

                          {/* Matriz visual de puertos */}
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1.5">
                              Esquema de Puertos Físicos del Splitter:
                            </span>
                            <div className="grid grid-cols-8 gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              {puertosDeCaja(caja).map(puerto => {
                                const ocupado = puerto.estado === 'Ocupado';
                                return (
                                  <div
                                    key={puerto.puerto}
                                    className={`h-6 rounded-md flex items-center justify-center font-mono text-[9px] font-bold border transition-colors ${
                                      ocupado
                                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                                        : 'bg-slate-900 border-slate-700 text-slate-500'
                                    }`}
                                    title={ocupado
                                      ? `Puerto #${puerto.puerto}: ${puerto.nombreCliente || (puerto.legado ? 'Ocupado sin ficha de asignación' : 'Ocupado')} ${puerto.serialOnt ? `· ONT ${puerto.serialOnt}` : ''}`
                                      : `Puerto #${puerto.puerto}: Disponible`}
                                  >
                                    {puerto.puerto}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {caja.notas && (
                          <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                            <strong className="text-slate-300">Nota técnica:</strong> {caja.notas}
                          </p>
                        )}

                        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() => abrirUbicacionCliente(`${caja.sector}, ${caja.ubicacionPoste}, Higuerote, Miranda`)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition"
                          >
                            <span>📍</span>
                            <span>Ubicación Poste</span>
                          </button>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => handleConfirmarEliminarCajaNap(caja)}
                              className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 hover:border-rose-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                              title="Eliminar esta caja NAP"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Eliminar</span>
                            </button>

                            <button
                              onClick={() => handleAbrirEditarCajaNap(caja)}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar Puntos</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ================================================================= */}
      {/* MODAL: RESOLVER AVERÍA (TÉCNICOS) */}
      {/* ================================================================= */}
      {fallaAResolver && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Cierre de Orden Técnica</span>
              </h3>
              <button
                onClick={() => setFallaAResolver(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Abonado:</span> <strong className="text-white">{fallaAResolver.cedula}</strong></p>
              <p><span className="text-slate-400">Problema:</span> <span className="text-slate-300">"{fallaAResolver.detalle}"</span></p>
            </div>

            <form onSubmit={handleResolverFalla} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Solución técnica aplicada *
                </label>
                <textarea
                  value={solucionDetalle}
                  onChange={e => setSolucionDetalle(e.target.value)}
                  placeholder="Ej: Fibra drop sustituida, re-empalmada con fusionadora Fujikura y conector SC/APC nuevo."
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Potencia Óptica Medida en ONT (dBm)
                </label>
                <input
                  type="number"
                  min="-50"
                  max="0"
                  step="0.1"
                  value={potenciaFinalMedida}
                  onChange={e => setPotenciaFinalMedida(e.target.value)}
                  placeholder="-19.5"
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Registra la medición tomada en sitio. Una lectura ≤ -27 dBm requiere revisión.</p>
              </div>

              {/* Insumos gastados para descontar de inventario al resolver */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reporte de Materiales Utilizados (Descontar de Inventario):</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Metros Drop Usados:</label>
                    <input
                      type="number"
                      value={resolverMetrosDrop}
                      onChange={e => setResolverMetrosDrop(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white font-mono focus:ring-2 focus:ring-emerald-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Conectores Mecánicos:</label>
                    <input
                      type="number"
                      value={resolverConectores}
                      onChange={e => setResolverConectores(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white font-mono focus:ring-2 focus:ring-emerald-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <input
                    type="checkbox"
                    id="chk-resolver-ont"
                    checked={resolverOntCambiada}
                    onChange={e => setResolverOntCambiada(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="chk-resolver-ont" className="text-[11px] text-slate-400 cursor-pointer">
                    ¿Se sustituyó la ONT/Módem del abonado? (-1 unidad de stock)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFallaAResolver(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  Guardar y Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: REPORTAR AVERÍA MANUAL */}
      {/* ================================================================= */}
      {mostrarCrearFalla && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Reportar Avería en Campo</span>
              </h3>
              <button
                onClick={() => setMostrarCrearFalla(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearFalla} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Cédula del Abonado *
                </label>
                <input
                  type="text"
                  placeholder="Ej: V-25678901"
                  value={fallaCedulaNueva}
                  onChange={e => setFallaCedulaNueva(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Prioridad
                </label>
                <select
                  value={fallaPrioridadNueva}
                  onChange={e => setFallaPrioridadNueva(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Crítica">🚨 Crítica (Corte total / Sin luz óptica)</option>
                  <option value="Alta">⚠️ Alta (Luz LOS intermitente / Drop rozando)</option>
                  <option value="Media">🔧 Media (Atenuación nocturna)</option>
                  <option value="Baja">ℹ️ Baja (Revisión de cableado preventivo)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Detalle del problema *
                </label>
                <textarea
                  value={fallaDetalleNuevo}
                  onChange={e => setFallaDetalleNuevo(e.target.value)}
                  placeholder="Describa el incidente reportado por el cliente..."
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarCrearFalla(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: REGISTRAR PAGO DE FACTURA EN OFICINA (TAQUILLA / CAJA) */}
      {/* ================================================================= */}
      {mostrarModalPago && clienteConsultado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Registrar Pago en Taquilla de Oficina</h3>
                  <p className="text-xs text-slate-400">Emisión de recibo para {clienteConsultado.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalPago(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha rápida del cobro */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Abonado / Cédula:</span>
                <span className="font-bold text-white">{clienteConsultado.nombre}</span>
                <span className="font-mono text-cyan-400 ml-2">({clienteConsultado.cedula})</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Deuda Pendiente:</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  ${(clienteConsultado.montoDeuda || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            <form onSubmit={handleRegistrarPago} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Monto Recibido en Oficina ($ USD) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={pagoMonto}
                    onChange={e => setPagoMonto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-2.5 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPagoMonto((clienteConsultado.montoDeuda || 0).toString())}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 cursor-pointer"
                  >
                    Pagar Total (${(clienteConsultado.montoDeuda || 0).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagoMonto((clienteConsultado.costoMensualPlan || 25).toString())}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 cursor-pointer"
                  >
                    1 Mensualidad (${(clienteConsultado.costoMensualPlan || 25).toFixed(2)})
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Método de Pago Recibido en Taquilla
                </label>
                <select
                  value={pagoMetodo}
                  onChange={e => setPagoMetodo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Efectivo en Taquilla (Oficina)">💵 Efectivo Dólares (Taquilla de Oficina)</option>
                  <option value="Punto de Venta / Tarjeta (Oficina)">💳 Punto de Venta Débito/Crédito (Oficina)</option>
                  <option value="Pago Móvil / Transferencia Bancaria">📱 Pago Móvil / Transferencia Verificada en Oficina</option>
                  <option value="Zelle / Divisas Electrónicas">🌐 Zelle / Depósito Electrónico</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas de Cobranza / Referencia
                </label>
                <input
                  type="text"
                  value={pagoNotas}
                  onChange={e => setPagoNotas(e.target.value)}
                  placeholder="Ej: Pago mensualidad completa Septiembre. Recibo físico entregado al cliente."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalPago(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPago}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessingPago ? 'Procesando...' : 'Confirmar Cobro en Oficina'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: RECIBO DE PAGO EMITIDO EN OFICINA */}
      {/* ================================================================= */}
      {ultimoComprobante && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="text-center pb-3 border-b border-slate-800">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-lg">Comprobante de Pago Oficial</h3>
              <p className="text-xs text-cyan-400 font-mono">Cable Tartak ISP • Recibo de Oficina</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">N° de Control:</span>
                <span className="font-mono font-bold text-cyan-400">{ultimoComprobante.numeroComprobante}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto Abonado:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">${ultimoComprobante.monto.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha y Hora:</span>
                <span className="text-slate-300 font-mono">{ultimoComprobante.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método de Cobro:</span>
                <span className="text-slate-300 font-medium">{ultimoComprobante.metodo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recibido en Taquilla:</span>
                <span className="text-slate-300">{ultimoComprobante.recibidoPor}</span>
              </div>
              {ultimoComprobante.notas && (
                <div className="pt-2 border-t border-slate-900 text-slate-400 text-[11px]">
                  <strong>Concepto:</strong> {ultimoComprobante.notas}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setUltimoComprobante(null)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Aceptar y Cerrar Comprobante
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CONFIGURACIÓN DE CONEXIÓN CON SERVIDOR CENTRAL (API URL) */}
      {/* ================================================================= */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                <span>Conexión Servidor Central</span>
              </h3>
              <button
                onClick={() => setShowApiModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              El panel usa la API integrada y guarda las operaciones en la base de datos del servidor.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Endpoint conectado</label>
                <input
                  type="text"
                  value={DEFAULT_API_URL}
                  readOnly
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setApiUrl(DEFAULT_API_URL);
                    cargarDatosServidor(DEFAULT_API_URL);
                    setShowApiModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Sincronizar datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ANEXAR NUEVO PLAN DISPONIBLE */}
      {/* ================================================================= */}
      {mostrarModalCrearPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Anexar Nuevo Plan</h3>
                  <p className="text-xs text-slate-400">Agregar plan al catálogo de Cable Tartak</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalCrearPlan(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearPlan} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Plan Ultra Gamer - 400 Mbps"
                  value={nuevoPlanNombre}
                  onChange={e => setNuevoPlanNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Velocidad *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 400 Mbps"
                    value={nuevoPlanVelocidad}
                    onChange={e => setNuevoPlanVelocidad(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Precio Mensual ($ USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-emerald-400 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="60.00"
                      value={nuevoPlanPrecio}
                      onChange={e => setNuevoPlanPrecio(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 pl-8 pr-3 py-2.5 rounded-xl text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Descripción del Plan
                </label>
                <textarea
                  value={nuevoPlanDescripcion}
                  onChange={e => setNuevoPlanDescripcion(e.target.value)}
                  placeholder="Ej: Conexión simétrica de fibra óptica con baja latencia para streaming 4K y gaming."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrearPlan(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSavingPlan ? 'Guardando...' : 'Anexar Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CAMBIAR PRECIO Y NOMBRE DEL PLAN */}
      {/* ================================================================= */}
      {planAEditar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Modificar Plan y Tarifa</h3>
                  <p className="text-xs text-slate-400">ID: {planAEditar.id} • Cable Tartak</p>
                </div>
              </div>
              <button
                onClick={() => setPlanAEditar(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditarPlan} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  value={editPlanNombre}
                  onChange={e => setEditPlanNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Velocidad *
                  </label>
                  <input
                    type="text"
                    value={editPlanVelocidad}
                    onChange={e => setEditPlanVelocidad(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Precio Mensual ($ USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-emerald-400 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={editPlanPrecio}
                      onChange={e => setEditPlanPrecio(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 pl-8 pr-3 py-2.5 rounded-xl text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Descripción
                </label>
                <textarea
                  value={editPlanDescripcion}
                  onChange={e => setEditPlanDescripcion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              <div className="space-y-3 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-medium">
                    Disponible para nuevas contrataciones:
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPlanActivo(!editPlanActivo)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      editPlanActivo
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {editPlanActivo ? 'Sí (Activo)' : 'No (Inactivo)'}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="chkUpdateClients"
                    checked={editPlanActualizarClientes}
                    onChange={e => setEditPlanActualizarClientes(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="chkUpdateClients" className="text-[11px] text-slate-300 cursor-pointer">
                    <strong className="text-white block">Actualizar abonados existentes</strong>
                    Aplicar automáticamente el nuevo nombre y la nueva tarifa mensual a los contratos que tienen este plan asignado.
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanAEditar(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingPlan ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: QUITAR / ELIMINAR PLAN DISPONIBLE */}
      {/* ================================================================= */}
      {planAEliminar && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="text-center pb-3 border-b border-slate-800">
              <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-lg">¿Quitar Plan del Catálogo?</h3>
              <p className="text-xs text-rose-300 font-medium">Esta acción desincorporará el plan del sistema</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan a quitar:</span>
                <strong className="text-white">{planAEliminar.nombre}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tarifa actual:</span>
                <span className="font-mono text-emerald-400 font-bold">${planAEliminar.precio.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Velocidad:</span>
                <span className="text-slate-300 font-mono">{planAEliminar.velocidad}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-400">Abonados suscritos:</span>
                <span className="text-amber-400 font-bold">
                  {clientes.filter(c => c.plan.toLowerCase().includes(planAEliminar.nombre.toLowerCase())).length} clientes
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              ℹ️ Si hay abonados suscritos a este plan, se migrarán automáticamente a otro plan activo para mantener su conectividad sin cortes en la OLT.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlanAEliminar(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarPlan}
                disabled={isSavingPlan}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSavingPlan ? 'Eliminando...' : 'Sí, Quitar Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: VISOR DE COMPROBANTE DE PAGO MÓVIL EN ALTA RESOLUCIÓN */}
      {/* ================================================================= */}
      {comprobanteModal && (
        <div 
          onClick={() => setComprobanteModal(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-4 shadow-2xl space-y-3 cursor-default animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Comprobante de Pago Adjunto</h3>
              </div>
              <button
                onClick={() => setComprobanteModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img 
                src={comprobanteModal} 
                alt="Comprobante en alta resolución" 
                className="w-full h-auto max-h-[68vh] object-contain"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>Cable Tartak • Taquilla Virtual</span>
              <button
                onClick={() => setComprobanteModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: AGREGAR O EDITAR CAJAS NAP (TERMINALES FTTH) */}
      {/* ================================================================= */}
      {mostrarModalCajaNap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  modoModalCajaNap === 'crear'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                }`}>
                  {modoModalCajaNap === 'crear' ? <Plus className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {modoModalCajaNap === 'crear' ? 'Agregar Nueva Caja NAP' : 'Editar Puntos de la Caja NAP'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modoModalCajaNap === 'crear'
                      ? 'Registre una nueva terminal óptica FTTH en poste para ampliar cobertura'
                      : `Modificación de capacidad y puertos de ${cajaAEditar?.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalCajaNap(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarCajaNap} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ID / Código {modoModalCajaNap === 'crear' ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    value={cajaFormId}
                    onChange={e => setCajaFormId(e.target.value.toUpperCase())}
                    placeholder="NAP-09"
                    disabled={modoModalCajaNap === 'editar'}
                    className={`w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl font-mono text-cyan-400 uppercase font-bold focus:ring-2 focus:ring-cyan-500 ${
                      modoModalCajaNap === 'editar' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    required
                  />
                  {modoModalCajaNap === 'crear' && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Auto-generado</span>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre de la Caja NAP *</label>
                  <input
                    type="text"
                    value={cajaFormNombre}
                    onChange={e => setCajaFormNombre(e.target.value)}
                    placeholder="Ej: NAP-09 Las Flores"
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Sector o Urbanización *</label>
                  <input
                    type="text"
                    value={cajaFormSector}
                    onChange={e => setCajaFormSector(e.target.value)}
                    placeholder="Ej: Las Flores, Centro, Los Pinos"
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Ubicación en Poste</label>
                  <input
                    type="text"
                    value={cajaFormPoste}
                    onChange={e => setCajaFormPoste(e.target.value)}
                    placeholder="Ej: Poste #14 - Calle Central"
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Coordenadas GPS</label>
                  <input
                    type="text"
                    value={cajaFormCoordenadas}
                    onChange={e => setCajaFormCoordenadas(e.target.value)}
                    placeholder="10.4850, -66.1100"
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Estado Operativo</label>
                  <select
                    value={cajaFormEstado}
                    onChange={e => setCajaFormEstado(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="Operativa">Operativa (Con señal)</option>
                    <option value="Saturada">Saturada (Sin puertos libres)</option>
                    <option value="Mantenimiento">Mantenimiento Preventivo</option>
                    <option value="Con Falla">Con Falla / Alta Atenuación</option>
                  </select>
                </div>
              </div>

              {/* Edición de Puntos y Puertos */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase text-cyan-400">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Capacidad de Puntos Ópticos:</span>
                  </h4>

                  {/* Presets rápidos */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 mr-1">Presets:</span>
                    {[8, 16, 24].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCajaFormPuertosTotales(num)}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition ${
                          cajaFormPuertosTotales === num
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {num}p
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Puertos Totales:</label>
                    <input
                      type="number"
                      value={cajaFormPuertosTotales}
                      onChange={e => setCajaFormPuertosTotales(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white font-mono"
                      min="4"
                      max="64"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Puertos Ocupados:</label>
                    <input
                      type="number"
                      value={cajaFormPuertosOcupados}
                      onChange={e => setCajaFormPuertosOcupados(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white font-mono"
                      min="0"
                      max={cajaFormPuertosTotales}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Potencia Entrada:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cajaFormPotenciaDbm}
                      onChange={e => setCajaFormPotenciaDbm(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-2 bg-slate-900/80 rounded-lg text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Puntos disponibles para nuevos abonados:</span>
                  <strong className="text-emerald-400 font-mono text-xs">
                    {Math.max(0, cajaFormPuertosTotales - cajaFormPuertosOcupados)} puertos libres
                  </strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notas del Splitter / Empalme</label>
                <textarea
                  value={cajaFormNotas}
                  onChange={e => setCajaFormNotas(e.target.value)}
                  placeholder="Detalles sobre el splitter óptico 1x8 o 1x16, sangría de fibra troncal..."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs h-16 resize-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalCajaNap(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingNap}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSavingNap ? (
                    <span>Guardando...</span>
                  ) : modoModalCajaNap === 'crear' ? (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Registrar Nueva Caja NAP</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Puntos NAP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CONFIRMACIÓN PARA ELIMINAR CAJA NAP */}
      {/* ================================================================= */}
      {cajaAEliminar && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="text-center pb-3 border-b border-slate-800">
              <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-lg">¿Eliminar Caja NAP?</h3>
              <p className="text-xs text-rose-300 font-medium">Esta acción desincorporará permanentemente la terminal óptica</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Identificador:</span>
                <span className="font-mono text-cyan-400 font-bold">{cajaAEliminar.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nombre de Caja:</span>
                <strong className="text-white">{cajaAEliminar.nombre}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sector / Ubicación:</span>
                <span className="text-slate-300">{cajaAEliminar.sector} • {cajaAEliminar.ubicacionPoste}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacidad Total:</span>
                <span className="text-slate-300 font-mono">{cajaAEliminar.puertosTotales} puertos</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-400">Abonados Conectados:</span>
                <span className={`font-bold font-mono ${cajaAEliminar.puertosOcupados > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {cajaAEliminar.puertosOcupados} ocupados
                </span>
              </div>
            </div>

            {cajaAEliminar.puertosOcupados > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>¡Precaución con abonados conectados!</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Esta caja tiene <strong>{cajaAEliminar.puertosOcupados} cliente(s)</strong> vinculados. Al eliminarla, sus acometidas ópticas deberán ser empalmadas o reasignadas a otra caja NAP cercana.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCajaAEliminar(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarEliminarCajaNap}
                disabled={isDeletingNap}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingNap ? 'Eliminando...' : 'Sí, Eliminar Caja NAP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: NOTIFICACIONES DE NUEVAS INSTALACIONES (TÉCNICOS) */}
      {/* ================================================================= */}
      {ordenACompletar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <form onSubmit={guardarInstalacionFisica} className="my-6 max-h-[92vh] w-full max-w-3xl space-y-5 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <header className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">Cierre de instalación FTTH</p>
                <h2 className="mt-1 text-xl font-black text-white">{ordenACompletar.nombreCliente}</h2>
                <p className="mt-1 text-xs text-slate-400">Orden {ordenACompletar.id} · {ordenACompletar.cedula}</p>
              </div>
              <button type="button" onClick={() => setOrdenACompletar(null)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar formulario"><X className="h-5 w-5" /></button>
            </header>

            <section>
              <h3 className="mb-3 text-sm font-bold text-white">Conexión física y equipo del cliente</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-300">
                  Caja NAP
                  <select required value={napInstalacionId} onChange={event => { setNapInstalacionId(event.target.value); setPuertoInstalacion(''); }} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                    <option value="" disabled>Selecciona una caja operativa</option>
                    {cajasNap.filter(box => box.estado === 'Operativa' && puertosLibres(box).length > 0).map(box => (
                      <option key={box.id} value={box.id}>{box.id} · {box.sector} · {puertosLibres(box).length} libres</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-300">
                  Puerto del splitter
                  <select required value={puertoInstalacion} onChange={event => setPuertoInstalacion(event.target.value)} disabled={!napInstalacionId} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white disabled:opacity-50">
                    <option value="" disabled>Selecciona un puerto libre</option>
                    {puertosLibres(cajasNap.find(box => box.id === napInstalacionId)).map(port => <option key={port.puerto} value={port.puerto}>Puerto {port.puerto}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-300">
                  Serial ONT (escanea o escribe)
                  <input required minLength={6} maxLength={40} autoCapitalize="characters" value={serialOntInstalacion} onChange={event => setSerialOntInstalacion(event.target.value.toUpperCase())} placeholder="HUAWEI... / ZTEG..." className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-600" />
                </label>
                <label className="text-xs font-semibold text-slate-300">
                  MAC de la ONT <span className="font-normal text-slate-500">(opcional)</span>
                  <input maxLength={32} autoCapitalize="characters" value={macOntInstalacion} onChange={event => setMacOntInstalacion(event.target.value.toUpperCase())} placeholder="00:1A:2B:3C:4D:5E" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-600" />
                </label>
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-bold text-white">Identidad lógica de la OLT</h3>
              <p className="mb-3 text-xs text-slate-500">Se guarda como referencia. No se envían comandos a la OLT hasta conocer el modelo, API y credenciales del operador.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-semibold text-slate-300">OLT<input maxLength={80} value={oltNombreInstalacion} onChange={event => setOltNombreInstalacion(event.target.value)} placeholder="OLT principal" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
                <label className="text-xs font-semibold text-slate-300">Frame<input maxLength={12} value={frameInstalacion} onChange={event => setFrameInstalacion(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
                <label className="text-xs font-semibold text-slate-300">Slot<input maxLength={12} value={slotInstalacion} onChange={event => setSlotInstalacion(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
                <label className="text-xs font-semibold text-slate-300">Puerto PON<input maxLength={16} value={ponInstalacion} onChange={event => setPonInstalacion(event.target.value)} placeholder="1" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
                <label className="text-xs font-semibold text-slate-300">ONU ID<input maxLength={16} value={onuIdInstalacion} onChange={event => setOnuIdInstalacion(event.target.value)} placeholder="12" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
                <label className="text-xs font-semibold text-slate-300">Potencia ONT (dBm)<input type="number" min="-50" max="0" step="0.1" value={potenciaInstalacion} onChange={event => setPotenciaInstalacion(event.target.value)} placeholder="-19.5" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-300">Cable drop utilizado (m)<input type="number" min="0" max="10000" value={metrosInstalacion} onChange={event => setMetrosInstalacion(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
              <label className="text-xs font-semibold text-slate-300">Conectores utilizados<input type="number" min="0" max="100" value={conectoresInstalacion} onChange={event => setConectoresInstalacion(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
            </section>

            {cajasNap.filter(box => box.estado === 'Operativa' && puertosLibres(box).length > 0).length === 0 && (
              <p role="alert" className="border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">No hay puertos disponibles en cajas NAP operativas. Registra o habilita capacidad antes de cerrar.</p>
            )}

            <footer className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setOrdenACompletar(null)} className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800">Cancelar</button>
              <button type="submit" disabled={isSavingInstallation || cajasNap.filter(box => box.estado === 'Operativa' && puertosLibres(box).length > 0).length === 0} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
                {isSavingInstallation ? 'Guardando instalación...' : 'Guardar conexión y activar'}
              </button>
            </footer>
          </form>
        </div>
      )}

      {mostrarNotificacionesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-cyan-400 rounded-xl border border-blue-500/30">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Notificaciones para Técnicos de Campo</h3>
                  <p className="text-xs text-slate-400">Avisos automáticos al agregar clientes para colocar la fibra óptica</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarNotificacionesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {ordenesInstalacion.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-white">No hay órdenes de instalación pendientes</p>
                  <p className="text-xs text-slate-400 mt-1">Todos los clientes nuevos tienen su fibra colocada.</p>
                </div>
              ) : (
                ordenesInstalacion.map(orden => (
                  <div
                    key={orden.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {orden.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        orden.estado === 'Instalado'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {orden.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">👤 Nombre del Cliente:</span>
                        <strong className="text-white text-sm">{orden.nombreCliente}</strong>
                        <span className="text-slate-500 font-mono text-[10px] block">Cédula: {orden.cedula}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">📞 Número de Contacto:</span>
                        <a
                          href={`tel:${orden.telefonoCliente}`}
                          className="text-cyan-300 font-mono font-bold hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-cyan-400" />
                          <span>{orden.telefonoCliente}</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-amber-400 font-bold block mb-0.5">🏠 Dirección de la Casa:</span>
                      <span className="text-white font-medium">{orden.direccionCasa}</span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">Sector: {orden.sectorNap} • Plan: {orden.plan}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          abrirUbicacionCliente(`${orden.direccionCasa}, ${orden.sectorNap}, Higuerote, Miranda`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>📍</span>
                        <span>Ver Mapa de Ruta</span>
                      </button>

                      {orden.estado === 'En Progreso' ? (
                        <button
                          onClick={() => handleCompletarOrdenInstalacion(orden.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Completar instalación</span>
                        </button>
                      ) : orden.estado !== 'Instalado' ? (
                        <button
                          onClick={() => handleIniciarOrdenInstalacion(orden.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Iniciar trabajo</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setMostrarNotificacionesModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar Notificaciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
