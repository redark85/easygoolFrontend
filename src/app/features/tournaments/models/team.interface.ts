export enum TeamStatus {
  Active = 0,      // Activo
  Disqualified = 1, // Descalificado del campeonato
  Deleted = 2      // Eliminado lógico
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl?: string;
  status: TeamStatus;
  totalPlayers: number;
  urlRegistration: string;
  phaseTeamId: number;
  // Campos adicionales para compatibilidad
  tournamentId?: number;
  logoBase64?: string;
  logoContentType?: string;
  description?: string;
  foundationDate?: Date;
  city?: string;
  stadium?: string;
  primaryColor?: string;
  secondaryColor?: string;
  allowPlayerRegistration?: boolean;
  hasExcelUploaded?: boolean;
  manager? : Manager;
  hasUsedLink? : boolean;
}

export interface Manager{
  name: string;
  phoneNumber: string;
}

export interface CreateTeamRequest {
  tournamentId: number;
  name: string;
  shortName: string;
  logoBase64: string;
  logoContentType: string;
}

export interface UpdateTeamRequest {
  id: number;
  tournamentId: number;
  name: string;
  shortName: string;
  logoBase64: string;
  logoContentType: string;
}

export interface Player {
  tournamentTeamPlayerId: number;
  name: string;
  lastName: string;
  identification: string;
  photoUrl: string;
  jerseyNumber: number;
}

export interface TeamWithoutPhase {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  status: TeamStatus;
  totalPlayers: number;
  urlRegistration: string;
  phaseTeamId: number;
  allowPlayerRegistration: boolean;
  hasExcelUploaded: boolean;
  manager: {
    managerName: string;
    phoneNumber: string;
  };
  hasUsedLink: boolean;
  players: Player[];
}

export interface TeamsWithoutPhaseResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TeamWithoutPhase[];
  records: number;
}

export interface TeamApiResponse {
  records: number;
  result: Team[];
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}
