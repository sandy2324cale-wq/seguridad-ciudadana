package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.EstadoIncidente;

import java.time.LocalDateTime;

public record IncidenteRespuestaDTO(
        Long id,
        String titulo,
        String descripcion,
        String callePrincipal,
        String calleSecundaria,
        EstadoIncidente estado,
        LocalDateTime fechaReporte,
        Long zonaId,
        String nombreZona,
        Long categoriaId,
        String nombreCategoria,
        Long agenciaId
) {}