package com.seguridad.reportes.servicios;

import com.seguridad.reportes.dto.RestablecerPasswordDTO;
import com.seguridad.reportes.entidades.CodigoRecuperacion;
import com.seguridad.reportes.entidades.Usuario;
import com.seguridad.reportes.enums.EstadoUsuario;
import com.seguridad.reportes.repositorios.CodigoRecuperacionRepositorio;
import com.seguridad.reportes.repositorios.UsuarioRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
public class RecuperacionPasswordServicio {

    private final UsuarioRepositorio usuarios;
    private final CodigoRecuperacionRepositorio codigos;
    private final CorreoServicio correos;
    private final PasswordEncoder encoder;

    private final SecureRandom random = new SecureRandom();

    private static final String RESPUESTA_SOLICITUD =
            "Si existe una cuenta habilitada con ese correo, " +
            "recibirás un código de recuperación.";

    public RecuperacionPasswordServicio(
            UsuarioRepositorio usuarios,
            CodigoRecuperacionRepositorio codigos,
            CorreoServicio correos,
            PasswordEncoder encoder
    ) {
        this.usuarios = usuarios;
        this.codigos = codigos;
        this.correos = correos;
        this.encoder = encoder;
    }

    @Transactional
    public String solicitarCodigo(String email) {

        String emailLimpio = email.trim()
                .toLowerCase(Locale.ROOT);

        Optional<Usuario> encontrado =
                usuarios.findByEmailIgnoreCase(emailLimpio);

        if (encontrado.isEmpty()) {
            return RESPUESTA_SOLICITUD;
        }

        Usuario usuario = encontrado.get();

        if (usuario.getEstado() != EstadoUsuario.VALIDADA) {
            return RESPUESTA_SOLICITUD;
        }

        LocalDateTime ahora = LocalDateTime.now();

        Optional<CodigoRecuperacion> existente =
                codigos.bloquearPorUsuario(usuario.getId());

        if (existente.isPresent()
                && existente.get().getUltimoEnvio()
                    .plusSeconds(60).isAfter(ahora)) {
            return RESPUESTA_SOLICITUD;
        }

        String codigo = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

        CodigoRecuperacion registro =
                existente.orElseGet(CodigoRecuperacion::new);

        registro.setUsuario(usuario);
        registro.setCodigoHash(encoder.encode(codigo));
        registro.setExpiracion(ahora.plusMinutes(10));
        registro.setUltimoEnvio(ahora);
        registro.setIntentos(0);

        codigos.saveAndFlush(registro);

        correos.enviarCodigoRecuperacion(
                usuario.getEmail(),
                usuario.getNombre(),
                codigo
        );

        return RESPUESTA_SOLICITUD;
    }

    @Transactional(noRollbackFor = CodigoIncorrectoException.class)
    public String restablecer(
            RestablecerPasswordDTO dto,
            String emailAutorizado
    ) {
        String email = dto.email().trim()
                .toLowerCase(Locale.ROOT);

        // Cuando viene del perfil, el correo debe ser
        // exactamente el de la sesión autenticada.
        if (emailAutorizado != null
                && !email.equalsIgnoreCase(emailAutorizado)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No puede modificar otra cuenta"
            );
        }

        Usuario usuario = usuarios.findByEmailIgnoreCase(email)
                .orElseThrow(this::codigoInvalido);

        if (usuario.getEstado() != EstadoUsuario.VALIDADA) {
            throw codigoInvalido();
        }

        CodigoRecuperacion registro =
                codigos.bloquearPorUsuario(usuario.getId())
                        .orElseThrow(this::codigoInvalido);

        LocalDateTime ahora = LocalDateTime.now();

        if (!ahora.isBefore(registro.getExpiracion())
                || registro.getIntentos() >= 5) {
            throw codigoInvalido();
        }

        if (!encoder.matches(
                dto.codigo(),
                registro.getCodigoHash()
        )) {
            registro.setIntentos(registro.getIntentos() + 1);
            codigos.save(registro);

            throw new CodigoIncorrectoException();
        }

        if (!dto.passwordNueva().equals(
                dto.confirmarPassword()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Las contraseñas nuevas no coinciden"
            );
        }

        if (encoder.matches(
                dto.passwordNueva(),
                usuario.getPassword()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La contraseña nueva debe ser diferente"
            );
        }

        usuario.setPassword(
                encoder.encode(dto.passwordNueva())
        );

        usuarios.save(usuario);
        codigos.delete(registro);

        return "Contraseña actualizada correctamente";
    }

    private ResponseStatusException codigoInvalido() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Código inválido, vencido o sin intentos disponibles"
        );
    }

    public static class CodigoIncorrectoException
            extends RuntimeException {

        public CodigoIncorrectoException() {
            super("Código inválido");
        }
    }
}