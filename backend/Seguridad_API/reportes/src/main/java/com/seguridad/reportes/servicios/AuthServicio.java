
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.dto.*;

import com.seguridad.reportes.entidades.Usuario;

import com.seguridad.reportes.enums.EstadoUsuario;
import com.seguridad.reportes.enums.Rol;

import com.seguridad.reportes.repositorios.UsuarioRepositorio;

import com.seguridad.reportes.seguridad.JwtProvider;

import org.springframework.http.HttpStatus;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AuthServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final CorreoServicio correoServicio;
    private final JwtProvider jwtProvider;

    private final SecureRandom secureRandom =
            new SecureRandom();

    public AuthServicio(
            UsuarioRepositorio usuarioRepositorio,
            PasswordEncoder passwordEncoder,
            CorreoServicio correoServicio,
            JwtProvider jwtProvider
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.correoServicio = correoServicio;
        this.jwtProvider = jwtProvider;
    }

    // ==========================================
    // GENERAR OTP
    // ==========================================
    private String generarCodigoOtp() {

        return String.format(
                "%06d",
                secureRandom.nextInt(1000000)
        );
    }

    // ==========================================
    // REGISTRAR CIUDADANO
    // ==========================================
    public String registrar(RegistroDTO dto) {

        if (dto == null ||
                dto.getEmail() == null ||
                dto.getCedula() == null ||
                dto.getNombre() == null ||
                dto.getApellido() == null ||
                dto.getPassword() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Complete todos los campos obligatorios"
            );
        }

        String emailLimpio = dto.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        String cedulaLimpia = dto.getCedula().trim();

        if (
                emailLimpio.isBlank() ||
                cedulaLimpia.isBlank() ||
                dto.getNombre().isBlank() ||
                dto.getApellido().isBlank() ||
                dto.getPassword().isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Complete todos los campos obligatorios"
            );
        }

        if (usuarioRepositorio.existsByEmail(emailLimpio)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El correo ingresado ya se encuentra registrado"
            );
        }

        if (usuarioRepositorio.existsByCedula(cedulaLimpia)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La cédula ingresada ya se encuentra registrada"
            );
        }

        String codigoOtp = generarCodigoOtp();

        Usuario usuario = Usuario.builder()
                .cedula(cedulaLimpia)
                .nombre(dto.getNombre().trim())
                .apellido(dto.getApellido().trim())
                .email(emailLimpio)
                .password(
                        passwordEncoder.encode(
                                dto.getPassword()
                        )
                )
                .rol(Rol.CLIENTE)
                .estado(EstadoUsuario.PENDIENTE)
                .codigoVerificacion(codigoOtp)
                .codigoExpiracion(
                        LocalDateTime.now().plusMinutes(15)
                )
                .build();

        // Guardar antes de enviar el código.
        usuarioRepositorio.saveAndFlush(usuario);

        // Si falla el correo, Spring devolverá
        // un error que Angular podrá mostrar.
        correoServicio.enviarCodigoOTP(
                emailLimpio,
                usuario.getNombre(),
                codigoOtp
        );

        return "Código OTP enviado correctamente. "
                + "Revisa tu correo electrónico para activar tu cuenta.";
    }

    // ==========================================
    // VERIFICAR CÓDIGO OTP
    // ==========================================
    @Transactional
    public String verificarCodigo(
            VerificacionDTO dto
    ) {

        if (dto == null ||
                dto.getEmail() == null ||
                dto.getCodigo() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Correo y código OTP obligatorios"
            );
        }

        String emailLimpio = dto.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        String codigoIngresado =
                dto.getCodigo().trim();

        Usuario usuario = usuarioRepositorio
                .findByEmailIgnoreCase(emailLimpio)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Usuario no encontrado"
                        )
                );

        if (usuario.getEstado() == EstadoUsuario.VALIDADA) {

            return "La cuenta ya se encuentra verificada.";
        }

        if (usuario.getEstado() == EstadoUsuario.BLOQUEADA) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "La cuenta está bloqueada"
            );
        }

        if (!codigoIngresado.matches("\\d{6}")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código OTP debe contener 6 dígitos"
            );
        }

        if (usuario.getCodigoVerificacion() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No existe un código OTP pendiente"
            );
        }

        if (
                usuario.getCodigoExpiracion() == null ||
                !LocalDateTime.now().isBefore(
                        usuario.getCodigoExpiracion()
                )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código OTP ha expirado. Solicite uno nuevo"
            );
        }

        if (!codigoIngresado.equals(
                usuario.getCodigoVerificacion()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código OTP ingresado es incorrecto"
            );
        }

        usuario.setEstado(EstadoUsuario.VALIDADA);

        usuario.setCodigoVerificacion(null);
        usuario.setCodigoExpiracion(null);

        usuarioRepositorio.saveAndFlush(usuario);

        return "Cuenta verificada exitosamente. "
                + "Ya puede iniciar sesión.";
    }

    // ==========================================
    // LOGIN
    // ==========================================
    public LoginResponse login(LoginDTO dto) {

        if (
                dto == null ||
                dto.getEmail() == null ||
                dto.getPassword() == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ingrese su correo y contraseña"
            );
        }

        String emailLimpio = dto.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        Usuario usuario = usuarioRepositorio
                .findByEmailIgnoreCase(emailLimpio)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Credenciales inválidas"
                        )
                );

        if (!passwordEncoder.matches(
                dto.getPassword(),
                usuario.getPassword()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Credenciales inválidas"
            );
        }

        if (usuario.getEstado() == EstadoUsuario.BLOQUEADA) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Su cuenta ha sido BLOQUEADA"
            );
        }

        if (usuario.getEstado() == EstadoUsuario.PENDIENTE) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Su cuenta aún no ha sido activada mediante el código OTP"
            );
        }

        if (usuario.getEstado() != EstadoUsuario.VALIDADA) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "La cuenta no está habilitada"
            );
        }

        String token = jwtProvider.generarToken(
                usuario.getEmail(),
                usuario.getRol().name()
        );

        return new LoginResponse(
                token,
                usuario.getEmail(),
                usuario.getRol()
        );
    }

    // ==========================================
    // REENVIAR CÓDIGO OTP
    // ==========================================
    @Transactional
    public String reenviarCodigo(String email) {

        if (email == null || email.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ingrese su correo electrónico"
            );
        }

        String emailLimpio = email
                .trim()
                .toLowerCase(Locale.ROOT);

        Usuario usuario = usuarioRepositorio
                .findByEmailIgnoreCase(emailLimpio)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "No existe una cuenta con ese correo"
                        )
                );

        if (usuario.getEstado() == EstadoUsuario.VALIDADA) {

            return "Esta cuenta ya está activada. Puede iniciar sesión.";
        }

        if (usuario.getEstado() == EstadoUsuario.BLOQUEADA) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "La cuenta está bloqueada"
            );
        }

        String nuevoCodigo = generarCodigoOtp();

        usuario.setCodigoVerificacion(nuevoCodigo);

        usuario.setCodigoExpiracion(
                LocalDateTime.now().plusMinutes(15)
        );

        usuarioRepositorio.saveAndFlush(usuario);

        correoServicio.enviarCodigoOTP(
                usuario.getEmail(),
                usuario.getNombre(),
                nuevoCodigo
        );

        return "Se envió un nuevo código OTP a su correo.";
    }
    // ==========================================
