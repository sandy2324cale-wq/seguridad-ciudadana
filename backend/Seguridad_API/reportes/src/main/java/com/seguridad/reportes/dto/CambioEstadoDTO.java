package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.EstadoUsuario;
import lombok.Data;

@Data
public class CambioEstadoDTO {
    private EstadoUsuario nuevoEstado;
    private String motivo;
}