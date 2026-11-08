
package com.seguridad.reportes.dto;

import com.seguridad.reportes.entidades.Usuario;
import com.seguridad.reportes.enums.Rol;
import com.seguridad.reportes.enums.EstadoUsuario;

public record UsuarioRespuestaDTO(
        Long id,
        String cedula,
        String nombre,
        String apellido,
        String email,
        Rol rol,
        EstadoUsuario estado
) {

    public static UsuarioRespuestaDTO desde(Usuario usuario) {
        return new UsuarioRespuestaDTO(
                usuario.getId(),
                usuario.getCedula(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getEstado()
        );
    }
}
