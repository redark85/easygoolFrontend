import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '@core/services/toast.service';
import { TOURNAMENT_CREATE_ENDPOINT, TOURNAMENT_GET_ALL_BY_USER_ENDPOINT, TOURNAMENT_GET_BY_ID_ENDPOINT, TOURNAMENT_UPDATE_ENDPOINT, TOURNAMENT_UPDATE_STATUS_ENDPOINT, TOURNAMENT_CHANGE_STATUS_ENDPOINT, TOURNAMENT_DELETE_ENDPOINT, TOURNAMENT_ALLOW_REGISTER_TEAM_ENDPOINT, TOURNAMENT_GET_BY_TOKEN_ENDPOINT, TOURNAMENT_GET_TO_ALLOW_TEAM_REGISTRATION_ENDPOINT } from '@core/config/endpoints';
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
   * Obtiene información básica de un torneo por token
   * @param token Token del torneo
   * @returns Observable con información básica del torneo
   */
  getTournamentByToken(token: string ): Observable<{ id: number; name: string; imageUrl: string } | null> {
    return this.apiService.get<ApiResponse<{ id: number; name: string; imageUrl: string }>>(`${TOURNAMENT_GET_BY_TOKEN_ENDPOINT}?token=${encodeURIComponent(token)}`).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return null;
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
   * Permite o deshabilita el registro de equipos en un torneo
   * @param id ID del torneo
   * @param allow true para permitir registro, false para cerrarlo
   * @returns Observable con la respuesta de la API
   */
  allowRegisterTeam(id: number, allow: boolean): Observable<ApiResponse<any>> {
    console.log('API Call:', { id, allow, url: `${TOURNAMENT_ALLOW_REGISTER_TEAM_ENDPOINT}/${id}?allow=${allow}` });
    
    return this.apiService.post<ApiResponse<any>>(`${TOURNAMENT_ALLOW_REGISTER_TEAM_ENDPOINT}/${id}?allow=${allow}`, {}).pipe(
      map(response => {
        console.log('API Response:', response);
        if (response.succeed) {
          const statusText = allow ? 'abierto' : 'cerrado';
          this.toastService.showSuccess(`Registro de equipos ${statusText} exitosamente`);
        } else {
          this.toastService.showError(response.message || 'No se pudo cambiar el estado del registro de equipos.');
        }
        return response;
      })
    );
  }

  /**
   * Obtiene los torneos que permiten registro de equipos con sus categorías
   * @returns Observable con array de torneos disponibles incluyendo categorías
   */
  getTournamentsToAllowTeamRegistration(): Observable<{ id: number; name: string; categories: { id: number; name: string }[] }[]> {
    return this.apiService.get<ApiResponse<{ id: number; name: string; categories: { id: number; name: string }[] }[]>>(TOURNAMENT_GET_TO_ALLOW_TEAM_REGISTRATION_ENDPOINT).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return [];
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
