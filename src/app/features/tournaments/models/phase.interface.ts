import { Team } from './team.interface';

/**
 * Enum para tipos de fase
 */
export enum PhaseType {
  GroupStage = 0, // Fase de grupos, todos contra todos
  Knockout = 1    // Eliminatorias, pierde sale, 8vos de final, cuartos de final, etc.
}

/**
 * Interface para fase de torneo
 */
export interface Phase {
  id: number;
  name: string;
  phaseType: PhaseType;
  tournamentId?: number;
  groups?: Group[]; // Formato estándar
  grups?: Group[]; // Formato API alternativo
  knockoutTeams?: Team[]; // Solo para fases de eliminatorias
}

/**
 * Interface para grupo dentro de una fase
 */
export interface Group {
  id: number;
  name: string;
  phaseId: number;
  countTeams: number;
  teams?: Team[];
}

/**
 * Interface para request de creación de fase
 */
export interface CreatePhaseRequest {
  name: string;
  phaseType: PhaseType;
}

/**
 * Interface para request de actualización de fase
 */
export interface UpdatePhaseRequest {
  id: number;
  name: string;
  phaseType?: PhaseType; // Opcional en actualizaciones
}

/**
 * Interface para request de creación de grupo
 */
export interface CreateGroupRequest {
  name: string;
}
