export type ShipmentStatus = 'EM TRÂNSITO' | 'ENTREGA FINAL' | 'PARADO (PONTO DE APOIO)' | 'CARREGANDO' | 'AGUARDANDO' | 'EM MANUTENÇÃO' | 'VAZIO';

export interface Shipment {
  id: string;
  vehicle: string;
  plate: string;
  route: string;
  status: ShipmentStatus;
  progress: number;
  lastUpdate: string;
  client?: string;
  startTime?: string;
  estimatedArrival?: string;
}

export interface FleetVehicle {
  id: string;
  plate: string;
  prefix?: string;
  lat: number;
  lng: number;
  speed: number;
  direction?: string;
  lastUpdate: string;
  ignition: boolean;
  address: string;
}
