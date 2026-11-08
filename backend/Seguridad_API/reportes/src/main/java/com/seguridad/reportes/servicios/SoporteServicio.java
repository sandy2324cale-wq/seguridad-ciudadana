
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.dto.ApelacionDTO;
import com.seguridad.reportes.dto.DecisionApelacionDTO;

import com.seguridad.reportes.entidades.SolicitudSoporte;
import com.seguridad.reportes.entidades.Usuario;

import com.seguridad.reportes.enums.EstadoUsuario;
import com.seguridad.reportes.enums.Rol;

import com.seguridad.reportes.repositorios.SolicitudSoporteRepositorio;
import com.seguridad.reportes.repositorios.UsuarioRepositorio;

import org.springframework.http.HttpStatus;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class SoporteServicio {

    private final SolicitudSoporteRepositorio soporteRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final UsuarioServicio usuarioServicio;
    private final AuditoriaServicio auditoriaServicio;

    public SoporteServicio(
            SolicitudSoporteRepositorio soporteRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            UsuarioServicio usuarioServicio,
            AuditoriaServicio auditoriaServicio
    ) {
        this.soporteRepositorio = soporteRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.usuarioServicio = usuarioServicio;
        this.auditoriaServicio = auditoriaServicio;
    }

    // ==========================================
    // CREAR SOLICITUD DE APELACIÓN
    // ==========================================
    @Transactional
    public SolicitudSoporte crearSolicitud(ApelacionDTO dto) {

        if (dto == null ||
                dto.email() == null ||
                dto.cedula() == null ||
                dto.motivoApelacion() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Todos los campos son obligatorios"
            );
        }

        String email = dto.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        String cedula = dto.cedula().trim();
        String motivo = dto.motivoApelacion().trim();

        if (email.isBlank() || cedula.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El correo y la cédula son obligatorios"
            );
        }

        if (motivo.length() < 10 ||
                motivo.length() > 2000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El motivo debe tener entre 10 y 2000 caracteres"
            );
        }

        Usuario usuario = usuarioRepositorio
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "No se puede procesar la apelación con los datos proporcionados"
                        )
                );

        if (!usuario.getCedula().equals(cedula)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se puede procesar la apelación con los datos proporcionados"
            );
        }

        if (usuario.getEstado() != EstadoUsuario.BLOQUEADA) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La cuenta no está bloqueada"
            );
        }

        if (soporteRepositorio
                .existsByEmailIgnoreCaseAndEstadoSolicitud(
                        email,
                        "PENDIENTE"
                )) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una apelación pendiente"
            );
        }

        SolicitudSoporte solicitud = SolicitudSoporte.builder()
                .email(email)
                .cedula(cedula)
                .motivoApelacion(motivo)
                .estadoSolicitud("PENDIENTE")
                .build();

        return soporteRepositorio.save(solicitud);
    }

    // ==========================================
    // LISTAR SOLICITUDES
    // ==========================================
    @Transactional(readOnly = true)
    public List<SolicitudSoporte> listarSolicitudes() {

        return soporteRepositorio
                .findAllByOrderByFechaSolicitudDesc();
    }

    // ==========================================
    // APROBAR O RECHAZAR APELACIÓN
    // ==========================================
    @Transactional
    public SolicitudSoporte decidirSolicitud(
            Long id,
            DecisionApelacionDTO dto
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                "anonymousUser".equals(
                        authentication.getPrincipal()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debes iniciar sesión"
            );
        }

        String emailAdministrador = authentication.getName();

        Usuario administrador = usuarioRepositorio
                .findByEmailIgnoreCase(emailAdministrador)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Administrador no encontrado"
                        )
                );

        if (administrador.getRol() != Rol.ADMIN &&
                administrador.getRol() != Rol.SUPER_ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tienes permisos para resolver apelaciones"
            );
        }

        if (dto == null ||
                dto.decision() == null ||
                (!"APROBADA".equals(dto.decision()) &&
                 !"RECHAZADA".equals(dto.decision()))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La decisión debe ser APROBADA o RECHAZADA"
            );
        }

        SolicitudSoporte solicitud = soporteRepositorio
                .buscarParaDecision(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Solicitud no encontrada"
                        )
                );

        if (!"PENDIENTE".equals(
                solicitud.getEstadoSolicitud()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La solicitud ya fue resuelta"
            );
        }

        Usuario usuario = usuarioRepositorio
                .findByEmailIgnoreCase(
                        solicitud.getEmail()
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Usuario no encontrado"
                        )
                );

        if (!usuario.getCedula().equals(
                solicitud.getCedula()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Los datos de la apelación no coinciden"
            );
        }

        // ADMIN solo gestiona CLIENTE y OPERADOR.
        if (administrador.getRol() == Rol.ADMIN &&
                usuario.getRol() != Rol.CLIENTE &&
                usuario.getRol() != Rol.OPERADOR) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "ADMIN no puede resolver apelaciones administrativas"
            );
        }

        // SUPER_ADMIN protegido.
        if (usuario.getRol() == Rol.SUPER_ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No se pueden resolver apelaciones de SUPER_ADMIN"
            );
        }

        // ======================================
        // APROBAR APELACIÓN
        // ======================================
        if ("APROBADA".equals(dto.decision())) {

            if (usuario.getEstado() != EstadoUsuario.BLOQUEADA) {

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "La cuenta ya no está bloqueada"
                );
            }

            usuarioServicio.cambiarEstado(
                    usuario.getId(),
                    EstadoUsuario.VALIDADA,
                    "Apelación aprobada por administración",
                    emailAdministrador
            );
        }

        // ======================================
        // ACTUALIZAR SOLICITUD
        // ======================================
        solicitud.setEstadoSolicitud(dto.decision());

        SolicitudSoporte guardada =
                soporteRepositorio.save(solicitud);

        // ======================================
        // REGISTRAR AUDITORÍA
        // ======================================
        String accion = "APROBADA".equals(dto.decision())
                ? "APROBAR_APELACION"
                : "RECHAZAR_APELACION";

        auditoriaServicio.registrar(
                emailAdministrador,
                accion,
                "Apelación ID " + solicitud.getId()
                        + ". Usuario: " + solicitud.getEmail()
                        + ". Decisión: " + dto.decision()
        );

        return guardada;
    }
}
