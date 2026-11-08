      package com.seguridad.reportes.dto;

      import jakarta.validation.constraints.NotBlank;
      import jakarta.validation.constraints.NotNull;
      import jakarta.validation.constraints.Positive;
      import jakarta.validation.constraints.Size;
      import lombok.Data;

      @Data
      public class IncidenteDTO {

      @NotBlank(message = "El título del incidente es obligatorio")
      @Size(min = 5, max = 100,
            message = "El título debe tener entre 5 y 100 caracteres")
      private String titulo;

      @NotBlank(message = "La descripción del incidente es obligatoria")
      @Size(min = 10, max = 500,
            message = "La descripción debe tener entre 10 y 500 caracteres")
      private String descripcion;

      @NotBlank(message = "La calle principal es obligatoria")
      @Size(min = 3, max = 100,
            message = "La calle principal debe tener entre 3 y 100 caracteres")
      private String callePrincipal;

      @Size(max = 100,
            message = "La calle secundaria no puede exceder los 100 caracteres")
      private String calleSecundaria;

      @NotNull(message = "La zona es obligatoria")
      @Positive(message = "El ID de zona debe ser positivo")
      private Long zonaId;

      @NotNull(message = "La categoría es obligatoria")
      @Positive(message = "El ID de categoría debe ser positivo")
      private Long categoriaId;
      }