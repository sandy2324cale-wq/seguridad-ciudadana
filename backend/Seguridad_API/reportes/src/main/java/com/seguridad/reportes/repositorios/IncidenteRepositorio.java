package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.Incidente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidenteRepositorio
        extends JpaRepository<Incidente, Long> {

    List<Incidente> findByUsuarioIdOrderByFechaReporteDesc(
            Long usuarioId
    );

    List<Incidente> findAllByOrderByFechaReporteDesc();
}