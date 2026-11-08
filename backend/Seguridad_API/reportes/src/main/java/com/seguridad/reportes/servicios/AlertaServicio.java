
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.dto.AlertaDTO;
import com.seguridad.reportes.entidades.Alerta;
import com.seguridad.reportes.entidades.Usuario;
import com.seguridad.reportes.excepciones.ResourceNotFoundException;
import com.seguridad.reportes.repositorios.AlertaRepositorio;
import com.seguridad.reportes.repositorios.UsuarioRepositorio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AlertaServicio {

    // ==========================================
    // 1. DEPENDENCIAS
    // ==========================================

    private final AlertaRepositorio alertaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final AuditoriaServicio auditoriaServicio;

    public AlertaServicio(
            AlertaRepositorio alertaRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            AuditoriaServicio auditoriaServicio
    ) {
        this.alertaRepositorio = alertaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.auditoriaServicio = auditoriaServicio;
    }

    // ==========================================
    // 2. LISTAR ALERTAS
    // ==========================================

    @Transactional(readOnly = true)
    public List<Alerta> listarTodas() {
        return alertaRepositorio.findAll();
    }

    // ==========================================
    // 3. CONSULTAR ALERTA POR ID
    // ==========================================

    @Transactional(readOnly = true)
    public Alerta obtenerPorId(Long id) {

        return alertaRepositorio.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Alerta no encontrada con ID: " + id
                        )
                );
    }

    // ==========================================
    // 4. CREAR ALERTA Y REGISTRAR AUDITORÍA
    // ==========================================

    @Transactional
    public Alerta crearAlerta(
            AlertaDTO dto,
            String emailEmisor
    ) {

        Usuario emisor = usuarioRepositorio
                .findByEmailIgnoreCase(emailEmisor.trim())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Usuario emisor no encontrado con el correo: "
                                        + emailEmisor
                        )
                );

        // Conservar los campos y comportamiento
        // originales de creación de alertas.
        Alerta alerta = Alerta.builder()
                .titulo(dto.getTitulo().trim())
                .mensaje(dto.getMensaje().trim())
                .nivel(dto.getNivel().trim().toUpperCase())
                .fechaPublicacion(LocalDateTime.now())
                .emisor(emisor)
                .build();

        Alerta guardada = alertaRepositorio.save(alerta);

        // Registrar quién publicó la alerta,
        // su identificador y el nivel asignado.
        auditoriaServicio.registrar(
                emisor.getEmail(),
                "PUBLICAR_ALERTA",
                "Alerta ID " + guardada.getId()
                        + ". Título: " + guardada.getTitulo()
                        + ". Nivel: " + guardada.getNivel()
        );

        return guardada;
    }

    // ==========================================
    // 5. ELIMINAR ALERTA
    // ==========================================

    // Se conserva el método existente.
    // No se añade auditoría aquí porque
    // actualmente no existe un endpoint DELETE
    // y el método no recibe al responsable.
    @Transactional
    public void eliminar(Long id) {

        Alerta alerta = obtenerPorId(id);

        alertaRepositorio.delete(alerta);
    }
}
