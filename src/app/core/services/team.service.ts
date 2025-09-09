import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Team } from '../interfaces/team.interface';
import { ApiResponse } from '../interfaces/api-response.interface';
import { EndpointsConfig } from '../config/endpoints';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los equipos de un torneo
   */
  getTeamsByTournament(tournamentId: number): Observable<Team[]> {
    const url = `${EndpointsConfig.TEAM_GET_BY_TOURNAMENT_ENDPOINT}/${tournamentId}`;
    return this.http.get<ApiResponse<Team[]>>(url).pipe(
      map(response => response.result || [])
    );
  }

  /**
   * Crea un nuevo equipo
   */
  createTeam(team: any): Observable<Team> {
    return this.http.post<ApiResponse<Team>>(EndpointsConfig.TEAM_CREATE_ENDPOINT, team).pipe(
      map(response => response.result!)
    );
  }

  /**
   * Actualiza un equipo existente
   */
  updateTeam(team: any): Observable<Team> {
    return this.http.put<ApiResponse<Team>>(EndpointsConfig.TEAM_UPDATE_ENDPOINT, team).pipe(
      map(response => response.result!)
    );
  }

  /**
   * Elimina un equipo
   */
  deleteTeam(teamId: number): Observable<void> {
    const url = `${EndpointsConfig.TEAM_DELETE_ENDPOINT}/${teamId}`;
    return this.http.delete<void>(url);
  }

  /**
   * Asigna un equipo a un grupo
   */
  assignTeamToGroup(teamId: number, groupId: number): Observable<void> {
    const url = `${EndpointsConfig.TEAM_ASSIGN_TO_GROUP_ENDPOINT}`;
    return this.http.post<void>(url, { teamId, groupId });
  }

  /**
   * Remueve un equipo de un grupo
   */
  removeTeamFromGroup(teamId: number): Observable<void> {
    const url = `${EndpointsConfig.TEAM_REMOVE_FROM_GROUP_ENDPOINT}/${teamId}`;
    return this.http.delete<void>(url);
  }
}
