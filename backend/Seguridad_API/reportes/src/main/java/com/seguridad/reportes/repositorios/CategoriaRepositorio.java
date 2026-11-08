package com.seguridad.reportes.repositorios;

import com.seguridad.reportes.entidades.CategoriaIncidente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepositorio extends JpaRepository<CategoriaIncidente, Long> {
    List<CategoriaIncidente> findByAgenciaEncargadaId(Long agenciaId);
}