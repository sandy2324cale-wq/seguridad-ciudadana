
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { Rol } from '../../core/services/auth';

// ==========================================
// 1. MODELO DE OPCIÓN DE MENÚ
// ==========================================

interface OpcionMenu {
  titulo: string;
  ruta: string;
  icono: string;
  roles: Rol[];
}

// ==========================================
// 2. COMPONENTE SIDEBAR
// ==========================================

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

  // ==========================================
  // 3. DATOS RECIBIDOS DEL COMPONENTE PADRE
  // ==========================================

  @Input() rol: Rol | null = null;
  @Input() abierto = false;

  // Eventos para cerrar el menú o cerrar sesión.
  @Output() cerrarMenu = new EventEmitter<void>();
  @Output() salir = new EventEmitter<void>();

  // ==========================================
  // 4. OPCIONES DE NAVEGACIÓN
  // ==========================================

  readonly opciones: OpcionMenu[] = [

    // TODOS LOS USUARIOS AUTENTICADOS
    {
      titulo: 'Panel principal',
      ruta: '/dashboard',
      icono: '⌂',
      roles: [
        'CLIENTE',
        'OPERADOR',
        'ADMIN',
        'SUPER_ADMIN'
      ]
    },

    // ========================================
    // CIUDADANO
    // ========================================

    {
      titulo: 'Reportar incidente',
      ruta: '/reportar',
      icono: '+',
      roles: ['CLIENTE']
    },
    {
      titulo: 'Mis reportes',
      ruta: '/mis-reportes',
      icono: '▤',
      roles: ['CLIENTE']
    },
    {
      titulo: 'Alertas de seguridad',
      ruta: '/alertas',
      icono: '!',
      roles: ['CLIENTE']
    },

    // ========================================
    // OPERADOR
    // ========================================

    {
      titulo: 'Gestionar incidentes',
      ruta: '/incidentes',
      icono: '⚑',
      roles: ['OPERADOR']
    },
    {
      titulo: 'Alertas de seguridad',
      ruta: '/alertas-operador',
      icono: '!',
      roles: ['OPERADOR']
    },

    // ========================================
    // ADMIN Y SUPER_ADMIN
    // ========================================

    {
      titulo: 'Usuarios',
      ruta: '/usuarios',
      icono: '♙',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      titulo: 'Categorías',
      ruta: '/categorias',
      icono: '▦',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      titulo: 'Zonas',
      ruta: '/zonas',
      icono: '◎',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      titulo: 'Agencias',
      ruta: '/agencias',
      icono: '▣',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    

    // ========================================
    // SUPER_ADMIN
    // ========================================

    {
      titulo: 'Auditoría',
      ruta: '/auditoria',
      icono: '◷',
      roles: ['SUPER_ADMIN']
    },
    // ==========================================
// APELACIONES: ADMIN Y SUPER_ADMIN
// ==========================================

{
  titulo: 'Apelaciones',
  ruta: '/apelaciones-admin',
  icono: '✉',
  roles: ['ADMIN', 'SUPER_ADMIN']
},

    // Apelaciones administrativas:
    // Se añadirá cuando confirmemos los
    // endpoints para listar y resolver apelaciones.
    
  ];

  // ==========================================
  // 5. FILTRAR OPCIONES SEGÚN EL ROL
  // ==========================================

  get opcionesVisibles(): OpcionMenu[] {
    if (!this.rol) {
      return [];
    }

    return this.opciones.filter(opcion =>
      opcion.roles.includes(this.rol!)
    );
  }
}
