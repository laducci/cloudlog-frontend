export interface FreightQuote { id?: string; freightCost: number; etaHours: number; estimatedDeliveryAt: string; serviceLevel: string }

export interface Delivery {
  id: string; code: string; customer: string; origin: string; destination: string;
  weightKg: number; distanceKm: number; driverId: string | null; vehicleId: string | null; status: string;
  estimate: { freightCost: number; etaHours: number; estimatedDeliveryAt: string; serviceLevel: string; calculatedAt?: string } | null;
  createdAt: string; updatedAt: string;
  driverName?: string | null; vehiclePlate?: string | null; freightQuote?: FreightQuote | null;
}

export interface Vehicle { id: string; plate: string; model: string; capacityKg: number; status: string }
export interface Driver { id: string; name: string; cnh: string; cnhCategory: string; phone: string; active: boolean }
export interface ListResult<T> { items: T[]; total: number }

export interface AggregatedData {
  generatedAt: string;
  sources: { entregas: string; frota: string; freteFunction: string };
  kpis: {
    deliveries: { total: number; byStatus: Record<string, number>; delayed: number; withoutEstimate: number };
    fleet: { vehicles: number; availableVehicles: number; inUseVehicles: number; activeDrivers: number; utilizationRate: number };
    freight: { quotedDeliveries: number; totalFreight: number; averageEtaHours: number };
  };
  deliveries: Delivery[];
  fleet: { vehicles: Vehicle[]; drivers: Driver[] };
  freight: { items: FreightQuote[]; totalFreight: number };
  warnings: string[];
}

export const DELIVERY_STATUSES = ["Pendente", "Em rota", "Atrasada", "Entregue", "Cancelada"];
export const VEHICLE_STATUSES = ["Disponível", "Em uso", "Manutenção"];
