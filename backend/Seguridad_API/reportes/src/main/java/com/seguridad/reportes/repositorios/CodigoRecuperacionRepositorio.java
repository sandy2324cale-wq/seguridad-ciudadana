package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.CodigoRecuperacion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface CodigoRecuperacionRepositorio extends JpaRepository<CodigoRecuperacion, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CodigoRecuperacion c WHERE c.usuario.id = :usuarioId")
    Optional<CodigoRecuperacion> bloquearPorUsuario(@Param("usuarioId") Long usuarioId);
}
