import type { Group } from './phase.interface';

export interface CreateGroupRequest {
  name: string;
}

export interface UpdateGroupRequest {
  id: number;
  name: string;
}

export interface GroupFormData {
  group?: Group;
  phaseId: number;
  tournamentId: number;
  isEdit: boolean;
}

export interface GroupModalResult {
  action: 'create' | 'update';
  data: CreateGroupRequest | UpdateGroupRequest;
}

// Re-export Group interface for convenience
export type { Group } from './phase.interface';
