/**
 * Interfaces para el detalle de equipo desde el API
 */

export interface PlayerDetail {
  jerseyNumber: number;
  name: string;
  matchesPlayed: number;
  goals: number;
  penalties: number;
  yellowCards: number;
  redCards: number;
}

export interface PlayersByPosition {
  position: string;
  players: PlayerDetail[];
}

export interface UpcomingMatch {
  matchId: number;
  matchDate: string;
  opponent: string;
  isHome: boolean;
  homeScore: number;
  awayScore: number;
  phaseName: string;
}

export interface RecentMatch {
  matchId: number;
  matchDate: string;
  opponent: string;
  isHome: boolean;
  homeScore: number;
  awayScore: number;
  phaseName: string;
}

export interface TopScorer {
  name: string;
  goals: number;
}

export interface TeamDetailData {
  teamName: string;
  shortName: string;
  logo: string;
  groupName: string;
  totalPlayers: number;
  lastFiveResults: string[];
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
  players: PlayersByPosition[];
  upcomingMatches: UpcomingMatch[];
  recentMatches: RecentMatch[];
  topScorer: TopScorer;
}

export interface TeamDetailResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TeamDetailData;
}

/**
 * Interface adaptada para el componente (compatible con estructura existente)
 */
export interface TeamDetailForComponent {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  groupName: string;
  motto?: string;
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  totalPlayers: number;
  pointsPerMatch: number;
  effectiveness: number;
  lastFiveResults: ('W' | 'D' | 'L')[];
  players: PlayerForComponent[];
  upcomingMatches: MatchForComponent[];
  pastMatches: MatchForComponent[];
  topScorer: TopScorer;
  // Campos adicionales para mantener compatibilidad
  coach?: string;
  stadium?: string;
  founded?: number;
}

export interface PlayerForComponent {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  photoUrl: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  penalties?: number;
}

export interface MatchForComponent {
  id: number;
  opponent: string;
  opponentLogo: string;
  date: Date;
  isHome: boolean;
  score?: string;
  result?: 'W' | 'D' | 'L';
  status: 'upcoming' | 'finished';
  phaseName?: string;
}
