
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

import { AuthService } from '../../../core/services/auth';

import {
  UsuariosService,
  UsuarioRespuesta,
  RolUsuario
} from '../../../core/services/usuarios';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {

  // ==========================================
  // 1. SERVICIOS Y ROL DE LA SESIÓN
  // ==========================================

  private usuariosService = inject(UsuariosService);
  private auth = inject(AuthService);

  rolActual = this.auth.obtenerRol();

  // ==========================================
  // 2. ESTADOS DE LA INTERFAZ
  // ==========================================

  usuarios = signal<UsuarioRespuesta[]>([]);
  seleccionado = signal<UsuarioRespuesta | null>(null);

  cargando = signal(false);
  guardandoEstado = signal(false);
  guardandoRol = signal(false);

  error = signal('');
  mensaje = signal('');

  // ==========================================
  // 3. BÚSQUEDA Y FILTROS
  // ==========================================

  busqueda = signal('');
  filtroRol = signal('TODOS');
  filtroEstado = signal('TODOS');

  // ==========================================
  // 4. FORMULARIOS DE ADMINISTRACIÓN
  // ==========================================

  nuevoEstado = '';
  motivo = '';
  nuevoRol: RolUsuario = 'CLIENTE';

  // Estos valores coinciden con los enums de Java.

  readonly roles: RolUsuario[] = [
    'CLIENTE',
    'OPERADOR',
    'ADMIN',
    'SUPER_ADMIN'
  ];

  readonly estados: string[] = [
    'PENDIENTE',
    'VALIDADA',
    'BLOQUEADA'
  ];

  // Solo SUPER_ADMIN puede modificar roles.
  get esSuperAdmin(): boolean {
    return this.rolActual === 'SUPER_ADMIN';
  }

  // ==========================================
  // 5. LISTA FILTRADA DE USUARIOS
  // ==========================================

  usuariosFiltrados = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const rol = this.filtroRol();
    const estado = this.filtroEstado();

    return this.usuarios().filter(usuario => {
      const contenido = this.normalizar(
        [
          usuario.id,
          usuario.cedula,
          usuario.nombre,
          usuario.apellido,
          usuario.email,
          usuario.rol,
          usuario.estado
        ].join(' ')
      );

      return (
        contenido.includes(texto) &&
        (rol === 'TODOS' || usuario.rol === rol) &&
        (estado === 'TODOS' || usuario.estado === estado)
      );
    });
  });

  totalUsuarios = computed(() => this.usuarios().length);

  totalPendientes = computed(() =>
    this.usuarios().filter(
      usuario => usuario.estado === 'PENDIENTE'
    ).length
  );

  totalValidados = computed(() =>
    this.usuarios().filter(
      usuario => usuario.estado === 'VALIDADA'
    ).length
  );

  totalBloqueados = computed(() =>
    this.usuarios().filter(
      usuario => usuario.estado === 'BLOQUEADA'
    ).length
  );

  // ==========================================
  // 6. CARGA INICIAL
  // ==========================================

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // GET /api/v1/usuarios
  cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set('');

    this.usuariosService.listarUsuarios().subscribe({
      next: datos => {
        this.usuarios.set(
          Array.isArray(datos)
            ? [...datos].sort((a, b) => a.id - b.id)
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
  // 7. SELECCIÓN DE UN USUARIO
  // ==========================================

  seleccionarUsuario(usuario: UsuarioRespuesta): void {
    this.seleccionado.set(usuario);

    // Inicializamos los formularios con sus valores actuales.
    this.nuevoEstado = usuario.estado;
    this.nuevoRol = usuario.rol;
    this.motivo = '';

    this.error.set('');
    this.mensaje.set('');
  }

  cerrarDetalle(): void {
    if (this.guardandoEstado() || this.guardandoRol()) {
      return;
    }

    this.seleccionado.set(null);
    this.error.set('');
    this.mensaje.set('');
  }

  // ==========================================
  // 8. CAMBIO DE ESTADO
  // ADMIN Y SUPER_ADMIN
  // ==========================================

  // PATCH /api/v1/usuarios/{id}/estado
  guardarEstado(): void {
    const usuario = this.seleccionado();

    if (
      !usuario ||
      this.guardandoEstado() ||
      this.guardandoRol()
    ) {
      return;
    }

    const estado = this.nuevoEstado.trim().toUpperCase();
    const motivo = this.motivo.trim();

    this.error.set('');
    this.mensaje.set('');

    // Comprobamos que el estado exista en el enum Java.
    if (!this.estados.includes(estado)) {
      this.error.set('Selecciona un estado válido.');
      return;
    }

    if (estado === usuario.estado) {
      this.error.set(
        'Selecciona un estado diferente al actual.'
      );
      return;
    }

    if (!motivo) {
      this.error.set(
        'Debes indicar el motivo del cambio de estado.'
      );
      return;
    }

    this.guardandoEstado.set(true);

    this.usuariosService.cambiarEstado(
      usuario.id,
      {
        nuevoEstado: estado,
        motivo
      }
    ).subscribe({
      next: actualizado => {
        this.actualizarUsuario(actualizado);

        this.nuevoEstado = actualizado.estado;
        this.motivo = '';

        this.guardandoEstado.set(false);

        this.mensaje.set(
          'Estado del usuario actualizado correctamente.'
        );
      },

      error: (err: HttpErrorResponse) => {
        this.guardandoEstado.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  // ==========================================
  // 9. CAMBIO DE ROL
  // SOLO SUPER_ADMIN
  // ==========================================

  // PATCH /api/v1/usuarios/{id}/rol
  guardarRol(): void {
    const usuario = this.seleccionado();

    if (
      !usuario ||
      !this.esSuperAdmin ||
      this.guardandoRol() ||
      this.guardandoEstado()
    ) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    if (!this.roles.includes(this.nuevoRol)) {
      this.error.set('Selecciona un rol válido.');
      return;
    }

    if (this.nuevoRol === usuario.rol) {
      this.error.set(
        'Selecciona un rol diferente al actual.'
      );
      return;
    }

    this.guardandoRol.set(true);

    this.usuariosService.cambiarRol(
      usuario.id,
      {
        nuevoRol: this.nuevoRol
      }
    ).subscribe({
      next: actualizado => {
        this.actualizarUsuario(actualizado);

        this.nuevoRol = actualizado.rol;
        this.guardandoRol.set(false);

        this.mensaje.set(
          'Rol del usuario actualizado correctamente.'
        );
      },

      error: (err: HttpErrorResponse) => {
        this.guardandoRol.set(false);
        this.error.set(this.mensajeError(err));
      }
    });
  }

  // ==========================================
  // 10. ACTUALIZAR DATOS EN PANTALLA
  // ==========================================

  private actualizarUsuario(
    usuario: UsuarioRespuesta
  ): void {
    this.usuarios.update(lista =>
      lista.map(item =>
        item.id === usuario.id ? usuario : item
      )
    );

    this.seleccionado.set(usuario);
  }

  // ==========================================
  // 11. FILTROS
  // ==========================================

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  cambiarFiltroRol(valor: string): void {
    this.filtroRol.set(valor);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroRol.set('TODOS');
    this.filtroEstado.set('TODOS');
  }

  // ==========================================
  // 12. TEXTOS Y COLORES DE LOS ESTADOS
  // ==========================================

  nombreEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';

      case 'VALIDADA':
        return 'Validada';

      case 'BLOQUEADA':
        return 'Bloqueada';

      default:
        return estado;
    }
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-pendiente';

      case 'VALIDADA':
        return 'estado-validada';

      case 'BLOQUEADA':
        return 'estado-bloqueada';

      default:
        return '';
    }
  }

  nombreRol(rol: RolUsuario): string {
    switch (rol) {
      case 'CLIENTE':
        return 'Ciudadano';

      case 'OPERADOR':
        return 'Operador';

      case 'ADMIN':
        return 'Administrador';

      case 'SUPER_ADMIN':
        return 'Superadministrador';

      default:
        return rol;
    }
  }

  // ==========================================
  // 13. FUNCIONES AUXILIARES
  // ==========================================

  private normalizar(texto: string): string {
    return texto
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
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    }

    if (err.status === 403) {
      return 'No tienes permisos para realizar esta operación.';
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
