import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '@core/services/toast.service';
import { TOURNAMENT_CREATE_ENDPOINT, TOURNAMENT_GET_ALL_BY_USER_ENDPOINT, TOURNAMENT_GET_BY_ID_ENDPOINT, TOURNAMENT_UPDATE_ENDPOINT, TOURNAMENT_UPDATE_STATUS_ENDPOINT, TOURNAMENT_CHANGE_STATUS_ENDPOINT, TOURNAMENT_DELETE_ENDPOINT } from '@core/config/endpoints';
import { ApiResponse } from '@core/models/api.interface';

import { CreateTournamentRequest, UpdateTournamentRequest, Tournament, TournamentApiResponse, TournamentStatusType, UpdateTournamentStatusRequest, ChangeStatusRequest, TournamentDetailResponse, TournamentDetail } from '../models/tournament.interface';

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

  /**
   * Obtiene todos los torneos del usuario
   * @returns Observable con array de torneos
   */
  getAllTournamentsByUser(): Observable<Tournament[]> {
    return this.apiService.get<TournamentApiResponse>(TOURNAMENT_GET_ALL_BY_USER_ENDPOINT).pipe(
      map(response => response.result || [])
    );
  }

  /**
   * Obtiene el detalle de un torneo por ID
   * @param id ID del torneo a obtener
   * @returns Observable con el detalle del torneo
   */
  getTournamentById(id: number): Observable<TournamentDetail> {
    return this.apiService.get<TournamentDetailResponse>(`${TOURNAMENT_GET_BY_ID_ENDPOINT}?id=${id}`).pipe(
      map(response => {
        if (!response.succeed) {
          this.toastService.showError(response.message || 'No se pudo obtener el detalle del torneo.');
          throw new Error(response.message || 'Error al obtener torneo');
        }
        return response.result;
      })
    );
  }

  /**
   * Actualiza un torneo existente
   * @param id ID del torneo a actualizar
   * @param data Datos del torneo a actualizar
   * @returns Observable con la respuesta de la API
   */
  updateTournament(id: number, data: UpdateTournamentRequest): Observable<ApiResponse<Tournament>> {
    return this.apiService.put<ApiResponse<Tournament>>(`${TOURNAMENT_UPDATE_ENDPOINT}/${id}`, data).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Torneo actualizado con éxito.');
        } else {
          this.toastService.showError(response.message || 'No se pudo actualizar el torneo.');
        }
        return response;
      })
    );
  }

  /**
   * Actualiza solo el estado de un torneo
   * @param id ID del torneo a actualizar
   * @param status Nuevo estado del torneo
   * @returns Observable con la respuesta de la API
   */
  updateTournamentStatus(id: number, status: TournamentStatusType): Observable<ApiResponse<Tournament>> {
    const statusData: UpdateTournamentStatusRequest = { status };
    return this.apiService.put<ApiResponse<Tournament>>(`${TOURNAMENT_UPDATE_STATUS_ENDPOINT}/${id}`, statusData).pipe(
      map(response => {
        if (response.succeed) {
          const statusText = this.getStatusText(status);
          this.toastService.showSuccess(`Estado del torneo cambiado a: ${statusText}`);
        } else {
          this.toastService.showError(response.message || 'No se pudo actualizar el estado del torneo.');
        }
        return response;
      })
    );
  }

  /**
   * Cambia el estado de un torneo usando el endpoint específico ChangeStatus
   * @param id ID del torneo
   * @param status Nuevo estado del torneo
   * @returns Observable con la respuesta de la API
   */
  changeStatus(id: number, status: TournamentStatusType): Observable<ApiResponse<Tournament>> {
    const statusData: ChangeStatusRequest = { status };
    return this.apiService.put<ApiResponse<Tournament>>(`${TOURNAMENT_CHANGE_STATUS_ENDPOINT}/${id}`, statusData).pipe(
      map(response => {
        if (response.succeed) {
          const statusText = this.getStatusText(status);
          this.toastService.showSuccess(`Estado del torneo cambiado a: ${statusText}`);
        } else {
          this.toastService.showError(response.message || 'No se pudo cambiar el estado del torneo.');
        }
        return response;
      })
    );
  }

  /**
   * Elimina un torneo de forma permanente
   * @param id ID del torneo a eliminar
   * @returns Observable con la respuesta de la API
   */
  deleteTournament(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(`${TOURNAMENT_DELETE_ENDPOINT}/${id}`).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess('Torneo eliminado con éxito.');
        } else {
          this.toastService.showError(response.message || 'No se pudo eliminar el torneo.');
        }
        return response;
      })
    );
  }

  /**
   * Obtiene el texto del estado para mostrar en mensajes
   */
  private getStatusText(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'Activo';
      case TournamentStatusType.Coming:
        return 'Próximo';
      case TournamentStatusType.Completed:
        return 'Completado';
      case TournamentStatusType.Deleted:
        return 'Eliminado';
      default:
        return 'Desconocido';
    }
  }
}
