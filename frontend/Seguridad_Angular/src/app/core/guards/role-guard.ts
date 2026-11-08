
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService, Rol } from '../services/auth';

// ==========================================
// PROTEGER PÁGINAS SEGÚN EL ROL
// ==========================================

export const roleGuard: CanActivateFn = (route) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // Primero verificar que la sesión sea válida.
  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  const rolesPermitidos =
    route.data['roles'] as Rol[] | undefined;

  const rolActual = auth.obtenerRol();

  // Permitir únicamente roles autorizados.
  if (
    rolActual &&
    rolesPermitidos?.includes(rolActual)
  ) {
    return true;
  }

  // Un usuario autenticado sin permisos
  // vuelve a su panel principal.
  return router.createUrlTree(['/dashboard']);
};
