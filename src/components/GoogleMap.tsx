import React from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { cn } from '../lib/utils';

interface GoogleMapProps {
  className?: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ className }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const center = { lat: -14.235, lng: -51.9253 }; // Centered on Brazil

  if (!apiKey) {
    return (
      <div className={cn("relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden", className)}>
        {/* Iframe Fallback (Google Maps Embed) - Works without private API Key for basic viewing */}
        <iframe
          title="Google Maps"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_YOUR_API_KEY&q=São+Paulo,Brazil&center=-23.5505,-46.6333&zoom=12`}
          allowFullScreen
          className="grayscale opacity-80"
        ></iframe>
        
        {/* Simple non-API Embed if above fails or for better UX when key is missing */}
        <div className="absolute inset-0 bg-slate-200/50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-outline-variant max-w-sm">
                <h3 className="font-bold text-primary-container text-sm flex items-center justify-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    Configuração de Mapa Necessária
                </h3>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                    O Google Maps requer uma chave de API para funcionar plenamente. 
                    <br/><br/>
                    Por favor, adicione a variável <code className="bg-slate-100 px-1 rounded font-mono text-primary-container">VITE_GOOGLE_MAPS_API_KEY</code> nos Secrets do AI Studio para habilitar o mapa interativo do TransPacheco.
                </p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={center}
          defaultZoom={12}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
        >
          <Marker position={center} title="MATRIZ" />
        </Map>
      </APIProvider>
    </div>
  );
};
