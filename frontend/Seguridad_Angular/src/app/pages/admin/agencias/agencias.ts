
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth';

import {
  AgenciasService,
  Agencia
} from '../../../core/services/agencias';

@Component({
  selector: 'app-agencias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './agencias.html',
  styleUrl: './agencias.css'
})
export class Agencias implements OnInit {

  // ==========================================
  // 1. SERVICIOS Y PERMISOS
  // ==========================================

  private agenciasService = inject(AgenciasService);
  private auth = inject(AuthService);

  readonly rolActual = this.auth.obtenerRol();

  get puedeCrear(): boolean {
    return this.rolActual === 'SUPER_ADMIN';
  }

  // ==========================================
  // 2. DATOS Y ESTADOS DE CARGA
  // ==========================================

  agencias = signal<Agencia[]>([]);

  cargando = signal(false);
  guardando = signal(false);

  error = signal('');
  mensaje = signal('');

  // ==========================================
  // 3. FORMULARIO
  // ==========================================

  nombre = '';
  siglas = '';
  telefonoEmergencia = '';

  // ==========================================
  // 4. BÚSQUEDA Y ESTADÍSTICAS
  // ==========================================

  busqueda = signal('');

  agenciasFiltradas = computed(() => {
    const texto = this.normalizar(this.busqueda());

    return this.agencias().filter(agencia =>
      this.normalizar(
        [
          agencia.nombre,
          agencia.siglas,
          agencia.telefonoEmergencia
        ].join(' ')
      ).includes(texto)
    );
  });

  totalAgencias = computed(() =>
    this.agencias().length
  );

  // ==========================================
  // 5. CARGAR AGENCIAS
  // ==========================================

  ngOnInit(): void {
    this.cargarAgencias();
  }

  cargarAgencias(): void {

    this.cargando.set(true);
    this.error.set('');

    this.agenciasService.listarAgencias().subscribe({

      next: datos => {
        this.agencias.set(
          Array.isArray(datos)
            ? [...datos].sort((a, b) =>
                a.nombre.localeCompare(b.nombre)
              )
            : []
        );

        this.cargando.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  // ==========================================
  // 6. REGISTRAR AGENCIA
  // Solo SUPER_ADMIN.
  // ==========================================

  guardarAgencia(): void {

    if (!this.puedeCrear || this.guardando()) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    const nombre = this.nombre.trim();
    const siglas = this.siglas.trim();
    const telefonoEmergencia =
      this.telefonoEmergencia.trim();

    // Validaciones de AgenciaRespuesta.java.

    if (!nombre) {
      this.error.set(
        'El nombre de la agencia es obligatorio.'
      );
      return;
    }

    if (nombre.length > 100) {
      this.error.set(
        'El nombre no puede superar los 100 caracteres.'
      );
      return;
    }

    if (!siglas) {
      this.error.set('Las siglas son obligatorias.');
      return;
    }

    if (siglas.length > 20) {
      this.error.set(
        'Las siglas no pueden superar los 20 caracteres.'
      );
      return;
    }

    if (!telefonoEmergencia) {
      this.error.set(
        'El teléfono de emergencia es obligatorio.'
      );
      return;
    }

    if (telefonoEmergencia.length > 15) {
      this.error.set(
        'El teléfono no puede superar los 15 caracteres.'
      );
      return;
    }

    this.guardando.set(true);

    this.agenciasService.crearAgencia({
      nombre,
      siglas,
      telefonoEmergencia
    }).subscribe({

      next: () => {
        this.guardando.set(false);

        // Limpiamos los campos.
        this.nombre = '';
        this.siglas = '';
        this.telefonoEmergencia = '';

        this.mensaje.set(
          'Agencia registrada correctamente.'
        );

        // Recargamos la lista desde el backend.
        this.cargarAgencias();
      },

      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  // ==========================================
  // 7. BÚSQUEDA
  // ==========================================

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  // ==========================================
  // 8. FUNCIONES AUXILIARES
  // ==========================================

  private normalizar(valor: string): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private mensajeError(
    err: HttpErrorResponse
  ): string {

    if (err.status === 0) {
      return 'No se pudo conectar con Spring Boot.';
    }

    if (err.status === 401) {
      return 'Tu sesión ha expirado.';
    }

    if (err.status === 403) {
      return 'No tienes permisos para realizar esta operación.';
    }

    if (typeof err.error?.message === 'string') {
      return err.error.message;
    }

    if (typeof err.error?.mensaje === 'string') {
      return err.error.mensaje;
    }

    return 'No fue posible completar la operación.';
  }
}
