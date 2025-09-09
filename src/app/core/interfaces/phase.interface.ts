export interface Phase {
  id: number;
  name: string;
  phaseType: PhaseType;
  tournamentId: number;
  grups?: Group[];
  createdAt: string;
  updatedAt?: string;
}

export interface Group {
  id: number;
  name: string;
  phaseId: number;
  teams?: {
    id: number;
    name: string;
    shortName: string;
    logoBase64?: string;
    logoContentType?: string;
  }[];
  createdAt: string;
  updatedAt?: string;
}

export enum PhaseType {
  GroupStage = 1,
  Knockout = 2
}
