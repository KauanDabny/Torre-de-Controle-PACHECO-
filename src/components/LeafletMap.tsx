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

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapProps {
  className?: string;
  vehicles?: FleetVehicle[];
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ className, vehicles = [] }) => {
  const barueriPos: [number, number] = [-23.5062, -46.8762];
  const initialPosition: [number, number] = barueriPos; 
  
  // Calculate center based on vehicles or use initial
  const center = vehicles.length > 0 
    ? [vehicles[0].lat, vehicles[0].lng] as [number, number]
    : initialPosition;

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
        
        {/* HQ / Matriz Point */}
        <Marker position={barueriPos}>
          <Popup className="custom-popup">
            <div className="p-2 text-center">
              <p className="font-black text-primary-container text-xs uppercase tracking-widest">Matriz Torre De Controle</p>
              <p className="text-[10px] text-slate-500 mt-1">Barueri - SP</p>
            </div>
          </Popup>
        </Marker>

        {vehicles.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]}>
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
