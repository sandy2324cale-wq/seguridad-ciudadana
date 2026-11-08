
package com.seguridad.reportes.seguridad;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.Console;

public class GenerarHashTemporal {

    public static void main(String[] args) {

        Console consola = System.console();

        if (consola == null) {
            System.err.println(
                "Ejecuta esta clase desde una terminal interactiva."
            );
            return;
        }

        char[] password = consola.readPassword(
            "Nueva contraseña para SUPER_ADMIN: "
        );

        if (password == null || password.length < 12) {
            System.err.println(
                "La contraseña debe tener al menos 12 caracteres."
            );
            return;
        }

        try {
            BCryptPasswordEncoder encoder =
                new BCryptPasswordEncoder();

            String hash = encoder.encode(
                new String(password)
            );

            System.out.println("HASH BCRYPT:");
            System.out.println(hash);

        } finally {
            java.util.Arrays.fill(password, '\0');
        }
    }
}
