package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertaRepositorio extends JpaRepository<Alerta, Long> {
    List<Alerta> findAllByOrderByFechaPublicacionDesc();
}