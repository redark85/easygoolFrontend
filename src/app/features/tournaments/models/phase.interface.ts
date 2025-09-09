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
  grups?: Group[]; // Nota: API usa 'grups' no 'groups'
}

/**
 * Interface para grupo dentro de una fase
 */
export interface Group {
  id: number;
  name: string;
  phaseId: number;
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
 * Interface para request de creación de grupo
 */
export interface CreateGroupRequest {
  name: string;
}
