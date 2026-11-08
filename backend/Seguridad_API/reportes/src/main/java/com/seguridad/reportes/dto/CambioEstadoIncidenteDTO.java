package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.EstadoIncidente;
import lombok.Data;

@Data
public class CambioEstadoIncidenteDTO {
    private EstadoIncidente nuevoEstado;
    private String observacion;
    private Long agenciaId;
}