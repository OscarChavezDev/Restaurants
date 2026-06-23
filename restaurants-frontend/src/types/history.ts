import type { Reservation } from './reservation';
import type { RatingResponse } from './restaurant';

export interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  visitCount: number;
}

export interface CustomerHistory {
  proximasReservas: Reservation[];
  restaurantesVisitados: RestaurantSummary[];
  misResenas: RatingResponse[];
  tiposCocinaFavoritos: string[];
  restauranteMasFrecuente?: RestaurantSummary;
  gastoEstimado: number;
}
