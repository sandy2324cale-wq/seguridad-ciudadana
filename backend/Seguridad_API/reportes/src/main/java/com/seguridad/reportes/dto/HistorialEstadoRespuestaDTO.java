
package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.EstadoIncidente;

import java.time.LocalDateTime;

public record HistorialEstadoRespuestaDTO(

        Long id,

        EstadoIncidente estadoAnterior,

        EstadoIncidente estadoNuevo,

        String observacion,

        LocalDateTime fechaCambio,

        Long incidenteId,

        String responsable

) {}
