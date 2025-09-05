/**
 * Interface para dirección/ubicación
 */
export interface Address {
  address: string;
  mainStreet: string;
  secondStreet: string;
  latitude: string;
  longitude: string;
}

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
 * Enum para estado del torneo - Unificado
 * Valores alineados con el backend
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
  endDate?: string; // ISO 8601 format - opcional
  imageBase64: string;
  imageContentType: string;
  hasPenaltyMode: boolean;
  modality: TournamentModality;
  address?: Address;
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
  endDate?: string; // ISO 8601 format - opcional
  status: TournamentStatusType;
  allowTeamRegistration: boolean;
  imageBase64: string;
  imageContentType: string;
  address?: Address;
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
  status: TournamentStatusType;
  address?: Address;
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
 * Interface para request de cambio de estado de torneo
 */
export interface ChangeStatusRequest {
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

/**
 * Interface para el detalle completo de un torneo desde la API
 */
export interface TournamentDetail {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  status: TournamentStatusType;
  totalTeams: number;
  totalMatches: number;
  manager: TournamentManager;
  tournamentLink: string;
  hasPenaltyMode: boolean;
  allowTeamRegistration: boolean;
  modality: TournamentModality;
  address: AddressDetail;
}

/**
 * Interface para la dirección con ID en el detalle del torneo
 */
export interface AddressDetail {
  id: number;
  address: string;
  mainStreet: string;
  secondStreet: string;
  latitude: string;
  longitude: string;
}

/**
 * Interface para response de la API de detalle de torneo
 */
export interface TournamentDetailResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TournamentDetail;
}
