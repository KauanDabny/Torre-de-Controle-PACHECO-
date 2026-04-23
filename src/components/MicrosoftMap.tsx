import React, { useEffect, useRef } from 'react';
import * as atlas from 'azure-maps-control';
import { cn } from '../lib/utils';
import 'azure-maps-control/dist/atlas.min.css';

interface MicrosoftMapProps {
  className?: string;
}

export const MicrosoftMap: React.FC<MicrosoftMapProps> = ({ className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const subscriptionKey = import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY;

    if (!subscriptionKey) {
      console.warn('Azure Maps subscription key is missing. Please set VITE_AZURE_MAPS_SUBSCRIPTION_KEY in your environment.');
      return;
    }

    // Initialize the map
    const map = new atlas.Map(mapContainerRef.current, {
      center: [-46.6333, -23.5505], // Sao Paulo
      zoom: 10,
      view: 'Auto',
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: subscriptionKey
      }
    });

    map.events.add('ready', () => {
      // Add a simple pin for the Hub
      const datasource = new atlas.source.DataSource();
      map.sources.add(datasource);

      const hubPin = new atlas.data.Feature(new atlas.data.Point([-14.235, -51.9253]), {
        title: "MATRIZ",
        description: "Base Operacional Central"
      });

      datasource.add(hubPin);

      map.layers.add(new atlas.layer.SymbolLayer(datasource, undefined, {
        iconOptions: {
          image: 'pin-round-blue'
        },
        textOptions: {
          textField: ['get', 'title'],
          offset: [0, 1.2]
        }
      }));
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
      }
    };
  }, []);

  const subscriptionKey = import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY;

  if (!subscriptionKey) {
    return (
      <div className={cn("relative w-full h-full", className)}>
        {/* Iframe Fallback (Bing Maps Embed) - Works without API Key for basic viewing */}
        <iframe
          title="Microsoft Bing Maps"
          width="100%"
          height="100%"
          frameBorder="0"
          src="https://www.bing.com/maps/embed?h=580&w=800&cp=-23.5505~-46.6333&lvl=12&typ=d&sty=h&src=SHELL&FORM=MBEDV8"
          scrolling="no"
          className="grayscale opacity-90"
        />
        <div className="absolute top-4 left-4 right-4 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-outline-variant pointer-events-auto max-w-xs transition-all hover:scale-[1.02]">
            <h3 className="font-bold text-primary-container text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Modo de Visualização (Demo)
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Para ativar o mapa interativo dinâmico, adicione sua chave 
              <code className="bg-slate-100 px-1 rounded ml-1">VITE_AZURE_MAPS_SUBSCRIPTION_KEY</code> 
              nos Secrets do AI Studio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className={className} style={{ width: '100%', height: '100%' }} />
  );
};
