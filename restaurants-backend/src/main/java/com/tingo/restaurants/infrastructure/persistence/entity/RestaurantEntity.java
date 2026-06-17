package com.tingo.restaurants.infrastructure.persistence.entity;

import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(length = 500)
    private String website;

    @Column(length = 20)
    private String ruc;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RestaurantStatus status;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String region;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @Builder.Default
    @Column(name = "total_capacity", nullable = false)
    private int totalCapacity = 0;

    @Builder.Default
    @Column(name = "price_level", nullable = false)
    private int priceLevel = 2;

    @Builder.Default
    @Column(name = "min_reservation_size", nullable = false)
    private int minReservationSize = 1;

    @Builder.Default
    @Column(name = "max_reservation_size", nullable = false)
    private int maxReservationSize = 20;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Builder.Default
    @Column(name = "avg_rating", precision = 3, scale = 2)
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_ratings", nullable = false)
    private int totalRatings = 0;

    @Builder.Default
    @Column(name = "accepts_reservations", nullable = false)
    private boolean acceptsReservations = true;

    @Builder.Default
    @Column(name = "accepts_events", nullable = false)
    private boolean acceptsEvents = false;

    @Builder.Default
    @Column(name = "has_parking", nullable = false)
    private boolean hasParking = false;

    @Builder.Default
    @Column(name = "has_wifi", nullable = false)
    private boolean hasWifi = false;

    @Builder.Default
    @Column(name = "has_air_conditioning", nullable = false)
    private boolean hasAirConditioning = false;

    @Builder.Default
    @Column(name = "is_accessible", nullable = false)
    private boolean accessible = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "restaurant_food_categories",
        joinColumns = @JoinColumn(name = "restaurant_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private List<FoodCategoryEntity> categories = new ArrayList<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ScheduleEntity> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MenuEntity> menus = new ArrayList<>();
}
