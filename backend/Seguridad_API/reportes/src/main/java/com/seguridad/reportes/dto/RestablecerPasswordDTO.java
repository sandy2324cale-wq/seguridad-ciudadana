package com.seguridad.reportes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RestablecerPasswordDTO(
        @NotBlank @Email String email,

        @NotBlank
        @Pattern(regexp = "\\d{6}")
        String codigo,

        @NotBlank
        @Size(min = 8, max = 72)
        String passwordNueva,

        @NotBlank
        String confirmarPassword
) {}