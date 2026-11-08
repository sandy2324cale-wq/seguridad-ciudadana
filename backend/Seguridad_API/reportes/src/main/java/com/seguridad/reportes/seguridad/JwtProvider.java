
package com.seguridad.reportes.seguridad;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {

    // =====================================
    // CONFIGURACIÓN JWT
    // =====================================

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:28800000}")
    private long expiration;

    // =====================================
    // CLAVE DE FIRMA
    // =====================================

    private Key getSigningKey() {

        return Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    // =====================================
    // GENERAR TOKEN
    // =====================================

    public String generarToken(
            String email,
            String rol
    ) {

        Date fechaActual = new Date();

        Date fechaExpiracion = new Date(
                fechaActual.getTime() + expiration
        );

        return Jwts.builder()
                .setSubject(email)
                .claim("rol", rol)
                .setIssuedAt(fechaActual)
                .setExpiration(fechaExpiracion)
                .signWith(
                        getSigningKey(),
                        SignatureAlgorithm.HS256
                )
                .compact();
    }

    // =====================================
    // VALIDAR TOKEN
    // =====================================

    public boolean validarToken(String token) {

        if (token == null || token.isBlank()) {
            return false;
        }

        try {

            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);

            return true;

        } catch (Exception e) {

            return false;
        }
    }

    // =====================================
    // OBTENER CORREO
    // =====================================

    public String obtenerEmail(String token) {

        Claims claims = obtenerClaims(token);

        return claims.getSubject();
    }

    // =====================================
    // OBTENER ROL
    // =====================================

    public String obtenerRol(String token) {

        Claims claims = obtenerClaims(token);

        return claims.get(
                "rol",
                String.class
        );
    }

    // =====================================
    // LEER CLAIMS
    // =====================================

    private Claims obtenerClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
