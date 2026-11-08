
package com.seguridad.reportes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApelacionDTO(

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no es válido")
    String email,

    @NotBlank(message = "La cédula es obligatoria")
    String cedula,

    @NotBlank(message = "El motivo es obligatorio")
    @Size(min = 10, max = 2000,
          message = "El motivo debe tener entre 10 y 2000 caracteres")
    String motivoApelacion

) {}
