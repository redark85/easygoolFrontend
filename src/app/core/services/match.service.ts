import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MATCH_GET_ALL_BY_GROUP_ENDPOINT, MATCH_GET_FREE_MATCHDAY_TEAMS_ENDPOINT, MATCH_CREATE_ENDPOINT } from '../config/endpoints';
import { ApiService } from './api.service';

export interface MatchDay {
  matchDayId: number;
  matchDayName: string;
  matches: MatchInfo[];
}

export interface MatchInfo {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: number;
  homeTeamLogoUrl? : string;
  awayTeamLogoUrl? : string;
}

export interface MatchesByGroupResponse {
  succeed: boolean;
  message: string;
  result: MatchDay[];
}

export interface FreeTeam {
  id: number;
  tournamentTeamId: number;
  name: string;
  shortName: string;
  logoUrl?: string;
  phaseTeamId : number;
}

export interface FreeMatchDayTeamsResponse {
  succeed: boolean;
  message: string;
  result: FreeTeam[];
}

export interface CreateMatchRequest {
  phaseId: number;
  matchDayId: number;
  homeTeamId: number;
  awayTeamId: number;
}

export interface CreateMatchResponse {
  succeed: boolean;
  message: string;
  result?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  constructor(
    private apiService: ApiService
  ) {}

  /**
   * Obtiene todos los partidos de un grupo organizados por jornadas
   * @param groupId ID del grupo
   * @returns Observable con las jornadas y partidos
   */
  getAllMatchesByGroup(groupId: number): Observable<MatchDay[]> {
    return this.apiService.get<MatchesByGroupResponse>(`${MATCH_GET_ALL_BY_GROUP_ENDPOINT}/${groupId}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener partidos del grupo');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los equipos libres para una jornada específica
   * @param groupId ID del grupo
   * @param phaseId ID de la fase
   * @param matchDayId ID de la jornada
   * @returns Observable con los equipos libres
   */
  getFreeMatchDayTeams(groupId: number, phaseId: number, matchDayId: number): Observable<FreeTeam[]> {
    return this.apiService.get<FreeMatchDayTeamsResponse>(`${MATCH_GET_FREE_MATCHDAY_TEAMS_ENDPOINT}?groupId=${groupId}&phaseId=${phaseId}&matchDayId=${matchDayId}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener equipos libres');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo partido
   * @param request Datos del partido a crear
   * @returns Observable con la respuesta de la creación
   */
  createMatch(request: CreateMatchRequest): Observable<CreateMatchResponse> {
    return this.apiService.post<CreateMatchResponse>(MATCH_CREATE_ENDPOINT, request).pipe(
      map(response => {
        if (response.succeed) {
          return response;
        }
        throw new Error(response.message || 'Error al crear el partido');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status >= 500) {
        errorMessage = 'Error interno del servidor';
      } else {
        errorMessage = error.error?.message || `Error HTTP: ${error.status}`;
      }
    }

    console.error('MatchService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
