import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useShipments } from './ShipmentContext';
import { Shipment, FleetVehicle } from '../types';

export interface FleetNotification {
  id: string;
  type: 'delay' | 'stop' | 'ignition' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  vehicleId?: string;
  plate?: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: FleetNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getStopDuration: (vehicleId: string) => number | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shipments, vehicles } = useShipments();
  const [notifications, setNotifications] = useState<FleetNotification[]>([]);
  const prevShipmentsRef = useRef<Shipment[]>([]);
  const prevVehiclesRef = useRef<FleetVehicle[]>([]);
  const stopTimersRef = useRef<{ [key: string]: number }>({});

  const addNotification = (title: string, message: string, type: FleetNotification['type'], vehicleId?: string, plate?: string) => {
    const newNotification: FleetNotification = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      title,
      message,
      timestamp: new Date(),
      vehicleId,
      plate,
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    
    // Discrete toast notification
    toast(
      (t) => (
        <div className="flex items-start gap-3">
          <div className={`mt-1 p-1 rounded-full ${
            type === 'delay' ? 'bg-amber-100 text-amber-600' :
            type === 'stop' ? 'bg-orange-100 text-orange-600' :
            type === 'ignition' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {type === 'delay' && <span className="text-xs font-bold">!</span>}
            {type === 'stop' && <span className="text-xs font-bold">P</span>}
            {type === 'ignition' && <span className="text-xs font-bold">X</span>}
            {type === 'critical' && <span className="text-xs font-bold">!</span>}
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">{title}</p>
            <p className="text-xs text-gray-600">{message}</p>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-right',
      }
    );
  };

  // Monitor shipments for delays
  useEffect(() => {
    shipments.forEach(shipment => {
      const prevShipment = prevShipmentsRef.current.find(s => s.id === shipment.id);
      if (prevShipment && prevShipment.status !== 'ATRASADO' && shipment.status === 'ATRASADO') {
        addNotification(
          'Atraso Identificado',
          `O veículo ${shipment.plate} (${shipment.vehicle}) está com atraso significativo.`,
          'delay',
          shipment.id,
          shipment.plate
        );
      }
    });
    prevShipmentsRef.current = shipments;
  }, [shipments]);

  // Monitor vehicles for unexpected stops and ignition failures
  useEffect(() => {
    vehicles.forEach(vehicle => {
      const prevVehicle = prevVehiclesRef.current.find(v => v.id === vehicle.id);
      
      // Ignition Failure Simulation / Monitoring
      // If ignition goes off while speed was high, or just any ignition change that might be critical
      if (prevVehicle && prevVehicle.ignition && !vehicle.ignition && prevVehicle.speed > 10) {
        addNotification(
          'Falha de Ignição',
          `Ignição desligada repentinamente para o veículo ${vehicle.plate} em movimento.`,
          'ignition',
          vehicle.id,
          vehicle.plate
        );
      }

      // Unexpected Stop Monitoring
      // If ignition is ON but speed is 0 for more than X seconds
      if (vehicle.ignition && vehicle.speed === 0) {
        if (!stopTimersRef.current[vehicle.id]) {
          stopTimersRef.current[vehicle.id] = Date.now();
        } else {
          const stopDuration = (Date.now() - stopTimersRef.current[vehicle.id]) / 1000;
          // If stopped for more than 30 seconds (for demo purposes, normally would be more)
          if (stopDuration > 30 && stopDuration < 35) { // Notify only once when hitting the threshold
            addNotification(
              'Parada Inesperada',
              `Veículo ${vehicle.plate} parado com ignição ligada há mais de 30s.`,
              'stop',
              vehicle.id,
              vehicle.plate
            );
          }
        }
      } else {
        delete stopTimersRef.current[vehicle.id];
      }
    });
    prevVehiclesRef.current = vehicles;
  }, [vehicles]);

  // Simulation for demonstration if no data is changing
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      const chance = Math.random();
      if (chance < 0.05) { // 5% chance every 30s to simulate a random critical alert
        const titles = ['Alerta de Velocidade', 'Desvio de Rota', 'Pânico Ativado', 'Temperatura Elevada'];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const messages = [
            'Veículo ultrapassou o limite de velocidade permitido.',
            'O veículo saiu da rota planejada para a entrega.',
            'Botão de pânico acionado pelo motorista!',
            'Sensor de temperatura do baú registrou alta crítica.'
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        addNotification(title, msg, 'critical');
      }
    }, 30000);

    return () => clearInterval(simulationInterval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getStopDuration = (vehicleId: string): number | null => {
    const startTime = stopTimersRef.current[vehicleId];
    if (!startTime) return null;
    return Date.now() - startTime;
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      clearNotifications,
      getStopDuration
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
