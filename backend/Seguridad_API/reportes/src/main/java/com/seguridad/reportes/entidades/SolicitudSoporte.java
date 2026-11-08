package com.seguridad.reportes.entidades;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "solicitudes_soporte")
public class SolicitudSoporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String cedula;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String motivoApelacion;

    @Column(nullable = false)
    private String estadoSolicitud; // PENDIENTE, APROBADA, RECHAZADA

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaSolicitud;

    @PrePersist
    protected void onCreate() {
        this.fechaSolicitud = LocalDateTime.now();
        if (this.estadoSolicitud == null) {
            this.estadoSolicitud = "PENDIENTE";
        }
    }
}