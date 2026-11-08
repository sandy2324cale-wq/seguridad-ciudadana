
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
import { forkJoin } from 'rxjs';

import {
  IncidentesService,
  Incidente,
  EstadoIncidente,
  HistorialEstado,
  AgenciaRespuesta
} from '../../../core/services/incidentes';

@Component({
  selector: 'app-mis-reportes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-reportes.html',
  styleUrl: './mis-reportes.css'
})
export class MisReportes implements OnInit {

  private incidentesService = inject(IncidentesService);

  reportes = signal<Incidente[]>([]);
  agencias = signal<AgenciaRespuesta[]>([]);

  cargando = signal(true);
  error = signal('');

  busqueda = signal('');
  filtroEstado = signal('TODOS');

  reporteSeleccionado = signal<Incidente | null>(null);
  historial = signal<HistorialEstado[]>([]);

  cargandoDetalle = signal(false);
  cargandoHistorial = signal(false);

  errorDetalle = signal('');
  errorHistorial = signal('');

  private solicitudDetalle = 0;

  reportesFiltrados = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const estado = this.filtroEstado();

    return this.reportes().filter(reporte => {
      const contenido = this.normalizar(
        [
          reporte.id,
          reporte.titulo,
          reporte.descripcion,
          reporte.nombreZona,
          reporte.nombreCategoria,
          reporte.callePrincipal,
          reporte.calleSecundaria || ''
        ].join(' ')
      );

      return (
        contenido.includes(texto) &&
        (estado === 'TODOS' || reporte.estado === estado)
      );
    });
  });

  totalReportes = computed(() => this.reportes().length);

  pendientes = computed(() =>
    this.reportes().filter(
      reporte => reporte.estado === 'PENDIENTE'
    ).length
  );

  enAtencion = computed(() =>
    this.reportes().filter(
      reporte => reporte.estado === 'EN_ATENCION'
    ).length
  );

  resueltos = computed(() =>
    this.reportes().filter(
      reporte => reporte.estado === 'RESUELTO'
    ).length
  );

  falsosReportes = computed(() =>
    this.reportes().filter(
      reporte => reporte.estado === 'FALSO_REPORTE'
    ).length
  );

  ngOnInit(): void {
    this.cargarReportes();
    this.cargarAgencias();
  }

  cargarReportes(): void {
    this.cargando.set(true);
    this.error.set('');

    this.incidentesService.obtenerMisReportes().subscribe({
      next: (datos) => {
        this.reportes.set(
          Array.isArray(datos)
            ? [...datos].sort((a, b) =>
                new Date(b.fechaReporte).getTime() -
                new Date(a.fechaReporte).getTime()
              )
            : []
        );

        this.cargando.set(false);

        const seleccionado = this.reporteSeleccionado();

        if (seleccionado) {
          const actualizado = this.reportes().find(
            reporte => reporte.id === seleccionado.id
          );

          if (actualizado) {
            this.reporteSeleccionado.set(actualizado);
          } else {
            this.cerrarDetalle();
          }
        }
      },

      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  private cargarAgencias(): void {
    this.incidentesService.listarAgencias().subscribe({
      next: (datos) => {
        this.agencias.set(Array.isArray(datos) ? datos : []);
      },
      error: () => {
        // El seguimiento puede mostrarse aunque no
        // sea posible consultar el catálogo de agencias.
        this.agencias.set([]);
      }
    });
  }

  abrirSeguimiento(reporte: Incidente): void {
    this.solicitudDetalle++;

    this.reporteSeleccionado.set(reporte);
    this.historial.set([]);

    this.errorDetalle.set('');
    this.errorHistorial.set('');

    this.actualizarSeguimiento();

    setTimeout(() => {
      document.getElementById('seguimiento-reporte')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    }, 0);
  }

  actualizarSeguimiento(): void {
    const reporte = this.reporteSeleccionado();

    if (!reporte) {
      return;
    }

    const solicitudActual = ++this.solicitudDetalle;
    const incidenteId = reporte.id;

    this.cargandoDetalle.set(true);
    this.cargandoHistorial.set(true);

    this.errorDetalle.set('');
    this.errorHistorial.set('');

    forkJoin({
      incidente: this.incidentesService.obtenerIncidente(incidenteId),
      historial: this.incidentesService.obtenerHistorial(incidenteId)
    }).subscribe({
      next: ({ incidente, historial }) => {
        if (solicitudActual !== this.solicitudDetalle) {
          return;
        }

        this.reporteSeleccionado.set(incidente);

        this.historial.set(
          [...historial].sort((a, b) =>
            new Date(b.fechaCambio).getTime() -
            new Date(a.fechaCambio).getTime()
          )
        );

        this.reportes.update(reportes =>
          reportes.map(item =>
            item.id === incidente.id ? incidente : item
          )
        );

        this.cargandoDetalle.set(false);
        this.cargandoHistorial.set(false);
      },

      error: (err: HttpErrorResponse) => {
        if (solicitudActual !== this.solicitudDetalle) {
          return;
        }

        this.cargandoDetalle.set(false);
        this.cargandoHistorial.set(false);

        this.errorDetalle.set(
          'No fue posible actualizar el seguimiento.'
        );

        this.errorHistorial.set(this.mensajeError(err));
      }
    });
  }

  cerrarDetalle(): void {
    this.solicitudDetalle++;
    this.reporteSeleccionado.set(null);
    this.historial.set([]);

    this.cargandoDetalle.set(false);
    this.cargandoHistorial.set(false);

    this.errorDetalle.set('');
    this.errorHistorial.set('');
  }

  nombreAgencia(agenciaId: number | null): string {
    if (!agenciaId) {
      return 'Todavía no se ha asignado una agencia';
    }

    const agencia = this.agencias().find(
      item => item.id === agenciaId
    );

    return agencia
      ? `${agencia.nombre} (${agencia.siglas})`
      : `Agencia asignada #${agenciaId}`;
  }

  cambiarBusqueda(texto: string): void {
    this.busqueda.set(texto);
  }

  cambiarEstado(estado: string): void {
    this.filtroEstado.set(estado);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('TODOS');
  }

  private normalizar(texto: string): string {
    return (texto || '')
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
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    }

    if (err.status === 403) {
      return 'No tienes permisos para consultar esta información.';
    }

    if (err.status === 404) {
      return 'No se encontró el reporte solicitado.';
    }

    return 'No fue posible consultar la información.';
  }

  nombreEstado(estado: EstadoIncidente | null): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';

      case 'EN_ATENCION':
        return 'En atención';

      case 'RESUELTO':
        return 'Resuelto';

      case 'FALSO_REPORTE':
        return 'Falso reporte';

      default:
        return 'Sin estado anterior';
    }
  }

  claseEstado(estado: EstadoIncidente | null): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-pendiente';

      case 'EN_ATENCION':
        return 'estado-atencion';

      case 'RESUELTO':
        return 'estado-resuelto';

      case 'FALSO_REPORTE':
        return 'estado-falso';

      default:
        return '';
    }
  }
}
