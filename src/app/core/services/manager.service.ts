import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { MANAGER_GET_TOURNAMENT_PHASES_ENDPOINT } from '../config/endpoints';

// Interfaces
export interface TournamentGroup {
  id: number;
  name: string;
}

export interface TournamentPhase {
  id: number;
  phaseType: PhaseType;
  name: string;
  groups: TournamentGroup[];
}

export enum PhaseType {
  Groups = 0,
  Knockout = 1
}

export interface TournamentDetails {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  status: number;
  categories: CateroryDetails[];
}

export interface CateroryDetails {
  id: number;
  name: string;
  phases: TournamentPhase[];
}

export interface TournamentPhasesResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TournamentDetails;
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {

  constructor(private apiService: ApiService) { }

  /**
   * Obtiene las fases y grupos de un torneo
   * @param tournamentId ID del torneo
   * @returns Observable con los detalles del torneo incluyendo fases y grupos
   */
  getTournamentPhases(tournamentId: number): Observable<TournamentDetails> {
    return this.apiService.get<TournamentPhasesResponse>(`${MANAGER_GET_TOURNAMENT_PHASES_ENDPOINT}/${tournamentId}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener las fases del torneo');
      })
    );
  }
}
