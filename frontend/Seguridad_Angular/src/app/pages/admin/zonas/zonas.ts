
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
import { ZonasService, Zona } from '../../../core/services/zonas';

@Component({
  selector: 'app-zonas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './zonas.html',
  styleUrl: './zonas.css'
})
export class Zonas implements OnInit {

  // ==========================================
  // 1. SERVICIOS Y PERMISOS
  // ==========================================

  private zonasService = inject(ZonasService);
  private auth = inject(AuthService);

  readonly rolActual = this.auth.obtenerRol();

  get puedeCrear(): boolean {
    return this.rolActual === 'SUPER_ADMIN';
  }

  // ==========================================
  // 2. DATOS Y ESTADOS
  // ==========================================

  zonas = signal<Zona[]>([]);

  cargando = signal(false);
  guardando = signal(false);

  error = signal('');
  mensaje = signal('');

  // ==========================================
  // 3. FORMULARIO
  // ==========================================

  nombreZona = '';
  codigoPostal = '';

  // ==========================================
  // 4. BÚSQUEDA Y ESTADÍSTICAS
  // ==========================================

  busqueda = signal('');

  zonasFiltradas = computed(() => {
    const texto = this.normalizar(this.busqueda());

    return this.zonas().filter(zona =>
      this.normalizar(
        `${zona.nombreZona} ${zona.codigoPostal}`
      ).includes(texto)
    );
  });

  totalZonas = computed(() => this.zonas().length);

  // ==========================================
  // 5. CARGAR ZONAS
  // ==========================================

  ngOnInit(): void {
    this.cargarZonas();
  }

  cargarZonas(): void {
    this.cargando.set(true);
    this.error.set('');

    this.zonasService.listarZonas().subscribe({
      next: datos => {
        this.zonas.set(
          Array.isArray(datos)
            ? [...datos].sort((a, b) =>
                a.nombreZona.localeCompare(b.nombreZona)
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
  // 6. REGISTRAR ZONA
  // Solo SUPER_ADMIN.
  // ==========================================

  guardarZona(): void {

    if (!this.puedeCrear || this.guardando()) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    const nombreZona = this.nombreZona.trim();
    const codigoPostal = this.codigoPostal.trim();

    // Validaciones de Zona.java.
    if (!nombreZona) {
      this.error.set('El nombre de la zona es obligatorio.');
      return;
    }

    if (nombreZona.length > 80) {
      this.error.set(
        'El nombre no puede superar los 80 caracteres.'
      );
      return;
    }

    if (!codigoPostal) {
      this.error.set('El código postal es obligatorio.');
      return;
    }

    if (codigoPostal.length > 10) {
      this.error.set(
        'El código postal no puede superar los 10 caracteres.'
      );
      return;
    }

    this.guardando.set(true);

    this.zonasService.crearZona({
      nombreZona,
      codigoPostal
    }).subscribe({

      next: () => {
        this.guardando.set(false);

        // Limpiamos el formulario.
        this.nombreZona = '';
        this.codigoPostal = '';

        // Mostramos el resultado y recargamos.
        this.mensaje.set('Zona registrada correctamente.');
        this.cargarZonas();
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

  private mensajeError(err: HttpErrorResponse): string {
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
