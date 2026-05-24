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
    public UserResponse updateRole(UUID id, UserRole newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        User updated = User.builder()
                .id(user.getId()).email(user.getEmail()).passwordHash(user.getPasswordHash())
                .fullName(user.getFullName()).phone(user.getPhone()).role(newRole)
                .isActive(user.isActive()).emailVerified(user.isEmailVerified())
                .lastLoginAt(user.getLastLoginAt()).createdAt(user.getCreatedAt())
                .updatedAt(LocalDateTime.now()).build();
        return toResponse(userRepository.save(updated));
    }

    @Transactional
    public UserResponse toggleActive(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        User updated = User.builder()
                .id(user.getId()).email(user.getEmail()).passwordHash(user.getPasswordHash())
                .fullName(user.getFullName()).phone(user.getPhone()).role(user.getRole())
                .isActive(!user.isActive()).emailVerified(user.isEmailVerified())
                .lastLoginAt(user.getLastLoginAt()).createdAt(user.getCreatedAt())
                .updatedAt(LocalDateTime.now()).build();
        return toResponse(userRepository.save(updated));
    }

    @Transactional
    public void deleteUser(UUID id) {
        userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId()).email(u.getEmail()).fullName(u.getFullName())
                .phone(u.getPhone()).role(u.getRole()).active(u.isActive())
                .emailVerified(u.isEmailVerified()).lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt()).build();
    }
}
