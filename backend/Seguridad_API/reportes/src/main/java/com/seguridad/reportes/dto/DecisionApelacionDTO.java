
package com.seguridad.reportes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record DecisionApelacionDTO(

    @NotBlank(
        message = "La decisión es obligatoria"
    )

    @Pattern(
        regexp = "APROBADA|RECHAZADA",
        message = "La decisión debe ser APROBADA o RECHAZADA"
    )

    String decision

) {
}
