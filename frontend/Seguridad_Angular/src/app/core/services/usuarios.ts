
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export type RolUsuario =
  | 'CLIENTE'
  | 'OPERADOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export interface UsuarioRespuesta {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  estado: string;
}

export interface CambioEstadoSolicitud {
  nuevoEstado: string;
  motivo: string;
}

export interface CambioRolSolicitud {
  nuevoRol: RolUsuario;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private readonly http = inject(HttpClient);
  private readonly API = `${API_BASE_URL}/usuarios`;

  listarUsuarios(): Observable<UsuarioRespuesta[]> {
    return this.http.get<UsuarioRespuesta[]>(this.API);
  }

  obtenerUsuario(id: number): Observable<UsuarioRespuesta> {
    return this.http.get<UsuarioRespuesta>(
      `${this.API}/${id}`
    );
  }

  cambiarEstado(
    id: number,
    solicitud: CambioEstadoSolicitud
  ): Observable<UsuarioRespuesta> {
    return this.http.patch<UsuarioRespuesta>(
      `${this.API}/${id}/estado`,
      solicitud
    );
  }

  cambiarRol(
    id: number,
    solicitud: CambioRolSolicitud
  ): Observable<UsuarioRespuesta> {
    return this.http.patch<UsuarioRespuesta>(
      `${this.API}/${id}/rol`,
      solicitud
    );
  }
}
