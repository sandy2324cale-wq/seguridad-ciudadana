
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.dto.ApelacionDTO;
import com.seguridad.reportes.dto.DecisionApelacionDTO;
import com.seguridad.reportes.entidades.SolicitudSoporte;
import com.seguridad.reportes.servicios.SoporteServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/soporte")
public class SoporteControlador {

    private final SoporteServicio soporteServicio;

    public SoporteControlador(SoporteServicio soporteServicio) {
        this.soporteServicio = soporteServicio;
    }

    @PostMapping("/apelar")
    public ResponseEntity<SolicitudSoporte> crearSolicitud(
            @Valid @RequestBody ApelacionDTO dto
    ) {
        SolicitudSoporte nueva = soporteServicio.crearSolicitud(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(nueva);
    }

    @GetMapping("/solicitudes")
    public ResponseEntity<List<SolicitudSoporte>> listarSolicitudes() {
        return ResponseEntity.ok(
                soporteServicio.listarSolicitudes()
        );
    }

    @PatchMapping("/solicitudes/{id}/decision")
    public ResponseEntity<SolicitudSoporte> decidirSolicitud(
            @PathVariable Long id,
            @Valid @RequestBody DecisionApelacionDTO dto
    ) {
        return ResponseEntity.ok(
                soporteServicio.decidirSolicitud(id, dto)
        );
    }
}
