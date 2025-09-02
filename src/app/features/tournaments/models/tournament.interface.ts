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
 * Interface para request de creación de torneo
 */
export interface CreateTournamentRequest {
  name: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
  imageBase64: string;
  imageContentType: string;
  hasPenaltyMode: boolean;
  modality: TournamentModality;
}

/**
 * Interface para manager del torneo en response de API
 */
export interface TournamentManager {
  managerName: string;
  phoneNumber: string;
}

/**
 * Interface para datos del torneo retornados por la API
 */
export interface Tournament {
  id: number;
  name: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate?: string | null;
  status: TournamentStatus;
  totalTeams: number;
  totalMatches: number;
  imageUrl?: string | null;
  modality: TournamentModality;
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
