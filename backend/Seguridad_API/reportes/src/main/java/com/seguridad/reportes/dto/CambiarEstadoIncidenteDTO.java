package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.EstadoIncidente;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambiarEstadoIncidenteDTO(

        @NotNull(message = "El nuevo estado es obligatorio")
        EstadoIncidente nuevoEstado,

        @NotBlank(message = "La observación es obligatoria")
        @Size(max = 255,
              message = "La observación no puede superar 255 caracteres")
        String observacion

) {}