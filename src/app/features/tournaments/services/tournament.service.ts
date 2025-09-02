import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ApiResponse } from '@core/models/api.interface';
import { TOURNAMENT_CREATE_ENDPOINT } from '@core/config/endpoints';

import { CreateTournamentRequest, Tournament } from '../models/tournament.interface';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) { }

  /**
   * Crea un nuevo torneo enviando POST request a la API
   * @param data Datos del torneo a crear
   * @returns Observable con la respuesta de la API
   */
  createTournament(data: CreateTournamentRequest): Observable<ApiResponse<Tournament>> {
    return this.apiService.post<ApiResponse<Tournament>>(TOURNAMENT_CREATE_ENDPOINT, data).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Torneo creado con éxito.');
        } else {
          this.toastService.showError(response.message || 'No se pudo crear el torneo.');
        }
        return response;
      })
    );
  }
}
