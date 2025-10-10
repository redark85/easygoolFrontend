import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { FIXTURE_GET_ENDPOINT, FIXTURE_GET_TOURNAMENT_LIST_ENDPOINT } from '../config/endpoints';
import { ApiResponse } from '../models/api.interface';

export interface FixtureTeam {
  position: number;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  lastFiveResults: string[];
}

export interface FixtureResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: FixtureTeam[];
  records: number;
}

export interface TournamentListItem {
  id: number;
  name: string;
  status: number;
  imageUrl: string;
}

export interface TournamentListResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TournamentListItem[];
  records: number;
}

@Injectable({
  providedIn: 'root'
})
export class FixtureService {

  constructor(private apiService: ApiService) { }

  /**
   * Obtiene la tabla de posiciones (fixture)
   * @param phaseId ID de la fase
   * @param groupId ID del grupo
   * @returns Observable con la tabla de posiciones
   */
  getFixture(phaseId: number, groupId: number): Observable<FixtureTeam[]> {
    return this.apiService.get<FixtureResponse>(`${FIXTURE_GET_ENDPOINT}?PhaseId=${phaseId}&GroupId=${groupId}`).pipe(
      map(response => {
              if (response.succeed && response.result) {
                return response.result;
              }
              throw new Error(response.message || 'Error al obtener partidos del grupo');
            }),
    );
  }

  /**
   * Obtiene la lista de torneos disponibles
   * @returns Observable con la lista de torneos
   */
  getTournamentList(): Observable<TournamentListItem[]> {
    return this.apiService.get<TournamentListResponse>(FIXTURE_GET_TOURNAMENT_LIST_ENDPOINT).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener la lista de torneos');
      })
    );
  }
}
