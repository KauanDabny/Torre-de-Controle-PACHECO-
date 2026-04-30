import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FleetVehicle } from '../types';
import { Truck, MapPin, Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

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

const VehicleIcon = (color: string) => {
  const iconHtml = renderToStaticMarkup(
    <div style={{ 
      color: color,
      backgroundColor: 'white',
      padding: '4px',
      borderRadius: '50%',
      border: `2px solid ${color}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Truck size={18} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-vehicle-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const MapUpdater: React.FC<{ center?: [number, number] }> = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

export const FleetMapView: React.FC<FleetMapViewProps> = ({ vehicles, onVehicleClick }) => {
  const defaultCenter: [number, number] = [-23.5505, -46.6333]; // São Paulo
  
  const getStatusColor = (speed: number, ignition: boolean) => {
    if (!ignition) return '#94a3b8'; // slate-400 (Off)
    if (speed > 0) return '#ef4444'; // red-500 (Moving)
    return '#facc15'; // yellow-400 (Idle)
  };

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-outline-variant shadow-inner relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        style={{ h: '100%', w: '100%', height: '100%', width: '100%' }}
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
            icon={VehicleIcon(getStatusColor(vehicle.speed, vehicle.ignition))}
            eventHandlers={{
              click: () => onVehicleClick?.(vehicle)
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={16} className="text-primary-container" />
                  <span className="font-black text-primary-container">{vehicle.plate}</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${vehicle.ignition ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-xs font-bold">{vehicle.ignition ? 'Ignição Ligada' : 'Ignição Desligada'}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400">Velocidade</p>
                      <p className="text-xs font-black">{vehicle.speed} km/h</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400">Última Transmissão</p>
                      <p className="text-xs font-black">{vehicle.lastUpdate}</p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] font-medium leading-tight text-slate-600">{vehicle.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-outline-variant shadow-lg flex flex-col gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Legenda</p>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="text-[10px] font-bold text-slate-600 uppercase">Em Movimento</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#facc15]" />
          <span className="text-[10px] font-bold text-slate-600 uppercase">Parado (Ligado)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#94a3b8]" />
          <span className="text-[10px] font-bold text-slate-600 uppercase">Desligado</span>
        </div>
      </div>
    </div>
  );
};
