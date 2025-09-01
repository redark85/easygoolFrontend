import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Utilidades para validación de teléfonos de Ecuador
 * Siguiendo principios SOLID - SRP (Single Responsibility Principle)
 */
export class PhoneValidatorUtil {
  
  /**
   * Formatea un número de teléfono ecuatoriano
   * @param phone - Número de teléfono sin formato
   * @returns Número formateado (09XX-XXX-XXX) o string vacío si es inválido
   */
  static formatEcuadorianPhone(phone: string): string {
    if (!phone) return '';
    
    // Remover todos los caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Validar que tenga exactamente 10 dígitos y empiece con 09
    if (cleanPhone.length === 10 && cleanPhone.startsWith('09')) {
      return `${cleanPhone.substring(0, 2)}-${cleanPhone.substring(2, 5)}-${cleanPhone.substring(5, 8)}-${cleanPhone.substring(8)}`;
    }
    
    return cleanPhone;
  }

  /**
   * Valida si un número de teléfono ecuatoriano es válido
   * @param phone - Número de teléfono a validar
   * @returns true si es válido, false si no
   */
  static isValidEcuadorianPhone(phone: string): boolean {
    if (!phone) return false;
    
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10 && cleanPhone.startsWith('09');
  }

  /**
   * Validador de Angular para teléfonos ecuatorianos
   * @returns ValidatorFn para usar en FormControl
   */
  static ecuadorianPhoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // No validar si está vacío (usar required por separado)
      }
      
      const isValid = PhoneValidatorUtil.isValidEcuadorianPhone(control.value);
      return isValid ? null : { 
        ecuadorianPhone: { 
          message: 'El teléfono debe tener 10 dígitos y empezar con 09',
          actualValue: control.value 
        } 
      };
    };
  }

  /**
   * Limpia el input permitiendo solo números
   * @param event - Evento del input
   * @returns true si el carácter es válido, false si no
   */
  static allowOnlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    
    // Permitir: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1 ||
        // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (charCode === 65 && event.ctrlKey) ||
        (charCode === 67 && event.ctrlKey) ||
        (charCode === 86 && event.ctrlKey) ||
        (charCode === 88 && event.ctrlKey)) {
      return true;
    }
    
    // Permitir solo números (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }

  /**
   * Obtiene el mensaje de error para validación de teléfono
   * @param control - FormControl con el error
   * @returns Mensaje de error apropiado
   */
  static getPhoneErrorMessage(control: AbstractControl): string {
    if (control.hasError('required')) {
      return 'El teléfono es requerido';
    }
    
    if (control.hasError('ecuadorianPhone')) {
      return 'El teléfono debe tener 10 dígitos y empezar con 09';
    }
    
    return '';
  }
}
