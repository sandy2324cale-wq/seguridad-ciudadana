
import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  IncidentesService,
  Incidente,
  AgenciaRespuesta,
  HistorialEstado,
  EstadoIncidente
} from '../../../core/services/incidentes';

@Component({
  selector: 'app-gestionar-incidentes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './gestionar-incidentes.html',
  styleUrl: './gestionar-incidentes.css'
})
export class GestionarIncidentes implements OnInit {

  private incidentesService = inject(IncidentesService);

  incidentes = signal<Incidente[]>([]);
  agencias = signal<AgenciaRespuesta[]>([]);
  historial = signal<HistorialEstado[]>([]);

  cargando = signal(false);
  cargandoHistorial = signal(false);
  guardandoAgencia = signal(false);
  guardandoEstado = signal(false);

  error = signal('');
  errorAgencias = signal('');
  errorHistorial = signal('');
  mensaje = signal('');
  cargandoDetalle = signal(false);
  errorDetalle = signal('');

  seleccionado = signal<Incidente | null>(null);

  busqueda = '';
  filtroEstado = 'TODOS';

  agenciaId: number | null = null;
  observacionAgencia = '';

  nuevoEstado: EstadoIncidente | '' = '';
  observacionEstado = '';

  readonly estados: EstadoIncidente[] = [
    'PENDIENTE',
    'EN_ATENCION',
    'RESUELTO',
    'FALSO_REPORTE'
  ];

  ngOnInit(): void {
    this.cargarIncidentes();
    this.cargarAgencias();
  }

  get incidentesFiltrados(): Incidente[] {

    const texto = this.busqueda.trim().toLowerCase();

    return this.incidentes().filter(incidente => {

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        incidente.estado === this.filtroEstado;

      const contenido = [
        incidente.id,
        incidente.titulo,
        incidente.nombreZona,
        incidente.nombreCategoria,
        incidente.callePrincipal
      ]
        .join(' ')
        .toLowerCase();

      return coincideEstado && contenido.includes(texto);
    });
  }

  get totalPendientes(): number {
    return this.incidentes().filter(
      incidente => incidente.estado === 'PENDIENTE'
    ).length;
  }

  get totalEnAtencion(): number {
    return this.incidentes().filter(
      incidente => incidente.estado === 'EN_ATENCION'
    ).length;
  }

  get totalResueltos(): number {
    return this.incidentes().filter(
      incidente => incidente.estado === 'RESUELTO'
    ).length;
  }

  get operacionEnCurso(): boolean {
    return this.guardandoAgencia() || this.guardandoEstado();
  }

