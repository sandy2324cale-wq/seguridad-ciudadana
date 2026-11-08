
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.entidades.AgenciaRespuesta;
import com.seguridad.reportes.repositorios.AgenciaRepositorio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AgenciaServicio {

    // ==========================================
    // 1. DEPENDENCIAS
    // ==========================================

    private final AgenciaRepositorio agenciaRepositorio;
    private final AuditoriaServicio auditoriaServicio;

    public AgenciaServicio(
            AgenciaRepositorio agenciaRepositorio,
            AuditoriaServicio auditoriaServicio
    ) {
        this.agenciaRepositorio = agenciaRepositorio;
        this.auditoriaServicio = auditoriaServicio;
    }

    // ==========================================
    // 2. CREAR AGENCIA
    // ==========================================

    @Transactional
    public AgenciaRespuesta crear(
            AgenciaRespuesta agencia,
            String emailEjecutor
    ) {

        // La base de datos genera el ID.
        agencia.setId(null);

        AgenciaRespuesta guardada =
                agenciaRepositorio.save(agencia);

        // Registrar la creación administrativa.
        auditoriaServicio.registrar(
                emailEjecutor,
                "CREAR_AGENCIA",
                "Agencia ID " + guardada.getId()
                        + ". Nombre: " + guardada.getNombre()
                        + ". Siglas: " + guardada.getSiglas()
        );

        return guardada;
    }

    // ==========================================
    // 3. LISTAR AGENCIAS
    // ==========================================

    @Transactional(readOnly = true)
    public List<AgenciaRespuesta> listar() {
        return agenciaRepositorio.findAll();
    }

    // ==========================================
    // 4. BUSCAR AGENCIA POR ID
    // ==========================================

    @Transactional(readOnly = true)
    public AgenciaRespuesta obtenerPorId(Long id) {

        return agenciaRepositorio.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Agencia de respuesta no encontrada con el ID: "
                                        + id
                        )
                );
    }
}
