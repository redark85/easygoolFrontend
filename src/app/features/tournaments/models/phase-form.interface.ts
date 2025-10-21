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
  isEdit: boolean;
  categoryId: number; // ID de la categoría (obligatorio ya que las fases solo pertenecen a categorías)
}

export interface PhaseModalResult {
  action: 'create' | 'update';
  data: CreatePhaseRequest | UpdatePhaseRequest;
}

// Re-export for convenience
export type { Phase } from './phase.interface';
export { PhaseType } from './phase.interface';
