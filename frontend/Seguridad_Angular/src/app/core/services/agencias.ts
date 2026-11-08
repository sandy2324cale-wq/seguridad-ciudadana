
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

// ==========================================
// 1. MODELO DE AGENCIA
// Coincide con AgenciaRespuesta.java
// ==========================================

export interface Agencia {
  id: number;
  nombre: string;
  siglas: string;
  telefonoEmergencia: string;
}

// ==========================================
// 2. SOLICITUD DE CREACIÓN
// El ID es generado por PostgreSQL.
// ==========================================

export interface AgenciaCrearSolicitud {
  nombre: string;
  siglas: string;
  telefonoEmergencia: string;
}

// ==========================================
// 3. SERVICIO HTTP
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class AgenciasService {

  private readonly http = inject(HttpClient);

  private readonly API_URL = `${API_BASE_URL}/agencias`;

  // GET /api/v1/agencias
  listarAgencias(): Observable<Agencia[]> {
    return this.http.get<Agencia[]>(this.API_URL);
  }

  // POST /api/v1/agencias
  // Solo SUPER_ADMIN.
  crearAgencia(
    solicitud: AgenciaCrearSolicitud
  ): Observable<Agencia> {
    return this.http.post<Agencia>(
      this.API_URL,
      solicitud
    );
  }
}
