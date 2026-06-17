package com.tingo.restaurants.domain.repository;

import com.tingo.restaurants.domain.model.Reservation;
import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository {

    Reservation save(Reservation reservation);

    Optional<Reservation> findById(UUID id);

    Optional<Reservation> findByConfirmationCode(String confirmationCode);

    Page<Reservation> findByRestaurantId(UUID restaurantId, Pageable pageable);

    Page<Reservation> findByRestaurantIdAndDate(UUID restaurantId, LocalDate date, Pageable pageable);

    Page<Reservation> findByCustomerId(UUID customerId, Pageable pageable);

    List<Reservation> findByRestaurantIdAndDateAndStatus(UUID restaurantId, LocalDate date,
                                                         ReservationStatus status);

    int countByRestaurantIdAndDateAndStatus(UUID restaurantId, LocalDate date, ReservationStatus status);

    int sumPartySizeByRestaurantAndDate(UUID restaurantId, LocalDate date);

    int sumOccupiedSeats(UUID restaurantId, LocalDate date, java.time.LocalTime time);

    boolean existsByConfirmationCode(String code);
}
