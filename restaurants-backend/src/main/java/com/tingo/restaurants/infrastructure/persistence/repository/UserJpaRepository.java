package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.domain.model.enums.AccountStatus;
import com.tingo.restaurants.infrastructure.persistence.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmailAndDeletedAtIsNull(String email);

    Optional<UserEntity> findByGoogleIdAndDeletedAtIsNull(String googleId);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    Page<UserEntity> findByDeletedAtIsNull(Pageable pageable);

    List<UserEntity> findByAccountStatusAndDeletedAtIsNullOrderByCreatedAtDesc(AccountStatus accountStatus);

    /** Panel admin global (S15-01): cantidad de usuarios por rol. */
    @Query("SELECT u.role, COUNT(u) FROM UserEntity u WHERE u.deletedAt IS NULL GROUP BY u.role")
    List<Object[]> countByRole();
}
