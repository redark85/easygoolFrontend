import { Player } from "@core/models/player.interface";

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
  categoryId?: number; // ID de la categoría seleccionada
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
  tournamentTeamId : number;
  players : Player[];
  allowUpdateInfo: boolean;
}

export interface Manager{
  managerName: string;
  phoneNumber: string;
  email?: string;
}

export interface CreateTeamRequest {
  tournamentId: number;
  categoryId: number; // Obligatorio - ID de la categoría seleccionada
  name: string;
  shortName: string;
  logoBase64?: string | null;
  logoContentType: string | null;
}

export interface UpdateTeamRequest {
  id: number;
  tournamentId: number;
  categoryId?: number; // Opcional para compatibilidad
  name: string;
  shortName: string;
  logoBase64: string | null;
  logoContentType: string | null;
}

export interface RegisterTournamentTeamRequest {
  tournamentId: number;
  teamId: number;
  categoryId: number; // Obligatorio - ID de la categoría seleccionada
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
  tournamentTeamId: number;
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
