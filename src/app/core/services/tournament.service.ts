import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CreateTournamentRequest, Tournament, TournamentApiResponse } from '@features/tournaments/models/tournament.interface';
import { ApiResponse } from '../models/api.interface';
import { TOURNAMENT_CREATE_ENDPOINT, TOURNAMENT_GET_ALL_BY_USER_ENDPOINT } from '../config/endpoints';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene todos los torneos del usuario
   */
  getAllTournamentsByUser(): Observable<Tournament[]> {
    return this.apiService.get<TournamentApiResponse>(TOURNAMENT_GET_ALL_BY_USER_ENDPOINT)
      .pipe(
        map(response => response.result || [])
      );
  }

  /**
   * Crea un nuevo torneo
   */
  createTournament(request: CreateTournamentRequest): Observable<any> {
    return this.apiService.post<ApiResponse<any>>(TOURNAMENT_CREATE_ENDPOINT, request);
  }
}
