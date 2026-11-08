
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
import { forkJoin } from 'rxjs';

import {
  CategoriasService,
  CategoriaIncidente,
  AgenciaCategoria
} from '../../../core/services/categorias';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})
export class Categorias implements OnInit {

  // ==========================================
  // 1. SERVICIO
  // ==========================================

  private categoriasService = inject(CategoriasService);

  // ==========================================
  // 2. DATOS Y ESTADOS DE CARGA
  // ==========================================

  categorias = signal<CategoriaIncidente[]>([]);
  agencias = signal<AgenciaCategoria[]>([]);

  cargando = signal(false);
  guardando = signal(false);

  error = signal('');
  mensaje = signal('');

  // ==========================================
  // 3. BÚSQUEDA Y FILTROS
  // ==========================================

  busqueda = signal('');
  filtroPrioridad = signal('TODAS');

  // ==========================================
  // 4. FORMULARIO DE REGISTRO
  // ==========================================

  nombre = '';
  nivelPrioridad = '';
  agenciaId: number | null = null;

  // ==========================================
  // 5. VALORES OBTENIDOS DEL BACKEND
  // ==========================================

  // Se obtienen las prioridades que aparecen
  // en las categorías existentes.
  // Cuando tengamos NivelPrioridad.java,
  // usaremos el enum completo.

  prioridades = computed(() => {
    return [
      ...new Set(
        this.categorias()
          .map(categoria => categoria.nivelPrioridad)
          .filter(Boolean)
      )
    ].sort();
  });

  // ==========================================
  // 6. LISTA FILTRADA
  // ==========================================

  categoriasFiltradas = computed(() => {

    const texto = this.normalizar(this.busqueda());
    const prioridad = this.filtroPrioridad();

    return this.categorias().filter(categoria => {

      const contenido = this.normalizar(
        [
          categoria.nombre,
          categoria.nivelPrioridad,
          categoria.agenciaEncargada?.nombre || '',
          categoria.agenciaEncargada?.siglas || ''
        ].join(' ')
      );

      return (
        contenido.includes(texto) &&
        (
          prioridad === 'TODAS' ||
          categoria.nivelPrioridad === prioridad
        )
      );
    });
  });

  totalCategorias = computed(() =>
    this.categorias().length
  );

  totalAgencias = computed(() =>
    this.agencias().length
  );

  // ==========================================
  // 7. CARGA INICIAL
  // ==========================================

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {

    this.cargando.set(true);
    this.error.set('');

    // Cargamos categorías y agencias
    // en una misma operación.

    forkJoin({
      categorias: this.categoriasService.listarCategorias(),
      agencias: this.categoriasService.listarAgencias()
    }).subscribe({

      next: datos => {

        this.categorias.set(
          Array.isArray(datos.categorias)
            ? datos.categorias
            : []
        );

        this.agencias.set(
          Array.isArray(datos.agencias)
            ? datos.agencias
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
  // 8. REGISTRAR NUEVA CATEGORÍA
  // ==========================================

  guardarCategoria(): void {

    if (this.guardando()) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    const nombre = this.nombre.trim();
    const prioridad = this.nivelPrioridad;
    const agenciaId = Number(this.agenciaId);

    // Validación del nombre.
    if (!nombre) {
      this.error.set(
        'El nombre de la categoría es obligatorio.'
      );
      return;
    }

    if (nombre.length > 80) {
      this.error.set(
        'El nombre no puede superar los 80 caracteres.'
      );
      return;
    }

    // Validación de prioridad.
    if (!prioridad) {
      this.error.set(
        'Selecciona un nivel de prioridad.'
      );
      return;
    }

    if (!this.prioridades().includes(prioridad)) {
      this.error.set(
        'La prioridad seleccionada no es válida.'
      );
      return;
    }

    // Validación de agencia.
    if (!Number.isInteger(agenciaId) || agenciaId <= 0) {
      this.error.set(
        'Selecciona una agencia responsable.'
      );
      return;
    }

    if (!this.agencias().some(a => a.id === agenciaId)) {
      this.error.set(
        'La agencia seleccionada no existe en la lista.'
      );
      return;
    }

    this.guardando.set(true);

    // POST /api/v1/categorias
    this.categoriasService.crearCategoria({
      nombre,
      nivelPrioridad: prioridad,
      agenciaId
    }).subscribe({

      next: () => {

        this.guardando.set(false);

        // Limpiamos el formulario.
        this.nombre = '';
        this.nivelPrioridad = '';
        this.agenciaId = null;

        this.mensaje.set(
          'Categoría registrada correctamente.'
        );

        // Volvemos a consultar los datos reales.
        this.cargarDatos();
      },

      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  // ==========================================
  // 9. CONTROLES DE FILTROS
  // ==========================================

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  cambiarFiltroPrioridad(valor: string): void {
    this.filtroPrioridad.set(valor);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroPrioridad.set('TODAS');
  }

  // ==========================================
  // 10. FUNCIONES AUXILIARES
  // ==========================================

  nombreAgencia(
    categoria: CategoriaIncidente
  ): string {
    return categoria.agenciaEncargada?.nombre ||
      'Sin agencia asignada';
  }

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
      return 'No tienes permisos para esta operación.';
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
