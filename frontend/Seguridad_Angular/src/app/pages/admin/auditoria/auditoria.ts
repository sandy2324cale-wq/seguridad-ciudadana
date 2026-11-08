
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  AuditoriaService,
  RegistroAuditoria
} from '../../../core/services/auditoria';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css'
})
export class Auditoria implements OnInit {

  // ==========================================
  // 1. SERVICIO Y ESTADOS
  // ==========================================

  private auditoriaService = inject(AuditoriaService);

  registros = signal<RegistroAuditoria[]>([]);
  seleccionado = signal<RegistroAuditoria | null>(null);

  cargando = signal(false);
  error = signal('');
  busqueda = signal('');

  // ==========================================
  // 2. ESTADÍSTICAS
  // ==========================================

  totalRegistros = computed(() =>
    this.registros().length
  );

  totalResponsables = computed(() =>
    new Set(
      this.registros().map(registro => registro.responsable)
    ).size
  );

  totalAcciones = computed(() =>
    new Set(
      this.registros().map(registro => registro.accion)
    ).size
  );

  // ==========================================
  // 3. BÚSQUEDA
  // ==========================================

  registrosFiltrados = computed(() => {

    const texto = this.normalizar(this.busqueda());

    return this.registros().filter(registro =>
      this.normalizar(
        [
          registro.id,
          registro.responsable,
          registro.accion,
          registro.detalle,
          registro.fecha
        ].join(' ')
      ).includes(texto)
    );
  });

  // ==========================================
  // 4. CARGAR AUDITORÍA
  // ==========================================

  ngOnInit(): void {
    this.cargarAuditoria();
  }

  cargarAuditoria(): void {

    this.cargando.set(true);
    this.error.set('');

    this.auditoriaService.listar().subscribe({

      next: datos => {
        const registros = Array.isArray(datos)
          ? [...datos]
          : [];

        // Mostrar primero los registros más recientes.
        registros.sort((a, b) =>
          (b.fecha || '').localeCompare(a.fecha || '')
        );

        this.registros.set(registros);
        this.cargando.set(false);

        const actual = this.seleccionado();

        if (actual) {
          this.seleccionado.set(
            registros.find(item => item.id === actual.id) || null
          );
        }
      },

      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  // ==========================================
  // 5. DETALLE DEL REGISTRO
  // ==========================================

  seleccionarRegistro(registro: RegistroAuditoria): void {
    this.seleccionado.set(registro);
  }

  cerrarDetalle(): void {
    this.seleccionado.set(null);
  }

  // ==========================================
  // 6. FILTROS
  // ==========================================

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  // ==========================================
  // 7. PRESENTACIÓN
  // ==========================================

  nombreAccion(accion: string): string {
    return accion.replace(/_/g, ' ');
  }

  formatearFecha(fecha: string): string {

    if (!fecha) {
      return 'Sin fecha';
    }

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return fecha;
    }

    return valor.toLocaleString('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  // ==========================================
  // 8. UTILIDADES
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
      return 'Solo SUPER_ADMIN puede consultar la auditoría.';
    }

    if (typeof err.error?.message === 'string') {
      return err.error.message;
    }

    return 'No fue posible cargar los registros.';
  }
}
