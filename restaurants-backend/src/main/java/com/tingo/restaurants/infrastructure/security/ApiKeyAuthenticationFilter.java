package com.tingo.restaurants.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.service.ApiKeyService;
import com.tingo.restaurants.domain.model.ApiKey;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Autentica solicitudes del portal de desarrollador vía el header X-API-Key,
 * en paralelo a JwtAuthenticationFilter (que sigue siendo el único camino para
 * el JWT de sesión del dashboard). Si la key es válida y no está revocada, carga
 * el UserDetails del dueño (rol DEVELOPER) igual que el filtro JWT, así que los
 * @PreAuthorize("hasRole('DEVELOPER')") existentes funcionan sin cambios.
 *
 * Si la key no existe, está revocada, o no viene el header: NO se autentica acá
 * (no se lanza excepción) — la solicitud sigue como anónima y es
 * @PreAuthorize/anyRequest().authenticated() quien la rechaza más adelante, igual
 * que el comportamiento de JwtAuthenticationFilter ante un token inválido.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";

    private final ApiKeyService apiKeyService;
    private final CustomUserDetailsService userDetailsService;
    private final ApiKeyRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String rawKey = request.getHeader(API_KEY_HEADER);

        if (StringUtils.hasText(rawKey)) {
            try {
                Optional<ApiKey> apiKey = apiKeyService.validateAndTouch(rawKey);
                if (apiKey.isPresent()) {
                    if (!rateLimiter.tryConsume(apiKey.get().getId())) {
                        writeTooManyRequests(response);
                        return;
                    }
                    UserDetails userDetails =
                            userDetailsService.loadUserByUsername(apiKey.get().getUserId().toString());
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                log.error("No se pudo autenticar la API key: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(
                ApiResponse.error("Límite de solicitudes excedido. Intenta de nuevo en un minuto.", "RATE_LIMIT_EXCEEDED")));
    }
}
