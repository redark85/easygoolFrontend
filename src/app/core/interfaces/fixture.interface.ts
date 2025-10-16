// Interfaces para el API de Fixture Completo

export interface FixtureMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: number;
  homeTeamLogoUrl: string;
  awayTeamLogoUrl: string;
  homeScore: number;
  awayScore: number;
}

export interface FixtureMatchDay {
  matchDayId: number;
  matchDayName: string;
  matches: FixtureMatch[];
}

export interface CompleteFixtureResult {
  totalMatches: number;
  nextMatches: number;
  liveMatches: number;
  finishedMatches: number;
  matches: FixtureMatchDay[];
}

export interface CompleteFixtureResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: CompleteFixtureResult;
}

// Enums para los estados de los partidos
export enum MatchStatus {
  Scheduled = 0,
  Live = 1,
  Finished = 2,
  Suspended = 3,
  Cancelled = 4
}

// Mapeo de estados para la UI
export const MatchStatusMap: { [key: number]: string } = {
  [MatchStatus.Scheduled]: 'upcoming',
  [MatchStatus.Live]: 'live',
  [MatchStatus.Finished]: 'finished',
  [MatchStatus.Suspended]: 'suspended',
  [MatchStatus.Cancelled]: 'cancelled'
};
