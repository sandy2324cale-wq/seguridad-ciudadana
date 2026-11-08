package com.seguridad.reportes.controladores;

import com.seguridad.reportes.dto.AlertaDTO;
import com.seguridad.reportes.entidades.Alerta;
import com.seguridad.reportes.servicios.AlertaServicio;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alertas")
public class AlertaControlador {

    @Autowired
    private AlertaServicio alertaServicio;

    @GetMapping
    public ResponseEntity<List<Alerta>> listarTodas() {
        return ResponseEntity.ok(alertaServicio.listarTodas());
    }

    @PostMapping
    public ResponseEntity<Alerta> crearAlerta(@Valid @RequestBody AlertaDTO dto) {
        String emailEmisor = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(alertaServicio.crearAlerta(dto, emailEmisor));
    }
}