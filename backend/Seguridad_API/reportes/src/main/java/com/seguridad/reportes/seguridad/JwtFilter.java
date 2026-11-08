
package com.seguridad.reportes.seguridad;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    public JwtFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    // ==========================================
    // FILTRO PRINCIPAL JWT
    // ==========================================
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {

            String token = obtenerToken(request);

            if (token != null
                    && SecurityContextHolder
                        .getContext()
                        .getAuthentication() == null
                    && jwtProvider.validarToken(token)) {

                String email = jwtProvider.obtenerEmail(token);
                String rol = jwtProvider.obtenerRol(token);

                if (email != null
                        && !email.isBlank()
                        && rol != null
                        && !rol.isBlank()) {

                    // Normalizar rol.
                    // Ejemplo:
                    // ADMIN      -> ROLE_ADMIN
                    // ROLE_ADMIN -> ROLE_ADMIN
                    String rolNormalizado = rol.startsWith("ROLE_")
                            ? rol.substring(5)
                            : rol;

                    String autoridad = "ROLE_" + rolNormalizado;

                    List<SimpleGrantedAuthority> authorities =
                            List.of(
                                    new SimpleGrantedAuthority(autoridad)
                            );

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    authorities
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authentication);
                }
            }

        } catch (Exception e) {

            // Si el JWT no puede procesarse,
            // no se autentica al usuario.
            // Spring Security decidirá si la
            // ruta requiere autenticación.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    // ==========================================
    // EXTRAER TOKEN DEL HEADER
    // ==========================================
    private String obtenerToken(
            HttpServletRequest request
    ) {

        String header =
                request.getHeader("Authorization");

        if (header == null || header.isBlank()) {
            return null;
        }

        if (!header.startsWith("Bearer ")) {
            return null;
        }

        String token = header.substring(7).trim();

        return token.isBlank() ? null : token;
    }
}
