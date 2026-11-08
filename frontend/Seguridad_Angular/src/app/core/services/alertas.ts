
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

// ==========================================
// 1. TIPOS Y MODELOS
// ==========================================

export type NivelAlerta = 'BAJO' | 'MEDIO' | 'ALTO';

export interface AlertaDTO {
  titulo: string;
  mensaje: string;
  nivel: NivelAlerta;
}

export interface Alerta {
  id: number;
  titulo: string;
  mensaje: string;
  nivel: string;
  fechaPublicacion: string;
  emisor?: {
    id?: number;
    nombre?: string;
    apellido?: string;
    email?: string;
  } | null;
}

// ==========================================
// 2. SERVICIO HTTP
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class AlertasService {

  private readonly http = inject(HttpClient);

  private readonly API = `${API_BASE_URL}/alertas`;

  // GET /api/v1/alertas
  listarAlertas(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.API);
  }

  // POST /api/v1/alertas
  crearAlerta(datos: AlertaDTO): Observable<Alerta> {
    return this.http.post<Alerta>(this.API, datos);
  }
}
