import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { FIXTURE_GET_ENDPOINT, FIXTURE_GET_TOURNAMENT_LIST_ENDPOINT, FIXTURE_GET_COMPLETE_FIXTURE_ENDPOINT } from '../config/endpoints';
import { ApiResponse } from '../models/api.interface';
import { CompleteFixtureResponse } from '../interfaces/fixture.interface';

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
  getFixture(categoryId:number, phaseId: number = 0, groupId: number = 0): Observable<FixtureTeam[]> {
    return this.apiService.get<FixtureResponse>(`${FIXTURE_GET_ENDPOINT}?CategoryId=${categoryId}&PhaseId=${phaseId}&GroupId=${groupId}`).pipe(
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

  /**
   * Obtiene el fixture completo con todos los partidos
   * @param phaseId ID de la fase
   * @param groupId ID del grupo (opcional)
   * @returns Observable con el fixture completo
   */
  getCompleteFixture(phaseId: number, groupId?: number): Observable<CompleteFixtureResponse> {
    let url = `${FIXTURE_GET_COMPLETE_FIXTURE_ENDPOINT}?PhaseId=${phaseId}`;
    if (groupId) {
      url += `&GroupId=${groupId}`;
    }
    
    return this.apiService.get<CompleteFixtureResponse>(url).pipe(
      map(response => {
        if (response.succeed) {
          return response;
        }
        throw new Error(response.message || 'Error al obtener el fixture completo');
      })
    );
  }
}
