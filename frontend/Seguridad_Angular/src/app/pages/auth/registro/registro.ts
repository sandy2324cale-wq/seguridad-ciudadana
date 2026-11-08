
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  mostrarPassword = signal(false);
  error = signal('');

  formulario = this.fb.nonNullable.group({
    cedula: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]{10}$/)
    ]],

    nombre: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ]],

    apellido: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ]],

    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(100)
    ]],

    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(100)
    ]]
  });

  get campos() {
    return this.formulario.controls;
  }

  alternarPassword(): void {
    this.mostrarPassword.update(valor => !valor);
  }

  registrar(): void {

    this.formulario.markAllAsTouched();
    this.error.set('');

    if (this.formulario.invalid || this.cargando()) {
      return;
    }

    this.cargando.set(true);

    const datos = this.formulario.getRawValue();

    this.auth.registro(datos).subscribe({

      next: (respuesta: string) => {
        this.cargando.set(false);

        console.log('Registro aceptado:', respuesta);

        this.router.navigate(['/verificacion'], {
          queryParams: {
            email: datos.email
          }
        });
      },

      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);

        console.error(
          'Error del registro:',
          err.status,
          err.error
        );

        if (err.status === 0) {
          this.error.set(
            'No se pudo conectar con Spring Boot. Verifica que el servidor esté encendido.'
          );
          return;
        }

        // Spring Boot puede enviar errores como JSON
        // o como texto.
        const mensajeBackend =
          typeof err.error === 'string'
            ? err.error
            : typeof err.error?.error === 'string'
              ? err.error.error
              : typeof err.error?.message === 'string'
                ? err.error.message
                : '';

        const mensajeNormalizado =
          mensajeBackend.toLowerCase();

        if (
          mensajeNormalizado.includes(
            'correo ingresado ya se encuentra registrado'
          )
        ) {
          this.error.set(
            'Este correo electrónico ya está registrado. Puedes iniciar sesión o utilizar otro correo.'
          );
          return;
        }

        if (
          mensajeNormalizado.includes('cédula') &&
          mensajeNormalizado.includes('registrad')
        ) {
          this.error.set(
            'Esta cédula ya está registrada. Verifica tus datos.'
          );
          return;
        }

        if (err.status === 400 || err.status === 409) {
          this.error.set(
            mensajeBackend ||
            'No se pudo completar el registro. Revisa los datos ingresados.'
          );
          return;
        }

        this.error.set(
          'Ocurrió un error al registrar la cuenta. Inténtalo nuevamente.'
        );
      }
    });
  }
}
