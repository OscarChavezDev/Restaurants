export interface CountByKey {
  key: string;
  cantidad: number;
}

export interface TopRestaurant {
  id: string;
  name: string;
  totalReservas: number;
}

export interface SystemStats {
  restaurantsByStatus: CountByKey[];
  usersByRole: CountByKey[];
  reservationsByStatus: CountByKey[];
  ingresoAdelantosTotal: number;
  avgRatingGlobal: number;
  topRestaurants: TopRestaurant[];
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId?: string;
  action: string;
  performedBy?: string;
  performedByName?: string;
  performedAt: string;
  detail?: string;
}
