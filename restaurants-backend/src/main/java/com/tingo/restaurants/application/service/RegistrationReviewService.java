package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.RegistrationRequestResponse;
import com.tingo.restaurants.application.dto.response.RestaurantResponse;
import com.tingo.restaurants.domain.exception.UserNotFoundException;
import com.tingo.restaurants.domain.model.User;
import com.tingo.restaurants.domain.model.enums.AccountStatus;
import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import com.tingo.restaurants.domain.repository.UserRepository;
import com.tingo.restaurants.infrastructure.persistence.entity.UserEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Revisión por el admin de las solicitudes de cuenta de restaurante. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegistrationReviewService {

    private final UserJpaRepository userJpaRepository;
    private final UserRepository userRepository;
    private final RestaurantService restaurantService;
    private final EmailService emailService;

    public List<RegistrationRequestResponse> listPending() {
        return userJpaRepository
                .findByAccountStatusAndDeletedAtIsNullOrderByCreatedAtDesc(AccountStatus.PENDING_REVIEW)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void approve(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Activa la cuenta del dueño.
        userRepository.save(user.toBuilder()
                .isActive(true)
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        // Publica sus restaurantes (PENDING_APPROVAL -> ACTIVE).
        ownerRestaurants(userId).forEach(r ->
                restaurantService.updateStatus(r.getId(), RestaurantStatus.ACTIVE));

        emailService.sendOwnerApplicationApproved(user.getEmail(), user.getFullName());
        log.info("Solicitud aprobada: {}", user.getEmail());
    }

    @Transactional
    public void reject(UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        userRepository.save(user.toBuilder()
                .isActive(false)
                .accountStatus(AccountStatus.REJECTED)
                .build());

        emailService.sendOwnerApplicationRejected(user.getEmail(), user.getFullName(), reason);
        log.info("Solicitud rechazada: {}", user.getEmail());
    }

    private List<RestaurantResponse> ownerRestaurants(UUID ownerId) {
        return restaurantService.findByOwner(ownerId, PageRequest.of(0, 50)).getContent();
    }

    private RegistrationRequestResponse toResponse(UserEntity u) {
        return RegistrationRequestResponse.builder()
                .userId(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .accountStatus(u.getAccountStatus() != null ? u.getAccountStatus().name() : null)
                .requestedAt(u.getCreatedAt())
                .restaurants(ownerRestaurants(u.getId()))
                .build();
    }
}
