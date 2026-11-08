
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.entidades.Zona;
import com.seguridad.reportes.repositorios.ZonaRepositorio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ZonaServicio {

    // ==========================================
    // 1. DEPENDENCIAS
    // ==========================================

    private final ZonaRepositorio zonaRepositorio;
    private final AuditoriaServicio auditoriaServicio;

    public ZonaServicio(
            ZonaRepositorio zonaRepositorio,
            AuditoriaServicio auditoriaServicio
    ) {
        this.zonaRepositorio = zonaRepositorio;
        this.auditoriaServicio = auditoriaServicio;
    }

    // ==========================================
    // 2. CREAR ZONA
    // ==========================================

    @Transactional
    public Zona crear(
            Zona zona,
            String emailEjecutor
    ) {

        // PostgreSQL genera el identificador.
        zona.setId(null);

        Zona guardada = zonaRepositorio.save(zona);

        // Registrar la creación de la zona.
        auditoriaServicio.registrar(
                emailEjecutor,
                "CREAR_ZONA",
                "Zona ID " + guardada.getId()
                        + ". Nombre: " + guardada.getNombreZona()
                        + ". Código postal: " + guardada.getCodigoPostal()
        );

        return guardada;
    }

    // ==========================================
    // 3. LISTAR ZONAS
    // ==========================================

    @Transactional(readOnly = true)
    public List<Zona> listar() {
        return zonaRepositorio.findAll();
    }
}
