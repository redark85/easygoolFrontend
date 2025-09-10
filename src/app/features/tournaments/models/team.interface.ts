export interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl?: string;
  status: number;
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

export interface TeamApiResponse {
  records: number;
  result: Team[];
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}
