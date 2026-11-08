
package com.seguridad.reportes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AsignarAgenciaDTO(

        @NotNull(message = "Debe seleccionar una agencia")
        @Positive(message = "El ID de la agencia debe ser positivo")
        Long agenciaId,

        @NotBlank(message = "La observación es obligatoria")
        @Size(max = 255, message = "Máximo 255 caracteres")
        String observacion

) {}
