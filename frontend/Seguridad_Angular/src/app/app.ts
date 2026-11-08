
import { CommonModule, DOCUMENT } from '@angular/common';

import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs';

import { AuthService } from './core/services/auth';
import { Sidebar } from './layout/sidebar/sidebar';

// ==========================================
// TIPOS DE PREFERENCIAS
// ==========================================

type Tema = 'claro' | 'oscuro' | 'sistema';

type TamanoLetra =
  | 'normal'
  | 'grande'
  | 'muy-grande';

interface Preferencias {
  tema: Tema;
  letra: TamanoLetra;
  altoContraste: boolean;
  reducirMovimiento: boolean;
}

// ==========================================
// PREFERENCIAS PREDETERMINADAS
// ==========================================

const PREFERENCIAS_INICIALES: Preferencias = {
  tema: 'claro',
  letra: 'normal',
  altoContraste: false,
  reducirMovimiento: false
};

@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar
  ],

  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  // ========================================
  // SERVICIOS
  // ========================================

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private readonly clavePreferencias =
    'ssc-preferencias-v1';

  // ========================================
  // TEMA DEL SISTEMA OPERATIVO
  // ========================================

  private consultaTemaSistema?: MediaQueryList;

  private readonly escucharTemaSistema = (): void => {
    this.aplicarPreferencias();
  };

  // ========================================
  // ESTADO GLOBAL DEL LAYOUT
  // ========================================

  readonly menuAbierto = signal(false);

  readonly menuPerfilAbierto = signal(false);

  readonly panelPerfilAbierto = signal(false);

  readonly rutaActual = signal(this.router.url);

  readonly preferencias = signal<Preferencias>({
    ...PREFERENCIAS_INICIALES
  });

  // ========================================
  // MOSTRAR SIDEBAR Y BARRA SUPERIOR
  // SOLO EN RUTAS PRIVADAS
  // ========================================

  readonly mostrarLayout = computed(() => {

    const ruta = this.rutaActual()
      .split(/[?#]/)[0];

    const rutasPublicas = [
  '/login',
  '/registro',
  '/verificacion',
  '/apelacion',
  '/recuperar-password'
];

    const esPublica = rutasPublicas.some(
      path =>
        ruta === path ||
        ruta.startsWith(path + '/')
    );

    return !esPublica && this.auth.sesionActiva();
  });

  // ========================================
  // INFORMACIÓN DEL USUARIO
  // ========================================

  get email(): string {
    return this.auth.obtenerEmail() || 'Usuario';
  }

  get rol() {
    return this.auth.obtenerRol();
  }

  get inicialUsuario(): string {
    return this.email.charAt(0).toUpperCase();
  }

  get tituloRol(): string {

    switch (this.rol) {

      case 'CLIENTE':
        return 'Portal ciudadano';

      case 'OPERADOR':
        return 'Centro de operaciones';

      case 'ADMIN':
        return 'Panel de administración';

      case 'SUPER_ADMIN':
        return 'Administración general';

      default:
        return 'Seguridad Ciudadana';
    }
  }

  // ========================================
  // CONSTRUCTOR
  // ========================================

  constructor() {

    this.router.events
      .pipe(
        filter(
          (evento): evento is NavigationEnd =>
            evento instanceof NavigationEnd
        )
      )
      .subscribe(evento => {

        this.rutaActual.set(
          evento.urlAfterRedirects
        );

        this.menuAbierto.set(false);

        this.menuPerfilAbierto.set(false);

        this.panelPerfilAbierto.set(false);

        this.verificarSesion();
      });
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  ngOnInit(): void {

    // Recupera las preferencias guardadas.
    this.cargarPreferencias();

    // Detecta el tema del sistema operativo.
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {

      this.consultaTemaSistema =
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        );

      this.consultaTemaSistema.addEventListener?.(
        'change',
        this.escucharTemaSistema
      );
    }

    // Aplica el tema al iniciar.
    this.aplicarPreferencias();
  }

  // ========================================
  // LIMPIEZA DEL COMPONENTE
  // ========================================

  ngOnDestroy(): void {

    this.consultaTemaSistema?.removeEventListener?.(
      'change',
      this.escucharTemaSistema
    );
  }

  // ========================================
  // PANEL DE PERFIL
  // ========================================

  abrirPanelPerfil(): void {

    this.menuPerfilAbierto.set(false);

    this.panelPerfilAbierto.set(true);
  }

  cerrarPanelPerfil(): void {

    this.panelPerfilAbierto.set(false);
  }

  // ========================================
  // CAMBIAR TEMA
  // ========================================

  cambiarTema(tema: Tema): void {

    // IMPORTANTE:
    // Al seleccionar Claro, Oscuro o Sistema,
    // desactivamos el alto contraste anterior.
    //
    // Así evitamos que el usuario seleccione
    // Claro y siga viendo fondos negros.

    this.actualizarPreferencias({
      tema,
      altoContraste: false
    });
  }

  // ========================================
  // CAMBIAR TAMAÑO DE LETRA
  // ========================================

  cambiarLetra(letra: TamanoLetra): void {

    this.actualizarPreferencias({
      letra
    });
  }

  // ========================================
  // ALTO CONTRASTE
  // ========================================

  cambiarContraste(valor: boolean): void {

    // El alto contraste es una opción propia.
    // Puede activarse o desactivarse desde
    // su casilla de accesibilidad.

    this.actualizarPreferencias({
      altoContraste: valor
    });
  }

  // ========================================
  // REDUCIR ANIMACIONES
  // ========================================

  cambiarMovimiento(valor: boolean): void {

    this.actualizarPreferencias({
      reducirMovimiento: valor
    });
  }

  // ========================================
  // RESTAURAR PREFERENCIAS
  // ========================================

  restaurarPreferencias(): void {

    this.guardarPreferencias({
      ...PREFERENCIAS_INICIALES
    });
  }

  // ========================================
  // ACTUALIZAR PREFERENCIAS
  // ========================================

  private actualizarPreferencias(
    cambios: Partial<Preferencias>
  ): void {

    const nuevasPreferencias: Preferencias = {
      ...this.preferencias(),
      ...cambios
    };

    this.guardarPreferencias(
      nuevasPreferencias
    );
  }

  // ========================================
  // GUARDAR EN LOCALSTORAGE
  // ========================================

  private guardarPreferencias(
    valor: Preferencias
  ): void {

    this.preferencias.set(valor);

    try {

      localStorage.setItem(
        this.clavePreferencias,
        JSON.stringify(valor)
      );

    } catch {

      // La aplicación continúa funcionando
      // aunque el almacenamiento esté bloqueado.
    }

    this.aplicarPreferencias();
  }

  // ========================================
  // CARGAR PREFERENCIAS GUARDADAS
  // ========================================

  private cargarPreferencias(): void {

    try {

      const texto = localStorage.getItem(
        this.clavePreferencias
      );

      if (!texto) {
        return;
      }

      const dato: unknown = JSON.parse(texto);

      if (
        !dato ||
        typeof dato !== 'object'
      ) {
        return;
      }

      const p = dato as Partial<Preferencias>;

      const tema: Tema =
        p.tema === 'oscuro' ||
        p.tema === 'sistema'
          ? p.tema
          : 'claro';

      const letra: TamanoLetra =
        p.letra === 'grande' ||
        p.letra === 'muy-grande'
          ? p.letra
          : 'normal';

      this.preferencias.set({

        tema,

        letra,

        altoContraste:
          p.altoContraste === true,

        reducirMovimiento:
          p.reducirMovimiento === true

      });

    } catch {

      this.preferencias.set({
        ...PREFERENCIAS_INICIALES
      });
    }
  }

  // ========================================
  // APLICAR TEMA A TODA LA APLICACIÓN
  // ========================================

  private aplicarPreferencias(): void {

    const p = this.preferencias();

    const temaOscuroDelSistema =
      this.consultaTemaSistema?.matches === true;

    // Tema oscuro normal.
    const oscuro =
      p.tema === 'oscuro' ||
      (
        p.tema === 'sistema' &&
        temaOscuroDelSistema
      );

    const raiz =
      this.document.documentElement;

    // ======================================
    // CLASES GLOBALES DEL HTML
    // ======================================

    // Solo se activa en modo oscuro.
    raiz.classList.toggle(
      'ssc-oscuro',
      oscuro
    );

    // Solo se activa cuando el usuario
    // marca la casilla Alto contraste.
    raiz.classList.toggle(
      'ssc-contraste',
      p.altoContraste
    );

    // Preferencia de movimiento.
    raiz.classList.toggle(
      'ssc-sin-movimiento',
      p.reducirMovimiento
    );

    // Tamaño de letra.
    raiz.setAttribute(
      'data-ssc-letra',
      p.letra
    );

    // ======================================
    // ESQUEMA NATIVO DE FORMULARIOS
    // ======================================

    // CORRECCIÓN IMPORTANTE:
    // Alto contraste también debe utilizar
    // controles nativos con esquema oscuro.

    raiz.style.colorScheme =
      p.altoContraste || oscuro
        ? 'dark'
        : 'light';
  }

  // ========================================
  // VERIFICAR SESIÓN AL RESTAURAR PÁGINA
  // ========================================

  @HostListener('window:pageshow')
  alRestaurarPagina(): void {

    this.verificarSesion();
  }

  // ========================================
  // VERIFICAR SESIÓN AL RECUPERAR FOCO
  // ========================================

  @HostListener('window:focus')
  alRecuperarFoco(): void {

    this.verificarSesion();
  }

  // ========================================
  // CERRAR PANELES CON ESCAPE
  // ========================================

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {

    this.menuAbierto.set(false);

    this.menuPerfilAbierto.set(false);

    this.panelPerfilAbierto.set(false);
  }
irACambiarPassword(): void {
  this.cerrarPanelPerfil();

  void this.router.navigateByUrl('/cambiar-password');
}
  // ========================================
  // SEGURIDAD DE RUTAS
  // ========================================

  private verificarSesion(): void {

    const ruta = this.router.url
      .split(/[?#]/)[0];

   const rutasPublicas = [
  '/login',
  '/registro',
  '/verificacion',
  '/apelacion',
  '/recuperar-password'
];

    const esPublica = rutasPublicas.some(
      path =>
        ruta === path ||
        ruta.startsWith(path + '/')
    );

    if (
      !esPublica &&
      !this.auth.estaAutenticado()
    ) {

      void this.router.navigateByUrl(
        '/login',
        {
          replaceUrl: true
        }
      );
    }
  }

  // ========================================
  // CERRAR SESIÓN
  // ========================================

  cerrarSesion(): void {

    this.menuAbierto.set(false);

    this.menuPerfilAbierto.set(false);

    this.panelPerfilAbierto.set(false);

    this.auth.cerrarSesion();

    void this.router.navigateByUrl(
      '/login',
      {
        replaceUrl: true
      }
    );
  }
}
