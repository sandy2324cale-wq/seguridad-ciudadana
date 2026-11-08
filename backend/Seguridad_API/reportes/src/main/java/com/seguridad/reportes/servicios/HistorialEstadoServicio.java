
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.dto.HistorialEstadoRespuestaDTO;
import com.seguridad.reportes.entidades.HistorialEstado;
import com.seguridad.reportes.entidades.Incidente;
import com.seguridad.reportes.entidades.Usuario;
import com.seguridad.reportes.enums.EstadoUsuario;
import com.seguridad.reportes.enums.Rol;
import com.seguridad.reportes.repositorios.HistorialEstadoRepositorio;
import com.seguridad.reportes.repositorios.IncidenteRepositorio;
import com.seguridad.reportes.repositorios.UsuarioRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class HistorialEstadoServicio {

    private final HistorialEstadoRepositorio historialRepositorio;
    private final IncidenteRepositorio incidenteRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    public HistorialEstadoServicio(
            HistorialEstadoRepositorio historialRepositorio,
            IncidenteRepositorio incidenteRepositorio,
            UsuarioRepositorio usuarioRepositorio
    ) {
        this.historialRepositorio = historialRepositorio;
        this.incidenteRepositorio = incidenteRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    // ==========================================
    // CONSULTAR HISTORIAL DE UN INCIDENTE
    // ==========================================

    @Transactional(readOnly = true)
    public List<HistorialEstadoRespuestaDTO> obtenerHistorialPorIncidente(
            Long incidenteId
    ) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesión"
            );
        }

        Usuario usuario = usuarioRepositorio
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado no encontrado"
                ));

        if (usuario.getEstado() != EstadoUsuario.VALIDADA) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "La cuenta no está habilitada"
            );
        }

        if (usuario.getRol() != Rol.OPERADOR &&
                usuario.getRol() != Rol.ADMIN &&
                usuario.getRol() != Rol.SUPER_ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tiene permisos para consultar el historial"
            );
        }

        if (incidenteId == null || incidenteId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El ID del incidente debe ser mayor a cero"
            );
        }

        Incidente incidente = incidenteRepositorio
                .findById(incidenteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Incidente no encontrado"
                ));

        return historialRepositorio
                .findByIncidenteIdOrderByFechaCambioDesc(
                        incidente.getId()
                )
                .stream()
                .map(historial -> new HistorialEstadoRespuestaDTO(
                        historial.getId(),
                        historial.getEstadoAnterior(),
                        historial.getEstadoNuevo(),
                        historial.getObservacion(),
                        historial.getFechaCambio(),
                        historial.getIncidente().getId(),
                        historial.getUsuario().getEmail()
                ))
                .toList();
    }
}
