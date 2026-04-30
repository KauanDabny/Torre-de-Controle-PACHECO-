import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from '../lib/utils';

// Fix for default Leaflet icons in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { FleetVehicle } from '../types';
import { Truck, Navigation, Activity } from 'lucide-react';

// Custom Marker Icon
const createCustomIcon = (ignition: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 ${ignition ? 'bg-teal-500' : 'bg-slate-400'} rounded-full opacity-20 animate-ping"></div>
        <div class="relative w-6 h-6 ${ignition ? 'bg-teal-500' : 'bg-slate-500'} border-2 border-white rounded-full shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

interface LeafletMapProps {
  className?: string;
  vehicles?: FleetVehicle[];
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ className, vehicles = [] }) => {
  const defaultCenter: [number, number] = [-23.5505, -46.6333]; // Central São Paulo
  
  // Calculate center based on vehicles or use initial
  const center = vehicles.length > 0 
    ? [vehicles[0].lat, vehicles[0].lng] as [number, number]
    : defaultCenter;

  return (
    <div className={cn("w-full h-full", className)}>
      <MapContainer 
        center={center} 
        zoom={vehicles.length > 0 ? 12 : 13} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Vehicles markers */}
        {vehicles.map((v) => (
          <Marker 
            key={v.id} 
            position={[v.lat, v.lng]}
            icon={createCustomIcon(v.ignition)}
          >
            <Popup className="custom-popup">
              <div className="p-2 space-y-2 min-w-[200px]">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-primary-container" />
                    <span className="font-black text-primary-container">{v.plate}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    v.ignition ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {v.ignition ? 'LIGADO' : 'DESLIGADO'}
                  </span>
                </div>
                
                <div className="space-y-1.5 pt-1">
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
                      {v.lastUpdate}
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
