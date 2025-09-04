import { Injectable } from '@angular/core';
import { TournamentStatusType } from '../models/tournament.interface';

/**
 * Servicio especializado para manejar reglas de estado de torneos
 * Aplica Single Responsibility Principle - solo maneja lógica de estados
 */
@Injectable({
  providedIn: 'root'
})
export class TournamentStatusService {

  /**
   * Cache para opciones de estado para evitar recálculos innecesarios
   */
  private readonly statusOptionsCache = new Map<TournamentStatusType, Array<{value: TournamentStatusType, label: string}>>();

  constructor() {
    this.initializeCache();
  }

  /**
   * Inicializa el cache de opciones de estado
   * Optimización: Pre-calcula todas las combinaciones posibles
   */
  private initializeCache(): void {
    // Coming puede cambiar a Active y Completed
    this.statusOptionsCache.set(TournamentStatusType.Coming, [
      { value: TournamentStatusType.Active, label: 'Marcar como Activo' },
      { value: TournamentStatusType.Completed, label: 'Marcar como Completado' },
      { value: TournamentStatusType.Deleted, label: 'Eliminar' }
    ]);

    // Active solo puede cambiar a Completed
    this.statusOptionsCache.set(TournamentStatusType.Active, [
      { value: TournamentStatusType.Completed, label: 'Marcar como Completado' },
      { value: TournamentStatusType.Deleted, label: 'Eliminar' }
    ]);

    // Completed solo puede cambiar a Active
    this.statusOptionsCache.set(TournamentStatusType.Completed, [
      { value: TournamentStatusType.Active, label: 'Marcar como Activo' },
      { value: TournamentStatusType.Deleted, label: 'Eliminar' }
    ]);

    // Deleted no tiene opciones disponibles
    this.statusOptionsCache.set(TournamentStatusType.Deleted, []);
  }

  /**
   * Obtiene las opciones de estado disponibles para un torneo
   * Optimización: Usa cache pre-calculado
   */
  getStatusOptions(currentStatus: TournamentStatusType): Array<{value: TournamentStatusType, label: string}> {
    const currentStatusType = this.mapToStatusType(currentStatus);
    return this.statusOptionsCache.get(currentStatusType) || [];
  }

  /**
   * Mapea TournamentStatusType a TournamentStatusType
   * Método puro para facilitar testing
   */
  mapToStatusType(status: TournamentStatusType): TournamentStatusType {
    switch (status) {
      case TournamentStatusType.Active:
        return TournamentStatusType.Active;
      case TournamentStatusType.Completed:
        return TournamentStatusType.Completed;
      case TournamentStatusType.Coming:
        return TournamentStatusType.Coming;
      case TournamentStatusType.Deleted:
        return TournamentStatusType.Deleted;
      default:
        return TournamentStatusType.Coming;
    }
  }

  /**
   * Mapea TournamentStatusType a valor del backend
   * Método puro para facilitar testing
   */
  mapStatusTypeToBackend(statusType: TournamentStatusType): number {
    switch (statusType) {
      case TournamentStatusType.Coming:
        return 0;
      case TournamentStatusType.Active:
        return 1;
      case TournamentStatusType.Completed:
        return 2;
      case TournamentStatusType.Deleted:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Obtiene el ícono para cada tipo de estado
   * Método puro para facilitar testing
   */
  getStatusIcon(statusType: TournamentStatusType): string {
    switch (statusType) {
      case TournamentStatusType.Active:
        return 'play_circle';
      case TournamentStatusType.Coming:
        return 'schedule';
      case TournamentStatusType.Completed:
        return 'check_circle';
      case TournamentStatusType.Deleted:
        return 'delete';
      default:
        return 'help';
    }
  }

  /**
   * Obtiene la clase CSS para el menú de estados
   * Método puro para facilitar testing
   */
  getStatusMenuClass(statusType: TournamentStatusType): string {
    switch (statusType) {
      case TournamentStatusType.Active:
        return 'status-menu-active';
      case TournamentStatusType.Coming:
        return 'status-menu-coming';
      case TournamentStatusType.Completed:
        return 'status-menu-completed';
      case TournamentStatusType.Deleted:
        return 'status-menu-deleted delete-action';
      default:
        return '';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del torneo
   * Método puro para facilitar testing
   */
  getStatusClass(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'status-active';
      case TournamentStatusType.Completed:
        return 'status-completed';
      case TournamentStatusType.Coming:
        return 'status-coming';
      case TournamentStatusType.Deleted:
        return 'status-deleted';
      default:
        return '';
    }
  }

  /**
   * Obtiene el texto del estado del torneo
   * Método puro para facilitar testing
   */
  getStatusText(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'Activo';
      case TournamentStatusType.Completed:
        return 'Completado';
      case TournamentStatusType.Coming:
        return 'Próximo';
      case TournamentStatusType.Deleted:
        return 'Eliminado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Valida si un cambio de estado es permitido
   * Método puro para facilitar testing
   */
  isStatusChangeAllowed(currentStatus: TournamentStatusType, newStatus: TournamentStatusType): boolean {
    const availableOptions = this.getStatusOptions(currentStatus);
    return availableOptions.some(option => option.value === newStatus);
  }
}
