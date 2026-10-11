import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import { parseNapCoordinates } from './napCoordinates';
import 'leaflet/dist/leaflet.css';

export interface NapMapItem {
  id: string;
  nombre: string;
  sector: string;
  coordenadas?: string;
  puertosTotales: number;
  puertosOcupados: number;
  estado: 'Operativa' | 'Mantenimiento' | 'Saturada' | 'Con Falla';
}

function FitMapToMarkers({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0] as LatLngExpression, 16);
    } else if (points.length > 1) {
      map.fitBounds(points as LatLngBoundsExpression, { padding: [32, 32], maxZoom: 16 });
    }
  }, [map, points]);

  return null;
}

export default function NapMap({ boxes }: { boxes: NapMapItem[] }) {
  const locatedBoxes = useMemo(() => boxes.flatMap(box => {
    const position = parseNapCoordinates(box.coordenadas);
    return position ? [{ box, position }] : [];
  }), [boxes]);
  const unlocatedBoxes = boxes.filter(box => !parseNapCoordinates(box.coordenadas));
  const points = useMemo(() => locatedBoxes.map(item => item.position), [locatedBoxes]);

  return (
    <section className="overflow-hidden border border-slate-800 bg-slate-900/70">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-white">Mapa de red FTTH</h2>
          <p className="mt-1 text-xs text-slate-400">Ubicaciones registradas y capacidad física por caja NAP</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Disponible</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />Alta ocupación</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Mantenimiento</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" />Falla o saturada</span>
        </div>
      </header>

      {locatedBoxes.length ? (
        <MapContainer center={points[0]} zoom={14} scrollWheelZoom className="h-[360px] w-full sm:h-[460px]">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapToMarkers points={points} />
          {locatedBoxes.map(({ box, position }) => {
            const occupied = Number(box.puertosOcupados || 0);
            const capacity = Number(box.puertosTotales || 0);
            const free = Math.max(0, capacity - occupied);
            const ratio = capacity ? occupied / capacity : 1;
            const color = box.estado === 'Con Falla' || box.estado === 'Saturada' || free === 0
              ? '#e11d48'
              : box.estado === 'Mantenimiento'
                ? '#94a3b8'
              : ratio >= 0.5
                ? '#f59e0b'
                : '#10b981';
            return (
              <CircleMarker key={box.id} center={position} radius={10} pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}>
                <Popup>
                  <div className="min-w-44 text-sm text-slate-900">
                    <strong className="block">{box.nombre}</strong>
                    <span className="block text-xs">{box.sector}</span>
                    <span className="mt-2 block text-xs">Estado: {box.estado}</span>
                    <span className="block text-xs">Puertos: {occupied}/{capacity} ocupados · {free} libres</span>
                    <span className="mt-1 block font-mono text-[10px]">{box.coordenadas}</span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      ) : (
        <div className="flex h-[360px] items-center justify-center bg-slate-950 px-6 text-center text-sm text-slate-400 sm:h-[460px]">
          Registra coordenadas GPS válidas en las cajas NAP para ubicarlas en el mapa.
        </div>
      )}

      <footer className="flex flex-wrap items-start justify-between gap-3 border-t border-slate-800 px-5 py-3 text-xs">
        <span className="text-slate-500">{locatedBoxes.length} ubicadas de {boxes.length} cajas</span>
        {unlocatedBoxes.length > 0 && (
          <span className="text-amber-300">Sin coordenadas válidas: {unlocatedBoxes.map(box => box.id).join(', ')}</span>
        )}
      </footer>
    </section>
  );
}