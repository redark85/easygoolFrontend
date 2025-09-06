import type { Phase } from './phase.interface';
import { PhaseType } from './phase.interface';

export interface CreatePhaseRequest {
  name: string;
  phaseType: number;
}

export interface UpdatePhaseRequest {
  id: number;
  name: string;
  phaseType: number;
}

export interface PhaseFormData {
  phase?: Phase;
  tournamentId: number;
  isEdit: boolean;
}

export interface PhaseModalResult {
  action: 'create' | 'update';
  data: CreatePhaseRequest | UpdatePhaseRequest;
}

// Re-export for convenience
export type { Phase } from './phase.interface';
export { PhaseType } from './phase.interface';
