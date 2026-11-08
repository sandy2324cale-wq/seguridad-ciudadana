package com.seguridad.reportes.entidades;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "codigos_recuperacion")
@Getter
@Setter
public class CodigoRecuperacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false, length = 100)
    private String codigoHash;

    @Column(nullable = false)
    private LocalDateTime expiracion;

    @Column(nullable = false)
    private LocalDateTime ultimoEnvio;

    @Column(nullable = false)
    private int intentos = 0;
}