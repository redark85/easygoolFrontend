export interface PublicMatchDetailResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: PublicMatchDetailResult;
}

export interface PublicMatchDetailResult {
  matchInfo: MatchInfo;
  events: MatchEvent[];
  homeTeamLineUp: TeamLineUp;
  awayTeamLineUp: TeamLineUp;
  statistics: MatchStatistics;
}

export interface MatchInfo {
  matchDayName: string;
  homeTeamName: string;
  homeTeamLogoUrl: string;
  homeTeamPosition: number;
  awayTeamName: string;
  awayTeamLogoUrl: string;
  awayTeamPosition: number;
  matchDate: string;
  homeScore: number;
  awayScore: number;
}

export interface MatchEvent {
  matchEventId: number;
  minute: number;
  description: string;
  type: number;
}

export interface TeamLineUp {
  players: Player[];
}

export interface Player {
  name: string;
  position: string;
}

export interface MatchStatistics {
  homeTeamYellowCards: number;
  awayTeamYellowCards: number;
  awayTeamRedCards: number;
  homeTeamRedCards: number;
  homeTeamSubstitution: number;
  awayTeamSubstitution: number;
}

// Enums para tipos de eventos
export enum MatchEventType {
  InMatch = 0,
  Goal = 1,
  YellowCard = 2,
  DoubleYellowCard = 3,
  RedCard = 4,
  Substitution = 5,
  Injury = 6,
  PenaltyMissed = 7,
  Other = 8
}
