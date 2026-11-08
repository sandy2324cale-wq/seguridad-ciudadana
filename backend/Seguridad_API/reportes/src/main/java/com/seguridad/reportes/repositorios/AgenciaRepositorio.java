package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.AgenciaRespuesta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgenciaRepositorio extends JpaRepository<AgenciaRespuesta, Long> {}