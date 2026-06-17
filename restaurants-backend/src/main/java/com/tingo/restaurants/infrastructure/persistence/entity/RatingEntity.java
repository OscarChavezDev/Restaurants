package com.tingo.restaurants.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ratings")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingEntity {

    @Id
    private UUID id;

    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "reservation_id")
    private UUID reservationId;

    @Column(nullable = false)
    private int score;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "food_score")
    private Integer foodScore;

    @Column(name = "service_score")
    private Integer serviceScore;

    @Column(name = "ambiance_score")
    private Integer ambianceScore;

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
