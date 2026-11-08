package com.seguridad.reportes.servicios;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class CorreoServicio {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Envía el código OTP de 6 dígitos para la verificación de cuenta.
     */
    public void enviarCodigoOTP(String destinatario, String nombre, String codigoOTP) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatario);
        mensaje.setSubject("Código de Verificación - Seguridad Ciudadana");
        mensaje.setText(
            "Hola " + nombre + ",\n\n" +
            "Tu código de activación de 6 dígitos es: " + codigoOTP + "\n\n" +
            "Este código expirará en 15 minutos."
        );

        mailSender.send(mensaje);
    }

    /**
     * Envía una notificación cuando la cuenta de un usuario es bloqueada.
     */
    public void enviarNotificacionBloqueo(String destinatario, String nombre, String motivo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatario);
        mensaje.setSubject("Aviso de Bloqueo de Cuenta - Seguridad Ciudadana");
        mensaje.setText(
            "Hola " + nombre + ",\n\n" +
            "Te informamos que tu cuenta ha sido BLOQUEADA por la siguiente razón:\n" +
            "\"" + motivo + "\"\n\n" +
            "Si consideras que se trata de un error, puedes enviar una apelación a través del panel de Soporte en nuestra plataforma."
        );

        mailSender.send(mensaje);
    }
    public void enviarNotificacionResolucionApelacion(String destinatario, String nombre, String nuevoEstado, String motivo) {
    SimpleMailMessage mensaje = new SimpleMailMessage();
    mensaje.setTo(destinatario);
    mensaje.setSubject("Actualización de Estado de Cuenta - Sistema de Reportes");
    
    String texto = String.format(
        "Hola %s,\n\n" +
        "Te informamos que tu solicitud de apelación ha sido procesada exitosamente.\n\n" +
        "Estado de la cuenta: %s\n" +
        "Detalle / Motivo: %s\n\n" +
        "Ya puedes iniciar sesión normalmente en la plataforma con tus credenciales habituales.",
        nombre, nuevoEstado, motivo
    );
    
    mensaje.setText(texto);
    mailSender.send(mensaje);
}
/**
 * Envía un código de 6 dígitos para recuperar
 * o cambiar la contraseña.
 */
public void enviarCodigoRecuperacion(
        String destinatario,
        String nombre,
        String codigo
) {
    SimpleMailMessage mensaje = new SimpleMailMessage();

    mensaje.setTo(destinatario);
    mensaje.setSubject(
            "Recuperación de contraseña - Seguridad Ciudadana"
    );

    mensaje.setText(
            "Hola " + nombre + ",\n\n" +
            "Recibimos una solicitud para cambiar tu contraseña.\n\n" +
            "Tu código de verificación es: " + codigo + "\n\n" +
            "El código caduca en 10 minutos y solo puede " +
            "utilizarse una vez.\n\n" +
            "Si no solicitaste este cambio, ignora este mensaje.\n\n" +
            "Sistema de Seguridad Ciudadana"
    );

    mailSender.send(mensaje);
}

}