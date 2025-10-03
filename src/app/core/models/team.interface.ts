// Team interfaces
export interface TeamTournament {
  tournamentId: number;
  tournamentName: string;
  playersCount: number;
}

export interface ManagerTeam {
  id: number;
  teamName: string;
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
