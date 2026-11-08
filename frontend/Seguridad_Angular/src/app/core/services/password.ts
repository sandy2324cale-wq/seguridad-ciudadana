
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { API_BASE_URL } from '../config/api.config';

export interface RestablecerPasswordDTO {
  email: string;
  codigo: string;
  passwordNueva: string;
  confirmarPassword: string;
}

export interface CambiarPasswordDTO {
  passwordActual: string;
  passwordNueva: string;
  confirmarPassword: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly api = `${API_BASE_URL}/auth`;

  private autorizacion(): HttpHeaders {
    const token = this.auth.obtenerToken();
    return new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );
  }

  solicitarRecuperacion(email: string): Observable<string> {
    return this.http.post(
      `${this.api}/recuperacion/solicitar`,
      { email },
      { responseType: 'text' }
    );
  }

  restablecerRecuperacion(
    datos: RestablecerPasswordDTO
  ): Observable<string> {
    return this.http.post(
      `${this.api}/recuperacion/restablecer`,
      datos,
      { responseType: 'text' }
    );
  }

  cambiarConActual(datos: CambiarPasswordDTO): Observable<string> {
    return this.http.patch(
      `${this.api}/cambiar-password`,
      datos,
      {
        headers: this.autorizacion(),
        responseType: 'text'
      }
    );
  }

  solicitarDesdePerfil(): Observable<string> {
    return this.http.post(
      `${this.api}/perfil/password/solicitar`,
      {},
      {
        headers: this.autorizacion(),
        responseType: 'text'
      }
    );
  }

  cambiarConCodigo(
    datos: RestablecerPasswordDTO
  ): Observable<string> {
    return this.http.post(
      `${this.api}/perfil/password/restablecer`,
      datos,
      {
        headers: this.autorizacion(),
        responseType: 'text'
      }
    );
  }
}
