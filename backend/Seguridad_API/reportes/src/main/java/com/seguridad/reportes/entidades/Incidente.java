
package com.seguridad.reportes.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.seguridad.reportes.enums.EstadoIncidente;
import jakarta.validation.constraints.Size;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "incidentes")
@JsonIgnoreProperties({
    "hibernateLazyInitializer",
    "handler"
})
public class Incidente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // DATOS DEL REPORTE
    // ==========================================

    @NotBlank(message = "El título es obligatorio")
    @Column(nullable = false, length = 100)
    private String titulo;

    @NotBlank(message = "La descripción es obligatoria")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @NotBlank(message = "La calle principal es obligatoria")
    @Column(nullable = false, length = 100)
    private String callePrincipal;

    @Size(max = 100)
@Column(nullable = true, length = 100)
private String calleSecundaria;

    // ==========================================
    // ESTADO DEL INCIDENTE
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private EstadoIncidente estado = EstadoIncidente.PENDIENTE;

    // ==========================================
    // FECHA DEL REPORTE
    // ==========================================

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaReporte;

    @PrePersist
    protected void onCreate() {

        if (this.fechaReporte == null) {
            this.fechaReporte = LocalDateTime.now();
        }

        if (this.estado == null) {
            this.estado = EstadoIncidente.PENDIENTE;
        }
    }

    // ==========================================
    // CIUDADANO QUE REPORTA
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "usuario_id",
        nullable = false
    )
    @JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
    })
    private Usuario usuario;

    // ==========================================
    // ZONA DEL INCIDENTE
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "zona_id",
        nullable = false
    )
    @JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
    })
    private Zona zona;

    // ==========================================
    // CATEGORÍA DEL INCIDENTE
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "categoria_id",
        nullable = false
    )
    @JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
    })
    private CategoriaIncidente categoria;

    // ==========================================
    // AGENCIA ASIGNADA
    // OPCIONAL AL CREAR EL REPORTE
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "agencia_id",
        nullable = true
    )
    @JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
    })
    private AgenciaRespuesta agencia;
}
