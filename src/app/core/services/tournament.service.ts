import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CreateTournamentRequest } from '../../features/tournaments/models/tournament.interface';
import { ApiResponse } from '../models/api.interface';
import { TOURNAMENT_CREATE_ENDPOINT } from '../config/endpoints';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {

  constructor(private apiService: ApiService) {}

  /**
   * Crea un nuevo torneo
   */
  createTournament(request: CreateTournamentRequest): Observable<any> {
    return this.apiService.post<ApiResponse<any>>(TOURNAMENT_CREATE_ENDPOINT, request);
  }
}
