import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VOCALIA_GET_MATCH_ENDPOINT, VOCALIA_GET_AVAILABLE_PLAYERS_ENDPOINT, VOCALIA_REGISTER_MATCH_EVENT_ENDPOINT, VOCALIA_FINISH_MATCH_ENDPOINT } from '../config/endpoints';
import { ApiService } from './api.service';

export enum MatchEventType {
  InMatch = 0,
  Goal = 1,
  YellowCard = 2,
  DoubleYellowCard = 3,
  RedCard = 4,
  Substitution = 5,
  Injury = 6,
  PenaltyMissed = 7,
  Other = 8
}

export interface VocaliaPlayer {
  tournamentTeamPlayerId: number;
  name: string;
  jersey: number;
  type: number;
}

export interface AvailablePlayer {
  tournamentTeamId: number;
  fullName: string;
  jerseyNumber: number;
  tournamentTeamPlayerId: number;
  isSanctioned: boolean;
}

export interface MatchEvent {
  tournamentTeamPlayerId: number;
  eventType: MatchEventType;
  minute: number;
  description?: string;
  isHomeGoal: boolean;
}

export interface RegisterMatchEventRequest {
  matchId: number;
  events: MatchEvent[];
}

export interface VocaliaTeam {
  phaseTeamId: number;
  name: string;
  score: number;
  playerInGame: VocaliaPlayer[];
  logoUrl: string;
}

export interface VocaliaEvent {
  matchEventId: number;
  minute: number;
  description: string;
  type: number;
}

export interface VocaliaMatchData {
  matchId: number;
  tournamentId: number;
  tournamentName: string;
  homeTeam: VocaliaTeam;
  awayTeam: VocaliaTeam;
  events: VocaliaEvent[];
}

interface VocaliaMatchResponse {
  result: VocaliaMatchData;
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}

interface AvailablePlayersResponse {
  records: number;
  result: AvailablePlayer[];
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}

interface RegisterMatchEventResponse {
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}

interface FinishMatchResponse {
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VocaliaService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene los datos del partido para la vocalía
   * @param matchId ID del partido
   * @returns Observable con los datos del partido
   */
  getMatchData(matchId: number): Observable<VocaliaMatchData> {
    return this.apiService.get<VocaliaMatchResponse>(`${VOCALIA_GET_MATCH_ENDPOINT}/${matchId}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener datos del partido');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los jugadores disponibles para agregar al partido
   * @param phaseTeamId ID del equipo en la fase
   * @param tournamentId ID del torneo
   * @returns Observable con la lista de jugadores disponibles
   */
  getAvailablePlayers(phaseTeamId: number, tournamentId: number): Observable<AvailablePlayer[]> {
    return this.apiService.get<AvailablePlayersResponse>(
      `${VOCALIA_GET_AVAILABLE_PLAYERS_ENDPOINT}?phaseTeamId=${phaseTeamId}&tournamentId=${tournamentId}`
    ).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener jugadores disponibles');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Registra eventos del partido (jugadores ingresando, goles, tarjetas, etc.)
   * @param request Request con matchId y lista de eventos
   * @returns Observable con la respuesta del servidor
   */
  registerMatchEvent(request: RegisterMatchEventRequest): Observable<boolean> {
    return this.apiService.post<RegisterMatchEventResponse>(VOCALIA_REGISTER_MATCH_EVENT_ENDPOINT, request).pipe(
      map(response => {
        if (response.succeed) {
          return true;
        }
        throw new Error(response.message || 'Error al registrar eventos del partido');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Finaliza el partido
   * @param matchId ID del partido a finalizar
   * @returns Observable con la respuesta del servidor
   */
  finishMatch(matchId: number): Observable<boolean> {
    return this.apiService.post<FinishMatchResponse>(`${VOCALIA_FINISH_MATCH_ENDPOINT}/${matchId}`, {}).pipe(
      map(response => {
        if (response.succeed) {
          return true;
        }
        throw new Error(response.message || 'Error al finalizar el partido');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores de las peticiones HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en VocaliaService:', error);
    const errorMessage = error.error?.message || error.message || 'Error desconocido';
    return throwError(() => new Error(errorMessage));
  }
}
