
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.dto.CategoriaCrearDTO;
import com.seguridad.reportes.entidades.AgenciaRespuesta;
import com.seguridad.reportes.entidades.CategoriaIncidente;
import com.seguridad.reportes.repositorios.AgenciaRepositorio;
import com.seguridad.reportes.repositorios.CategoriaRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoriaServicio {

    // ==========================================
    // 1. DEPENDENCIAS
    // ==========================================

    private final CategoriaRepositorio categoriaRepositorio;
    private final AgenciaRepositorio agenciaRepositorio;
    private final AuditoriaServicio auditoriaServicio;

    public CategoriaServicio(
            CategoriaRepositorio categoriaRepositorio,
            AgenciaRepositorio agenciaRepositorio,
            AuditoriaServicio auditoriaServicio
    ) {
        this.categoriaRepositorio = categoriaRepositorio;
        this.agenciaRepositorio = agenciaRepositorio;
        this.auditoriaServicio = auditoriaServicio;
    }

    // ==========================================
    // 2. CREAR CATEGORÍA
    // ==========================================

    @Transactional
    public CategoriaIncidente crear(
            CategoriaCrearDTO dto,
            String emailEjecutor
    ) {

        // Verificar que la agencia exista.
        AgenciaRespuesta agencia = agenciaRepositorio
                .findById(dto.agenciaId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "La agencia seleccionada no existe"
                        )
                );

        // Conservar el modelo original.
        CategoriaIncidente categoria =
                CategoriaIncidente.builder()
                        .nombre(dto.nombre().trim())
                        .nivelPrioridad(dto.nivelPrioridad())
                        .agenciaEncargada(agencia)
                        .build();

        CategoriaIncidente guardada =
                categoriaRepositorio.save(categoria);

        // Registrar la creación en auditoría.
        auditoriaServicio.registrar(
                emailEjecutor,
                "CREAR_CATEGORIA",
                "Categoría ID " + guardada.getId()
                        + ". Nombre: " + guardada.getNombre()
                        + ". Prioridad: " + guardada.getNivelPrioridad()
                        + ". Agencia ID: " + agencia.getId()
        );

        return guardada;
    }

    // ==========================================
    // 3. LISTAR CATEGORÍAS
    // ==========================================

    @Transactional(readOnly = true)
    public List<CategoriaIncidente> listar() {
        return categoriaRepositorio.findAll();
    }
}
