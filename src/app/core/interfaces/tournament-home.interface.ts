// Interfaces para el API GetTournamentHome

export interface TournamentHomeResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TournamentHomeData;
}

export interface TournamentHomeData {
  name: string;
  description: string;
  totalTeams: number;
  totalMatches: number;
  goals: number;
  startDate: string;
  endDate: string;
  phaseName: string;
  groupName: string;
  phaseType: number;
  status: number;
  outstandingMatch: OutstandingMatch;
  lastMatches: LastMatch[];
  bestScorers: BestScorer[];
}

export interface OutstandingMatch {
  matchDayName: string;
  homeTeamName: string;
  homeTeamLogoUrl: string;
  homeTeamPosition: number;
  awayTeamName: string;
  awayTeamLogoUrl: string;
  awayTeamPosition: number;
  matchDate: string;
  phaseName: string;
  groupName: string;
}

export interface LastMatch {
  matchDayName: string;
  homeTeamName: string;
  homeTeamLogoUrl: string;
  homeTeamPosition: number;
  awayTeamName: string;
  awayTeamLogoUrl: string;
  awayTeamPosition: number;
  matchDate: string;
  homeScore?: number;
  awayScore?: number;
}

export interface BestScorer {
  name: string;
  imageUrl: string;
  teamName: string;
  teamLogoUrl: string;
  goals: number;
}
