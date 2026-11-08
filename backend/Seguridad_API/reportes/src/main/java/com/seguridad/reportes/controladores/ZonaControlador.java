
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.entidades.Zona;
import com.seguridad.reportes.servicios.ZonaServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/zonas")
@Validated
public class ZonaControlador {

    // ==========================================
    // 1. SERVICIO
    // ==========================================

    private final ZonaServicio zonaServicio;

    public ZonaControlador(
            ZonaServicio zonaServicio
    ) {
        this.zonaServicio = zonaServicio;
    }

    // ==========================================
    // 2. CREAR ZONA
    // SOLO SUPER_ADMIN
    // ==========================================

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping
    public ResponseEntity<Zona> crear(
            @Valid @RequestBody Zona zona,
            Principal principal
    ) {

        Zona nuevaZona = zonaServicio.crear(
                zona,
                principal.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(nuevaZona);
    }

    // ==========================================
    // 3. LISTAR ZONAS
    // USUARIOS AUTENTICADOS
    // ==========================================

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<List<Zona>> listar() {

        return ResponseEntity.ok(
                zonaServicio.listar()
        );
    }
}
