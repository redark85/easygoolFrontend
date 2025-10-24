/**
 * Interfaces para el detalle del equipo del manager
 */

export interface TopScorer {
  name: string;
  goals: number;
}

export interface NextMatch {
  matchId: number;
  matchDate: string;
  opponent: string;
  isHome: boolean;
  homeScore: number;
  awayScore: number;
  phaseName: string;
  status: number;
  imageUrl?: string;
}

export interface TeamDetail {
  teamName: string;
  logoUrl: string;
  position: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  pointsPerMatch: number;
  effectiveness: number;
  shortName: string;
  groupName: string;
  totalPlayers: number;
  topScorer: TopScorer;
  nextMatch: NextMatch;
  tournamentTeamId : number;
}

export interface TeamDetailResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TeamDetail;
}
