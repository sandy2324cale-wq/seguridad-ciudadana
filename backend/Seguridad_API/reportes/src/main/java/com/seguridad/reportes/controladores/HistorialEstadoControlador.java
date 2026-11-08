
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.dto.HistorialEstadoRespuestaDTO;
import com.seguridad.reportes.servicios.HistorialEstadoServicio;

import jakarta.validation.constraints.Min;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/historial")
@Validated
public class HistorialEstadoControlador {

    private final HistorialEstadoServicio historialEstadoServicio;

    public HistorialEstadoControlador(
            HistorialEstadoServicio historialEstadoServicio
    ) {
        this.historialEstadoServicio = historialEstadoServicio;
    }

    // ==========================================
    // CONSULTAR HISTORIAL DEL INCIDENTE
    // ==========================================

    @GetMapping("/incidente/{incidenteId}")
    public ResponseEntity<List<HistorialEstadoRespuestaDTO>>
            obtenerHistorialPorIncidente(

            @PathVariable
            @Min(value = 1, message = "El ID debe ser mayor a cero")
            Long incidenteId

    ) {

        return ResponseEntity.ok(
                historialEstadoServicio
                        .obtenerHistorialPorIncidente(incidenteId)
        );
    }
}
