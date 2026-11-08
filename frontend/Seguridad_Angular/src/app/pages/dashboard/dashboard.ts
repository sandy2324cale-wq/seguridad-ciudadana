import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth';
import { IncidentesService, Incidente } from '../../core/services/incidentes';
import { AlertasService, Alerta } from '../../core/services/alertas';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  // El sidebar y el cierre de sesión ahora pertenecen a App.
  private readonly auth = inject(AuthService);
  private readonly incidentesService = inject(IncidentesService);
  private readonly alertasService = inject(AlertasService);

  readonly email = this.auth.obtenerEmail() || 'Usuario';
  readonly rol = this.auth.obtenerRol();
  readonly incidentes = signal<Incidente[]>([]);
  readonly cargandoIncidentes = signal(false);
  readonly errorIncidentes = signal('');
  readonly alertas = signal<Alerta[]>([]);
  readonly cargandoAlertas = signal(false);
  readonly errorAlertas = signal('');

  ngOnInit(): void { this.actualizarDashboard(); }

  get tituloRol(): string {
    switch (this.rol) {
      case 'CLIENTE': return 'Portal ciudadano';
      case 'OPERADOR': return 'Centro de operaciones';
      case 'ADMIN': return 'Panel de administración';
      case 'SUPER_ADMIN': return 'Administración general';
      default: return 'Panel principal';
    }
  }

  get descripcionRol(): string {
    switch (this.rol) {
      case 'CLIENTE': return 'Reporta incidentes, consulta su seguimiento y mantente informado sobre las alertas de seguridad.';
      case 'OPERADOR': return 'Supervisa incidentes, asigna agencias de respuesta y actualiza los estados de atención.';
      case 'ADMIN': return 'Gestiona usuarios, categorías, bloqueos y apelaciones según tus permisos.';
      case 'SUPER_ADMIN': return 'Supervisa usuarios, roles, catálogos y la administración general del sistema.';
      default: return 'Bienvenido al Sistema de Seguridad Ciudadana.';
    }
  }

  get totalReportes(): number { return this.incidentes().length; }
  get totalPendientes(): number { return this.incidentes().filter(i => i.estado === 'PENDIENTE').length; }
  get totalEnAtencion(): number { return this.incidentes().filter(i => i.estado === 'EN_ATENCION').length; }
  get totalResueltos(): number { return this.incidentes().filter(i => i.estado === 'RESUELTO').length; }
  get totalFalsosReportes(): number { return this.incidentes().filter(i => i.estado === 'FALSO_REPORTE').length; }
  get totalAlertas(): number { return this.alertas().length; }

  cargarMisReportes(): void {
    if (this.rol !== 'CLIENTE') return;
    this.cargandoIncidentes.set(true);
    this.errorIncidentes.set('');
    this.incidentesService.obtenerMisReportes().subscribe({
      next: datos => { this.incidentes.set(Array.isArray(datos) ? datos : []); this.cargandoIncidentes.set(false); },
      error: (err: HttpErrorResponse) => { this.cargandoIncidentes.set(false); this.errorIncidentes.set(this.obtenerMensajeError(err, 'No fue posible cargar tus reportes.')); }
    });
  }

  cargarIncidentesOperador(): void {
    if (this.rol !== 'OPERADOR') return;
    this.cargandoIncidentes.set(true);
    this.errorIncidentes.set('');
    this.incidentesService.listarIncidentes().subscribe({
      next: datos => { this.incidentes.set(Array.isArray(datos) ? datos : []); this.cargandoIncidentes.set(false); },
      error: (err: HttpErrorResponse) => { this.cargandoIncidentes.set(false); this.errorIncidentes.set(this.obtenerMensajeError(err, 'No fue posible cargar los incidentes.')); }
    });
  }

  cargarAlertas(): void {
    if (this.rol !== 'CLIENTE' && this.rol !== 'OPERADOR') return;
    this.cargandoAlertas.set(true);
    this.errorAlertas.set('');
    this.alertasService.listarAlertas().subscribe({
      next: datos => { this.alertas.set(Array.isArray(datos) ? datos : []); this.cargandoAlertas.set(false); },
      error: (err: HttpErrorResponse) => { this.cargandoAlertas.set(false); this.errorAlertas.set(this.obtenerMensajeError(err, 'No fue posible consultar las alertas.')); }
    });
  }

  actualizarDashboard(): void {
    if (this.rol === 'CLIENTE') { this.cargarMisReportes(); this.cargarAlertas(); }
    if (this.rol === 'OPERADOR') { this.cargarIncidentesOperador(); this.cargarAlertas(); }
  }

  private obtenerMensajeError(err: HttpErrorResponse, predeterminado: string): string {
    if (err.status === 0) return 'No se pudo conectar con Spring Boot.';
    if (err.status === 401) return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    if (err.status === 403) return 'No tienes permisos para consultar esta información.';
    return predeterminado;
  }
}
