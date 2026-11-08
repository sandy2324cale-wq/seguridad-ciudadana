
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.entidades.Auditoria;
import com.seguridad.reportes.repositorios.AuditoriaRepositorio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditoriaServicio {

    private final AuditoriaRepositorio auditoriaRepositorio;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    public AuditoriaServicio(
            AuditoriaRepositorio auditoriaRepositorio
    ) {
        this.auditoriaRepositorio = auditoriaRepositorio;
    }

    // ==========================================
    // REGISTRAR ACCIÓN ADMINISTRATIVA
    // ==========================================
    @Transactional
    public void registrar(
            String responsable,
            String accion,
            String detalle
    ) {

        if (responsable == null ||
                responsable.isBlank()) {

            throw new IllegalArgumentException(
                    "El responsable de auditoría es obligatorio"
            );
        }

        if (accion == null ||
                accion.isBlank()) {

            throw new IllegalArgumentException(
                    "La acción de auditoría es obligatoria"
            );
        }

        if (detalle == null ||
                detalle.isBlank()) {

            throw new IllegalArgumentException(
                    "El detalle de auditoría es obligatorio"
            );
        }

        Auditoria auditoria = new Auditoria(
                responsable.trim(),
                accion.trim(),
                detalle.trim()
        );

        auditoriaRepositorio.save(auditoria);
    }

    // ==========================================
    // CONSULTAR AUDITORÍA
    // ==========================================
    @Transactional(readOnly = true)
    public List<Auditoria> listar() {

        return auditoriaRepositorio
                .findAllByOrderByFechaDesc();
    }
}
