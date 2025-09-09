export interface Team {
  id: number;
  tournamentId?: number;
  name: string;
  shortName: string;
  logoUrl?: string;
  logoBase64?: string;
  logoContentType?: string;
  status?: number;
  totalPlayers?: number;
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
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: Team[];
  records: number;
}
