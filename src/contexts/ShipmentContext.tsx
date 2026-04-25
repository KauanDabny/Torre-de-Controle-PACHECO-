import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Shipment, FleetVehicle, ShipmentStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ShipmentContextType {
  shipments: Shipment[];
  vehicles: FleetVehicle[];
  addShipment: (shipment: Omit<Shipment, 'lastUpdate'>) => Promise<void>;
  updateShipment: (id: string, updates: Partial<Shipment>) => Promise<void>;
  deleteShipment: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<FleetVehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<FleetVehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  syncSascar: () => Promise<void>;
  loading: boolean;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

export const ShipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from Supabase
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch Shipments
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (shipmentError) throw shipmentError;

      // Fetch Vehicles
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*');
      
      if (vehicleError) throw vehicleError;

      if (shipmentData) {
        setShipments(shipmentData.map(s => ({
          id: s.id,
          vehicle: s.vehicle_name || 'Desconhecido',
          driver: s.driver || 'Não Atribuído',
          plate: s.plate || '',
          route: s.route || '',
          status: s.status as ShipmentStatus,
          progress: s.progress || 0,
          lastUpdate: s.last_update ? new Date(s.last_update).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---',
          client: s.client || '',
          startTime: s.start_time,
          estimatedArrival: s.estimated_arrival,
          collectionTime: s.collection_time,
          unloadingTime: s.unloading_time
        })));
      }

      if (vehicleData) {
        setVehicles(vehicleData.map(v => ({
          id: v.id,
          plate: v.plate,
          prefix: v.prefix,
          lat: v.last_lat || 0,
          lng: v.last_lng || 0,
          speed: v.last_speed || 0,
          lastUpdate: v.last_update ? new Date(v.last_update).toLocaleTimeString() : 'N/A',
          ignition: v.ignition || false,
          address: v.address || '',
          category: v.category || ''
        })));
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
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

    return () => {
      supabase.removeChannel(shipmentsChannel);
      supabase.removeChannel(vehiclesChannel);
    };
  }, [isAuthenticated, fetchData]);

  const syncSascar = async () => {
    try {
      const response = await fetch('/api/sascar/fleet');
      if (!response.ok) throw new Error('Erro na sincronização');
      const data = await response.json();
      
      if (data.vehicles) {
        // Here we would ideally upsert to Supabase
        for (const v of data.vehicles) {
          await supabase.from('vehicles').upsert({
            plate: v.plate,
            prefix: v.prefix,
            last_lat: v.lat,
            last_lng: v.lng,
            last_speed: v.speed,
            last_update: new Date().toISOString(),
            ignition: v.ignition,
            address: v.address
          });
        }
        await fetchData();
      }
    } catch (err: any) {
      console.error('Sascar sync failed:', err.message);
    }
  };

  const addShipment = async (shipment: Omit<Shipment, 'lastUpdate'>) => {
    // First, ensure the vehicle exists in the vehicles table
    await supabase.from('vehicles').upsert({
      plate: shipment.plate,
      prefix: shipment.vehicle,
      last_update: new Date().toISOString()
    }, { onConflict: 'plate' });

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

  return (
    <ShipmentContext.Provider value={{ 
      shipments, 
      vehicles, 
      addShipment, 
      updateShipment, 
      deleteShipment, 
      addVehicle,
      updateVehicle,
      deleteVehicle,
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
