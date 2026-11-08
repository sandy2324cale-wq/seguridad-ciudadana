
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../../core/config/api.config';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css'
})
export class RecuperarPassword {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

private readonly api =
  `${API_BASE_URL}/auth/recuperacion`;

  readonly cargando = signal(false);
  readonly codigoSolicitado = signal(false);
  readonly completado = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly formularioCorreo = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly formularioRestablecer = this.fb.nonNullable.group({
    codigo: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]{6}$/)
    ]],
    passwordNueva: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(72)
    ]],
    confirmarPassword: ['', Validators.required]
  });

  solicitarCodigo(): void {
    this.formularioCorreo.markAllAsTouched();
    this.error.set('');
    this.mensaje.set('');

    if (this.formularioCorreo.invalid || this.cargando()) {
      return;
    }

    this.cargando.set(true);

    this.http.post(
      `${this.api}/solicitar`,
      { email: this.formularioCorreo.controls.email.value },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.cargando.set(false);
        this.codigoSolicitado.set(true);
        this.mensaje.set(
          'Si el correo está registrado y habilitado, recibirás un código de verificación.'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  restablecer(): void {
    this.formularioRestablecer.markAllAsTouched();
    this.error.set('');
    this.mensaje.set('');

    if (this.formularioRestablecer.invalid || this.cargando()) {
      return;
    }

    const datos = this.formularioRestablecer.getRawValue();

    if (datos.passwordNueva !== datos.confirmarPassword) {
      this.error.set('Las contraseñas nuevas no coinciden.');
      return;
    }

    this.cargando.set(true);

    this.http.post(
      `${this.api}/restablecer`,
      {
        email: this.formularioCorreo.controls.email.value,
        ...datos
      },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.cargando.set(false);
        this.completado.set(true);
        this.mensaje.set(
          'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
        );
        this.formularioRestablecer.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con Spring Boot.';
    }

    if (err.status === 429) {
      return 'Demasiadas solicitudes. Espera antes de intentar nuevamente.';
    }

    if (err.status === 400 || err.status === 409) {
      return typeof err.error === 'string' && err.error.trim()
        ? err.error
        : 'Los datos o el código no son válidos.';
    }

    return 'No se pudo completar la operación. Inténtalo nuevamente.';
  }
}
