/**
 * Interfaces para el API de Tournament Teams Summary
 */

export interface TournamentTeamsSummaryParams {
  phaseId: number;
  groupId: number;
}

export interface TeamSummary {
  teamName: string;
  teamLogoUrl: string;
  groupName: string;
  points: number;
  playersCount: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  wins: number;
  draws: number;
  losses: number;
  position: number;
  tournamentTeamId : number;
}

export interface TournamentTeamsSummaryData {
  totalTeams: number;
  totalPlayers: number;
  totalGoals: number;
  goalsAverage: number;
  teams: TeamSummary[];
}

export interface TournamentTeamsSummaryApiResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TournamentTeamsSummaryData;
}
