import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MATCH_GET_ALL_BY_GROUP_ENDPOINT } from '../config/endpoints';
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
}

export interface MatchesByGroupResponse {
  succeed: boolean;
  message: string;
  result: MatchDay[];
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  constructor(
    private apiService: ApiService,
    
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
