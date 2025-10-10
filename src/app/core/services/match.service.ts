import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MATCH_GET_ALL_BY_GROUP_ENDPOINT, MATCH_GET_FREE_MATCHDAY_TEAMS_ENDPOINT, MATCH_CREATE_ENDPOINT, MATCH_CREATE_MATCHDAY_ENDPOINT, MATCH_CREATE_RANDOM_ENDPOINT, MATCH_CREATE_RANDOM_FOR_MATCHDAY_ENDPOINT, MATCH_DELETE_ENDPOINT, MATCH_DELETE_MATCHDAY_ENDPOINT, MATCH_GET_ALL_BY_PHASE_ENDPOINT, MATCH_UPDATE_DATE_ENDPOINT } from '../config/endpoints';
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
  matchTime?: string;
  status: MatchStatusType;
  homeTeamLogoUrl? : string;
  awayTeamLogoUrl? : string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
}

export enum MatchStatusType {
  scheduled, //Programado
  inProgress, //En curso, se esta jugando
  finished, //Jugado
  canceled, //Cancelado // eliminado
  postponed //Portergado
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

export interface CreateRandomMatchesRequest {
  phaseId: number;
  groupId: number;
}

export interface CreateRandomMatchesForMatchDayRequest {
  phaseId: number;
  groupId: number;
  matchDayId : number;
}

export interface CreateRandomMatchesResponse {
  succeed: boolean;
  message: string;
  result?: any;
}

export interface DeleteMatchResponse {
  succeed: boolean;
  message: string;
  result?: any;
}

export interface DeleteMatchDayResponse {
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
   * Obtiene todos los partidos de un grupo organizados por jornadas
   * @param groupId ID del grupo
   * @returns Observable con las jornadas y partidos
   */
  getAllMatchesByPhase(phaseId: number): Observable<MatchDay[]> {
    return this.apiService.get<MatchesByGroupResponse>(`${MATCH_GET_ALL_BY_PHASE_ENDPOINT}/${phaseId}`).pipe(
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
   * Crea una nueva jornada para un grupo
   * @param phaseId ID de la fase
   * @param groupId ID del grupo
   * @returns Observable con la respuesta de la creación
   */
  createMatchDay(phaseId: number, groupId: number): Observable<CreateMatchResponse> {
    return this.apiService.post<CreateMatchResponse>(`${MATCH_CREATE_MATCHDAY_ENDPOINT}?phaseId=${phaseId}&groupId=${groupId}`, {}).pipe(
      map(response => {
        if (response.succeed) {
          return response;
        }
        throw new Error(response.message || 'Error al crear la jornada');
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
   * Genera partidos aleatorios para una fase y grupo
   * @param request Datos de la fase y grupo
   * @returns Observable con la respuesta de la generación
   */
  createRandomMatches(request: CreateRandomMatchesRequest): Observable<CreateRandomMatchesResponse> {
    return this.apiService.post<CreateRandomMatchesResponse>(MATCH_CREATE_RANDOM_ENDPOINT, request).pipe(
      map(response => {
        if (response.succeed) {
          return response;
        }
        throw new Error(response.message || 'Error al generar partidos aleatorios');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Genera partidos aleatorios para una fase, grupo y jornada
   * @param request Datos de la fase y grupo
   * @returns Observable con la respuesta de la generación
   */
  createRandomMatchesForMatchDay(request: CreateRandomMatchesForMatchDayRequest): Observable<CreateRandomMatchesResponse> {
    return this.apiService.post<CreateRandomMatchesResponse>(MATCH_CREATE_RANDOM_FOR_MATCHDAY_ENDPOINT, request).pipe(
      map(response => {
        if (response.succeed) {
          return response;
        }
        throw new Error(response.message || 'Error al generar partidos aleatorios');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un partido
   * @param matchId ID del partido a eliminar
   * @returns Observable con la respuesta de la eliminación
   */
  deleteMatch(matchId: number): Observable<DeleteMatchResponse> {
    return this.apiService.delete<DeleteMatchResponse>(`${MATCH_DELETE_ENDPOINT}/${matchId}`).pipe(
      map(response => {
        if (response.succeed) {
          return response;
        }
        throw new Error(response.message || 'Error al eliminar el partido');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una jornada completa
   * @param matchDayId ID de la jornada a eliminar
   * @returns Observable con la respuesta de la eliminación
   */
  deleteMatchDay(matchDayId: number): Observable<DeleteMatchDayResponse> {
    return this.apiService.delete<DeleteMatchDayResponse>(`${MATCH_DELETE_MATCHDAY_ENDPOINT}?matchDayId=${matchDayId}`).pipe(
      map(response => {
        if (response.succeed) {
          return response;
        }
        throw new Error(response.message || 'Error al eliminar la jornada');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza la fecha de un partido
   * @param matchId ID del partido
   * @param matchDate Nueva fecha del partido
   * @returns Observable con el resultado de la operación
   */
  updateMatchDate(matchId: number, matchDate: string): Observable<boolean> {
    const request = { matchDate };
    return this.apiService.put<any>(`${MATCH_UPDATE_DATE_ENDPOINT}/${matchId}`, request).pipe(
      map(response => {
        if (response.succeed) {
          return true;
        }
        return false;
      }),
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
