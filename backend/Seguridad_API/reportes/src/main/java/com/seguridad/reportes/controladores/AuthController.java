package com.seguridad.reportes.controladores;

import java.util.Map;

import com.seguridad.reportes.dto.CambiarPasswordDTO;
import com.seguridad.reportes.dto.LoginDTO;
import com.seguridad.reportes.dto.RegistroDTO;
import com.seguridad.reportes.dto.RestablecerPasswordDTO;
import com.seguridad.reportes.dto.SolicitarRecuperacionDTO;
import com.seguridad.reportes.dto.VerificacionDTO;
import com.seguridad.reportes.servicios.AuthServicio;
import com.seguridad.reportes.servicios.RecuperacionPasswordServicio;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "http://localhost:4200")
@Validated
public class AuthController {

    @Autowired
    private AuthServicio authServicio;

    @Autowired
    private RecuperacionPasswordServicio recuperacionPasswordServicio;

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@Valid @RequestBody RegistroDTO dto) {
        return ResponseEntity.ok(authServicio.registrar(dto));
    }

    @PostMapping("/verificar-codigo")
    public ResponseEntity<?> verificar(@Valid @RequestBody VerificacionDTO dto) {
        return ResponseEntity.ok(authServicio.verificarCodigo(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO dto) {
        return ResponseEntity.ok(authServicio.login(dto));
    }

    @PostMapping("/reenviar-codigo")
    public ResponseEntity<?> reenviarCodigo(@RequestBody Map<String, String> datos) {
        return ResponseEntity.ok(authServicio.reenviarCodigo(datos.get("email")));
    }

    // Requiere JWT: contraseña actual + contraseña nueva.
    @PatchMapping("/cambiar-password")
    public ResponseEntity<String> cambiarPassword(
            @Valid @RequestBody CambiarPasswordDTO dto,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debe iniciar sesión");
        }
        return ResponseEntity.ok(authServicio.cambiarPassword(authentication.getName(), dto));
    }

    // Público: solicitar recuperación desde el login.
    @PostMapping("/recuperacion/solicitar")
    public ResponseEntity<String> solicitarRecuperacion(
            @Valid @RequestBody SolicitarRecuperacionDTO dto) {
        return ResponseEntity.ok(recuperacionPasswordServicio.solicitarCodigo(dto.email()));
    }

    // Público: completar recuperación desde el login.
    @PostMapping("/recuperacion/restablecer")
    public ResponseEntity<String> restablecerPassword(
            @Valid @RequestBody RestablecerPasswordDTO dto) {
        return ResponseEntity.ok(recuperacionPasswordServicio.restablecer(dto, null));
    }

    // Requiere JWT: enviar código al correo de la cuenta autenticada.
    @PostMapping("/perfil/password/solicitar")
    public ResponseEntity<String> solicitarDesdePerfil(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debe iniciar sesión");
        }
        return ResponseEntity.ok(
                recuperacionPasswordServicio.solicitarCodigo(authentication.getName()));
    }

    // Requiere JWT y código: cambiar contraseña desde el perfil.
    @PostMapping("/perfil/password/restablecer")
    public ResponseEntity<String> restablecerDesdePerfil(
            @Valid @RequestBody RestablecerPasswordDTO dto,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debe iniciar sesión");
        }
        return ResponseEntity.ok(
                recuperacionPasswordServicio.restablecer(dto, authentication.getName()));
    }
}