  cargarIncidentes(): void {

    this.cargando.set(true);
    this.error.set('');

    this.incidentesService.listarIncidentes().subscribe({

      next: datos => {
        this.incidentes.set([...datos].sort((a, b) => b.id - a.id));
        this.cargando.set(false);

        const actual = this.seleccionado();

        if (actual) {
          const actualizado = datos.find(
            incidente => incidente.id === actual.id
          );

          this.seleccionado.set(actualizado || null);
        }
      },

      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          this.obtenerMensajeError(
            err,
            'No fue posible cargar los incidentes.'
          )
        );
      }
    });
  }

  cargarAgencias(): void {

    this.errorAgencias.set('');

    this.incidentesService.listarAgencias().subscribe({

      next: datos => {
        this.agencias.set(datos);
      },

      error: (err: HttpErrorResponse) => {
        this.errorAgencias.set(
          this.obtenerMensajeError(
            err,
            'No fue posible cargar las agencias.'
          )
        );
      }
    });
  }

  seleccionarIncidente(incidente: Incidente): void {

    this.seleccionado.set(incidente);

    this.agenciaId = incidente.agenciaId;
    this.observacionAgencia = '';

    this.nuevoEstado = '';
    this.observacionEstado = '';

    this.mensaje.set('');
    this.error.set('');

    this.cargarHistorial(incidente.id);
    this.cargandoDetalle.set(true);
    this.errorDetalle.set('');
    this.incidentesService.obtenerIncidente(incidente.id).subscribe({
      next: detalle => {
        if (this.seleccionado()?.id === incidente.id) {
          this.seleccionado.set(detalle);
          this.agenciaId = detalle.agenciaId;
        }
        this.cargandoDetalle.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (this.seleccionado()?.id === incidente.id) {
          this.errorDetalle.set(this.obtenerMensajeError(err, 'No se pudo actualizar el detalle.'));
        }
        this.cargandoDetalle.set(false);
      }
    });
  }

  cerrarDetalle(): void {
    if (this.operacionEnCurso) {
      return;
    }

    this.seleccionado.set(null);
    this.historial.set([]);
    this.errorDetalle.set('');
  }

  cargarHistorial(incidenteId: number): void {

    this.cargandoHistorial.set(true);
    this.errorHistorial.set('');
    this.historial.set([]);

    this.incidentesService.obtenerHistorial(incidenteId)
      .subscribe({

        next: datos => {

          // Evita mostrar el historial de otro incidente
          // si el operador cambió rápidamente de selección.
          if (this.seleccionado()?.id !== incidenteId) {
            return;
          }

          this.historial.set(
            [...datos].sort(
              (a, b) =>
                new Date(b.fechaCambio).getTime() -
                new Date(a.fechaCambio).getTime()
            )
          );

          this.cargandoHistorial.set(false);
        },

        error: (err: HttpErrorResponse) => {

          if (this.seleccionado()?.id !== incidenteId) {
            return;
          }

          this.cargandoHistorial.set(false);
          this.errorHistorial.set(
            this.obtenerMensajeError(
              err,
              'No fue posible consultar el historial.'
            )
          );
        }
      });
  }

  asignarAgencia(): void {

    const incidente = this.seleccionado();
    const observacion = this.observacionAgencia.trim();

    if (!incidente || this.operacionEnCurso) {
      return;
    }

    if (!this.agenciaId || this.agenciaId <= 0) {
      this.error.set('Selecciona una agencia válida.');
      return;
    }

    if (!observacion || observacion.length > 255) {
      this.error.set(
        'La observación es obligatoria y debe tener máximo 255 caracteres.'
      );
      return;
    }

    this.error.set('');
    this.mensaje.set('');
    this.guardandoAgencia.set(true);

    this.incidentesService.asignarAgencia(
      incidente.id,
      {
        agenciaId: this.agenciaId,
        observacion
      }
    ).subscribe({

      next: () => {
        this.guardandoAgencia.set(false);
        this.observacionAgencia = '';

        this.mensaje.set(
          'Agencia asignada correctamente.'
        );

        this.actualizarIncidente(incidente.id);
      },

      error: (err: HttpErrorResponse) => {
        this.guardandoAgencia.set(false);
        this.error.set(
          this.obtenerMensajeError(
            err,
            'No fue posible asignar la agencia.'
          )
        );
      }
    });
  }

  cambiarEstado(): void {

    const incidente = this.seleccionado();
    const observacion = this.observacionEstado.trim();

    if (!incidente || this.operacionEnCurso) {
      return;
    }

    if (!this.nuevoEstado) {
      this.error.set('Selecciona el nuevo estado.');
      return;
    }

    if (this.nuevoEstado === incidente.estado) {
      this.error.set(
        'Selecciona un estado diferente al actual.'
      );
      return;
    }

    if (!observacion || observacion.length > 255) {
      this.error.set(
        'La observación es obligatoria y debe tener máximo 255 caracteres.'
      );
      return;
    }

    this.error.set('');
    this.mensaje.set('');
    this.guardandoEstado.set(true);

    this.incidentesService.cambiarEstado(
      incidente.id,
      {
        nuevoEstado: this.nuevoEstado,
        observacion
      }
    ).subscribe({

      next: () => {

        this.guardandoEstado.set(false);
        this.nuevoEstado = '';
        this.observacionEstado = '';

        this.mensaje.set(
          'Estado actualizado correctamente.'
        );

        this.actualizarIncidente(incidente.id);
      },

      error: (err: HttpErrorResponse) => {
        this.guardandoEstado.set(false);
        this.error.set(
          this.obtenerMensajeError(
            err,
            'No fue posible actualizar el estado.'
          )
        );
      }
    });
  }

  private actualizarIncidente(id: number): void {

    this.incidentesService.obtenerIncidente(id)
      .subscribe({

        next: actualizado => {

          this.incidentes.update(lista =>
            lista.map(incidente =>
              incidente.id === id
                ? actualizado
                : incidente
            )
          );

          if (this.seleccionado()?.id === id) {
            this.seleccionado.set(actualizado);
            this.agenciaId = actualizado.agenciaId;
            this.cargarHistorial(id);
          }
        },

        error: () => {
          // La operación ya se guardó en el backend.
          // Recargamos la lista para recuperar los datos.
          this.cargarIncidentes();

          if (this.seleccionado()?.id === id) {
            this.cargarHistorial(id);
          }
        }
      });
  }

  nombreAgencia(id: number | null): string {

    if (!id) {
      return 'Sin agencia asignada';
    }

    const agencia = this.agencias().find(
      item => item.id === id
    );

    return agencia
      ? `${agencia.nombre} (${agencia.siglas})`
      : `Agencia #${id}`;
  }

  etiquetaEstado(estado: string | null): string {

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
        return estado || 'Sin estado anterior';
    }
  }

  private obtenerMensajeError(
    err: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {

    if (err.status === 401) {
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    }

    if (err.status === 403) {
      return 'No tienes permisos para realizar esta operación.';
    }

    if (err.status === 0) {
      return 'No se pudo conectar con Spring Boot.';
    }

    if (
      err.error &&
      typeof err.error === 'object' &&
      typeof err.error.message === 'string'
    ) {
      return err.error.message;
    }

    return mensajePredeterminado;
  }
}
