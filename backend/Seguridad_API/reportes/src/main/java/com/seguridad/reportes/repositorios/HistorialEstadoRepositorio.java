package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.HistorialEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialEstadoRepositorio extends JpaRepository<HistorialEstado, Long> {
    List<HistorialEstado> findByIncidenteIdOrderByFechaCambioDesc(Long incidenteId);
}