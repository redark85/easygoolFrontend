import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiResponse } from '../../../core/models/api.interface';
import {
  Player,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  PLAYER_POSITIONS,
  PlayerPositionOption
} from '../../../core/models/player.interface';

/**
 * Request para agregar un jugador existente a un equipo
 */
export interface AddTeamPlayerRequest {
  playerId: number;
  tournamentTeamId: number;
  position: string;
  jerseyNumber: number;
}
import {
  PLAYER_CREATE_ENDPOINT,
  PLAYER_GET_BY_TEAM_ENDPOINT,
  PLAYER_UPDATE_ENDPOINT,
  PLAYER_REMOVE_ENDPOINT,
  PLAYER_GET_BY_IDENTIFICATION_ENDPOINT,
  PLAYER_ADD_TEAM_PLAYER_ENDPOINT
} from '../../../core/config/endpoints';

/**
 * Servicio para gestión de jugadores
 * Implementa principios SOLID:
 * - SRP: Responsabilidad única de gestionar jugadores
 * - DIP: Depende de abstracciones (ApiService, ToastService)
 */
@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Obtiene todos los jugadores de un equipo
   * @param teamId ID del equipo
   * @returns Observable con lista de jugadores
   */
  getPlayersByTeam(teamId: number): Observable<Player[]> {
    const url = `${PLAYER_GET_BY_TEAM_ENDPOINT}/${teamId}`;

    return this.apiService.get<ApiResponse<Player[]>>(url).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener jugadores');
      }),
      catchError(error => {
        console.error('Error getting players by team:', error);
        this.toastService.showError('Error al cargar jugadores del equipo');
        return throwError(() => error);
      })
    );
  }

  /**
   * Crea un nuevo jugador
   * @param playerData Datos del jugador a crear
   * @returns Observable con el jugador creado
   */
  createPlayer(playerData: CreatePlayerRequest): Observable<Player> {
    return this.apiService.post<ApiResponse<Player>>(PLAYER_CREATE_ENDPOINT, playerData).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.toastService.showSuccess('Jugador creado exitosamente');
          return response.result;
        }
        throw new Error(response.message || 'Error al crear jugador');
      }),
      catchError(error => {
        console.error('Error creating player:', error);
        const errorMessage = this.getErrorMessage(error);
        this.toastService.showError(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza un jugador existente
   * @param playerData Datos actualizados del jugador (incluye tournamentTeamPlayerId)
   * @returns Observable con el jugador actualizado
   */
  updatePlayer(playerData: UpdatePlayerRequest): Observable<Player> {
    console.log('PlayerService.updatePlayer called with:', {
      url: PLAYER_UPDATE_ENDPOINT,
      playerData
    });
    
    return this.apiService.post<ApiResponse<Player>>(PLAYER_UPDATE_ENDPOINT, playerData).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.toastService.showSuccess('Jugador actualizado exitosamente');
          return response.result;
        }
        throw new Error(response.message || 'Error al actualizar jugador');
      }),
      catchError(error => {
        console.error('Error updating player:', error);
        const errorMessage = this.getErrorMessage(error);
        this.toastService.showError(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un jugador
   * @param playerId ID del jugador a eliminar
   * @returns Observable con resultado de la eliminación
   */
  deletePlayer(playerId: number): Observable<any> {
    const url = `${PLAYER_REMOVE_ENDPOINT}/${playerId}`;

    return this.apiService.delete<ApiResponse<any>>(url).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess('Jugador eliminado exitosamente');
          return response;
        }
        throw new Error(response.message || 'Error al eliminar jugador');
      }),
      catchError(error => {
        console.error('Error deleting player:', error);
        const errorMessage = this.getErrorMessage(error);
        this.toastService.showError(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene las opciones de posiciones disponibles
   * @returns Array de opciones de posiciones
   */
  getPlayerPositions(): PlayerPositionOption[] {
    return PLAYER_POSITIONS;
  }

  /**
   * Obtiene el texto de una posición
   * @param position Posición del jugador
   * @returns Texto de la posición
   */
  getPositionText(position: string): string {
    const positionOption = PLAYER_POSITIONS.find(p => p.value === position);
    return positionOption?.label || position;
  }

  /**
   * Obtiene el ícono de una posición
   * @param position Posición del jugador
   * @returns Ícono de la posición
   */
  getPositionIcon(position: string): string {
    const positionOption = PLAYER_POSITIONS.find(p => p.value === position);
    return positionOption?.icon || 'person';
  }

  /**
   * Valida si un número de camiseta está disponible
   * @param jerseyNumber Número de camiseta
   * @param players Lista de jugadores existentes
   * @param excludePlayerId ID del jugador a excluir (para edición)
   * @returns true si está disponible
   */
  isJerseyNumberAvailable(
    jerseyNumber: number,
    players: Player[],
    excludePlayerId?: number
  ): boolean {
    return !players.some(player =>
      player.jerseyNumber === jerseyNumber &&
      player.id !== excludePlayerId
    );
  }

  /**
   * Obtiene un jugador por su número de identificación
   * @param identificationNumber Número de identificación del jugador
   * @returns Observable con los datos del jugador o null
   */
  getPlayerByIdentification(identificationNumber: string): Observable<Player | null> {
    const url = `${PLAYER_GET_BY_IDENTIFICATION_ENDPOINT}?identificationNumber=${identificationNumber}`;

    return this.apiService.get<ApiResponse<Player>>(url).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error getting player by identification:', error);
        // No mostrar toast de error aquí, solo retornar null
        return throwError(() => null);
      })
    );
  }

  /**
   * Agrega un jugador existente a un equipo
   * @param request Datos para agregar el jugador al equipo
   * @returns Observable con el jugador agregado
   */
  addTeamPlayer(request: AddTeamPlayerRequest): Observable<Player> {
    return this.apiService.post<ApiResponse<Player>>(PLAYER_ADD_TEAM_PLAYER_ENDPOINT, request).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.toastService.showSuccess('Jugador agregado al equipo exitosamente');
          return response.result;
        }
        throw new Error(response.message || 'Error al agregar jugador al equipo');
      })
    );
  }

  /**
   * Obtiene el nombre completo de un jugador
   * @param player Jugador
   * @returns Nombre completo
   */
  getPlayerFullName(player: Player): string {
    const names = [player.name, player.secondName].filter(n => n?.trim()).join(' ');
    const lastNames = [player.lastName, player.secondLastName].filter(n => n?.trim()).join(' ');
    return `${names} ${lastNames}`.trim();
  }

  /**
   * Extrae mensaje de error personalizado
   * @param error Error recibido
   * @returns Mensaje de error apropiado
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    // Errores específicos de jugadores
    if (error?.status === 400) {
      return 'Datos del jugador inválidos. Verifique la información ingresada.';
    }

    if (error?.status === 409) {
      return 'Ya existe un jugador con ese número de camiseta o identificación.';
    }

    return 'Error al procesar la solicitud. Intente nuevamente.';
  }
}
