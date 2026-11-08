
package com.seguridad.reportes.controladores;

import com.seguridad.reportes.dto.CambioEstadoDTO;
import com.seguridad.reportes.dto.CambioRolDTO;
import com.seguridad.reportes.dto.UsuarioRespuestaDTO;

import com.seguridad.reportes.entidades.Usuario;
import com.seguridad.reportes.servicios.UsuarioServicio;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioControlador {

    @Autowired
    private UsuarioServicio usuarioServicio;

    // ====================================
    // LISTAR USUARIOS
    // ADMIN Y SUPER_ADMIN
    // ====================================
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> listarTodos() {

        List<UsuarioRespuestaDTO> usuarios =
                usuarioServicio.listarTodos()
                        .stream()
                        .map(UsuarioRespuestaDTO::desde)
                        .toList();

        return ResponseEntity.ok(usuarios);
    }

    // ====================================
    // OBTENER USUARIO POR ID
    // ADMIN Y SUPER_ADMIN
    // ====================================
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UsuarioRespuestaDTO> obtenerPorId(
            @PathVariable Long id) {

        Usuario usuario = usuarioServicio.obtenerPorId(id);

        return ResponseEntity.ok(
                UsuarioRespuestaDTO.desde(usuario)
        );
    }

    // ====================================
    // CAMBIAR ESTADO
    // ADMIN Y SUPER_ADMIN
    // ====================================
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UsuarioRespuestaDTO> cambiarEstado(
            @PathVariable Long id,
            @RequestBody CambioEstadoDTO dto,
            Principal principal) {

        Usuario actualizado = usuarioServicio.cambiarEstado(
                id,
                dto.getNuevoEstado(),
                dto.getMotivo(),
                principal.getName()
        );

        return ResponseEntity.ok(
                UsuarioRespuestaDTO.desde(actualizado)
        );
    }

    // ====================================
    // CAMBIAR ROL
    // SOLO SUPER_ADMIN
    // ====================================
    @PatchMapping("/{id}/rol")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UsuarioRespuestaDTO> cambiarRol(
            @PathVariable Long id,
            @RequestBody CambioRolDTO dto,
            Principal principal) {

        Usuario actualizado = usuarioServicio.cambiarRolUsuario(
                id,
                dto.getNuevoRol(),
                principal.getName()
        );

        return ResponseEntity.ok(
                UsuarioRespuestaDTO.desde(actualizado)
        );
    }
}
