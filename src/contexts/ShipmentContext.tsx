import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shipment, FleetVehicle } from '../types';

interface ShipmentContextType {
  shipments: Shipment[];
  vehicles: FleetVehicle[];
  sascarCredentials: { user: string; login: string; pass: string };
  setSascarCredentials: (creds: { user: string; login: string; pass: string }) => void;
  syncStatus: { lastSync: string | null; error: string | null; loading: boolean };
  addShipment: (shipment: Omit<Shipment, 'lastUpdate'>) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  deleteShipment: (id: string) => void;
  syncSascar: (silent?: boolean) => Promise<void>;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

// Initial mock data
const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: "J&T-990-21",
    vehicle: "Scania R450",
    plate: "ABC-1234",
    route: "Goiânia → Manaus",
    status: "EM TRÂNSITO",
    progress: 45,
    lastUpdate: "Agora",
    client: "J&T Express"
  },
  {
    id: "J&T-992-18",
    vehicle: "Mercedes Actros",
    plate: "XYZ-8890",
    route: "Rio de Janeiro → Vitória",
    status: "ENTREGA FINAL",
    progress: 92,
    lastUpdate: "há 12 min",
    client: "Mercado Livre"
  },
  {
    id: "J&T-885-04",
    vehicle: "Volvo FH 540",
    plate: "DFG-4451",
    route: "Brasília → Fortaleza",
    status: "PARADO (PONTO DE APOIO)",
    progress: 60,
    lastUpdate: "há 44 min",
    client: "Shopee"
  }
];

export const ShipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const saved = localStorage.getItem('transpacheco_shipments');
    return saved ? JSON.parse(saved) : INITIAL_SHIPMENTS;
  });

  const [vehicles, setVehicles] = useState<FleetVehicle[]>(() => {
    const saved = localStorage.getItem('transpacheco_vehicles');
    return saved ? JSON.parse(saved) : [];
  });

  const [sascarCredentials, setSascarCredentials] = useState(() => {
    const saved = localStorage.getItem('transpacheco_sascar_creds');
    try {
      return saved ? JSON.parse(saved) : { user: '', login: '', pass: '' };
    } catch {
      return { user: '', login: '', pass: '' };
    }
  });

  const [syncStatus, setSyncStatus] = useState<{ lastSync: string | null; error: string | null; loading: boolean }>({
    lastSync: null,
    error: null,
    loading: false
  });

  useEffect(() => {
    localStorage.setItem('transpacheco_shipments', JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    localStorage.setItem('transpacheco_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('transpacheco_sascar_creds', JSON.stringify(sascarCredentials));
  }, [sascarCredentials]);

  const syncSascar = async (silent = false) => {
    setSyncStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/sascar/fleet', {
        headers: {
          'x-sascar-user': sascarCredentials.user,
          'x-sascar-login': sascarCredentials.login,
          'x-sascar-pass': sascarCredentials.pass
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        let errorMsg = data.detail ? `${data.error}: ${data.detail}` : (data.error || 'Erro na sincronização');
        if (data.logs) {
          errorMsg += `\n\nLogs do Sistema:\n${data.logs.join('\n')}`;
        }
        throw new Error(errorMsg);
      }
      
      if (data.vehicles) {
        setVehicles(data.vehicles);
        setSyncStatus({ 
          lastSync: new Date().toLocaleTimeString(), 
          error: null, 
          loading: false 
        });
        if (!silent) {
          console.log(`Sincronização concluída! ${data.vehicles.length} veículos encontrados.`);
        }
      }
    } catch (err: any) {
      console.error('Auto-sync failed:', err.message);
      setSyncStatus({ 
        lastSync: new Date().toLocaleTimeString(), 
        error: err.message, 
        loading: false 
      });
      if (!silent) alert(err.message);
    }
  };

  // Automatic sync on mount and every 5 minutes
  useEffect(() => {
    syncSascar(true); // Initial sync (silent)
    
    const interval = setInterval(() => {
      syncSascar(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const addShipment = (shipment: Omit<Shipment, 'lastUpdate'>) => {
    const newShipment: Shipment = {
      ...shipment,
      lastUpdate: 'Agora'
    };
    setShipments(prev => [newShipment, ...prev]);
  };

  const updateShipment = (id: string, updates: Partial<Shipment>) => {
    setShipments(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates, lastUpdate: 'Agora' } : s
    ));
  };

  const deleteShipment = (id: string) => {
    setShipments(prev => prev.filter(s => s.id !== id));
  };

  return (
    <ShipmentContext.Provider value={{ shipments, vehicles, sascarCredentials, setSascarCredentials, syncStatus, addShipment, updateShipment, deleteShipment, syncSascar }}>
      {children}
    </ShipmentContext.Provider>
  );
};

export const useShipments = () => {
  const context = useContext(ShipmentContext);
  if (!context) throw new Error('useShipments must be used within a ShipmentProvider');
  return context;
};
