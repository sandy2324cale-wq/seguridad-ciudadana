
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export type EstadoSolicitud =
  'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export type DecisionApelacion =
  'APROBADA' | 'RECHAZADA';

export interface SolicitudSoporte {
  id: number;
  email: string;
  cedula: string;
  motivoApelacion: string;
  estadoSolicitud: EstadoSolicitud;
  fechaSolicitud: string;
}

export interface CrearApelacionSolicitud {
  email: string;
  cedula: string;
  motivoApelacion: string;
}

export interface DecidirApelacionSolicitud {
  decision: DecisionApelacion;
}

@Injectable({
  providedIn: 'root'
})
export class SoporteService {

  private readonly http = inject(HttpClient);
  private readonly API = `${API_BASE_URL}/soporte`;

  crearApelacion(
    datos: CrearApelacionSolicitud
  ): Observable<SolicitudSoporte> {
    return this.http.post<SolicitudSoporte>(
      `${this.API}/apelar`,
      datos
    );
  }

  listarSolicitudes(): Observable<SolicitudSoporte[]> {
    return this.http.get<SolicitudSoporte[]>(
      `${this.API}/solicitudes`
    );
  }

  decidirSolicitud(
    id: number,
    datos: DecidirApelacionSolicitud
  ): Observable<SolicitudSoporte> {
    return this.http.patch<SolicitudSoporte>(
      `${this.API}/solicitudes/${id}/decision`,
      datos
    );
  }
}
