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
@Table(name = "agencias_respuesta")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AgenciaRespuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la agencia es obligatorio")
    @Size(max = 100, message = "El nombre de la agencia no puede superar los 100 caracteres")
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "Las siglas son obligatorias")
    @Size(max = 20, message = "Las siglas no pueden superar los 20 caracteres")
    @Column(nullable = false, length = 20)
    private String siglas;

    @NotBlank(message = "El teléfono de emergencia es obligatorio")
    @Size(max = 15, message = "El teléfono no puede superar los 15 caracteres")
    @Column(nullable = false, length = 15)
    private String telefonoEmergencia;
}