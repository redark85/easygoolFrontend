import { Injectable } from '@angular/core';
import { ErrorResponse, ERROR_CODE_MAPPINGS, ErrorCodeMapping } from '../models/error-response.interface';
import { ToastService } from './toast.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private toastService: ToastService) {}

  /**
   * Maneja errores basados en códigos específicos de EasyGool
   * @param error Error response del API
   * @returns true si el error fue manejado específicamente, false si debe usar manejo genérico
   */
  handleSpecificError(error: ErrorResponse): boolean {
    const errorMapping = ERROR_CODE_MAPPINGS.find(
      mapping => mapping.code === error.messageType || mapping.messageId === error.messageId
    );

    if (errorMapping) {
      this.showSpecificErrorMessage(errorMapping, error);
      return true;
    }

    return false;
  }

  /**
   * Muestra mensaje de error específico usando SweetAlert2
   * @param mapping Configuración del error
   * @param error Error response original
   */
  private showSpecificErrorMessage(mapping: ErrorCodeMapping, error: ErrorResponse): void {
    Swal.fire({
      title: mapping.title || 'Error',
      text: mapping.customMessage,
      icon: mapping.icon || 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#1976D2',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'error-popup',
        title: 'error-title'
      }
    });
  }

  /**
   * Verifica si un error es del nuevo formato con códigos específicos
   * @param error Error object
   * @returns true si es ErrorResponse con messageId y messageType
   */
  isSpecificErrorFormat(error: any): error is ErrorResponse {
    return error && 
           typeof error.result === 'boolean' &&
           typeof error.succeed === 'boolean' &&
           typeof error.message === 'string' &&
           typeof error.messageId === 'string' &&
           typeof error.messageType === 'number';
  }

  /**
   * Extrae ErrorResponse del error HTTP
   * @param httpError Error HTTP del interceptor
   * @returns ErrorResponse si existe, null si no
   */
  extractErrorResponse(httpError: any): ErrorResponse | null {
    // Verificar si el error tiene el formato esperado en el body
    if (httpError?.error && this.isSpecificErrorFormat(httpError.error)) {
      return httpError.error;
    }

    // Verificar si el error está directamente en el objeto
    if (this.isSpecificErrorFormat(httpError)) {
      return httpError;
    }

    return null;
  }

  /**
   * Maneja errores genéricos cuando no hay código específico
   * @param error Error genérico
   */
  handleGenericError(error: any): void {
    let message = 'Ha ocurrido un error inesperado';

    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    this.toastService.showError(message);
  }
}
