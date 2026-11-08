
import { Routes } from '@angular/router';

// ==========================================
// 1. AUTENTICACIÓN
// ==========================================

import { Login } from './pages/auth/login/login';
import { Registro } from './pages/auth/registro/registro';
import { Verificacion } from './pages/auth/verificacion/verificacion';
import { Apelacion } from './pages/auth/apelacion/apelacion';

// ==========================================
// 2. DASHBOARD
// ==========================================

import { Dashboard } from './pages/dashboard/dashboard';

// ==========================================
// 3. MÓDULOS DEL CIUDADANO
// ==========================================

import {
  ReportarIncidente
} from './pages/cliente/reportar-incidente/reportar-incidente';

import {
  MisReportes
} from './pages/cliente/mis-reportes/mis-reportes';

import {
  AlertasCliente
} from './pages/cliente/alertas-cliente/alertas-cliente';

// ==========================================
// 4. MÓDULOS DEL OPERADOR
// ==========================================

import {
  GestionarIncidentes
} from './pages/operador/gestionar-incidentes/gestionar-incidentes';

import {
  Alertas
} from './pages/operador/alertas/alertas';

// ==========================================
// 5. MÓDULOS ADMINISTRATIVOS
// ==========================================

import {
  ApelacionesAdmin
} from './pages/admin/apelaciones-admin/apelaciones-admin';

import { Auditoria } from './pages/admin/auditoria/auditoria';
import { Usuarios } from './pages/admin/usuarios/usuarios';
import { Categorias } from './pages/admin/categorias/categorias';
import { Zonas } from './pages/admin/zonas/zonas';
import { Agencias } from './pages/admin/agencias/agencias';

// ==========================================
// 6. GUARDS DE SEGURIDAD
// ==========================================

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

// ==========================================
// 7. DEFINICIÓN DE RUTAS
// ==========================================

export const routes: Routes = [

  // ========================================
  // RUTA INICIAL
  // ========================================

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  // ========================================
  // RUTAS PÚBLICAS
  // ========================================

  {
    path: 'login',
    component: Login
  },
  {
    path: 'registro',
    component: Registro
  },
  {
    path: 'verificacion',
    component: Verificacion
  },
  {
    path: 'apelacion',
    component: Apelacion
  },

  // Recuperación de contraseña por Gmail.
  // No requiere iniciar sesión.
  {
    path: 'recuperar-password',
    loadComponent: () =>
      import(
        './pages/auth/recuperar-password/recuperar-password'
      ).then(m => m.RecuperarPassword)
  },

  // ========================================
  // RUTAS PARA USUARIOS AUTENTICADOS
  // ========================================

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  // Cambio de contraseña desde el perfil.
  // Requiere iniciar sesión.
  
{
  path: 'cambiar-password',
  loadComponent: () =>
    import('./pages/cuenta/cambiar-password/cambiar-password')
      .then(m => m.CambiarPassword),
  canActivate: [authGuard]
},

  // ========================================
  // CIUDADANO
  // ========================================

  {
    path: 'reportar',
    component: ReportarIncidente,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CLIENTE']
    }
  },
  {
    path: 'mis-reportes',
    component: MisReportes,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CLIENTE']
    }
  },
  {
    path: 'alertas',
    component: AlertasCliente,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CLIENTE']
    }
  },

  // ========================================
  // OPERADOR
  // ========================================

  {
    path: 'incidentes',
    component: GestionarIncidentes,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['OPERADOR']
    }
  },
  {
    path: 'alertas-operador',
    component: Alertas,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['OPERADOR']
    }
  },

  // ========================================
  // ADMIN Y SUPER_ADMIN
  // ========================================

  {
    path: 'usuarios',
    component: Usuarios,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  },
  {
    path: 'categorias',
    component: Categorias,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  },
  {
    path: 'zonas',
    component: Zonas,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  },
  {
    path: 'agencias',
    component: Agencias,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  },

  // ========================================
  // APELACIONES ADMINISTRATIVAS
  // ========================================

  {
    path: 'apelaciones-admin',
    component: ApelacionesAdmin,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  },

  // ========================================
  // AUDITORÍA: SUPER_ADMIN
  // ========================================

  {
    path: 'auditoria',
    component: Auditoria,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['SUPER_ADMIN']
    }
  },

  // ========================================
  // RUTA DESCONOCIDA
  // SIEMPRE DEBE IR AL FINAL
  // ========================================

  {
    path: '**',
    redirectTo: 'login'
  }

];
