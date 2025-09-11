import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import {
  TEAM_GET_ALL_TEAMS_ENDPOINT,
  TEAM_GET_BY_TOURNAMENT_ENDPOINT,
  TEAM_CREATE_ENDPOINT,
  TEAM_UPDATE_ENDPOINT,
  TEAM_DELETE_ENDPOINT,
  TEAM_ASSIGN_TO_GROUP_ENDPOINT,
  TEAM_REMOVE_FROM_GROUP_ENDPOINT,
  TEAM_DISQUALIFY_ENDPOINT,
  TEAM_REMOVE_ENDPOINT
} from '@core/config/endpoints';
import {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamApiResponse
} from '../models/team.interface';
import { ApiResponse } from '@core/models/api.interface';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Obtiene todos los equipos de un torneo
   * @param tournamentId ID del torneo
   * @returns Observable con la lista de equipos
   */
  getTeamsByTournament(tournamentId: number): Observable<Team[]> {
    return this.apiService.get<TeamApiResponse>(`${TEAM_GET_ALL_TEAMS_ENDPOINT}/${tournamentId}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        this.toastService.showError(response.message || 'Error al obtener equipos');
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
    return this.apiService.get<ApiResponse<Team>>(`${TEAM_GET_ALL_TEAMS_ENDPOINT}/${teamId}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        this.toastService.showError(response.message || 'Error al obtener equipo');
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
    return this.apiService.post<ApiResponse<Team>>(TEAM_CREATE_ENDPOINT, teamData).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.toastService.showSuccess(response.message || 'Equipo creado con éxito');
          return response.result;
        }
        this.toastService.showError(response.message || 'Error al crear equipo');
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
    return this.apiService.put<ApiResponse<Team>>(`${TEAM_UPDATE_ENDPOINT}/${teamData.id}`, teamData).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.toastService.showSuccess(response.message || 'Equipo actualizado con éxito');
          return response.result;
        }
        this.toastService.showError(response.message || 'Error al actualizar equipo');
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
    return this.apiService.delete<ApiResponse<any>>(`${TEAM_DELETE_ENDPOINT}/${teamId}`).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Equipo eliminado con éxito');
          return true;
        }
        this.toastService.showError(response.message || 'Error al eliminar equipo');
        throw new Error(response.message || 'Error al eliminar equipo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un equipo
   * @param teamId ID del equipo a eliminar
   * @returns Observable con el resultado de la operación
   */
  removeTeam(tournamentTeamId: number): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`${TEAM_REMOVE_ENDPOINT}/${tournamentTeamId}`).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Equipo eliminado con éxito');
          return true;
        }
        this.toastService.showError(response.message || 'Error al eliminar equipo');
        throw new Error(response.message || 'Error al eliminar equipo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Asigna equipos a un grupo
   * @param phaseId ID de la fase
   * @param tournamentTeams Array de IDs de equipos
   * @param tournamentGroupId ID del grupo
   * @returns Observable con el resultado de la operación
   */
  assignTeamsToGroup(phaseId: number, tournamentTeams: number[], tournamentGroupId: number): Observable<boolean> {
    const body = {
      phaseTd: phaseId,
      tournamentTeams: tournamentTeams,
      tournamentGroupId: tournamentGroupId
    };
    return this.apiService.post<ApiResponse<any>>(TEAM_ASSIGN_TO_GROUP_ENDPOINT, body).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Equipos asignados al grupo con éxito');
          return true;
        }
        this.toastService.showError(response.message || 'Error al asignar equipos al grupo');
        throw new Error(response.message || 'Error al asignar equipos al grupo');
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
    return this.apiService.post<ApiResponse<any>>(`${TEAM_REMOVE_FROM_GROUP_ENDPOINT}/${teamId}`, {}).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Equipo removido del grupo con éxito');
          return true;
        }
        this.toastService.showError(response.message || 'Error al remover equipo del grupo');
        throw new Error(response.message || 'Error al remover equipo del grupo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Descalifica un equipo
   * @param teamId ID del equipo a descalificar
   * @returns Observable con el resultado de la operación
   */
  disqualifyTeam(teamId: number): Observable<boolean> {
    return this.apiService.post<ApiResponse<any>>(`${TEAM_DISQUALIFY_ENDPOINT}/${teamId}`, {}).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Equipo descalificado con éxito');
          return true;
        }
        this.toastService.showError(response.message || 'Error al descalificar equipo');
        throw new Error(response.message || 'Error al descalificar equipo');
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
    let endpoint = `${TEAM_GET_ALL_TEAMS_ENDPOINT}/validate-name?name=${encodeURIComponent(name)}&tournamentId=${tournamentId}`;
    if (excludeTeamId) {
      endpoint += `&excludeTeamId=${excludeTeamId}`;
    }

    return this.apiService.get<{ isAvailable: boolean }>(endpoint).pipe(
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
    let endpoint = `${TEAM_GET_ALL_TEAMS_ENDPOINT}/validate-short-name?shortName=${encodeURIComponent(shortName)}&tournamentId=${tournamentId}`;
    if (excludeTeamId) {
      endpoint += `&excludeTeamId=${excludeTeamId}`;
    }

    return this.apiService.get<{ isAvailable: boolean }>(endpoint).pipe(
      map(response => response.isAvailable),
      catchError(this.handleError)
    );
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
