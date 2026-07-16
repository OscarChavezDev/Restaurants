/**
 * /profile/restaurants → redirige a /restaurants
 *
 * La vista pública /restaurants ya soporta usuarios autenticados
 * (favoritos, reseñas, filtros). Eliminamos la copia duplicada.
 */
import { redirect } from 'next/navigation';

export default function ProfileRestaurantsRedirect() {
  redirect('/restaurants');
}
