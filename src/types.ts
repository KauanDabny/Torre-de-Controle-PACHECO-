export type ShipmentStatus = 'EM TRÂNSITO' | 'ENTREGA FINAL' | 'PARADO (PONTO DE APOIO)' | 'CARREGANDO' | 'AGUARDANDO' | 'EM MANUTENÇÃO' | 'VAZIO' | 'ATRASADO';

export interface Shipment {
  id: string;
  vehicle: string;
  driver?: string;
  plate: string;
  route: string;
  status: ShipmentStatus;
  progress: number;
  lastUpdate: string;
  client?: string;
  startTime?: string;
  estimatedArrival?: string;
  collectionTime?: string;
  unloadingTime?: string;
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
  category?: string;
}

export interface Driver {
  id: string;
  name: string;
}
