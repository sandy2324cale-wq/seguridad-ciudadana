
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

// ==========================================
// 1. MODELO DE AGENCIA
// ==========================================

export interface AgenciaCategoria {
  id: number;
  nombre: string;
  siglas: string;
  telefonoEmergencia: string;
}

// ==========================================
// 2. MODELO DE CATEGORÍA
// Coincide con CategoriaIncidente.java
// ==========================================

export interface CategoriaIncidente {
  id: number;
  nombre: string;
  nivelPrioridad: string;
  agenciaEncargada: AgenciaCategoria | null;
}

// ==========================================
// 3. DATOS PARA CREAR UNA CATEGORÍA
// Coincide con CategoriaCrearDTO.java
// ==========================================

export interface CategoriaCrearSolicitud {
  nombre: string;
  nivelPrioridad: string;
  agenciaId: number;
}

// ==========================================
// 4. SERVICIO HTTP
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  private readonly http = inject(HttpClient);

  // URL base: /api/v1
  private readonly API = API_BASE_URL;

  // GET /api/v1/categorias
  listarCategorias(): Observable<CategoriaIncidente[]> {
    return this.http.get<CategoriaIncidente[]>(
      `${this.API}/categorias`
    );
  }

  // POST /api/v1/categorias
  // Solo ADMIN y SUPER_ADMIN
  crearCategoria(
    solicitud: CategoriaCrearSolicitud
  ): Observable<CategoriaIncidente> {
    return this.http.post<CategoriaIncidente>(
      `${this.API}/categorias`,
      solicitud
    );
  }

  // GET /api/v1/agencias
  // Necesario para elegir la agencia responsable.
  listarAgencias(): Observable<AgenciaCategoria[]> {
    return this.http.get<AgenciaCategoria[]>(
      `${this.API}/agencias`
    );
  }
}
