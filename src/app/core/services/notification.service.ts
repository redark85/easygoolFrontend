import { Injectable } from '@angular/core';

// Servicio de notificaciones simple sin dependencias externas
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  /**
   * Muestra una notificación de error
   * @param message - Mensaje de error
   */
  showError(message: string): void {
    // Implementación simple con alert por ahora
    // Se puede reemplazar con toast library más adelante
    alert(`Error: ${message}`);
  }

  /**
   * Muestra una notificación de éxito
   * @param message - Mensaje de éxito
   */
  showSuccess(message: string): void {
    alert(`Éxito: ${message}`);
  }

  /**
   * Muestra una notificación informativa
   * @param message - Mensaje informativo
   */
  showInfo(message: string): void {
    alert(`Info: ${message}`);
  }
}
