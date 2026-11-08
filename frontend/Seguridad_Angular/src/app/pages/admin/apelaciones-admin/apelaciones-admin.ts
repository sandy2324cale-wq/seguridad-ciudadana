
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
  SoporteService,
  SolicitudSoporte,
  EstadoSolicitud,
  DecisionApelacion
} from '../../../core/services/soporte';

@Component({
  selector: 'app-apelaciones-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './apelaciones-admin.html',
  styleUrl: './apelaciones-admin.css'
})
export class ApelacionesAdmin implements OnInit {

  // ==========================================
  // 1. SERVICIO
  // ==========================================

  private soporteService = inject(SoporteService);

  // ==========================================
  // 2. ESTADOS DE LA PANTALLA
  // ==========================================

  solicitudes = signal<SolicitudSoporte[]>([]);
  seleccionado = signal<SolicitudSoporte | null>(null);

  cargando = signal(false);
  guardando = signal(false);

  error = signal('');
  mensaje = signal('');

  busqueda = signal('');
  filtroEstado = signal('TODOS');

  // ==========================================
  // 3. ESTADÍSTICAS
  // ==========================================

  totalSolicitudes = computed(() =>
    this.solicitudes().length
  );

  totalPendientes = computed(() =>
    this.solicitudes().filter(
      solicitud => solicitud.estadoSolicitud === 'PENDIENTE'
    ).length
  );

  totalAprobadas = computed(() =>
    this.solicitudes().filter(
      solicitud => solicitud.estadoSolicitud === 'APROBADA'
    ).length
  );

  totalRechazadas = computed(() =>
    this.solicitudes().filter(
      solicitud => solicitud.estadoSolicitud === 'RECHAZADA'
    ).length
  );

  // ==========================================
  // 4. FILTROS
  // ==========================================

  solicitudesFiltradas = computed(() => {

    const texto = this.normalizar(this.busqueda());
    const estado = this.filtroEstado();

    return this.solicitudes().filter(solicitud => {

      const coincideEstado =
        estado === 'TODOS' ||
        solicitud.estadoSolicitud === estado;

      const coincideTexto = this.normalizar(
        [
          solicitud.id,
          solicitud.email,
          solicitud.cedula,
          solicitud.motivoApelacion,
          solicitud.estadoSolicitud
        ].join(' ')
      ).includes(texto);

      return coincideEstado && coincideTexto;
    });
  });

  // ==========================================
  // 5. CARGA INICIAL
  // ==========================================

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {

    this.cargando.set(true);
    this.error.set('');

    this.soporteService.listarSolicitudes().subscribe({

      next: datos => {
        this.solicitudes.set(
          Array.isArray(datos) ? datos : []
        );

        // Mantener actualizado el panel lateral.
        const actual = this.seleccionado();

        if (actual) {
          const actualizado = datos.find(
            solicitud => solicitud.id === actual.id
          );

          this.seleccionado.set(actualizado || null);
        }

        this.cargando.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  // ==========================================
  // 6. SELECCIÓN
  // ==========================================

  seleccionarSolicitud(
    solicitud: SolicitudSoporte
  ): void {

    if (this.guardando()) {
      return;
    }

    this.seleccionado.set(solicitud);
    this.error.set('');
    this.mensaje.set('');
  }

  cerrarDetalle(): void {
    if (!this.guardando()) {
      this.seleccionado.set(null);
    }
  }

  // ==========================================
  // 7. CONFIRMAR DECISIÓN
  // ==========================================

  solicitarDecision(
    decision: DecisionApelacion
  ): void {

    const solicitud = this.seleccionado();

    if (
      !solicitud ||
      solicitud.estadoSolicitud !== 'PENDIENTE' ||
      this.guardando()
    ) {
      return;
    }

    const accion = decision === 'APROBADA'
      ? 'aprobar'
      : 'rechazar';

    const mensajeConfirmacion =
      `¿Confirmas que deseas ${accion} la apelación #${solicitud.id}?`;

    // Confirmación mediante panel propio,
    // sin utilizar ventanas nativas del navegador.
    this.decisionPendiente.set(decision);
    this.confirmacion.set(mensajeConfirmacion);
  }

  decisionPendiente = signal<DecisionApelacion | null>(null);
  confirmacion = signal('');

  cancelarDecision(): void {
    if (this.guardando()) {
      return;
    }

    this.decisionPendiente.set(null);
    this.confirmacion.set('');
  }

  // ==========================================
  // 8. ENVIAR DECISIÓN AL BACKEND
  // ==========================================

  confirmarDecision(): void {

    const solicitud = this.seleccionado();
    const decision = this.decisionPendiente();

    if (
      !solicitud ||
      !decision ||
      solicitud.estadoSolicitud !== 'PENDIENTE' ||
      this.guardando()
    ) {
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.soporteService.decidirSolicitud(
      solicitud.id,
      { decision }
    ).subscribe({

      next: actualizada => {

        this.solicitudes.update(lista =>
          lista.map(item =>
            item.id === actualizada.id
              ? actualizada
              : item
          )
        );

        this.seleccionado.set(actualizada);

        this.guardando.set(false);
        this.cancelarDecision();

        this.mensaje.set(
          decision === 'APROBADA'
            ? 'Apelación aprobada. La cuenta fue validada.'
            : 'Apelación rechazada correctamente.'
        );
      },

      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.cancelarDecision();
        this.error.set(this.mensajeError(err));

        // Refrescar si el servidor informa
        // que otra persona ya decidió.
        if (err.status === 409) {
          this.cargarSolicitudes();
        }
      }
    });
  }

  // ==========================================
  // 9. CONTROLES DE BÚSQUEDA
  // ==========================================

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('TODOS');
  }

  // ==========================================
  // 10. PRESENTACIÓN
  // ==========================================

  nombreEstado(estado: EstadoSolicitud): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'APROBADA': return 'Aprobada';
      case 'RECHAZADA': return 'Rechazada';
    }
  }

  claseEstado(estado: EstadoSolicitud): string {
    switch (estado) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'APROBADA': return 'estado-aprobada';
      case 'RECHAZADA': return 'estado-rechazada';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return fecha;
    }

    return fechaObjeto.toLocaleString('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  // ==========================================
  // 11. UTILIDADES
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
      return 'No se pudo conectar con el servidor.';
    }

    if (err.status === 401) {
      return 'Tu sesión ha expirado.';
    }

    if (err.status === 403) {
      return 'No tienes permiso para resolver esta apelación.';
    }

    if (err.status === 409) {
      return 'La solicitud ya fue resuelta o su estado cambió.';
    }

    if (typeof err.error?.message === 'string') {
      return err.error.message;
    }

    if (typeof err.error?.detail === 'string') {
      return err.error.detail;
    }

    return 'No se pudo completar la operación.';
  }
}
