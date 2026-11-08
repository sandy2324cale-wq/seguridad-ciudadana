
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface Zona {
  id: number;
  nombreZona: string;
  codigoPostal: string;
}

export interface ZonaCrearSolicitud {
  nombreZona: string;
  codigoPostal: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZonasService {

  private readonly http = inject(HttpClient);
  private readonly API = `${API_BASE_URL}/zonas`;

  listarZonas(): Observable<Zona[]> {
    return this.http.get<Zona[]>(this.API);
  }

  crearZona(
    solicitud: ZonaCrearSolicitud
  ): Observable<Zona> {
    return this.http.post<Zona>(
      this.API,
      solicitud
    );
  }
}

