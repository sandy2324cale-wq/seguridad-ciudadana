
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

// ==========================================
// 1. MODELO REAL DE AUDITORÍA
// ==========================================

export interface RegistroAuditoria {
  id: number;
  responsable: string;
  accion: string;
  detalle: string;
  fecha: string;
}

// ==========================================
// 2. SERVICIO HTTP
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {

  private readonly http = inject(HttpClient);

  private readonly API = `${API_BASE_URL}/auditoria`;

  // Solo SUPER_ADMIN puede consultar
  // este endpoint según SecurityConfig.java.
  listar(): Observable<RegistroAuditoria[]> {
    return this.http.get<RegistroAuditoria[]>(this.API);
  }
}
