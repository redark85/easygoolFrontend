import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FIXTURE_GET_TOURNAMENT_HOME_ENDPOINT } from '@core/config/endpoints';
import { TournamentHomeResponse } from '@core/interfaces/tournament-home.interface';
import {ApiService} from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class TournamentHomeService {

  constructor(
    private apiService: ApiService
  ) {}

  /**
   * Obtiene los datos del home del torneo
   * @param tournamentId ID del torneo
   * @param phaseId ID de la fase
   * @param groupId ID del grupo (0 si no tiene grupos)
   * @returns Observable con los datos del home del torneo
   */
  getTournamentHome(tournamentId: number,categoryId:number, phaseId: number = 0, groupId: number = 0): Observable<TournamentHomeResponse> {
    const url = `${FIXTURE_GET_TOURNAMENT_HOME_ENDPOINT}/${tournamentId}?CategoryId=${categoryId}&PhaseId=${phaseId}&GroupId=${groupId}`;
    return this.apiService.get<TournamentHomeResponse>(url);
  }
}
