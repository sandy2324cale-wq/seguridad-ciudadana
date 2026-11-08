
package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.SolicitudSoporte;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudSoporteRepositorio
        extends JpaRepository<SolicitudSoporte, Long> {

    boolean existsByEmailIgnoreCaseAndEstadoSolicitud(
            String email,
            String estadoSolicitud
    );

    List<SolicitudSoporte> findAllByOrderByFechaSolicitudDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SolicitudSoporte s WHERE s.id = :id")
    Optional<SolicitudSoporte> buscarParaDecision(
            @Param("id") Long id
    );
}
