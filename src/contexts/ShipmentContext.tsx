import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Shipment, FleetVehicle, ShipmentStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ShipmentContextType {
  shipments: Shipment[];
  vehicles: FleetVehicle[];
  addShipment: (shipment: Omit<Shipment, 'lastUpdate' | 'id'>) => Promise<void>;
  updateShipment: (id: string, updates: Partial<Shipment>) => Promise<void>;
  deleteShipment: (id: string) => Promise<void>;
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
          plate: s.plate || '',
          route: s.route || '',
          status: s.status as ShipmentStatus,
          progress: s.progress || 0,
          lastUpdate: new Date(s.last_update).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          client: s.client || '',
          startTime: s.start_time,
          estimatedArrival: s.estimated_arrival
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
          address: v.address || ''
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

  const addShipment = async (shipment: Omit<Shipment, 'lastUpdate' | 'id'>) => {
    const { error } = await supabase.from('shipments').insert({
      vehicle_name: shipment.vehicle,
      plate: shipment.plate,
      route: shipment.route,
      status: shipment.status,
      progress: shipment.progress,
      client: shipment.client,
      start_time: shipment.startTime,
      estimated_arrival: shipment.estimatedArrival
    });
    if (error) throw error;
  };

  const updateShipment = async (id: string, updates: Partial<Shipment>) => {
    const { error } = await supabase.from('shipments').update({
      vehicle_name: updates.vehicle,
      plate: updates.plate,
      route: updates.route,
      status: updates.status,
      progress: updates.progress,
      client: updates.client,
      start_time: updates.startTime,
      estimated_arrival: updates.estimatedArrival,
      last_update: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
  };

  const deleteShipment = async (id: string) => {
    const { error } = await supabase.from('shipments').delete().eq('id', id);
    if (error) throw error;
  };

  return (
    <ShipmentContext.Provider value={{ shipments, vehicles, addShipment, updateShipment, deleteShipment, syncSascar, loading }}>
      {children}
    </ShipmentContext.Provider>
  );
};

export const useShipments = () => {
  const context = useContext(ShipmentContext);
  if (!context) throw new Error('useShipments must be used within a ShipmentProvider');
  return context;
};
