package com.tingo.restaurants.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Restaurants Service API")
                        .description("""
                            **Sistema Independiente de Restaurantes**

                            Microservicio de gestión de restaurantes para la Plataforma Turística de Tingo María.

                            ### Funcionalidades
                            - Gestión completa de restaurantes, menús y platos
                            - Sistema de reservas con validación de capacidad
                            - Búsqueda geoespacial (restaurantes cercanos a eventos)
                            - Promociones y descuentos
                            - Calificaciones y reseñas
                            - APIs de integración para el ecosistema turístico

                            ### Roles
                            - `ADMIN` — Control total del sistema
                            - `RESTAURANTE_OWNER` — Gestión de su restaurante
                            - `CLIENTE` — Reservas y consultas
                            - `SYSTEM_INTEGRATION` — Integración entre microservicios (creada por un admin)
                            - `DEVELOPER` — Portal de desarrollador autoservicio; genera una API key
                              (`X-API-Key`) para consumir el catálogo de restaurantes de solo lectura
                            """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Equipo Técnico - Tingo María Platform")
                                .email("dev@tingo-restaurants.com"))
                        .license(new License().name("MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080/api").description("Desarrollo Local"),
                        new Server().url("https://api.tingo-restaurants.com").description("Producción")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT obtenido del endpoint /v1/auth/login"))
                        .addSecuritySchemes("apiKeyAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-API-Key")
                                .description("API key de desarrollador, generada en el panel " +
                                        "/dashboard/api-keys. Solo para los endpoints de /v1/developer-api/**")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
