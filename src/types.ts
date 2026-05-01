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
  macro?: string;
  status?: string;
  driver?: string;
}

export interface FleetMetrics {
  movingTimePercentage: number;
  stoppedTimePercentage: number;
  stoppedOffTimePercentage: number;
  kmsTraveled: number;
  infractionRatePer1000km: number;
  drivingScore: number;
  rpmBands: {
    extraGreen: number;
    green: number;
    transition: number;
    yellow: number;
    danger: number;
  };
}

export interface Driver {
  id: string;
  name: string;
}

export interface DriverScoreboard extends Driver {
  metrics: FleetMetrics;
  category: string;
}
