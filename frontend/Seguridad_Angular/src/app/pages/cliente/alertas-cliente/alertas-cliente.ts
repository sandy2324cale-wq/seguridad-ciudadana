
import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  AlertasService,
  Alerta
} from '../../../core/services/alertas';

@Component({
  selector: 'app-alertas-cliente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './alertas-cliente.html',
  styleUrl: './alertas-cliente.css'
})
export class AlertasCliente implements OnInit {

  private alertasService = inject(AlertasService);

  alertas = signal<Alerta[]>([]);
  cargando = signal(true);
  error = signal('');

  buscador = signal('');
  filtroNivel = signal('TODOS');

  totalAlertas = computed(() => this.alertas().length);

  totalAltas = computed(() =>
    this.alertas().filter(alerta =>
      alerta.nivel === 'ALTO' ||
      alerta.nivel === 'URGENTE'
    ).length
  );

  alertasFiltradas = computed(() => {
    const texto = this.normalizar(this.buscador());
    const nivel = this.filtroNivel();

    return this.alertas().filter(alerta => {

      const coincideTexto =
        this.normalizar(alerta.titulo).includes(texto) ||
        this.normalizar(alerta.mensaje).includes(texto);

      const coincideNivel =
        nivel === 'TODOS' ||
        this.nivelNormalizado(alerta.nivel) === nivel;

      return coincideTexto && coincideNivel;
    });
  });

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.cargando.set(true);
    this.error.set('');

    this.alertasService.listarAlertas().subscribe({
      next: (datos) => {
        this.alertas.set(
          [...datos].sort((a, b) =>
            new Date(b.fechaPublicacion).getTime() -
            new Date(a.fechaPublicacion).getTime()
          )
        );

        this.cargando.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);

        if (err.status === 401) {
          this.error.set(
            'Tu sesión ha expirado. Inicia sesión nuevamente.'
          );
        } else if (err.status === 403) {
          this.error.set(
            'No tienes permisos para consultar las alertas.'
          );
        } else if (err.status === 0) {
          this.error.set(
            'No se pudo conectar con el servidor.'
          );
        } else {
          this.error.set(
            'No fue posible cargar las alertas de seguridad.'
          );
        }
      }
    });
  }

  cambiarBusqueda(texto: string): void {
    this.buscador.set(texto);
  }

  cambiarFiltro(nivel: string): void {
    this.filtroNivel.set(nivel);
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  nivelNormalizado(nivel: string): string {
    switch (nivel) {
      case 'ALTO':
      case 'URGENTE':
        return 'ALTO';

      case 'MEDIO':
      case 'ADVERTENCIA':
        return 'MEDIO';

      default:
        return 'BAJO';
    }
  }

  nombreNivel(nivel: string): string {
    switch (this.nivelNormalizado(nivel)) {
      case 'ALTO':
        return 'Prioridad alta';

      case 'MEDIO':
        return 'Precaución';

      default:
        return 'Información';
    }
  }

  claseNivel(nivel: string): string {
    switch (this.nivelNormalizado(nivel)) {
      case 'ALTO':
        return 'nivel-alto';

      case 'MEDIO':
        return 'nivel-medio';

      default:
        return 'nivel-bajo';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return 'Fecha no disponible';
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

  nombreEmisor(alerta: Alerta): string {
    if (!alerta.emisor) {
      return 'Personal de seguridad';
    }

    const nombre = [
      alerta.emisor.nombre,
      alerta.emisor.apellido
    ].filter(Boolean).join(' ');

    return nombre ||
      alerta.emisor.email ||
      'Personal de seguridad';
  }
}
