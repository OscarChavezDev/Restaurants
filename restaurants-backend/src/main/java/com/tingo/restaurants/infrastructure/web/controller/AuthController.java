package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.GoogleLoginRequest;
import com.tingo.restaurants.application.dto.request.LoginRequest;
import com.tingo.restaurants.application.dto.request.RegisterOwnerRequest;
import com.tingo.restaurants.application.dto.request.RegisterRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.AuthResponse;
import com.tingo.restaurants.application.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de registro, login y gestión de tokens")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Usuario registrado exitosamente", response));
    }

    @PostMapping("/register-owner")
    @Operation(summary = "Solicitar una cuenta de restaurante (queda en revisión del admin)")
    public ResponseEntity<ApiResponse<Void>> registerOwner(
            @Valid @RequestBody RegisterOwnerRequest request) {
        authService.registerOwner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                "Solicitud recibida. Revisaremos tu restaurante y te avisaremos por correo cuando tu cuenta sea aprobada.",
                null));
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login exitoso", response));
    }

    @PostMapping("/google")
    @Operation(summary = "Iniciar sesión / registrarse con Google (rol CLIENTE)")
    public ResponseEntity<ApiResponse<AuthResponse>> google(
            @Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.loginWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.ok("Login con Google exitoso", response));
    }
}
