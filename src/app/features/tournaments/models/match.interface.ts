// Enums para estados y períodos de partidos
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

// Interfaz para equipos en partidos
export interface Team {
  id: string | number; // Soporte para ambos tipos
  name: string;
  shortName: string;
  logo: string;
  logoUrl?: string;
  logoBase64?: string;
  logoContentType?: string;
  color: string;
}

// Interfaz para puntuación de partidos
export interface MatchScore {
  homeScore: number;
  awayScore: number;
  halfTimeHome?: number;
  halfTimeAway?: number;
}

// Interfaz principal de partido (para componentes de visualización)
export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamScore?: number; // Alias para compatibilidad
  awayTeamScore?: number; // Alias para compatibilidad
  score: MatchScore;
  status: MatchStatus;
  period: MatchPeriod;
  minute?: number | null;
  date: Date;
  dateTime?: Date; // Alias para compatibilidad
  venue: string;
  tournament: string;
  round?: string;
  referee?: string;
  attendance?: number;
  weather?: string;
  notes?: string;
  phaseId?: number; // Para compatibilidad con API
  groupId?: number; // Para compatibilidad con API
}

// Interfaz para agrupación de partidos por fecha
export interface MatchGroup {
  date: string;
  displayDate: string;
  matches: Match[];
  isToday?: boolean;
  isTomorrow?: boolean;
  isYesterday?: boolean;
}

// Interfaz para filtros de partidos
export interface MatchFilters {
  status?: MatchStatus;
  tournament?: string;
  team?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Interfaz para estadísticas de partidos
export interface MatchStatistics {
  totalMatches: number;
  liveMatches: number;
  finishedMatches: number;
  scheduledMatches: number;
  averageGoals: number;
}

// Interfaz original para API (mantenida para compatibilidad)
export interface ApiMatch {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamScore?: number; // Alias para compatibilidad
  awayTeamScore?: number; // Alias para compatibilidad
  matchDate: Date;
  dateTime?: Date; // Alias para compatibilidad
  status: number; // 0: Scheduled, 1: In Progress, 2: Paused, 3: Completed, 4: Cancelled
  phaseId: number;
  groupId?: number;
  round?: number;
  venue?: string;
  referee?: string;
  notes?: string;
  // Objetos de equipos para templates
  homeTeam?: {
    id: number;
    name: string;
    shortName: string;
    logoBase64?: string;
    logoContentType?: string;
  };
  awayTeam?: {
    id: number;
    name: string;
    shortName: string;
    logoBase64?: string;
    logoContentType?: string;
  };
}

export interface CreateMatchRequest {
  homeTeamId: number;
  awayTeamId: number;
  matchDate: string;
  phaseId: number;
  groupId?: number;
  round?: number;
  venue?: string;
}

export interface UpdateMatchRequest {
  id: number;
  homeScore?: number;
  awayScore?: number;
  status: number;
  matchDate?: string;
  venue?: string;
  notes?: string;
}
