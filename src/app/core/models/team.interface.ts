// Team interfaces
export interface TeamTournament {
  tournamentId: number;
  tournamentName: string;
  playersCount: number;
  tournamentTeamId: number; // ID del equipo en el torneo (requerido para el API)
}

export interface ManagerTeam {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  tournaments: TeamTournament[];
}

export interface ManagerTeamsResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: ManagerTeam[];
  records: number;
}

// Tournament Category interface para el response del API TokenValidation
export interface TournamentCategory {
  id: number;
  name: string;
}

// Tournament Token Validation Response
export interface TournamentTokenValidationResult {
  id: number;
  name: string;
  imageUrl: string;
  categories: TournamentCategory[];
}
