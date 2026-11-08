package com.seguridad.reportes.controladores;

import com.seguridad.reportes.servicios
        .RecuperacionPasswordServicio.CodigoIncorrectoException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class RecuperacionExceptionHandler {

    @ExceptionHandler(CodigoIncorrectoException.class)
    public ResponseEntity<Map<String, String>> codigoIncorrecto() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "mensaje",
                        "Código inválido, vencido o sin intentos disponibles"
                ));
    }
}