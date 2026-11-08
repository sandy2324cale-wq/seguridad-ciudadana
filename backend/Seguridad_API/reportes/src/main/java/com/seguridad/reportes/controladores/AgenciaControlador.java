
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.entidades.AgenciaRespuesta;
import com.seguridad.reportes.servicios.AgenciaServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/agencias")
public class AgenciaControlador {

    // ==========================================
    // 1. SERVICIO
    // ==========================================

    private final AgenciaServicio agenciaServicio;

    public AgenciaControlador(
            AgenciaServicio agenciaServicio
    ) {
        this.agenciaServicio = agenciaServicio;
    }

    // ==========================================
    // 2. LISTAR AGENCIAS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<AgenciaRespuesta>> listar() {

        return ResponseEntity.ok(
                agenciaServicio.listar()
        );
    }

    // ==========================================
    // 3. CREAR AGENCIA
    // SOLO SUPER_ADMIN
    // ==========================================

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AgenciaRespuesta> crear(
            @Valid @RequestBody AgenciaRespuesta agencia,
            Principal principal
    ) {

        agencia.setId(null);

        AgenciaRespuesta creada =
                agenciaServicio.crear(
                        agencia,
                        principal.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creada);
    }
}
