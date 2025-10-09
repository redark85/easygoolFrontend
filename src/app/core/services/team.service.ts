import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.interface';
import { ManagerTeam, ManagerTeamsResponse } from '../models/team.interface';
import { MANAGER_GET_TEAMS_ENDPOINT, MANAGER_TOKEN_VALIDATION_ENDPOINT } from '../config/endpoints';

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
   * Valida un token de torneo y obtiene información del torneo
   * @param token Token del torneo a validar
   * @returns Observable con la información del torneo
   */
  validateTournamentToken(token: string): Observable<{ id: number; name: string; imageUrl: string } | null> {
    return this.apiService.get<ApiResponse<{ id: number; name: string; imageUrl: string }>>(`${MANAGER_TOKEN_VALIDATION_ENDPOINT}?token=${encodeURIComponent(token)}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return null;
      })
    );
  }
}
