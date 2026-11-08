
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth';

// ==========================================
// PROTEGER PÁGINAS AUTENTICADAS
// ==========================================

export const authGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // Comprueba existencia y expiración del JWT.
  if (auth.estaAutenticado()) {
    return true;
  }

  // No permite acceder a la ruta protegida.
  return router.createUrlTree(['/login']);
};
