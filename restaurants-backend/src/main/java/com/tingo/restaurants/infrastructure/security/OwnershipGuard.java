package com.tingo.restaurants.infrastructure.security;

import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Verificación de propiedad a nivel de recurso: un RESTAURANTE_OWNER solo puede
 * modificar entidades que pertenezcan a SUS restaurantes; un ADMIN puede todo.
 * Lee la identidad del SecurityContext para no propagar parámetros por todos los
 * controladores/servicios.
 */
@Component
@RequiredArgsConstructor
public class OwnershipGuard {

    private final RestaurantRepository restaurantRepository;

    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            return UUID.fromString(ud.getUsername());
        }
        return null;
    }

    /** Lanza AccessDeniedException si el usuario actual no es ADMIN ni dueño del restaurante. */
    public void assertOwnsRestaurant(UUID restaurantId) {
        if (isAdmin()) return;
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
        UUID userId = currentUserId();
        if (userId == null || !userId.equals(restaurant.getOwnerId())) {
            throw new AccessDeniedException("No tienes permiso sobre este restaurante");
        }
    }
}
