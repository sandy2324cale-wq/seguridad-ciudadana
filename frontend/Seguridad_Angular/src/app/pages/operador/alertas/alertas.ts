
import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth';

import {
  AlertasService,
  Alerta,
  AlertaDTO,
  NivelAlerta
} from '../../../core/services/alertas';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css'
})
export class Alertas implements OnInit {

  private alertasService = inject(AlertasService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  // ========================================
  // PERMISOS SEGÚN EL ROL
  // ========================================

  rol = this.auth.obtenerRol();

  get esOperador(): boolean {
    return this.rol === 'OPERADOR';
  }

  get etiquetaPagina(): string {
    switch (this.rol) {
      case 'CLIENTE':
        return 'PORTAL CIUDADANO';

      case 'OPERADOR':
        return 'CENTRO DE OPERACIONES';

      case 'ADMIN':
        return 'PANEL DE ADMINISTRACIÓN';

      case 'SUPER_ADMIN':
        return 'ADMINISTRACIÓN GENERAL';

      default:
        return 'SEGURIDAD CIUDADANA';
    }
  }

  get descripcionPagina(): string {
    if (this.esOperador) {
      return 'Consulta y publica comunicados de seguridad ciudadana.';
    }

    return 'Consulta las alertas y recomendaciones de seguridad publicadas.';
  }

  // ========================================
  // ESTADO DE LA PÁGINA
  // ========================================

  alertas = signal<Alerta[]>([]);

  cargando = signal(true);
  guardando = signal(false);

  error = signal('');
  errorFormulario = signal('');
  exito = signal('');

  buscador = signal('');
  filtroNivel = signal('TODOS');

  mostrarFormulario = signal(false);

  // ========================================
  // FORMULARIO
  // ========================================

  formulario = this.fb.nonNullable.group({
    titulo: ['', [
      Validators.required,
      Validators.maxLength(150)
    ]],

    mensaje: ['', [
      Validators.required
    ]],

    nivel: ['MEDIO' as NivelAlerta, [
      Validators.required
    ]]
  });

  // ========================================
  // FILTROS
  // ========================================

  alertasFiltradas = computed(() => {

    const texto = this.normalizar(this.buscador());
    const nivel = this.filtroNivel();

    return this.alertas().filter(alerta => {

      const coincideTexto =
        this.normalizar(alerta.titulo).includes(texto) ||
        this.normalizar(alerta.mensaje).includes(texto);

      const coincideNivel =
        nivel === 'TODOS' ||
        alerta.nivel === nivel;

      return coincideTexto && coincideNivel;
    });
  });

  // ========================================
  // ESTADÍSTICAS
  // ========================================

  totalAlertas = computed(() =>
    this.alertas().length
  );

  totalAltas = computed(() =>
    this.alertas().filter(a =>
      a.nivel === 'ALTO' ||
      a.nivel === 'URGENTE'
    ).length
  );

  totalMedias = computed(() =>
    this.alertas().filter(a =>
      a.nivel === 'MEDIO' ||
      a.nivel === 'ADVERTENCIA'
    ).length
  );

  totalBajas = computed(() =>
    this.alertas().filter(a =>
      a.nivel === 'BAJO' ||
      a.nivel === 'INFORMATIVA'
    ).length
  );

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  ngOnInit(): void {
    this.cargarAlertas();
  }

  // ========================================
  // CONSULTAR ALERTAS
  // TODOS LOS ROLES AUTORIZADOS
  // ========================================

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
          return;
        }

        if (err.status === 403) {
          this.error.set(
            'No tienes permisos para consultar las alertas.'
          );
          return;
        }

        if (err.status === 0) {
          this.error.set(
            'No se pudo conectar con Spring Boot.'
          );
          return;
        }

        this.error.set(
          'No fue posible cargar las alertas.'
        );
      }
    });
  }

  // ========================================
  // BÚSQUEDA Y FILTROS
  // ========================================

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

  // ========================================
  // ABRIR FORMULARIO
  // SOLO OPERADOR
  // ========================================

  abrirFormulario(): void {

    if (!this.esOperador) {
      return;
    }

    this.errorFormulario.set('');
    this.exito.set('');
    this.mostrarFormulario.set(true);
  }

  // ========================================
  // CERRAR FORMULARIO
  // ========================================

  cerrarFormulario(): void {

    if (this.guardando()) {
      return;
    }

    this.mostrarFormulario.set(false);
    this.errorFormulario.set('');

    this.formulario.reset({
      titulo: '',
      mensaje: '',
      nivel: 'MEDIO'
    });
  }

  // ========================================
  // CREAR ALERTA
  // SOLO OPERADOR
  // ========================================

  crearAlerta(): void {

    // Protección adicional en Angular.
    // La protección real debe existir en Spring Security.

    if (!this.esOperador) {
      this.errorFormulario.set(
        'Solo los operadores pueden publicar alertas.'
      );
      return;
    }

    this.errorFormulario.set('');
    this.exito.set('');

    this.formulario.markAllAsTouched();

    if (this.formulario.invalid || this.guardando()) {
      return;
    }

    const valores = this.formulario.getRawValue();

    const datos: AlertaDTO = {
      titulo: valores.titulo.trim(),
      mensaje: valores.mensaje.trim(),
      nivel: valores.nivel
    };

    if (!datos.titulo || !datos.mensaje) {
      this.errorFormulario.set(
        'Completa el título y el mensaje de la alerta.'
      );
      return;
    }

    this.guardando.set(true);

    this.alertasService.crearAlerta(datos).subscribe({

      next: () => {

        this.guardando.set(false);
        this.cerrarFormulario();

        this.exito.set(
          'La alerta se publicó correctamente.'
        );

        this.cargarAlertas();
      },

      error: (err: HttpErrorResponse) => {

        this.guardando.set(false);

        if (err.status === 401) {
          this.errorFormulario.set(
            'Tu sesión ha expirado.'
          );
          return;
        }

        if (err.status === 403) {
          this.errorFormulario.set(
            'No tienes permisos para publicar alertas.'
          );
          return;
        }

        if (err.status === 0) {
          this.errorFormulario.set(
            'No se pudo conectar con Spring Boot.'
          );
          return;
        }

        const mensaje =
          typeof err.error === 'string'
            ? err.error
            : typeof err.error?.error === 'string'
              ? err.error.error
              : typeof err.error?.message === 'string'
                ? err.error.message
                : '';

        this.errorFormulario.set(
          mensaje || 'No fue posible publicar la alerta.'
        );
      }
    });
  }

  // ========================================
  // ESTILOS SEGÚN PRIORIDAD
  // ========================================

  claseNivel(nivel: string): string {

    switch (nivel) {

      case 'ALTO':
      case 'URGENTE':
        return 'nivel-alto';

      case 'MEDIO':
      case 'ADVERTENCIA':
        return 'nivel-medio';

      default:
        return 'nivel-bajo';
    }
  }

  // ========================================
  // FECHAS
  // ========================================

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

  // ========================================
  // AUTOR DE LA ALERTA
  // ========================================

  nombreEmisor(alerta: Alerta): string {

    if (!alerta.emisor) {
      return 'Personal autorizado';
    }

    const nombre = [
      alerta.emisor.nombre,
      alerta.emisor.apellido
    ].filter(Boolean).join(' ');

    return nombre ||
      alerta.emisor.email ||
      'Personal autorizado';
  }
}
