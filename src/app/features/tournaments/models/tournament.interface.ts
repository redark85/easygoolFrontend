/**
 * Enum para modalidad de torneo, basado en el enum de C#
 */
export enum TournamentModality {
  Five = 5,      // Fútbol Indoor
  Six = 6,       // 6 vs 6
  Seven = 7,     // 7 vs 7
  Eight = 8,     // 8 vs 8
  Nine = 9,      // 9 vs 9
  Ten = 10,      // 10 vs 10
  Eleven = 11    // Fútbol 11
}

/**
 * Enum para estado del torneo
 */
export enum TournamentStatus {
  Active = 0,
  Comming = 1,
  Completed = 2,
  Cancelled = 3 //eliminado puede ser
}

/**
 * Enum para tipos de estado del torneo (nuevo)
 */
export enum TournamentStatusType {
  Active = 0,
  Coming = 1,
  Completed = 2,
  Deleted = 3
}

/**
 * Interface para request de creación de torneo
 */
export interface CreateTournamentRequest {
  name: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  imageBase64: string;
  imageContentType: string;
  hasPenaltyMode: boolean;
  modality: TournamentModality;
  location?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface para manager del torneo en response de API
 */
export interface TournamentManager {
  managerName: string;
  phoneNumber: string;
}

/**
 * Interface para request de actualización de torneo
 */
export interface UpdateTournamentRequest {
  name: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  status: TournamentStatusType;
  allowTeamRegistration: boolean;
  imageBase64: string;
  imageContentType: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface para datos del torneo retornados por la API
 */
export interface Tournament {
  id: number;
  name: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate: string | null;
  imageUrl: string | null;
  modality: TournamentModality;
  status: TournamentStatus;
  location?: string;
  latitude?: number;
  longitude?: number;
  totalTeams: number;
  totalMatches: number;
}

/**
 * Interface para request de actualización de estado de torneo
 */
export interface UpdateTournamentStatusRequest {
  status: TournamentStatusType;
}

/**
 * Interface para response de la API de torneos
 */
export interface TournamentApiResponse {
  records: number;
  result: Tournament[];
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}
