
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.dto.AsignarAgenciaDTO;
import com.seguridad.reportes.dto.CambiarEstadoIncidenteDTO;
import com.seguridad.reportes.dto.IncidenteDTO;
import com.seguridad.reportes.servicios.IncidenteServicio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/incidentes")
@Validated
public class IncidenteControlador {

    private final IncidenteServicio incidenteServicio;

    public IncidenteControlador(
            IncidenteServicio incidenteServicio
    ) {
        this.incidenteServicio = incidenteServicio;
    }

    // ==========================================
    // REGISTRAR INCIDENTE
    // CLIENTE / OPERADOR
    // ==========================================

    @PostMapping
    public ResponseEntity<?> crear(
            @Valid @RequestBody IncidenteDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                    incidenteServicio.crear(
                        dto,
                        authentication.getName()
                    )
                );
    }

    // ==========================================
    // CONSULTAR MIS REPORTES
    // ==========================================

    @GetMapping("/mis-reportes")
    public ResponseEntity<?> misReportes(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
            incidenteServicio.listarMisIncidentes(
                authentication.getName()
            )
        );
    }

    // ==========================================
    // LISTAR TODOS LOS INCIDENTES
    // OPERADOR / ADMIN / SUPER_ADMIN
    // ==========================================

    @GetMapping
    public ResponseEntity<?> listar(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
            incidenteServicio.listarTodos(
                authentication.getName()
            )
        );
    }

    // ==========================================
    // CONSULTAR INCIDENTE POR ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(
            @PathVariable @Min(1) Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
            incidenteServicio.obtenerPorId(
                id,
                authentication.getName()
            )
        );
    }

    // ==========================================
    // ASIGNAR AGENCIA
    // ==========================================

    @PatchMapping("/{id}/agencia")
    public ResponseEntity<?> asignarAgencia(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody AsignarAgenciaDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
            incidenteServicio.asignarAgencia(
                id,
                dto.agenciaId(),
                dto.observacion(),
                authentication.getName()
            )
        );
    }

    // ==========================================
    // CAMBIAR ESTADO
    // GUARDA HISTORIAL AUTOMÁTICAMENTE
    // ==========================================

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody CambiarEstadoIncidenteDTO dto,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
            incidenteServicio.cambiarEstado(
                id,
                dto.nuevoEstado(),
                dto.observacion(),
                authentication.getName()
            )
        );
    }
}
