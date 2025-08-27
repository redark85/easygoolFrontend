export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  color: string;
}

export interface MatchScore {
  homeScore: number;
  awayScore: number;
  halfTimeHome?: number;
  halfTimeAway?: number;
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  HALF_TIME = 'half_time',
  FINISHED = 'finished',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled'
}

export enum MatchPeriod {
  NOT_STARTED = 'not_started',
  FIRST_HALF = 'first_half',
  HALF_TIME = 'half_time',
  SECOND_HALF = 'second_half',
  EXTRA_TIME = 'extra_time',
  PENALTIES = 'penalties',
  FINISHED = 'finished'
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  score: MatchScore;
  status: MatchStatus;
  period: MatchPeriod;
  minute?: number;
  date: Date;
  venue: string;
  tournament: string;
  round?: string;
  referee?: string;
  attendance?: number;
  weather?: string;
  notes?: string;
}

export interface MatchFilters {
  status?: MatchStatus;
  tournament?: string;
  team?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MatchStatistics {
  totalMatches: number;
  liveMatches: number;
  finishedMatches: number;
  scheduledMatches: number;
  averageGoals: number;
}

export interface MatchGroup {
  date: string;
  displayDate: string;
  matches: Match[];
  isToday?: boolean;
  isTomorrow?: boolean;
  isYesterday?: boolean;
}
