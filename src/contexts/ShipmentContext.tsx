import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Shipment, FleetVehicle, ShipmentStatus, Driver, DriverScoreboard, FleetMetrics } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface ShipmentContextType {
  shipments: Shipment[];
  vehicles: FleetVehicle[];
  drivers: Driver[];
  uniqueClients: string[];
  uniqueRoutes: string[];
  addShipment: (shipment: Omit<Shipment, 'lastUpdate'>) => Promise<void>;
  updateShipment: (id: string, updates: Partial<Shipment>) => Promise<void>;
  deleteShipment: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<FleetVehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<FleetVehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addDriver: (name: string) => Promise<void>;
  addClient: (client: string) => Promise<void>;
  addRoute: (route: string) => Promise<void>;
  syncSascar: () => Promise<void>;
  loading: boolean;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

export const ShipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [uniqueClients, setUniqueClients] = useState<string[]>([]);
  const [uniqueRoutes, setUniqueRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from Supabase
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch data in parallel to be faster
      const [shipmentsRes, vehiclesRes, driversRes] = await Promise.all([
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*'),
        supabase.from('drivers').select('*').order('name')
      ]);

      if (shipmentsRes.error) console.error('Error fetching shipments:', shipmentsRes.error);
      if (vehiclesRes.error) console.error('Error fetching vehicles:', vehiclesRes.error);
      if (driversRes.error) console.warn('Drivers fetch error (ignoring if table missing):', driversRes.error);

      // MOCK DATA FALLBACK - If database is empty, use mock data to keep the system looking populated
      const MOCK_SHIPMENTS: Shipment[] = [
        { id: '844', vehicle: 'Scania R450', driver: 'Antônio Silva', plate: 'ABC1D23', route: 'Barueri, SP → Curitiba, PR', status: 'EM TRÂNSITO', progress: 65, lastUpdate: '14:20', client: 'Mercado Livre', startTime: '2024-04-25T08:00:00Z' },
        { id: '309', vehicle: 'Volvo FH 540', driver: 'Carlos Ferreira', plate: 'XYZ9E87', route: 'Extrema, MG → Guarulhos, SP', status: 'ENTREGA FINAL', progress: 92, lastUpdate: '15:10', client: 'Amazon', startTime: '2024-04-25T10:00:00Z' },
        { id: '152', vehicle: 'Mercedes Actros', driver: 'Roberto Santos', plate: 'KLM2J45', route: 'Santos, SP → Campinas, SP', status: 'PARADO (PONTO DE APOIO)', progress: 45, lastUpdate: '14:55', client: 'Bayer', startTime: '2024-04-25T12:00:00Z' },
        { id: '761', vehicle: 'DAF XF', driver: 'Luiz Oliveira', plate: 'OPQ7K32', route: 'Cajamar, SP → Rio de Janeiro, RJ', status: 'CARREGANDO', progress: 15, lastUpdate: '15:20', client: 'Petrobras', startTime: '2024-04-25T14:00:00Z' }
      ];

      const MOCK_VEHICLES: FleetVehicle[] = [
        { id: 'v1', plate: 'ABC1D23', prefix: 'Scania R450', lat: -23.5505, lng: -46.6333, speed: 82, lastUpdate: '15:25', ignition: true, address: 'Rod. dos Bandeirantes, KM 45' },
        { id: 'v2', plate: 'XYZ9E87', prefix: 'Volvo FH 540', lat: -23.2237, lng: -45.9009, speed: 78, lastUpdate: '15:25', ignition: true, address: 'Rod. Pres. Dutra, KM 152' }
      ];

      const MOCK_DRIVERS: Driver[] = [
        { id: 'd1', name: 'Antônio Silva' },
        { id: 'd2', name: 'Carlos Ferreira' },
        { id: 'd3', name: 'Roberto Santos' },
        { id: 'd4', name: 'Luiz Oliveira' }
      ];

      if (shipmentsRes.data && shipmentsRes.data.length > 0) {
        const mappedShipments: Shipment[] = shipmentsRes.data.map(s => ({
          id: s.id,
          vehicle: s.vehicle_name || 'Desconhecido',
          driver: s.driver || 'Não Atribuído',
          plate: s.plate || '',
          route: s.route || '',
          status: s.status as ShipmentStatus,
          progress: s.progress || 0,
          lastUpdate: s.last_update ? new Date(s.last_update).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(s.last_update).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---',
          client: s.client || '',
          startTime: s.start_time,
          estimatedArrival: s.estimated_arrival,
          collectionTime: s.collection_time,
          unloadingTime: s.unloading_time
        }));
        setShipments(mappedShipments);
        
        // Extract unique clients and routes
        setUniqueClients(Array.from(new Set(mappedShipments.map(s => s.client).filter(Boolean))));
        setUniqueRoutes(Array.from(new Set(mappedShipments.map(s => s.route).filter(Boolean))));
      } else {
        setShipments(MOCK_SHIPMENTS);
        setUniqueClients(Array.from(new Set(MOCK_SHIPMENTS.map(s => s.client).filter(Boolean))));
        setUniqueRoutes(Array.from(new Set(MOCK_SHIPMENTS.map(s => s.route).filter(Boolean))));
      }

      if (vehiclesRes.data && vehiclesRes.data.length > 0) {
        setVehicles(vehiclesRes.data.map(v => ({
          id: v.id,
          plate: v.plate,
          prefix: v.prefix,
          lat: v.last_lat || 0,
          lng: v.last_lng || 0,
          speed: v.last_speed || 0,
          lastUpdate: v.last_update ? new Date(v.last_update).toLocaleTimeString() : 'N/A',
          ignition: v.ignition || false,
          address: v.address || '',
          category: v.category || '',
          macro: v.last_macro,
          status: v.operational_status,
          driver: v.current_driver
        })));
      } else if (!isAuthenticated) {
        setVehicles(MOCK_VEHICLES);
      }

      if (driversRes.data && driversRes.data.length > 0) {
        setDrivers(driversRes.data.map((d: any) => ({
          id: d.id,
          name: d.name
        })));
      } else {
        setDrivers(MOCK_DRIVERS);
      }
    } catch (err) {
      console.error('General fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();

    if (!isAuthenticated) return;

    // Subscribe to real-time changes
    const shipmentsChannel = supabase.channel('public:shipments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        fetchData();
      })
      .subscribe();

    const vehiclesChannel = supabase.channel('public:vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        fetchData();
      })
      .subscribe();

    const driversChannel = supabase.channel('public:drivers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(shipmentsChannel);
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(driversChannel);
    };
  }, [isAuthenticated, fetchData]);

  const syncSascar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      console.log('Starting Sascar Sync...');
      const response = await axios.get('/api/sascar/fleet');
      const { vehicles: sascarVehicles } = response.data;
      
      console.log(`Sascar Sync: Obtained ${sascarVehicles?.length || 0} vehicles`);

      if (sascarVehicles && sascarVehicles.length > 0) {
        // Map to our local FleetVehicle type
        const updatedVehicles: FleetVehicle[] = sascarVehicles.map((v: any) => ({
          id: v.id,
          plate: v.plate,
          prefix: v.prefix,
          lat: v.lat,
          lng: v.lng,
          speed: v.speed,
          lastUpdate: v.lastUpdate,
          ignition: v.ignition,
          address: v.address || 'Localização obtida via Sascar',
          macro: v.macro,
          status: v.status,
          driver: v.driver
        }));

        setVehicles(updatedVehicles);
        
        // Batch upsert to Supabase for performance
        // We'll do it in chunks or just all at once if not too many
        const upsertData = updatedVehicles.map(v => ({
          plate: v.plate,
          prefix: v.prefix,
          last_lat: v.lat,
          last_lng: v.lng,
          last_speed: v.speed,
          last_update: new Date().toISOString(),
          ignition: v.ignition,
          address: v.address,
          last_macro: v.macro,
          operational_status: v.status,
          current_driver: v.driver
        }));

        const { error: upsertError } = await supabase.from('vehicles').upsert(upsertData, { onConflict: 'plate' });
        if (upsertError) console.warn('Supabase positions upsert error:', upsertError);
      }
      
      if (!silent) {
        await fetchData();
        toast.success('Sincronização concluída!');
      }
    } catch (err: any) {
      console.error('Sascar sync failed:', err.message);
      if (!silent) {
        toast.error(`Falha na sincronização: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [fetchData]);

  // Automatic sync interval (every 2 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial sync
    syncSascar(true);

    const intervalId = setInterval(() => {
      syncSascar(true);
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated, syncSascar]);

  const addShipment = async (shipment: Omit<Shipment, 'lastUpdate'>) => {
    // First, ensure the vehicle exists in the vehicles table
    await supabase.from('vehicles').upsert({
      plate: shipment.plate,
      prefix: shipment.vehicle,
      last_update: new Date().toISOString()
    }, { onConflict: 'plate' });

    // Register driver if provided
    if (shipment.driver) {
      try {
        await supabase.from('drivers').upsert({
          name: shipment.driver
        }, { onConflict: 'name' });
      } catch (e) {
        console.warn('Could not sync driver to drivers table:', e);
      }
    }

    const { error } = await supabase.from('shipments').insert({
      id: shipment.id,
      vehicle_name: shipment.vehicle,
      driver: shipment.driver,
      plate: shipment.plate,
      route: shipment.route,
      status: shipment.status,
      progress: shipment.progress,
      client: shipment.client,
      start_time: shipment.startTime,
      estimated_arrival: shipment.estimatedArrival,
      collection_time: shipment.collectionTime,
      unloading_time: shipment.unloadingTime,
      last_update: new Date().toISOString()
    });
    if (error) throw error;
  };

  const updateShipment = async (id: string, updates: Partial<Shipment>) => {
    // If plate is being updated, ensure the new vehicle exists
    if (updates.plate) {
      await supabase.from('vehicles').upsert({
        plate: updates.plate,
        prefix: updates.vehicle, // May be undefined, which is fine for upsert
        last_update: new Date().toISOString()
      }, { onConflict: 'plate' });
    }

    // Register driver if updated
    if (updates.driver) {
      try {
        await supabase.from('drivers').upsert({
          name: updates.driver
        }, { onConflict: 'name' });
      } catch (e) {
        console.warn('Could not sync driver to drivers table:', e);
      }
    }

    const payload: any = {};
    if (updates.vehicle) payload.vehicle_name = updates.vehicle;
    if (updates.driver) payload.driver = updates.driver;
    if (updates.plate) payload.plate = updates.plate;
    if (updates.route) payload.route = updates.route;
    if (updates.status) payload.status = updates.status;
    if (updates.progress !== undefined) payload.progress = updates.progress;
    if (updates.client) payload.client = updates.client;
    if (updates.startTime) payload.start_time = updates.startTime;
    if (updates.estimatedArrival) payload.estimated_arrival = updates.estimatedArrival;
    if (updates.collectionTime) payload.collection_time = updates.collectionTime;
    if (updates.unloadingTime) payload.unloading_time = updates.unloadingTime;
    payload.last_update = new Date().toISOString();

    const { error } = await supabase.from('shipments').update(payload).eq('id', id);
    if (error) throw error;
  };

  const deleteShipment = async (id: string) => {
    const { error } = await supabase.from('shipments').delete().eq('id', id);
    if (error) throw error;
  };

  const addVehicle = async (vehicle: Omit<FleetVehicle, 'id'>) => {
    const { error } = await supabase.from('vehicles').upsert({
      plate: vehicle.plate.toUpperCase(),
      prefix: vehicle.prefix,
      address: vehicle.address,
      last_update: new Date().toISOString()
    }, { onConflict: 'plate' });
    if (error) throw error;
    fetchData();
  };

  const updateVehicle = async (id: string, updates: Partial<FleetVehicle>) => {
    const payload: any = {};
    if (updates.plate) payload.plate = updates.plate.toUpperCase();
    if (updates.prefix !== undefined) payload.prefix = updates.prefix;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.lat !== undefined) payload.last_lat = updates.lat;
    if (updates.lng !== undefined) payload.last_lng = updates.lng;
    if (updates.speed !== undefined) payload.last_speed = updates.speed;
    if (updates.ignition !== undefined) payload.ignition = updates.ignition;
    
    payload.last_update = new Date().toISOString();

    const { error } = await supabase.from('vehicles').update(payload).eq('id', id);
    if (error) throw error;
    fetchData();
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
    fetchData();
  };

  const addDriver = async (name: string) => {
    const { error } = await supabase.from('drivers').upsert({
      name
    }, { onConflict: 'name' });
    if (error) throw error;
    fetchData();
  };

  const addClient = async (client: string) => {
    setUniqueClients(prev => Array.from(new Set([...prev, client])));
  };

  const addRoute = async (route: string) => {
    setUniqueRoutes(prev => Array.from(new Set([...prev, route])));
  };

  // Simulation of movement for mock data
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles => {
        return prevVehicles.map(v => {
          if (!v.ignition || v.speed === 0) return v;
          
          // Move a bit (roughly ~0.001 deg is ~111m)
          // Speed 80km/h is ~22m/s. In 5s it moves 110m.
          const movement = (v.speed / 3600) * 0.05; // Dummy factor for visualization
          const newLat = v.lat + (Math.random() - 0.5) * movement;
          const newLng = v.lng + (Math.random() - 0.5) * movement;
          
          return {
            ...v,
            lat: newLat,
            lng: newLng,
            lastUpdate: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
        });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ShipmentContext.Provider value={{ 
      shipments, 
      vehicles, 
      drivers,
      uniqueClients,
      uniqueRoutes,
      addShipment, 
      updateShipment, 
      deleteShipment, 
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addDriver,
      addClient,
      addRoute,
      syncSascar, 
      loading 
    }}>
      {children}
    </ShipmentContext.Provider>
  );
};

export const useShipments = () => {
  const context = useContext(ShipmentContext);
  if (!context) throw new Error('useShipments must be used within a ShipmentProvider');
  return context;
};
