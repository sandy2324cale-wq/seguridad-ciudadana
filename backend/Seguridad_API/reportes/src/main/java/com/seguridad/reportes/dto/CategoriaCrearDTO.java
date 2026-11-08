
package com.seguridad.reportes.dto;

import com.seguridad.reportes.enums.NivelPrioridad;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;

public record CategoriaCrearDTO(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80)
        String nombre,

        @NotNull(message = "La prioridad es obligatoria")
        NivelPrioridad nivelPrioridad,

        @NotNull(message = "Seleccione una agencia")
        @Positive
        Long agenciaId
) {}
