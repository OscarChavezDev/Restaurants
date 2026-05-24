package com.tingo.restaurants.infrastructure.persistence.adapter;

import com.tingo.restaurants.domain.model.User;
import com.tingo.restaurants.domain.repository.UserRepository;
import com.tingo.restaurants.infrastructure.persistence.entity.UserEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository jpaRepository;

    @Override
    public User save(User user) {
        return toDomain(jpaRepository.save(toEntity(user)));
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpaRepository.findById(id)
                .filter(e -> e.getDeletedAt() == null)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmailAndDeletedAtIsNull(email).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmailAndDeletedAtIsNull(email);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.findById(id).ifPresent(entity -> {
            entity.softDelete();
            jpaRepository.save(entity);
        });
    }

    @Override
    public Page<User> findAll(Pageable pageable) {
        return jpaRepository.findByDeletedAtIsNull(pageable).map(this::toDomain);
    }

    private User toDomain(UserEntity e) {
        return User.builder()
                .id(e.getId())
                .email(e.getEmail())
                .passwordHash(e.getPasswordHash())
                .fullName(e.getFullName())
                .phone(e.getPhone())
                .role(e.getRole())
                .isActive(e.isActive())
                .emailVerified(e.isEmailVerified())
                .lastLoginAt(e.getLastLoginAt())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .deletedAt(e.getDeletedAt())
                .build();
    }

    private UserEntity toEntity(User u) {
        return UserEntity.builder()
                .id(u.getId())
                .email(u.getEmail())
                .passwordHash(u.getPasswordHash())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .active(u.isActive())
                .emailVerified(u.isEmailVerified())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }
}
