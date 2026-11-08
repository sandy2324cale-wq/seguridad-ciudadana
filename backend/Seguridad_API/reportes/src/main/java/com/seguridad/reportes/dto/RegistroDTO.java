    package com.seguridad.reportes.dto;

    import jakarta.validation.constraints.Email;
    import jakarta.validation.constraints.NotBlank;
    import jakarta.validation.constraints.Size;
    import lombok.Data;
    import lombok.Getter;
    import lombok.Setter;

    @Getter 
    @Setter

    @Data
    public class RegistroDTO {

        @NotBlank(message = "La cédula es obligatoria")
        @Size(min = 10, max = 10, message = "La cédula debe tener exactamente 10 dígitos")
        private String cedula;

        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
        private String nombre;

        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
        private String apellido;

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Debe ingresar un formato de correo electrónico válido")
        @Size(max = 100, message = "El correo no puede exceder los 100 caracteres")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 100, message = "La contraseña debe tener al menos 8 caracteres")
        private String password;
    }