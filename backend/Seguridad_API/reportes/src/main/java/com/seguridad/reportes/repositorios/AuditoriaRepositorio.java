
package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditoriaRepositorio
        extends JpaRepository<Auditoria, Long> {

    List<Auditoria> findAllByOrderByFechaDesc();
}
