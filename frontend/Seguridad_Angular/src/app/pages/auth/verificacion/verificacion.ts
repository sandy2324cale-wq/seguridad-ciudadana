
import {
  Component,
  ElementRef,
  ViewChildren,
  QueryList,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-verificacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verificacion.html',
  styleUrl: './verificacion.css'
})
export class Verificacion {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChildren('casilla')
  casillas!: QueryList<ElementRef<HTMLInputElement>>;

  cargando = signal(false);
  reenviando = signal(false);
  mostrarExito = signal(false);
  mensaje = signal('');
  error = signal('');

  digitos = ['', '', '', '', '', ''];

  formulario = this.fb.nonNullable.group({
    email: [
      this.route.snapshot.queryParamMap.get('email') || '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]
    ]
  });

  get email() {
    return this.formulario.controls.email;
  }

  get codigoCompleto(): string {
    return this.digitos.join('');
  }

  enfocar(indice: number): void {
    this.casillas.get(indice)?.nativeElement.focus();
  }

  alEscribir(evento: Event, indice: number): void {
    const input = evento.target as HTMLInputElement;
    const valor = input.value.replace(/\D/g, '');

    if (valor.length > 1) {
      this.repartirCodigo(valor, indice);
      return;
    }

    this.digitos[indice] = valor;
    input.value = valor;
    this.error.set('');

    if (valor && indice < 5) {
      this.enfocar(indice + 1);
    }
  }

  alPresionarTecla(
    evento: KeyboardEvent,
    indice: number
  ): void {
    if (evento.key === 'Backspace') {
      if (this.digitos[indice]) {
        this.digitos[indice] = '';
        (evento.target as HTMLInputElement).value = '';
      } else if (indice > 0) {
        this.digitos[indice - 1] = '';
        this.enfocar(indice - 1);
      }

      evento.preventDefault();
      return;
    }

    if (evento.key === 'ArrowLeft' && indice > 0) {
      evento.preventDefault();
      this.enfocar(indice - 1);
    }

    if (evento.key === 'ArrowRight' && indice < 5) {
      evento.preventDefault();
      this.enfocar(indice + 1);
    }
  }

  alPegar(evento: ClipboardEvent, indice: number): void {
    evento.preventDefault();

    const texto = evento.clipboardData
      ?.getData('text')
      .replace(/\D/g, '') || '';

    this.repartirCodigo(texto, indice);
  }

  repartirCodigo(texto: string, inicio: number): void {
    const numeros = texto.replace(/\D/g, '').slice(0, 6 - inicio);

    for (let i = 0; i < numeros.length; i++) {
      this.digitos[inicio + i] = numeros[i];
    }

    const ultimo = Math.min(inicio + numeros.length, 5);
    this.enfocar(ultimo);
    this.error.set('');
  }

  verificar(): void {
    this.email.markAsTouched();
    this.error.set('');
    this.mensaje.set('');

    if (this.email.invalid) {
      this.error.set('Ingresa un correo electrónico válido.');
      return;
    }

    if (this.codigoCompleto.length !== 6) {
      this.error.set('Completa los 6 dígitos del código.');
      return;
    }

    if (this.cargando()) {
      return;
    }

    this.cargando.set(true);

    this.auth.verificarCodigo({
      email: this.email.value,
      codigo: this.codigoCompleto
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.mostrarExito.set(true);
        this.mensaje.set(
          '¡Tu cuenta fue verificada correctamente! Ya puedes iniciar sesión.'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);

        const mensajeBackend =
          typeof err.error === 'string'
            ? err.error
            : typeof err.error?.error === 'string'
              ? err.error.error
              : typeof err.error?.message === 'string'
                ? err.error.message
                : '';

        this.error.set(
          err.status === 0
            ? 'No se pudo conectar con Spring Boot.'
            : mensajeBackend ||
              'El código es incorrecto o ha caducado.'
        );
      }
    });
  }

  reenviar(): void {
    this.email.markAsTouched();
    this.error.set('');
    this.mensaje.set('');

    if (
      this.email.invalid ||
      this.reenviando() ||
      this.cargando()
    ) {
      return;
    }

    this.reenviando.set(true);

    this.auth.reenviarCodigo(this.email.value).subscribe({
      next: () => {
        this.reenviando.set(false);
        this.digitos = ['', '', '', '', '', ''];
        this.mensaje.set(
          'Se solicitó un nuevo código. Revisa tu correo electrónico.'
        );
        this.enfocar(0);
      },
      error: (err: HttpErrorResponse) => {
        this.reenviando.set(false);
        this.error.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor.'
            : 'No fue posible reenviar el código.'
        );
      }
    });
  }

  irAlLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
