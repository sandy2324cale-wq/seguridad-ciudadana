
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.dto.CategoriaCrearDTO;
import com.seguridad.reportes.entidades.CategoriaIncidente;
import com.seguridad.reportes.servicios.CategoriaServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
public class CategoriaControlador {

    // ==========================================
    // 1. SERVICIO
    // ==========================================

    private final CategoriaServicio categoriaServicio;

    public CategoriaControlador(
            CategoriaServicio categoriaServicio
    ) {
        this.categoriaServicio = categoriaServicio;
    }

    // ==========================================
    // 2. LISTAR CATEGORÍAS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<CategoriaIncidente>> listar() {

        return ResponseEntity.ok(
                categoriaServicio.listar()
        );
    }

    // ==========================================
    // 3. CREAR CATEGORÍA
    // ADMIN Y SUPER_ADMIN
    // ==========================================

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<CategoriaIncidente> crear(
            @Valid @RequestBody CategoriaCrearDTO dto,
            Principal principal
    ) {

        CategoriaIncidente creada =
                categoriaServicio.crear(
                        dto,
                        principal.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creada);
    }
}
