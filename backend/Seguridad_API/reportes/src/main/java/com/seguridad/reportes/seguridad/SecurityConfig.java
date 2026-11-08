
package com.seguridad.reportes.seguridad;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    // ==========================================
    // PASSWORD ENCODER
    // ==========================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ==========================================
    // AUTHENTICATION MANAGER
    // ==========================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // ==========================================
    // SECURITY FILTER CHAIN
    // ==========================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

            // ==========================================
            // CORS
            // ==========================================

            .cors(cors ->
                cors.configurationSource(
                    corsConfigurationSource()
                )
            )

            // ==========================================
            // CSRF
            // JWT SIN SESION
            // ==========================================

            .csrf(csrf -> csrf.disable())

            // ==========================================
            // SESIONES STATELESS
            // ==========================================

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            // ==========================================
            // AUTORIZACION DE ENDPOINTS
            // ==========================================

            .authorizeHttpRequests(auth -> auth

                // ==========================================
                // PREFLIGHT CORS
                // ==========================================

                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                // ==========================================
                // LOGIN, REGISTRO Y OTP
                // ==========================================

                // CAMBIAR CONTRASEÑA
                // Solo usuarios autenticados con JWT.
                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/auth/cambiar-password"
                ).authenticated()

                // CAMBIO DE CONTRASEÑA DESDE EL PERFIL: REQUIERE JWT
                .requestMatchers(
                    "/api/v1/auth/perfil/password/**"
                ).authenticated()

                // LOGIN, REGISTRO Y RECUPERACION PUBLICA
                .requestMatchers(
                    "/api/v1/auth/**"
                ).permitAll()
                // ==========================================
                // APELACION PUBLICA
                // ==========================================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/soporte/apelar"
                ).permitAll()

                // ==========================================
                // SWAGGER
                // ==========================================

                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // ==========================================
                // INCIDENTES - CREAR
                // CLIENTE / OPERADOR
                // ==========================================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/incidentes"
                ).hasAnyRole(
                    "CLIENTE",
                    "OPERADOR"
                )

                // ==========================================
                // INCIDENTES - MIS REPORTES
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/incidentes/mis-reportes"
                ).hasAnyRole(
                    "CLIENTE",
                    "OPERADOR",
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // INCIDENTES - LISTAR TODOS
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/incidentes"
                ).hasAnyRole(
                    "OPERADOR",
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // INCIDENTES - CAMBIAR ESTADO
                // ==========================================

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/incidentes/*/estado"
                ).hasAnyRole(
                    "OPERADOR",
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // INCIDENTES - ASIGNAR AGENCIA
                // ==========================================

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/incidentes/*/agencia"
                ).hasAnyRole(
                    "OPERADOR",
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // INCIDENTES - CONSULTAR POR ID
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/incidentes/*"
                ).hasAnyRole(
                    "CLIENTE",
                    "OPERADOR",
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // INCIDENTES - DENEGAR RESTO
                // ==========================================

                .requestMatchers(
                    "/api/v1/incidentes",
                    "/api/v1/incidentes/**"
                ).denyAll()

                // ==========================================
                // USUARIOS - CONSULTAR
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/usuarios"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // USUARIOS - CAMBIAR ROL
                // ==========================================

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/usuarios/*/rol"
                ).hasRole(
                    "SUPER_ADMIN"
                )

                // ==========================================
                // USUARIOS - CAMBIAR ESTADO
                // ==========================================

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/usuarios/*/estado"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // USUARIOS - DENEGAR RESTO
                // ==========================================

                .requestMatchers(
                    "/api/v1/usuarios",
                    "/api/v1/usuarios/**"
                ).denyAll()

                // ==========================================
                // APELACIONES - CONSULTAR
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/soporte/solicitudes"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // APELACIONES - RESOLVER
                // ==========================================

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/soporte/solicitudes/*/decision"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // APELACIONES - DENEGAR RESTO
                // ==========================================

                .requestMatchers(
                    "/api/v1/soporte/**"
                ).denyAll()

                // ==========================================
                // AUDITORIA
                // SOLO SUPER_ADMIN
                // ==========================================

                .requestMatchers(
                    "/api/v1/auditoria",
                    "/api/v1/auditoria/**"
                ).hasRole(
                    "SUPER_ADMIN"
                )

                // ==========================================
                // ZONAS - CONSULTAR
                // TODOS LOS AUTENTICADOS
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/zonas",
                    "/api/v1/zonas/**"
                ).authenticated()

                // ==========================================
                // ZONAS - CREAR
                // SOLO SUPER_ADMIN
                // ==========================================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/zonas"
                ).hasRole(
                    "SUPER_ADMIN"
                )

                // ==========================================
                // ZONAS - DENEGAR RESTO
                // ==========================================

                .requestMatchers(
                    "/api/v1/zonas",
                    "/api/v1/zonas/**"
                ).denyAll()

                // ==========================================
                // CATEGORIAS - CONSULTAR
                // TODOS LOS AUTENTICADOS
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/categorias",
                    "/api/v1/categorias/**"
                ).authenticated()

                // ==========================================
                // CATEGORIAS - ADMINISTRAR
                // ADMIN / SUPER_ADMIN
                // ==========================================

                .requestMatchers(
                    "/api/v1/categorias",
                    "/api/v1/categorias/**"
                ).hasAnyRole(
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // AGENCIAS - CONSULTAR
                // TODOS LOS AUTENTICADOS
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/agencias",
                    "/api/v1/agencias/**"
                ).authenticated()

                // ==========================================
                // AGENCIAS - ADMINISTRAR
                // SOLO SUPER_ADMIN
                // ==========================================

                .requestMatchers(
                    "/api/v1/agencias",
                    "/api/v1/agencias/**"
                ).hasRole(
                    "SUPER_ADMIN"
                )

                // ==========================================
                // HISTORIAL
                // OPERADOR / ADMIN / SUPER_ADMIN
                // ==========================================

                .requestMatchers(
                    "/api/v1/historial",
                    "/api/v1/historial/**",
                    "/api/v1/historiales",
                    "/api/v1/historiales/**"
                ).hasAnyRole(
                    "OPERADOR",
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // ALERTAS - CONSULTAR
                // TODOS LOS AUTENTICADOS
                // ==========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/alertas",
                    "/api/v1/alertas/**"
                ).authenticated()

                // ==========================================
                // ALERTAS - ADMINISTRAR
                // OPERADOR / ADMIN / SUPER_ADMIN
                // ==========================================

                .requestMatchers(
                    "/api/v1/alertas",
                    "/api/v1/alertas/**"
                ).hasAnyRole(
                    "OPERADOR",
                    "ADMIN",
                    "SUPER_ADMIN"
                )

                // ==========================================
                // DEMAS ENDPOINTS
                // ==========================================

                .anyRequest().authenticated()
            )

            // ==========================================
            // FILTRO JWT
            // ==========================================

            .addFilterBefore(
                jwtFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    // ==========================================
    // CONFIGURACION CORS
    // ==========================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // ORIGENES AUTORIZADOS: desarrollo local, Tailscale y Funnel HTTPS
        configuration.setAllowedOrigins(
    List.of(
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://100.114.156.7:4200",
        "http://localhost:5173",
        "https://opulent-eureka-pjvg955vw74j27xxr-4200.app.github.dev",
        "https://sandy.tail074548.ts.net",
        "https://seguridad-ciudadana-kohl.vercel.app"
    )
);
        // METODOS HTTP

        configuration.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
        );

        // CABECERAS

        configuration.setAllowedHeaders(
            List.of(
                "Authorization",
                "Content-Type",
                "Accept"
            )
        );

        configuration.setExposedHeaders(
            List.of(
                "Authorization"
            )
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }
}
