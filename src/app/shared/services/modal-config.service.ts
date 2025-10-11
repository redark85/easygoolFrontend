import { Injectable, Type } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { MODAL_CONFIG, ModalSize } from '../constants/modal-config.constants';

@Injectable({
  providedIn: 'root'
})
export class ModalConfigService {

  constructor(private dialog: MatDialog) {}

  /**
   * Abre un modal con configuración estandarizada
   * @param component Componente a mostrar en el modal
   * @param size Tamaño del modal (SMALL, MEDIUM, LARGE, XLARGE)
   * @param data Datos a pasar al componente
   * @param options Opciones adicionales para sobrescribir configuración
   * @returns MatDialogRef del modal abierto
   */
  openModal<T, R>(
    component: Type<T>,
    size: ModalSize = 'MEDIUM',
    data?: any,
    options?: Partial<MatDialogConfig>
  ): MatDialogRef<T, R> {
    
    const config: MatDialogConfig = {
      ...MODAL_CONFIG[size],
      data,
      panelClass: ['custom-dialog-panel'],
      backdropClass: ['custom-backdrop'],
      ...options
    };
    
    return this.dialog.open(component, config);
  }

  /**
   * Abre un modal pequeño (confirmaciones, OTP)
   */
  openSmallModal<T, R>(
    component: Type<T>,
    data?: any,
    options?: Partial<MatDialogConfig>
  ): MatDialogRef<T, R> {
    return this.openModal(component, 'SMALL', data, options);
  }

  /**
   * Abre un modal mediano (formularios estándar)
   */
  openMediumModal<T, R>(
    component: Type<T>,
    data?: any,
    options?: Partial<MatDialogConfig>
  ): MatDialogRef<T, R> {
    return this.openModal(component, 'MEDIUM', data, options);
  }

  /**
   * Abre un modal grande (formularios complejos)
   */
  openLargeModal<T, R>(
    component: Type<T>,
    data?: any,
    options?: Partial<MatDialogConfig>
  ): MatDialogRef<T, R> {
    return this.openModal(component, 'LARGE', data, options);
  }

  /**
   * Abre un modal extra grande (mapas, galerías)
   */
  openXLargeModal<T, R>(
    component: Type<T>,
    data?: any,
    options?: Partial<MatDialogConfig>
  ): MatDialogRef<T, R> {
    return this.openModal(component, 'XLARGE', data, options);
  }
}
