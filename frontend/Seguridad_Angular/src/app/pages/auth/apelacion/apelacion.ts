
import { Component, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../../../core/config/api.config';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface ApelacionDTO {
  email: string;
  cedula: string;
  motivoApelacion: string;
}

interface SolicitudSoporte {
  id: number;
  email: string;
  cedula: string;
  motivoApelacion: string;
  estadoSolicitud: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaSolicitud: string;
}

@Component({
  selector: 'app-apelacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './apelacion.html',
  styleUrl: './apelacion.css'
})
export class Apelacion {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  private readonly URL_APELACIONES =
  `${API_BASE_URL}/soporte/apelar`;

  cargando = signal(false);
  enviada = signal(false);
  error = signal('');
  numeroSolicitud = signal<number | null>(null);

  formulario = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]
    ],
    cedula: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]
    ],
    motivoApelacion: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]
    ]
  });

  get email() {
    return this.formulario.controls.email;
  }

  get cedula() {
    return this.formulario.controls.cedula;
  }

  get motivo() {
    return this.formulario.controls.motivoApelacion;
  }

  enviar(): void {
    this.error.set('');
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid || this.cargando()) {
      return;
    }

    const datos: ApelacionDTO = {
      email: this.email.value.trim().toLowerCase(),
      cedula: this.cedula.value.trim(),
      motivoApelacion: this.motivo.value.trim()
    };

    if (
      datos.motivoApelacion.length < 10 ||
      datos.motivoApelacion.length > 2000
    ) {
      this.error.set(
        'El motivo debe tener entre 10 y 2000 caracteres.'
      );
      return;
    }

    this.cargando.set(true);

    this.http.post<SolicitudSoporte>(
      this.URL_APELACIONES,
      datos
    ).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.numeroSolicitud.set(respuesta.id);
        this.enviada.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);

        if (err.status === 0) {
          this.error.set(
            'No se pudo conectar con Spring Boot. Comprueba que esté encendido.'
          );
          return;
        }

        if (err.status === 401 || err.status === 403) {
          this.error.set(
            'El servidor no permite enviar apelaciones sin iniciar sesión. Hay que revisar los permisos de esta ruta en Spring Security.'
          );
          return;
        }

        const mensajeBackend =
          typeof err.error === 'string'
            ? err.error
            : typeof err.error?.error === 'string'
              ? err.error.error
              : typeof err.error?.message === 'string'
                ? err.error.message
                : '';

        const mensaje = mensajeBackend.toLowerCase();

        if (
          err.status === 409 &&
          mensaje.includes('pendiente')
        ) {
          this.error.set(
            'Ya existe una apelación pendiente para esta cuenta.'
          );
          return;
        }

        if (mensaje.includes('no está bloqueada')) {
          this.error.set(
            'Esta cuenta no está bloqueada, por lo que no necesita una apelación.'
          );
          return;
        }

        if (
          mensaje.includes('datos proporcionados')
        ) {
          this.error.set(
            'No se pudo procesar la solicitud. Revisa los datos ingresados.'
          );
          return;
        }

        this.error.set(
          mensajeBackend ||
          'No se pudo enviar la apelación. Inténtalo nuevamente.'
        );
      }
    });
  }
}
