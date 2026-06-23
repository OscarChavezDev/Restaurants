export interface PeriodCount {
  periodo: string;
  cantidad: number;
}

export interface DishCount {
  dishName: string;
  cantidad: number;
}

export interface PeriodAvgScore {
  periodo: string;
  avgScore: number;
}

export interface SectionCount {
  sectionName: string;
  cantidad: number;
}

export interface RestaurantStats {
  reservasPorPeriodo: PeriodCount[];
  tasaNoShow: number;
  ingresoAdelantos: number;
  platosMasPedidos: DishCount[];
  ratingPromedioEnElTiempo: PeriodAvgScore[];
  ocupacionPorSeccion: SectionCount[];
}

export type StatsGroupBy = 'day' | 'week' | 'month';

export interface RestaurantStatsParams {
  from?: string;
  to?: string;
  groupBy?: StatsGroupBy;
}
