
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

type Metodo = 'actual' | 'correo';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cambiar-password.html',
  styleUrl: './cambiar-password.css'
})
export class CambiarPassword {

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly API =
    'private readonly API_URL = `${API_BASE_URL}//auth';

  readonly metodo = signal<Metodo>('actual');
  readonly cargando = signal(false);
  readonly codigoEnviado = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly completado = signal(false);

  readonly formularioActual = this.fb.nonNullable.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(72)
    ]],
    confirmarPassword: ['', Validators.required]
  });

  readonly formularioCorreo = this.fb.nonNullable.group({
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

  get email(): string {
    return this.auth.obtenerEmail() ?? '';
  }

  seleccionarMetodo(valor: Metodo): void {
    if (this.cargando() || this.completado()) {
      return;
    }

    this.metodo.set(valor);
    this.error.set('');
    this.mensaje.set('');
  }

  private encabezados(): HttpHeaders | null {
    const token = this.auth.obtenerToken();

    if (!token || !this.auth.estaAutenticado()) {
      this.error.set(
        'Tu sesión expiró. Inicia sesión nuevamente.'
      );
      return null;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  cambiarConPasswordActual(): void {
    this.formularioActual.markAllAsTouched();
    this.error.set('');
    this.mensaje.set('');

    if (this.formularioActual.invalid || this.cargando()) {
      return;
    }

    const datos = this.formularioActual.getRawValue();

    if (datos.passwordNueva !== datos.confirmarPassword) {
      this.error.set('Las contraseñas nuevas no coinciden.');
      return;
    }

    if (datos.passwordActual === datos.passwordNueva) {
      this.error.set(
        'La contraseña nueva debe ser diferente de la actual.'
      );
      return;
    }

    const headers = this.encabezados();
    if (!headers) return;

    this.cargando.set(true);

    this.http.patch(
      `${this.API}/cambiar-password`,
      datos,
      { headers, responseType: 'text' }
    ).subscribe({
      next: () => this.finalizarCambio(),
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.obtenerMensajeError(err));
      }
    });
  }

  solicitarCodigo(): void {
    this.error.set('');
    this.mensaje.set('');

    if (this.cargando()) return;

    const headers = this.encabezados();
    if (!headers) return;

    this.cargando.set(true);

    this.http.post(
      `${this.API}/perfil/password/solicitar`,
      {},
      { headers, responseType: 'text' }
    ).subscribe({
      next: () => {
        this.cargando.set(false);
        this.codigoEnviado.set(true);
        this.mensaje.set(
          'Solicitud procesada. Revisa el correo asociado a tu cuenta.'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.obtenerMensajeError(err));
      }
    });
  }

  cambiarConCodigo(): void {
    this.formularioCorreo.markAllAsTouched();
    this.error.set('');
    this.mensaje.set('');

    if (
      !this.codigoEnviado() ||
      this.formularioCorreo.invalid ||
      this.cargando()
    ) {
      return;
    }

    const datos = this.formularioCorreo.getRawValue();

    if (datos.passwordNueva !== datos.confirmarPassword) {
      this.error.set('Las contraseñas nuevas no coinciden.');
      return;
    }

    const headers = this.encabezados();
    if (!headers) return;

    this.cargando.set(true);

    this.http.post(
      `${this.API}/perfil/password/restablecer`,
      {
        email: this.email,
        codigo: datos.codigo,
        passwordNueva: datos.passwordNueva,
        confirmarPassword: datos.confirmarPassword
      },
      { headers, responseType: 'text' }
    ).subscribe({
      next: () => this.finalizarCambio(),
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.obtenerMensajeError(err));
      }
    });
  }

  private finalizarCambio(): void {
    this.cargando.set(false);
    this.completado.set(true);
    this.error.set('');
    this.mensaje.set(
      'Contraseña actualizada correctamente. Por seguridad, inicia sesión nuevamente.'
    );

    this.formularioActual.reset();
    this.formularioCorreo.reset();

    this.auth.cerrarSesion();
  }

  irAlLogin(): void {
    void this.router.navigateByUrl('/login');
  }

  private obtenerMensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con Spring Boot.';
    }

    if (err.status === 401 || err.status === 403) {
      return 'La sesión no es válida o no tienes permiso para realizar esta operación.';
    }

    if (err.status === 429) {
      return 'Demasiadas solicitudes. Espera antes de volver a intentarlo.';
    }

    if (
      typeof err.error === 'string' &&
      err.error.trim() &&
      err.status >= 400 &&
      err.status < 500
    ) {
      return err.error;
    }

    return 'No se pudo cambiar la contraseña. Revisa los datos e inténtalo nuevamente.';
  }
}
