
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../../core/config/api.config';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  Router,
  RouterLink
} from '@angular/router';

import { forkJoin } from 'rxjs';

interface Zona {
  id: number;
  nombreZona: string;
  codigoPostal: string;
}

interface Categoria {
  id: number;
  nombre: string;
  nivelPrioridad: string;
}

interface IncidenteDTO {
  titulo: string;
  descripcion: string;
  callePrincipal: string;
  calleSecundaria: string;
  zonaId: number;
  categoriaId: number;
}

@Component({
  selector: 'app-reportar-incidente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './reportar-incidente.html',
  styleUrl: './reportar-incidente.css'
})
export class ReportarIncidente implements OnInit {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private elemento = inject(ElementRef<HTMLElement>);

  private readonly API = API_BASE_URL;

  // CATÁLOGOS

  zonas = signal<Zona[]>([]);
  categorias = signal<Categoria[]>([]);

  cargandoDatos = signal(true);
  cargando = signal(false);

  error = signal('');
  errorCatalogos = signal('');
  enviado = signal(false);

  // BUSCADORES

  buscarZona = signal('');
  buscarCategoria = signal('');

  zonaAbierta = signal(false);
  categoriaAbierta = signal(false);

  indiceZona = signal(-1);
  indiceCategoria = signal(-1);

  // FORMULARIO

  formulario = this.fb.nonNullable.group({

    titulo: ['', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100)
    ]],

