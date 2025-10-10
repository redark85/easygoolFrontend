import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { FIXTURE_GET_ENDPOINT } from '../config/endpoints';
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
}

export interface FixtureResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: FixtureTeam[];
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
}
