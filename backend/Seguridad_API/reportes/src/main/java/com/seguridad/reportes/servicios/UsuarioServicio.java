
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.entidades.Usuario;
import com.seguridad.reportes.enums.EstadoUsuario;
import com.seguridad.reportes.enums.Rol;
import com.seguridad.reportes.repositorios.UsuarioRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UsuarioServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final CorreoServicio correoServicio;
    private final AuditoriaServicio auditoriaServicio;

    public UsuarioServicio(
            UsuarioRepositorio usuarioRepositorio,
            CorreoServicio correoServicio,
            AuditoriaServicio auditoriaServicio
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.correoServicio = correoServicio;
        this.auditoriaServicio = auditoriaServicio;
    }

    // ==========================================
    // LISTAR USUARIOS
    // ==========================================
    @Transactional(readOnly = true)
    public List<Usuario> listarTodos() {

        return usuarioRepositorio.findAll();
    }

    // ==========================================
    // BUSCAR USUARIO POR ID
    // ==========================================
    @Transactional(readOnly = true)
    public Usuario obtenerPorId(Long id) {

        return usuarioRepositorio.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Usuario no encontrado"
                        )
                );
    }

    // ==========================================
    // OBTENER ADMINISTRADOR AUTENTICADO
    // ==========================================
    private Usuario obtenerEjecutor(String emailEjecutor) {

        if (emailEjecutor == null ||
                emailEjecutor.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "No se pudo identificar al usuario autenticado"
            );
        }

        return usuarioRepositorio
                .findByEmailIgnoreCase(emailEjecutor)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Administrador no encontrado"
                        )
                );
    }

    // ==========================================
    // CAMBIAR ESTADO DE USUARIO
    // ==========================================
    @Transactional
    public Usuario cambiarEstado(
            Long id,
            EstadoUsuario nuevoEstado,
            String motivo,
            String emailEjecutor
    ) {

        Usuario ejecutor = obtenerEjecutor(emailEjecutor);
        Usuario usuario = obtenerPorId(id);

        // Solo ADMIN y SUPER_ADMIN.
        if (ejecutor.getRol() != Rol.ADMIN &&
                ejecutor.getRol() != Rol.SUPER_ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tienes permisos para cambiar estados"
            );
        }

        // Validar datos.
        if (nuevoEstado == null ||
                motivo == null ||
                motivo.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debes indicar el estado y el motivo"
            );
        }

        String motivoLimpio = motivo.trim();

        if (motivoLimpio.length() < 10) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El motivo debe tener al menos 10 caracteres"
            );
        }

        // No modificar la propia cuenta.
        if (usuario.getId().equals(ejecutor.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No puedes modificar tu propio estado"
            );
        }

        // ADMIN solo puede modificar
        // CLIENTE y OPERADOR.
        if (ejecutor.getRol() == Rol.ADMIN &&
                usuario.getRol() != Rol.CLIENTE &&
                usuario.getRol() != Rol.OPERADOR) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Un ADMIN no puede modificar cuentas administrativas"
            );
        }

        // Proteger SUPER_ADMIN.
        if (usuario.getRol() == Rol.SUPER_ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No se puede modificar el estado de SUPER_ADMIN"
            );
        }

        // Evitar operaciones innecesarias.
        if (usuario.getEstado() == nuevoEstado) {
            return usuario;
        }

        // Guardar estado anterior para auditoría.
        EstadoUsuario estadoAnterior = usuario.getEstado();

        usuario.setEstado(nuevoEstado);

        Usuario guardado = usuarioRepositorio.save(usuario);

        // ======================================
        // REGISTRAR AUDITORÍA
        // ======================================
        String accion;

        if (nuevoEstado == EstadoUsuario.BLOQUEADA) {
            accion = "BLOQUEAR_USUARIO";
        } else if (nuevoEstado == EstadoUsuario.VALIDADA) {
            accion = "VALIDAR_USUARIO";
        } else {
            accion = "CAMBIAR_ESTADO_USUARIO";
        }

        auditoriaServicio.registrar(
                ejecutor.getEmail(),
                accion,
                "Usuario ID " + usuario.getId()
                        + " (" + usuario.getEmail() + ")"
                        + ". Estado anterior: " + estadoAnterior
                        + ". Estado nuevo: " + nuevoEstado
                        + ". Motivo: " + motivoLimpio
        );

        // ======================================
        // NOTIFICACIÓN POR CORREO
        // ======================================
        try {

            if (nuevoEstado == EstadoUsuario.BLOQUEADA) {

                correoServicio.enviarNotificacionBloqueo(
                        usuario.getEmail(),
                        usuario.getNombre(),
                        motivoLimpio
                );

            } else if (nuevoEstado == EstadoUsuario.VALIDADA) {

                correoServicio.enviarNotificacionResolucionApelacion(
                        usuario.getEmail(),
                        usuario.getNombre(),
                        nuevoEstado.name(),
                        motivoLimpio
                );
            }

        } catch (Exception e) {

            // No impedir que se guarde el cambio
            // si falla el envío de correo.
            System.err.println(
                    "No se pudo enviar el correo: "
                            + e.getMessage()
            );
        }

        return guardado;
    }

    // ==========================================
    // CAMBIAR ROL DE USUARIO
    // SOLO SUPER_ADMIN
    // ==========================================
    @Transactional
    public Usuario cambiarRolUsuario(
            Long id,
            Rol nuevoRol,
            String emailEjecutor
    ) {

        Usuario ejecutor = obtenerEjecutor(emailEjecutor);
        Usuario usuario = obtenerPorId(id);

        if (ejecutor.getRol() != Rol.SUPER_ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo SUPER_ADMIN puede cambiar roles"
            );
        }

        if (nuevoRol == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debes seleccionar un rol"
            );
        }

        // No modificar el propio rol.
        if (usuario.getId().equals(ejecutor.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No puedes modificar tu propio rol"
            );
        }

        // Si no cambia, no registrar auditoría.
        if (usuario.getRol() == nuevoRol) {
            return usuario;
        }

        // Proteger al último SUPER_ADMIN.
        if (usuario.getRol() == Rol.SUPER_ADMIN &&
                nuevoRol != Rol.SUPER_ADMIN) {

            long cantidadSuperAdmins = usuarioRepositorio
                    .findAll()
                    .stream()
                    .filter(u -> u.getRol() == Rol.SUPER_ADMIN)
                    .count();

            if (cantidadSuperAdmins <= 1) {

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No puedes eliminar el último SUPER_ADMIN"
                );
            }
        }

        Rol rolAnterior = usuario.getRol();

        usuario.setRol(nuevoRol);

        Usuario guardado = usuarioRepositorio.save(usuario);

        // ======================================
        // AUDITORÍA DE CAMBIO DE ROL
        // ======================================
        auditoriaServicio.registrar(
                ejecutor.getEmail(),
                "CAMBIAR_ROL",
                "Usuario ID " + usuario.getId()
                        + " (" + usuario.getEmail() + ")"
                        + ". Rol anterior: " + rolAnterior
                        + ". Rol nuevo: " + nuevoRol
        );

        return guardado;
    }

    // ==========================================
    // ELIMINACIÓN DESHABILITADA
    // ==========================================
    public void eliminar(Long id) {

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "La eliminación de usuarios está deshabilitada"
        );
    }
}
