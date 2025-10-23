import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.interface';
import { ManagerTeam, ManagerTeamsResponse, TournamentTokenValidationResult, TournamentCategory } from '../models/team.interface';
import { MANAGER_GET_TEAMS_ENDPOINT, MANAGER_TOKEN_VALIDATION_ENDPOINT, MANAGER_GET_ALL_TEAMS_ENDPOINT, MANAGER_REGISTER_TOURNAMENT_TEAM_ENDPOINT } from '../config/endpoints';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene los equipos del manager autenticado
   */
  getManagerTeams(): Observable<ManagerTeam[]> {
    return this.apiService.get<ManagerTeamsResponse>(MANAGER_GET_TEAMS_ENDPOINT).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return [];
      })
    );
  }

  /**
   * Valida un token de torneo y obtiene información del torneo incluyendo categorías
   * @param token Token del torneo a validar
   * @returns Observable con la información del torneo y sus categorías
   */
  validateTournamentToken(token: string): Observable<TournamentTokenValidationResult | null> {
    return this.apiService.get<ApiResponse<TournamentTokenValidationResult>>(`${MANAGER_TOKEN_VALIDATION_ENDPOINT}?token=${encodeURIComponent(token)}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return null;
      })
    );
  }

  /**
   * Obtiene las categorías de un torneo específico usando el token
   * @param token Token del torneo
   * @returns Observable con las categorías del torneo
   */
  getTournamentCategories(token: string): Observable<TournamentCategory[]> {
    return this.validateTournamentToken(token).pipe(
      map(result => {
        if (result && result.categories) {
          return result.categories;
        }
        return [];
      })
    );
  }

  /**
   * Obtiene todos los equipos del manager (sin filtro de torneo)
   * @returns Observable con array de equipos
   */
  getAllManagerTeams(): Observable<ManagerTeam[]> {
    return this.apiService.get<ManagerTeamsResponse>(MANAGER_GET_ALL_TEAMS_ENDPOINT).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return [];
      })
    );
  }

  /**
   * Registra un equipo existente en un torneo
   * @param tournamentId ID del torneo
   * @param teamId ID del equipo a registrar
   * @returns Observable con la respuesta
   */
  registerTournamentTeam(tournamentId: number, teamId: number): Observable<void> {
    const body = { tournamentId, teamId };
    return this.apiService.post<ApiResponse<void>>(MANAGER_REGISTER_TOURNAMENT_TEAM_ENDPOINT, body).pipe(
      map(response => {
        if (!response.succeed) {
          throw new Error(response.message || 'Error al registrar equipo en el torneo');
        }
        return void 0;
      })
    );
  }
}
