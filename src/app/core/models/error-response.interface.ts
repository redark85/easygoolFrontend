/**
 * Interface para respuestas de error del API con códigos específicos
 */
export interface ErrorResponse {
  result: boolean;
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
}

/**
 * Enum con códigos de error específicos de EasyGool
 */
export enum EasyGoolErrorCode {
  PHASE_HAS_GROUPS = 111,
  TEAM_BELONGS_TO_PHASE = 113
}

/**
 * Interface para mapear códigos de error a mensajes personalizados
 */
export interface ErrorCodeMapping {
  code: number;
  messageId: string;
  customMessage: string;
  title?: string;
  icon?: 'error' | 'warning' | 'info';
}

/**
 * Configuración de mensajes de error personalizados
 */
export const ERROR_CODE_MAPPINGS: ErrorCodeMapping[] = [
  {
    code: EasyGoolErrorCode.PHASE_HAS_GROUPS,
    messageId: 'EGOL_111',
    title: 'No se puede eliminar la fase',
    customMessage: 'Esta fase tiene grupos asignados. Debes eliminar todos los grupos primero antes de eliminar la fase.',
    icon: 'warning'
  },
  {
    code: EasyGoolErrorCode.TEAM_BELONGS_TO_PHASE,
    messageId: 'EGOL_113',
    title: 'No se puede eliminar el equipo',
    customMessage: 'Este equipo pertenece a una fase del torneo. Debes remover el equipo de la fase antes de eliminarlo.',
    icon: 'warning'
  }
];