// CAMBIAR CONTRASEÑA DEL USUARIO AUTENTICADO
// ==========================================
@Transactional
public String cambiarPassword(
        String emailAutenticado,
        CambiarPasswordDTO dto
) {

    if (emailAutenticado == null || emailAutenticado.isBlank()) {
        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Debe iniciar sesión"
        );
    }

    Usuario usuario = usuarioRepositorio
            .findByEmailIgnoreCase(emailAutenticado)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Usuario no encontrado"
                    )
            );

    if (usuario.getEstado() != EstadoUsuario.VALIDADA) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "La cuenta no está habilitada"
        );
    }

    // Verificar contraseña actual con BCrypt.
    if (!passwordEncoder.matches(
            dto.getPasswordActual(),
            usuario.getPassword()
    )) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La contraseña actual es incorrecta"
        );
    }

    // Confirmar la contraseña nueva.
    if (!dto.getPasswordNueva().equals(
            dto.getConfirmarPassword()
    )) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Las contraseñas nuevas no coinciden"
        );
    }

    // Impedir reutilizar la contraseña actual.
    if (passwordEncoder.matches(
            dto.getPasswordNueva(),
            usuario.getPassword()
    )) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La contraseña nueva debe ser diferente de la actual"
        );
    }

    // Guardar únicamente la contraseña cifrada.
    usuario.setPassword(
            passwordEncoder.encode(dto.getPasswordNueva())
    );

    usuarioRepositorio.save(usuario);

    return "Contraseña actualizada correctamente";
}
}
