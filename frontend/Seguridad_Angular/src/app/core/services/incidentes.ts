
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export type EstadoIncidente =
  | 'PENDIENTE'
  | 'EN_ATENCION'
  | 'RESUELTO'
  | 'FALSO_REPORTE';

// ========================================
// MODELO DE INCIDENTE
// ========================================

export interface Incidente {
  id: number;
  titulo: string;
  descripcion: string;
  callePrincipal: string;
  calleSecundaria: string | null;
  estado: EstadoIncidente;
  fechaReporte: string;
  zonaId: number;
  nombreZona: string;
  categoriaId: number;
  nombreCategoria: string;
  agenciaId: number | null;
}

// ========================================
// MODELO DE AGENCIA
// ========================================

export interface AgenciaRespuesta {
  id: number;
  nombre: string;
  siglas: string;
  telefonoEmergencia: string;
}

// ========================================
// MODELO DE HISTORIAL
// ========================================

export interface HistorialEstado {
  id: number;
  estadoAnterior: EstadoIncidente | null;
  estadoNuevo: EstadoIncidente;
  observacion: string;
  fechaCambio: string;
  incidenteId: number;
  responsable: string;
}

// ========================================
// SOLICITUDES
// ========================================

export interface AsignarAgenciaSolicitud {
  agenciaId: number;
  observacion: string;
}

export interface CambiarEstadoSolicitud {
  nuevoEstado: EstadoIncidente;
  observacion: string;
}

// ========================================
// SERVICIO DE INCIDENTES
// ========================================

@Injectable({
  providedIn: 'root'
})
export class IncidentesService {

  private readonly http = inject(HttpClient);

  // URL base: /api/v1
  private readonly API = API_BASE_URL;

  // LISTAR TODOS LOS INCIDENTES
  // OPERADOR / ADMIN / SUPER_ADMIN
  listarIncidentes(): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(
      `${this.API}/incidentes`
    );
  }

  // OBTENER UN INCIDENTE POR ID
  obtenerIncidente(id: number): Observable<Incidente> {
    return this.http.get<Incidente>(
      `${this.API}/incidentes/${id}`
    );
  }

  // CONSULTAR MIS REPORTES
  // CLIENTE
  obtenerMisReportes(): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(
      `${this.API}/incidentes/mis-reportes`
    );
  }

  // NOMBRE ALTERNATIVO PARA COMPATIBILIDAD
  listarMisReportes(): Observable<Incidente[]> {
    return this.obtenerMisReportes();
  }

  // LISTAR AGENCIAS DE RESPUESTA
  listarAgencias(): Observable<AgenciaRespuesta[]> {
    return this.http.get<AgenciaRespuesta[]>(
      `${this.API}/agencias`
    );
  }

  // ASIGNAR AGENCIA A UN INCIDENTE
  asignarAgencia(
    incidenteId: number,
    solicitud: AsignarAgenciaSolicitud
  ): Observable<Incidente> {
    return this.http.patch<Incidente>(
      `${this.API}/incidentes/${incidenteId}/agencia`,
      solicitud
    );
  }

  // CAMBIAR ESTADO DE UN INCIDENTE
  cambiarEstado(
    incidenteId: number,
    solicitud: CambiarEstadoSolicitud
  ): Observable<Incidente> {
    return this.http.patch<Incidente>(
      `${this.API}/incidentes/${incidenteId}/estado`,
      solicitud
    );
  }

  // CONSULTAR HISTORIAL DE ESTADOS
  obtenerHistorial(
    incidenteId: number
  ): Observable<HistorialEstado[]> {
    return this.http.get<HistorialEstado[]>(
      `${this.API}/historial/incidente/${incidenteId}`
    );
  }
}