    descripcion: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(500)
    ]],

    callePrincipal: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100)
    ]],

    calleSecundaria: ['', [
      Validators.maxLength(100)
    ]],

    zonaId: [0, [
      Validators.required,
      Validators.min(1)
    ]],

    categoriaId: [0, [
      Validators.required,
      Validators.min(1)
    ]]

  });

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  // CARGAR ZONAS Y CATEGORÍAS

  cargarCatalogos(): void {

    this.cargandoDatos.set(true);
    this.errorCatalogos.set('');

    forkJoin({

      zonas: this.http.get<Zona[]>(
        `${this.API}/zonas`
      ),

      categorias: this.http.get<Categoria[]>(
        `${this.API}/categorias`
      )

    }).subscribe({

      next: ({ zonas, categorias }) => {

        this.zonas.set(zonas);
        this.categorias.set(categorias);

        this.cargandoDatos.set(false);
      },

      error: (err: HttpErrorResponse) => {

        this.cargandoDatos.set(false);

        if (err.status === 401) {
          this.errorCatalogos.set(
            'Tu sesión ha expirado. Inicia sesión nuevamente.'
          );
          return;
        }

        if (err.status === 0) {
          this.errorCatalogos.set(
            'No se pudo conectar con Spring Boot.'
          );
          return;
        }

        this.errorCatalogos.set(
          'No se pudieron cargar las zonas y categorías.'
        );
      }

    });
  }

  // NORMALIZAR TEXTO PARA BÚSQUEDAS

  private normalizar(texto: string): string {

    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // ZONAS FILTRADAS

  get zonasFiltradas(): Zona[] {

    const texto = this.normalizar(
      this.buscarZona()
    );

    return this.zonas().filter(zona =>
      this.normalizar(zona.nombreZona).includes(texto)
    );
  }

  // CATEGORÍAS FILTRADAS

  get categoriasFiltradas(): Categoria[] {

    const texto = this.normalizar(
      this.buscarCategoria()
    );

    return this.categorias().filter(categoria =>
      this.normalizar(categoria.nombre).includes(texto)
    );
  }

  // ELEMENTOS SELECCIONADOS

  get zonaSeleccionada(): string {

    const id = this.formulario.controls.zonaId.value;

    return this.zonas().find(
      zona => zona.id === id
    )?.nombreZona || '';
  }

  get categoriaSeleccionada(): string {

    const id = this.formulario.controls.categoriaId.value;

    return this.categorias().find(
      categoria => categoria.id === id
    )?.nombre || '';
  }

  // ABRIR BUSCADORES

  abrirZona(): void {

    if (this.cargandoDatos()) return;

    this.categoriaAbierta.set(false);

    this.buscarZona.set('');
    this.indiceZona.set(-1);
    this.zonaAbierta.set(true);
  }

  abrirCategoria(): void {

    if (this.cargandoDatos()) return;

    this.zonaAbierta.set(false);

    this.buscarCategoria.set('');
    this.indiceCategoria.set(-1);
    this.categoriaAbierta.set(true);
  }

  // BUSCAR ZONA

  cambiarBusquedaZona(texto: string): void {

    this.buscarZona.set(texto);

    this.formulario.controls.zonaId.setValue(0);

    this.indiceZona.set(-1);
    this.zonaAbierta.set(true);
  }

  // BUSCAR CATEGORÍA

  cambiarBusquedaCategoria(texto: string): void {

    this.buscarCategoria.set(texto);

    this.formulario.controls.categoriaId.setValue(0);

    this.indiceCategoria.set(-1);
    this.categoriaAbierta.set(true);
  }

  // SELECCIONAR ZONA

  elegirZona(zona: Zona): void {

    this.formulario.controls.zonaId.setValue(zona.id);
    this.formulario.controls.zonaId.markAsTouched();

    this.buscarZona.set(zona.nombreZona);

    this.zonaAbierta.set(false);
    this.indiceZona.set(-1);
  }

  // SELECCIONAR CATEGORÍA

  elegirCategoria(categoria: Categoria): void {

    this.formulario.controls.categoriaId.setValue(categoria.id);
    this.formulario.controls.categoriaId.markAsTouched();

    this.buscarCategoria.set(categoria.nombre);

    this.categoriaAbierta.set(false);
    this.indiceCategoria.set(-1);
  }

  // CERRAR BUSCADORES

  cerrarSelectores(): void {

    this.zonaAbierta.set(false);
    this.categoriaAbierta.set(false);

    this.indiceZona.set(-1);
    this.indiceCategoria.set(-1);
  }

  // CERRAR AL HACER CLIC FUERA

  @HostListener('document:click', ['$event'])
  alHacerClickFuera(evento: MouseEvent): void {

    const objetivo = evento.target;

    if (!(objetivo instanceof Element)) {
      return;
    }

    if (!this.elemento.nativeElement.contains(objetivo)) {
      this.cerrarSelectores();
      return;
    }

    if (!objetivo.closest('.selector-contenedor')) {
      this.cerrarSelectores();
    }
  }

  // NAVEGACIÓN CON TECLADO: ZONAS

  tecladoZona(evento: KeyboardEvent): void {

    const opciones = this.zonasFiltradas;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      this.cerrarSelectores();
      return;
    }

    if (!this.zonaAbierta()) {

      if (
        evento.key === 'ArrowDown' ||
        evento.key === 'ArrowUp'
      ) {
        evento.preventDefault();
        this.abrirZona();

        if (opciones.length > 0) {
          this.indiceZona.set(
            evento.key === 'ArrowUp'
              ? opciones.length - 1
              : 0
          );
        }
      }

      return;
    }

    if (evento.key === 'ArrowDown') {

      evento.preventDefault();

      if (opciones.length > 0) {

        this.indiceZona.set(
          Math.min(
            this.indiceZona() + 1,
            opciones.length - 1
          )
        );
      }
    }

    if (evento.key === 'ArrowUp') {

      evento.preventDefault();

      if (opciones.length > 0) {

        this.indiceZona.set(
          this.indiceZona() <= 0
            ? 0
            : this.indiceZona() - 1
        );
      }
    }

    if (evento.key === 'Enter') {

      evento.preventDefault();

      const indice = this.indiceZona();

      if (indice >= 0 && opciones[indice]) {
        this.elegirZona(opciones[indice]);
      }
    }
  }

  // NAVEGACIÓN CON TECLADO: CATEGORÍAS

  tecladoCategoria(evento: KeyboardEvent): void {

    const opciones = this.categoriasFiltradas;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      this.cerrarSelectores();
      return;
    }

    if (!this.categoriaAbierta()) {

      if (
        evento.key === 'ArrowDown' ||
        evento.key === 'ArrowUp'
      ) {
        evento.preventDefault();
        this.abrirCategoria();

        if (opciones.length > 0) {
          this.indiceCategoria.set(
            evento.key === 'ArrowUp'
              ? opciones.length - 1
              : 0
          );
        }
      }

      return;
    }

    if (evento.key === 'ArrowDown') {

      evento.preventDefault();

      if (opciones.length > 0) {

        this.indiceCategoria.set(
          Math.min(
            this.indiceCategoria() + 1,
            opciones.length - 1
          )
        );
      }
    }

    if (evento.key === 'ArrowUp') {

      evento.preventDefault();

      if (opciones.length > 0) {

        this.indiceCategoria.set(
          this.indiceCategoria() <= 0
            ? 0
            : this.indiceCategoria() - 1
        );
      }
    }

    if (evento.key === 'Enter') {

      evento.preventDefault();

      const indice = this.indiceCategoria();

      if (indice >= 0 && opciones[indice]) {
        this.elegirCategoria(opciones[indice]);
      }
    }
  }

  // ENVIAR INCIDENTE AL BACKEND

  enviar(): void {

    this.error.set('');
    this.formulario.markAllAsTouched();

    if (
      this.formulario.invalid ||
      this.cargando() ||
      this.cargandoDatos() ||
      !!this.errorCatalogos()
    ) {
      return;
    }

    const valores = this.formulario.getRawValue();

    const datos: IncidenteDTO = {

      titulo: valores.titulo.trim(),
      descripcion: valores.descripcion.trim(),

      callePrincipal: valores.callePrincipal.trim(),
      calleSecundaria: valores.calleSecundaria.trim(),

      zonaId: Number(valores.zonaId),
      categoriaId: Number(valores.categoriaId)

    };

    if (
      datos.titulo.length < 5 ||
      datos.descripcion.length < 10 ||
      datos.callePrincipal.length < 3 ||
      datos.titulo.length > 100 ||
      datos.descripcion.length > 500 ||
      datos.callePrincipal.length > 100 ||
      datos.calleSecundaria.length > 100
    ) {

      this.error.set(
        'Revisa los campos. Algunos no cumplen las longitudes permitidas.'
      );

      return;
    }

    const zonaValida = this.zonas().some(
      zona => zona.id === datos.zonaId
    );

    const categoriaValida = this.categorias().some(
      categoria => categoria.id === datos.categoriaId
    );

    if (!zonaValida || !categoriaValida) {

      this.error.set(
        'Selecciona una zona y una categoría válidas.'
      );

      return;
    }

    this.cargando.set(true);

    this.http.post(
      `${this.API}/incidentes`,
      datos
    ).subscribe({

      next: () => {

        this.cargando.set(false);
        this.enviado.set(true);

        this.formulario.reset();

        this.buscarZona.set('');
        this.buscarCategoria.set('');

        this.cerrarSelectores();
      },

      error: (err: HttpErrorResponse) => {

        this.cargando.set(false);

        if (err.status === 0) {

          this.error.set(
            'No se pudo conectar con Spring Boot.'
          );

          return;
        }

        if (err.status === 401) {

          this.error.set(
            'Tu sesión ha expirado. Inicia sesión nuevamente.'
          );

          return;
        }

        if (err.status === 403) {

          this.error.set(
            'No tienes permisos para registrar incidentes.'
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

        this.error.set(
          mensaje || 'No fue posible registrar el incidente.'
        );
      }

    });
  }

  irAMisReportes(): void {
    this.router.navigateByUrl('/mis-reportes');
  }
}
