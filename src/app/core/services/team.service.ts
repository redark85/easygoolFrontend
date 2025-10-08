import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ManagerTeam, ManagerTeamsResponse } from '../models/team.interface';
import { MANAGER_GET_TEAMS_ENDPOINT } from '../config/endpoints';

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
}
