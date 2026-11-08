
package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.Rol;

public record LoginResponse(
        String token,
        String email,
        Rol rol
) {
}
