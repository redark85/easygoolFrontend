export interface Team {
  tournamentId: number;
  name: string;
  shortName: string;
  logoBase64: string;
  logoContentType: string;
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
