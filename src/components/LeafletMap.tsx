import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from '../lib/utils';

// Fix for default Leaflet icons in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { FleetVehicle } from '../types';
import { Truck, Navigation, Activity, Circle } from 'lucide-react';

const createCustomIcon = (ignition: boolean) => {
  return L.divIcon({
    className: 'custom-vehicle-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 ${ignition ? 'bg-teal-500/20' : 'bg-slate-500/20'} rounded-full animate-pulse"></div>
        <div class="relative z-10 w-8 h-8 ${ignition ? 'bg-teal-500 text-white' : 'bg-slate-600 text-slate-100'} rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a2 2 0 0 0-.59-1.42l-2.42-2.42A2 2 0 0 0 17.58 9H15"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

interface LeafletMapProps {
  className?: string;
  vehicles?: FleetVehicle[];
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ className, vehicles = [] }) => {
  const initialPosition: [number, number] = [-14.235, -51.9253]; // Centered on Brazil
  
  // Calculate center based on vehicles or use initial
  const center = vehicles.length > 0 
    ? [vehicles[0].lat, vehicles[0].lng] as [number, number]
    : initialPosition;

  return (
    <div className={cn("w-full h-full", className)}>
      <style>{`
        .leaflet-tooltip-pane .vehicle-label {
          background-color: rgba(0, 0, 0, 0.75);
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 800;
          font-size: 11px;
          padding: 2px 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          white-space: nowrap;
          pointer-events: none;
          margin-top: -35px;
        }
        .leaflet-tooltip-top:before {
          border-top-color: rgba(0, 0, 0, 0.75);
        }
      `}</style>
      <MapContainer 
        center={center} 
        zoom={vehicles.length > 0 ? 12 : 4} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles.map((v) => (
          <Marker 
            key={v.id} 
            position={[v.lat, v.lng]}
            icon={createCustomIcon(v.ignition)}
          >
            <Tooltip 
              permanent 
              direction="top" 
              className="vehicle-label"
              offset={[0, -10]}
            >
              {v.plate}{v.driver ? ` (${v.driver.split(' ')[0]})` : ''}
            </Tooltip>
            <Popup className="custom-popup">
              <div className="p-2 space-y-2 min-w-[220px]">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-primary-container" />
                    <div className="flex flex-col">
                      <span className="font-black text-primary-container leading-none">{v.plate}</span>
                      {v.prefix && <span className="text-[10px] text-slate-400">Prefixo: {v.prefix}</span>}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    v.ignition ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {v.ignition ? 'LIGADO' : 'DESLIGADO'}
                  </span>
                </div>
                
                <div className="space-y-1.5 pt-1">
                  {v.driver && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Circle size={8} className="fill-primary-container text-primary-container" />
                      Motorista: {v.driver}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Navigation size={12} className="text-slate-400" />
                    <span className="font-medium">{v.address}</span>
                  </div>
                  <div className="flex items-center justify-between items-center text-xs pt-1">
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <Activity size={12} className="text-slate-400" />
                      {v.speed} km/h
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Atualizado: {v.lastUpdate}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
