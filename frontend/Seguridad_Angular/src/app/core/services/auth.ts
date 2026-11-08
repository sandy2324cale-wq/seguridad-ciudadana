
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

// ==========================================
// 1. ROLES DEL SISTEMA
// ==========================================

export type Rol =
  | 'CLIENTE'
  | 'OPERADOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

// ==========================================
// 2. CONTRATOS DEL BACKEND
// ==========================================

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  rol: Rol;
}

export interface RegistroDTO {
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

export interface VerificacionDTO {
  email: string;
  codigo: string;
}

// ==========================================
// 3. SERVICIO DE AUTENTICACIÓN
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly API_URL = `${API_BASE_URL}/auth`;
  // Estado reactivo para actualizar la interfaz.
  readonly sesionActiva = signal(this.validarSesion());

  // ========================================
  // 4. PETICIONES PÚBLICAS
  // ========================================

  login(datos: LoginDTO): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.API_URL}/login`,
      datos
    );
  }

  registro(datos: RegistroDTO): Observable<string> {
    return this.http.post(
      `${this.API_URL}/registro`,
      datos,
      { responseType: 'text' }
    );
  }

  verificarCodigo(
    datos: VerificacionDTO
  ): Observable<string> {
    return this.http.post(
      `${this.API_URL}/verificar-codigo`,
      datos,
      { responseType: 'text' }
    );
  }

  reenviarCodigo(email: string): Observable<string> {
    return this.http.post(
      `${this.API_URL}/reenviar-codigo`,
      { email },
      { responseType: 'text' }
    );
  }

  // ========================================
  // 5. GUARDAR SESIÓN
  // ========================================

  guardarSesion(respuesta: LoginResponse): void {

    sessionStorage.setItem('token', respuesta.token);
    sessionStorage.setItem('email', respuesta.email);
    sessionStorage.setItem('rol', respuesta.rol);

    this.sesionActiva.set(this.validarSesion());
  }

  // ========================================
  // 6. CONSULTAR DATOS DE SESIÓN
  // ========================================

  obtenerToken(): string | null {
    return sessionStorage.getItem('token');
  }

  obtenerEmail(): string | null {
    return sessionStorage.getItem('email');
  }

  obtenerRol(): Rol | null {

    const rol = sessionStorage.getItem('rol');

    if (
      rol === 'CLIENTE' ||
      rol === 'OPERADOR' ||
      rol === 'ADMIN' ||
      rol === 'SUPER_ADMIN'
    ) {
      return rol;
    }

    return null;
  }

  // ========================================
  // 7. VALIDAR EXPIRACIÓN DEL JWT
  // ========================================

  private tokenVigente(token: string): boolean {

    try {
      const partes = token.split('.');

      if (partes.length !== 3) {
        return false;
      }

      const base64 = partes[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(
        atob(base64)
      ) as { exp?: number };

      // Se exige una fecha de expiración.
      if (
        typeof payload.exp !== 'number' ||
        !Number.isFinite(payload.exp)
      ) {
        return false;
      }

      const ahora = Math.floor(Date.now() / 1000);

      return payload.exp > ahora;

    } catch {
      return false;
    }
  }

  // ========================================
  // 8. COMPROBAR SESIÓN
  // ========================================

  private validarSesion(): boolean {

    const token = this.obtenerToken();
    const rol = this.obtenerRol();

    if (!token || !rol) {
      return false;
    }

    return this.tokenVigente(token);
  }

  estaAutenticado(): boolean {

    const valida = this.validarSesion();

    if (!valida) {
      this.cerrarSesion();
    }

    return valida;
  }

  // ========================================
  // 9. CERRAR SESIÓN
  // ========================================

  cerrarSesion(): void {

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('rol');

    this.sesionActiva.set(false);
  }
}
