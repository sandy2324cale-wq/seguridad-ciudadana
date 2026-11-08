
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
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  mostrarPassword = signal(false);
  error = signal('');

  formulario = this.fb.nonNullable.group({
    email: ['', [
      Validators.required,
      Validators.email
    ]],
    password: ['', Validators.required]
  });

  get email() {
    return this.formulario.controls.email;
  }

  get password() {
    return this.formulario.controls.password;
  }

  alternarPassword(): void {
    this.mostrarPassword.update(valor => !valor);
  }

  iniciarSesion(): void {
    this.formulario.markAllAsTouched();
    this.error.set('');

    if (this.formulario.invalid || this.cargando()) {
      return;
    }

    this.cargando.set(true);

    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: respuesta => {
        this.auth.guardarSesion(respuesta);
        this.cargando.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);

        if (err.status === 0) {
          this.error.set(
            'No se pudo conectar con el servidor. Comprueba que Spring Boot esté funcionando.'
          );
        } else if (err.status === 401 || err.status === 403) {
          this.error.set(
            'Correo o contraseña incorrectos, o cuenta sin acceso.'
          );
        } else {
          this.error.set(
            'No se pudo iniciar sesión. Revisa tus datos e inténtalo nuevamente.'
          );
        }
      }
    });
  }
}
