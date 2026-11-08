
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { AuthService } from '../services/auth';
import { API_BASE_URL } from '../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.obtenerToken();

  // Verificar que la solicitud pertenezca a nuestra API.
  // Funciona con URLs relativas, por ejemplo: /api/v1/usuarios.
  const esNuestraApi =
    req.url === API_BASE_URL ||
    req.url.startsWith(`${API_BASE_URL}/`) ||
    req.url.startsWith(`${API_BASE_URL}?`);

  if (!esNuestraApi) {
    return next(req);
  }

  // Obtener la ruta sin utilizar new URL(),
  // porque nuestra API ahora utiliza direcciones relativas.
  const rutaCompleta = req.url.split('?')[0];

  const ruta = rutaCompleta.substring(API_BASE_URL.length);

  // Endpoints públicos que no necesitan JWT.
  const rutasPublicas = [
    '/auth/login',
    '/auth/registro',
    '/auth/verificar-codigo',
    '/auth/reenviar-codigo',
    '/auth/recuperacion/solicitar',
    '/auth/recuperacion/restablecer'
  ];

  if (rutasPublicas.includes(ruta)) {
    return next(req);
  }

  // Si no existe token, enviar la petición sin Authorization.
  // Spring Security decidirá si debe rechazarla.
  if (!token) {
    return next(req);
  }

  // Adjuntar el token JWT a los endpoints protegidos.
  const solicitudAutenticada = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(solicitudAutenticada);
};
