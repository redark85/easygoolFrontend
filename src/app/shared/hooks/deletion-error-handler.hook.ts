import { Injectable } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

export interface ErrorResponse {
  result: boolean;
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: number | null;
  response: ErrorResponses;
}

export interface ErrorResponses{
  data: ErrorData;
}

export interface ErrorData{
  message: string | null;
  messageId: string | null;
}


export interface ErrorConfig {
  entityName: string;
  customMessages?: { [messageId: string]: string };
  showGenericError?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeletionErrorHandlerHook {

  constructor(private toastService: ToastService) {}

  /**
   * Maneja errores de eliminación con mensajes personalizados basados en messageId
   * @param error Respuesta de error del backend
   * @param config Configuración para el manejo del error
   * @returns true si se manejó el error, false si debe continuar con el flujo normal
   */
  handleResponseError(error: ErrorResponse, config: ErrorConfig): boolean {
    if (!error || error.succeed) {
      return false; // No hay error que manejar
    }
    // Mapeo de mensajes de error comunes
    const commonErrorMessages: { [messageId: string]: string } = {
      'EGOL_106': `Ya existe una cuenta vinculada con esta direción de correo.`,
      'EGOL_112': `No se puede eliminar el ${config.entityName.toLowerCase()} porque tiene partidos programados.`,
      'EGOL_113': `No se puede eliminar el ${config.entityName.toLowerCase()} porque pertenece a una fase activa.`,
      'EGOL_114': `No se puede eliminar el ${config.entityName.toLowerCase()} porque tiene equipos asignados.`,
      'EGOL_115': `No se puede eliminar el ${config.entityName.toLowerCase()} porque tiene partidos programados.`,
      'EGOL_116': `No se puede eliminar el ${config.entityName.toLowerCase()} porque está siendo utilizado en el torneo.`,
      'EGOL_117': `No se puede eliminar el ${config.entityName.toLowerCase()} porque tiene dependencias activas.`,
      'EGOL_118': `El código ingresado no es válido.`,
      'EGOL_119': `El código ingresado ha vencido.`,
      'EGOL_120': `El ususario no ha validado su cuenta de correo.`
    };

    // Combinar mensajes comunes con mensajes personalizados
    const allMessages = { ...commonErrorMessages, ...(config.customMessages || {}) };

    // Buscar mensaje específico por messageId
    let errorMessage = error.response.data.messageId ? allMessages[error.response.data.messageId] : undefined;

    // Si no hay mensaje específico, usar el mensaje del backend o uno genérico
    if (!errorMessage) {
      if (error.message && error.message.trim()) {
        errorMessage = error.message;
      } else if (config.showGenericError !== false) {
        errorMessage = `No se puede eliminar el ${config.entityName.toLowerCase()}. Verifique que no tenga dependencias activas.`;
      } else {
        return false; // No mostrar error genérico
      }
    }

    // Mostrar mensaje de error
    this.toastService.showError(errorMessage);

    // Log para debugging
    console.warn('Deletion error handled:', {
      messageId: error.messageId,
      messageType: error.messageType,
      originalMessage: error.message,
      displayedMessage: errorMessage,
      entityName: config.entityName
    });

    return true; // Error manejado
  }

  /**
   * Maneja la respuesta completa de eliminación
   * @param response Respuesta del backend
   * @param config Configuración para el manejo del error
   * @returns true si la eliminación fue exitosa, false si hubo error
   */
  handleResponse(response: ErrorResponse, config: ErrorConfig): boolean {
    if (response.succeed) {
      this.toastService.showSuccess(`${config.entityName} eliminado correctamente`);
      return true;
    } else {
      this.handleResponseError(response, config);
      return false;
    }
  }

  /**
   * Crea una configuración básica para el manejo de errores
   * @param entityName Nombre de la entidad (ej: "Equipo", "Fase", "Grupo")
   * @param customMessages Mensajes personalizados opcionales
   * @returns Configuración para el hook
   */
  createConfig(entityName: string, customMessages?: { [messageId: string]: string }): ErrorConfig {
    return {
      entityName,
      customMessages,
      showGenericError: true
    };
  }
}
