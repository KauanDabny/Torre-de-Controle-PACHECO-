import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FleetVehicle } from '../types';
import { Truck, MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FleetMapViewProps {
  vehicles: FleetVehicle[];
  onVehicleClick?: (vehicle: FleetVehicle) => void;
}

const VehicleIcon = (color: string, plate: string) => {
  // Using a raw SVG string for the icon to avoid renderToStaticMarkup hook issues in React 19
  const svgString = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
      <div style="background-color: white; padding: 4px; border-radius: 50%; border: 2.5px solid ${color}; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
          <path d="M15 18H9"></path>
          <path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"></path>
          <circle cx="7" cy="18" r="2"></circle>
          <circle cx="17" cy="18" r="2"></circle>
        </svg>
      </div>
      <div style="background-color: ${color}; color: white; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-family: 'Inter', sans-serif; font-weight: 900; margin-top: -4px; z-index: 1; border: 1.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap; letter-spacing: -0.025em; text-transform: uppercase;">
        ${plate}
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgString,
    className: 'custom-vehicle-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const MapUpdater: React.FC<{ center?: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Helper component for live timer in Popup
const StopDurationPopupContent: React.FC<{ vehicle: FleetVehicle }> = ({ vehicle }) => {
  const { getStopDuration } = useNotifications();
  const [durationMs, setDurationMs] = useState<number | null>(getStopDuration(vehicle.id));

  useEffect(() => {
    const timer = setInterval(() => {
      setDurationMs(getStopDuration(vehicle.id));
    }, 1000);
    return () => clearInterval(timer);
  }, [vehicle.id, getStopDuration]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const isCriticalStop = durationMs !== null && durationMs > 10 * 60 * 1000; // 10 minutes

  return (
    <div className="p-1 min-w-[180px]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-primary-container" />
          <span className="font-black text-primary-container">{vehicle.plate}</span>
        </div>
        {isCriticalStop && (
          <div className="flex items-center gap-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded animate-pulse">
            <AlertCircle size={10} />
            <span className="text-[8px] font-black uppercase">Crítico</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${vehicle.ignition ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold">{vehicle.ignition ? 'Ignição Ligada' : 'Ignição Desligada'}</span>
          </div>
        </div>

        {durationMs !== null && vehicle.ignition && vehicle.speed === 0 && (
          <div className={`p-2 rounded-lg ${isCriticalStop ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
            <p className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
              <Clock size={10} /> Tempo de Parada
            </p>
            <p className={`text-sm font-black ${isCriticalStop ? 'text-red-600' : 'text-amber-600'}`}>
              {formatDuration(durationMs)}
            </p>
            {isCriticalStop && (
              <p className="text-[8px] mt-1 font-bold text-red-400 leading-tight">
                Veículo parado há mais de 10 minutos com ignição ligada!
              </p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Velocidade</p>
            <p className="text-xs font-black">{vehicle.speed} km/h</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Última Transm.</p>
            <p className="text-xs font-black">{vehicle.lastUpdate}</p>
          </div>
        </div>

        <div className="mt-1 pt-2 border-t border-slate-100">
          <div className="flex items-start gap-1.5">
            <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] font-medium leading-tight text-slate-600 max-w-[150px]">{vehicle.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FleetMapView: React.FC<FleetMapViewProps> = ({ vehicles, onVehicleClick }) => {
  const defaultCenter: [number, number] = [-23.5505, -46.6333]; // São Paulo
  
  const getStatusColor = (speed: number, ignition: boolean, status?: string) => {
    if (status === 'Encerrado') return '#64748b'; // slate-500
    if (status === 'Parado') return '#fbbf24'; // amber-400
    if (status === 'Aguardando') return '#22d3ee'; // cyan-400
    if (!ignition) return '#94a3b8'; // slate-400 (Off)
    if (speed > 5) return '#22c55e'; // green-500 (Moving)
    return '#f97316'; // orange-500 (Idle/Parado em Viagem)
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-outline-variant relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles.map(vehicle => (
          <Marker 
            key={vehicle.id} 
            position={[vehicle.lat, vehicle.lng]}
            icon={VehicleIcon(
              getStatusColor(vehicle.speed, vehicle.ignition, vehicle.status),
              vehicle.plate || 'S/PLACA'
            )}
            eventHandlers={{
              click: () => onVehicleClick?.(vehicle)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-primary-container" />
                    <span className="font-black text-primary-container uppercase">{vehicle.plate}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                    vehicle.status === 'Em Viagem' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  )}>{vehicle.status || 'Status N/A'}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1.5 text-center">Motorista</p>
                    <p className="text-xs font-bold text-slate-700 text-center bg-slate-50 p-1 rounded border border-slate-100">
                      {vehicle.driver || 'Não Identificado'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Velocidade</p>
                      <p className="text-xs font-black text-primary-container">{Math.round(vehicle.speed)} km/h</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Ignição</p>
                      <p className={cn("text-xs font-black", vehicle.ignition ? "text-green-600" : "text-slate-400")}>
                        {vehicle.ignition ? 'LIGADA' : 'DESLIGADA'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Última Macro</p>
                    <p className="text-[10px] font-bold text-slate-600 italic bg-amber-50 p-1.5 rounded border border-amber-100">
                      {vehicle.macro || 'Sem Mensagem'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] font-medium leading-tight text-slate-500">{vehicle.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-outline-variant shadow-lg flex flex-col gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-1 mb-1">Status da Frota</p>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
          <span className="text-[9px] font-bold text-slate-600 uppercase">Em Movimento</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
          <span className="text-[9px] font-bold text-slate-600 uppercase">Parado (L)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
          <span className="text-[9px] font-bold text-slate-600 uppercase">Parado (D)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22d3ee]" />
          <span className="text-[9px] font-bold text-slate-600 uppercase">Aguardando</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
          <span className="text-[9px] font-bold text-slate-600 uppercase">Desligado</span>
        </div>
      </div>
    </div>
  );
};
