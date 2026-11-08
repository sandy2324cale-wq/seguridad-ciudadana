package com.seguridad.reportes.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "zonas")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Zona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la zona es obligatorio")
    @Size(max = 80, message = "El nombre de la zona no puede superar los 80 caracteres")
    @Column(nullable = false, length = 80)
    private String nombreZona;

    @NotBlank(message = "El código postal es obligatorio")
    @Size(max = 10, message = "El código postal no puede superar los 10 caracteres")
    @Column(nullable = false, length = 10)
    private String codigoPostal;
}