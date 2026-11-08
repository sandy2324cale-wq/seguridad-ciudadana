package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.Rol;
import lombok.Data;

@Data
public class CambioRolDTO {
    private Rol nuevoRol;
}