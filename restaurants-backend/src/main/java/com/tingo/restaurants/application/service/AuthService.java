package com.tingo.restaurants.application.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.tingo.restaurants.application.dto.request.GoogleLoginRequest;
import com.tingo.restaurants.application.dto.request.LoginRequest;
import com.tingo.restaurants.application.dto.request.RegisterOwnerRequest;
import com.tingo.restaurants.application.dto.request.RegisterRequest;
import com.tingo.restaurants.application.dto.response.AuthResponse;
import com.tingo.restaurants.domain.exception.AccountNotActiveException;
import com.tingo.restaurants.domain.exception.InvalidCredentialsException;
import com.tingo.restaurants.domain.exception.UserAlreadyExistsException;
import com.tingo.restaurants.domain.model.User;
import com.tingo.restaurants.domain.model.enums.AccountStatus;
import com.tingo.restaurants.domain.model.enums.AuthProvider;
import com.tingo.restaurants.domain.model.enums.UserRole;
import com.tingo.restaurants.domain.repository.UserRepository;
import com.tingo.restaurants.infrastructure.security.GoogleTokenVerifier;
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
    private final GoogleTokenVerifier googleTokenVerifier;
    private final RestaurantService restaurantService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        // Una cuenta de dueño nunca se activa sola: queda en revisión del admin.
        boolean owner = request.getRole() == UserRole.RESTAURANTE_OWNER;

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .isActive(!owner)
                .accountStatus(owner ? AccountStatus.PENDING_REVIEW : AccountStatus.ACTIVE)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        log.info("Usuario registrado: {} con rol: {}", saved.getEmail(), saved.getRole());
        return buildAuthResponse(saved);
    }

    /**
     * Solicitud de cuenta de restaurante: crea al dueño en PENDING_REVIEW
     * (login bloqueado) y su restaurante en PENDING_APPROVAL. No devuelve token;
     * el admin debe aprobar la solicitud. Etapa de mejora de login/registro.
     */
    @Transactional
    public void registerOwner(RegisterOwnerRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        User owner = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.RESTAURANTE_OWNER)
                .provider(AuthProvider.LOCAL)
                .isActive(false)
                .accountStatus(AccountStatus.PENDING_REVIEW)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        User saved = userRepository.save(owner);

        // El restaurante se crea como PENDING_APPROVAL (oculto al público hasta aprobar).
        restaurantService.create(request.getRestaurant(), saved.getId());

        emailService.sendOwnerApplicationReceived(
                saved.getEmail(), saved.getFullName(), request.getRestaurant().getName());

        log.info("Solicitud de cuenta de restaurante recibida: {} ({})",
                saved.getEmail(), request.getRestaurant().getName());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Rate limiting: bloquea tras demasiados intentos fallidos.
        loginAttemptService.checkBlocked(request.getEmail());

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        boolean passwordOk = user != null
                && user.getDeletedAt() == null
                && user.getPasswordHash() != null
                && passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!passwordOk) {
            loginAttemptService.loginFailed(request.getEmail());
            throw new InvalidCredentialsException();
        }
        loginAttemptService.loginSucceeded(request.getEmail());

        // Credenciales correctas: ahora validamos el estado de la cuenta.
        AccountStatus status = user.getAccountStatus() != null ? user.getAccountStatus() : AccountStatus.ACTIVE;
        if (status == AccountStatus.PENDING_REVIEW) {
            throw new AccountNotActiveException(
                    "Tu solicitud de cuenta está en revisión. Te avisaremos por correo en cuanto sea aprobada.",
                    "ACCOUNT_PENDING");
        }
        if (status == AccountStatus.REJECTED) {
            throw new AccountNotActiveException(
                    "Tu solicitud de cuenta fue rechazada. Si crees que es un error, contáctanos.",
                    "ACCOUNT_REJECTED");
        }
        if (!user.isActive()) {
            throw new AccountNotActiveException(
                    "Tu cuenta está desactivada. Contacta al administrador.",
                    "ACCOUNT_DISABLED");
        }

        User updated = User.builder()
                .id(user.getId())
                .email(user.getEmail())
                .passwordHash(user.getPasswordHash())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .isActive(user.isActive())
                .accountStatus(user.getAccountStatus())
                .emailVerified(user.isEmailVerified())
                .lastLoginAt(LocalDateTime.now())
                .createdAt(user.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();
        userRepository.save(updated);

        log.info("Login exitoso para: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    /**
     * Login / registro con Google (rol CLIENTE). Verifica el ID token, y si el
     * usuario no existe lo crea automáticamente. Es la única vía de acceso del
     * cliente al sistema (reservas, favoritos, reseñas) — Etapa 3, S9-01.
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.getIdToken());

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        Boolean emailVerified = payload.getEmailVerified();
        String name = (String) payload.get("name");
        if (name == null || name.isBlank()) {
            name = email != null ? email.split("@")[0] : "Cliente";
        }

        // 1) ¿Ya entró antes con este Google account?
        User existing = userRepository.findByGoogleId(googleId)
                // 2) Si no, ¿hay una cuenta con ese email? (la enlazamos a Google)
                .or(() -> email != null ? userRepository.findByEmail(email) : java.util.Optional.empty())
                .orElse(null);

        User toSave;
        if (existing != null) {
            toSave = User.builder()
                    .id(existing.getId())
                    .email(existing.getEmail())
                    .passwordHash(existing.getPasswordHash())
                    .fullName(existing.getFullName())
                    .phone(existing.getPhone())
                    .role(existing.getRole())
                    .provider(AuthProvider.GOOGLE)
                    .googleId(googleId)
                    .isActive(existing.isActive())
                    .emailVerified(Boolean.TRUE.equals(emailVerified) || existing.isEmailVerified())
                    .lastLoginAt(LocalDateTime.now())
                    .createdAt(existing.getCreatedAt())
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else {
            // 3) Cliente nuevo: se registra automáticamente con rol CLIENTE.
            toSave = User.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .passwordHash(null)
                    .fullName(name)
                    .role(UserRole.CLIENTE)
                    .provider(AuthProvider.GOOGLE)
                    .googleId(googleId)
                    .isActive(true)
                    .emailVerified(Boolean.TRUE.equals(emailVerified))
                    .lastLoginAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        User saved = userRepository.save(toSave);
        log.info("Login con Google: {} (rol {})", saved.getEmail(), saved.getRole());
        return buildAuthResponse(saved);
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
