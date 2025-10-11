// Constantes de configuración para modales - EasyGool
export const MODAL_SIZES = {
  SMALL: '450px',    // OTP, confirmaciones, login forms
  MEDIUM: '600px',   // Formularios estándar (equipos, fases, grupos)
  LARGE: '600px',    // Formularios complejos (torneos)
  XLARGE: '600px'   // Mapas, galerías
} as const;

export const MODAL_CONFIG = {
  SMALL: {
    width: MODAL_SIZES.SMALL,
    maxWidth: '90vw',
    maxHeight: '85vh',
    disableClose: true,
    autoFocus: false,
    restoreFocus: false,
    hasBackdrop: true
  },
  MEDIUM: {
    width: MODAL_SIZES.MEDIUM,
    maxWidth: '90vw',
    maxHeight: '90vh',
    disableClose: true,
    autoFocus: false,
    restoreFocus: false,
    hasBackdrop: true
  },
  LARGE: {
    width: MODAL_SIZES.LARGE,
    maxWidth: '95vw',
    maxHeight: '90vh',
    disableClose: true,
    autoFocus: false,
    restoreFocus: false,
    hasBackdrop: true
  },
  XLARGE: {
    width: MODAL_SIZES.XLARGE,
    maxWidth: '95vw',
    maxHeight: '95vh',
    disableClose: true,
    autoFocus: false,
    restoreFocus: false,
    hasBackdrop: true
  }
} as const;

// Tipos para TypeScript
export type ModalSize = keyof typeof MODAL_CONFIG;
