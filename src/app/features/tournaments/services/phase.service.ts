import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { PHASE_CREATE_ENDPOINT, PHASE_GET_BY_TOURNAMENT_ENDPOINT, GROUP_CREATE_ENDPOINT } from '@core/config/endpoints';
import { ApiResponse } from '@core/models/api.interface';

import { Phase, CreatePhaseRequest, Group, CreateGroupRequest } from '../models/phase.interface';

@Injectable({
  providedIn: 'root'
})
export class PhaseService {

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) { }

  /**
   * Crea una nueva fase para un torneo específico
   * @param tournamentId ID del torneo
   * @param data Datos de la fase a crear
   * @returns Observable con la respuesta de la API
   */
  createPhase(tournamentId: number, data: CreatePhaseRequest): Observable<ApiResponse<Phase>> {
    const endpoint = `${PHASE_CREATE_ENDPOINT}/${tournamentId}`;
    return this.apiService.post<ApiResponse<Phase>>(endpoint, data).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Fase creada con éxito.');
        } else {
          this.toastService.showError(response.message || 'No se pudo crear la fase.');
        }
        return response;
      })
    );
  }

  /**
   * Obtiene todas las fases de un torneo específico
   * @param tournamentId ID del torneo
   * @returns Observable con array de fases
   */
  getPhasesByTournament(tournamentId: number): Observable<Phase[]> {
    const endpoint = `${PHASE_GET_BY_TOURNAMENT_ENDPOINT}/${tournamentId}`;
    return this.apiService.get<ApiResponse<Phase[]>>(endpoint).pipe(
      map(response => {
        if (!response.succeed) {
          this.toastService.showError(response.message || 'No se pudieron obtener las fases.');
          return [];
        }
        return response.result || [];
      })
    );
  }

  /**
   * Crea un nuevo grupo para una fase específica
   * @param phaseId ID de la fase
   * @param data Datos del grupo a crear
   * @returns Observable con la respuesta de la API
   */
  createGroup(phaseId: number, data: CreateGroupRequest): Observable<ApiResponse<Group>> {
    const endpoint = `${GROUP_CREATE_ENDPOINT}/${phaseId}`;
    return this.apiService.post<ApiResponse<Group>>(endpoint, data).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess(response.message || 'Grupo creado con éxito.');
        } else {
          this.toastService.showError(response.message || 'No se pudo crear el grupo.');
        }
        return response;
      })
    );
  }

  /**
   * Obtiene el texto descriptivo del tipo de fase
   * @param phaseType Tipo de fase
   * @returns Texto descriptivo
   */
  getPhaseTypeText(phaseType: number): string {
    switch (phaseType) {
      case 0:
        return 'Fase de Grupos';
      case 1:
        return 'Eliminatorias';
      default:
        return 'Tipo desconocido';
    }
  }

  /**
   * Obtiene las opciones disponibles para tipos de fase
   * @returns Array con opciones de tipo de fase
   */
  getPhaseTypeOptions(): Array<{value: number, label: string, description: string}> {
    return [
      {
        value: 0,
        label: 'Fase de Grupos',
        description: 'Todos contra todos - Los equipos se enfrentan entre sí dentro del grupo'
      },
      {
        value: 1,
        label: 'Eliminatorias',
        description: 'Eliminación directa - El perdedor queda eliminado del torneo'
      }
    ];
  }
}
