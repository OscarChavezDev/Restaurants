package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.UpdateProfileRequest;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.UserResponse;
import com.tingo.restaurants.domain.exception.InvalidCredentialsException;
import com.tingo.restaurants.domain.exception.UserNotFoundException;
import com.tingo.restaurants.domain.model.User;
import com.tingo.restaurants.domain.model.enums.UserRole;
import com.tingo.restaurants.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserResponse getMyProfile(UUID id) {
        return toResponse(userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id)));
    }

    @Transactional
    public UserResponse updateMyProfile(UUID id, UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        String newHash = user.getPasswordHash();
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new InvalidCredentialsException();
            }
            newHash = passwordEncoder.encode(request.getNewPassword());
        }

        User updated = User.builder()
                .id(user.getId())
                .email(user.getEmail())
                .passwordHash(newHash)
                .fullName(request.getFullName() != null && !request.getFullName().isBlank() ? request.getFullName() : user.getFullName())
                .phone(request.getPhone() != null ? request.getPhone() : user.getPhone())
                .role(user.getRole())
                .isActive(user.isActive())
                .emailVerified(user.isEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(userRepository.save(updated));
    }

    public PagedResponse<UserResponse> listUsers(Pageable pageable) {
        return PagedResponse.from(userRepository.findAll(pageable).map(this::toResponse));
    }

    @Transactional
    public UserResponse updateRole(UUID id, UserRole newRole, UUID requesterId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        UserRole previousRole = user.getRole();
        User updated = User.builder()
                .id(user.getId()).email(user.getEmail()).passwordHash(user.getPasswordHash())
                .fullName(user.getFullName()).phone(user.getPhone()).role(newRole)
                .isActive(user.isActive()).emailVerified(user.isEmailVerified())
                .lastLoginAt(user.getLastLoginAt()).createdAt(user.getCreatedAt())
                .updatedAt(LocalDateTime.now()).build();
        User saved = userRepository.save(updated);
        auditLogService.record("USER", saved.getId(), "UPDATE_USER_ROLE", requesterId,
                previousRole + " → " + newRole + " (" + saved.getEmail() + ")");
        return toResponse(saved);
    }

    @Transactional
    public UserResponse toggleActive(UUID id, UUID requesterId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        User updated = User.builder()
                .id(user.getId()).email(user.getEmail()).passwordHash(user.getPasswordHash())
                .fullName(user.getFullName()).phone(user.getPhone()).role(user.getRole())
                .isActive(!user.isActive()).emailVerified(user.isEmailVerified())
                .lastLoginAt(user.getLastLoginAt()).createdAt(user.getCreatedAt())
                .updatedAt(LocalDateTime.now()).build();
        User saved = userRepository.save(updated);
        auditLogService.record("USER", saved.getId(), "TOGGLE_USER_ACTIVE", requesterId,
                (saved.isActive() ? "Activado" : "Desactivado") + ": " + saved.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public void deleteUser(UUID id, UUID requesterId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        userRepository.deleteById(id);
        auditLogService.record("USER", id, "DELETE_USER", requesterId, user.getEmail());
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId()).email(u.getEmail()).fullName(u.getFullName())
                .phone(u.getPhone()).role(u.getRole()).active(u.isActive())
                .emailVerified(u.isEmailVerified()).lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt()).build();
    }
}
