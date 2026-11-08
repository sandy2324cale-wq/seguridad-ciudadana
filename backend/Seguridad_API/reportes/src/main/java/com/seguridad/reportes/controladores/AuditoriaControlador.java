
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.entidades.Auditoria;
import com.seguridad.reportes.servicios.AuditoriaServicio;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auditoria")
public class AuditoriaControlador {

    private final AuditoriaServicio auditoriaServicio;

    public AuditoriaControlador(
            AuditoriaServicio auditoriaServicio
    ) {
        this.auditoriaServicio = auditoriaServicio;
    }

    @GetMapping
    public ResponseEntity<List<Auditoria>> listar() {

        return ResponseEntity.ok(
                auditoriaServicio.listar()
        );
    }
}
