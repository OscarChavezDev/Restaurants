package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.LoginRequest;
import com.tingo.restaurants.application.dto.request.RegisterRequest;
import com.tingo.restaurants.application.dto.response.AuthResponse;
import com.tingo.restaurants.domain.exception.InvalidCredentialsException;
import com.tingo.restaurants.domain.exception.UserAlreadyExistsException;
import com.tingo.restaurants.domain.model.User;
import com.tingo.restaurants.domain.repository.UserRepository;
import com.tingo.restaurants.infrastructure.security.JwtTokenProvider;
import com.tingo.restaurants.infrastructure.security.LoginAttemptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .isActive(true)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        log.info("Usuario registrado: {} con rol: {}", saved.getEmail(), saved.getRole());
        return buildAuthResponse(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Rate limiting: bloquea tras demasiados intentos fallidos.
        loginAttemptService.checkBlocked(request.getEmail());

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        boolean credentialsOk = user != null
                && user.isActive()
                && user.getDeletedAt() == null
                && passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!credentialsOk) {
            loginAttemptService.loginFailed(request.getEmail());
            throw new InvalidCredentialsException();
        }
        loginAttemptService.loginSucceeded(request.getEmail());

        User updated = User.builder()
                .id(user.getId())
                .email(user.getEmail())
                .passwordHash(user.getPasswordHash())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .isActive(user.isActive())
                .emailVerified(user.isEmailVerified())
                .lastLoginAt(LocalDateTime.now())
                .createdAt(user.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();
        userRepository.save(updated);

        log.info("Login exitoso para: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateToken(user.getId().toString(),
                user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId().toString());

        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .tokenType("Bearer")
                .build();
    }
}
