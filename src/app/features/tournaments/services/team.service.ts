import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  Team, 
  CreateTeamRequest, 
  UpdateTeamRequest, 
  TeamApiResponse 
} from '../models/team.interface';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly apiUrl = `${environment.apiBaseUrl}/teams`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los equipos de un torneo
   * @param tournamentId ID del torneo
   * @returns Observable con la lista de equipos
   */
  getTeamsByTournament(tournamentId: number): Observable<Team[]> {
    const url = `${this.apiUrl}/tournament/${tournamentId}`;
    
    return this.http.get<TeamApiResponse>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener equipos');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un equipo por su ID
   * @param teamId ID del equipo
   * @returns Observable con el equipo
   */
  getTeamById(teamId: number): Observable<Team> {
    const url = `${this.apiUrl}/${teamId}`;
    
    return this.http.get<{ result: Team; succeed: boolean; message: string }>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener equipo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo equipo
   * @param teamData Datos del equipo a crear
   * @returns Observable con el equipo creado
   */
  createTeam(teamData: CreateTeamRequest): Observable<Team> {
    return this.http.post<{ result: Team; succeed: boolean; message: string }>(
      this.apiUrl, 
      teamData, 
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al crear equipo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un equipo existente
   * @param teamData Datos del equipo a actualizar
   * @returns Observable con el equipo actualizado
   */
  updateTeam(teamData: UpdateTeamRequest): Observable<Team> {
    const url = `${this.apiUrl}/${teamData.id}`;
    
    return this.http.put<{ result: Team; succeed: boolean; message: string }>(
      url, 
      teamData, 
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al actualizar equipo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un equipo
   * @param teamId ID del equipo a eliminar
   * @returns Observable con el resultado de la operación
   */
  deleteTeam(teamId: number): Observable<boolean> {
    const url = `${this.apiUrl}/${teamId}`;
    
    return this.http.delete<{ succeed: boolean; message: string }>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.succeed) {
          return true;
        }
        throw new Error(response.message || 'Error al eliminar equipo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Asigna un equipo a un grupo
   * @param teamId ID del equipo
   * @param groupId ID del grupo
   * @returns Observable con el resultado de la operación
   */
  assignTeamToGroup(teamId: number, groupId: number): Observable<boolean> {
    const url = `${this.apiUrl}/${teamId}/assign-group`;
    const body = { groupId };
    
    return this.http.post<{ succeed: boolean; message: string }>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.succeed) {
          return true;
        }
        throw new Error(response.message || 'Error al asignar equipo al grupo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Remueve un equipo de un grupo
   * @param teamId ID del equipo
   * @returns Observable con el resultado de la operación
   */
  removeTeamFromGroup(teamId: number): Observable<boolean> {
    const url = `${this.apiUrl}/${teamId}/remove-group`;
    
    return this.http.post<{ succeed: boolean; message: string }>(url, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.succeed) {
          return true;
        }
        throw new Error(response.message || 'Error al remover equipo del grupo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Valida si un nombre de equipo está disponible
   * @param name Nombre del equipo
   * @param tournamentId ID del torneo
   * @param excludeTeamId ID del equipo a excluir (para edición)
   * @returns Observable con el resultado de la validación
   */
  validateTeamName(name: string, tournamentId: number, excludeTeamId?: number): Observable<boolean> {
    const url = `${this.apiUrl}/validate-name`;
    const params: any = { name, tournamentId };
    
    if (excludeTeamId) {
      params.excludeTeamId = excludeTeamId;
    }
    
    return this.http.get<{ isAvailable: boolean }>(url, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(response => response.isAvailable),
      catchError(this.handleError)
    );
  }

  /**
   * Valida si un nombre corto de equipo está disponible
   * @param shortName Nombre corto del equipo
   * @param tournamentId ID del torneo
   * @param excludeTeamId ID del equipo a excluir (para edición)
   * @returns Observable con el resultado de la validación
   */
  validateTeamShortName(shortName: string, tournamentId: number, excludeTeamId?: number): Observable<boolean> {
    const url = `${this.apiUrl}/validate-short-name`;
    const params: any = { shortName, tournamentId };
    
    if (excludeTeamId) {
      params.excludeTeamId = excludeTeamId;
    }
    
    return this.http.get<{ isAvailable: boolean }>(url, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(response => response.isAvailable),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los headers HTTP necesarios
   * @returns HttpHeaders configurados
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con error
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Datos inválidos';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado';
      } else if (error.status === 403) {
        errorMessage = 'Acceso denegado';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflicto en los datos';
      } else if (error.status >= 500) {
        errorMessage = 'Error interno del servidor';
      } else {
        errorMessage = error.error?.message || `Error HTTP: ${error.status}`;
      }
    }
    
    console.error('TeamService Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
