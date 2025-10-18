/**
 * Interfaces para las estadísticas del torneo desde el API
 */

// Response principal del API
export interface TournamentStatsApiResponse {
  result: TournamentStatsData;
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: number | null;
}

// Datos principales de estadísticas
export interface TournamentStatsData {
  matchesPlayed: number;
  totalGoals: number;
  goalsPerMatch: number;
  yellowCards: number;
  redCards: number;
  records: TournamentRecordsApi;
  goalsByMatchDay: GoalsByMatchDay[];
  resultsDistribution: ResultsDistribution;
  topScorers: TopScorerApi[];
  analysis: TournamentAnalysis;
}

// Récords del torneo desde API
export interface TournamentRecordsApi {
  biggestWin: BiggestWinRecord | null;
  highestScoringMatch: HighestScoringRecord | null;
  bestStreak: BestStreakRecord | null;
  bestDefense: BestDefenseRecord | null;
  bestOffense: BestOffenseRecord | null;
  mostCleanSheets: CleanSheetsRecord | null;
  fairPlayLeader: FairPlayRecord | null;
}

// Récords específicos
export interface BiggestWinRecord {
  score: string;
  winner: string;
  loser: string;
  date: string;
  goalDifference: number;
}

export interface HighestScoringRecord {
  totalGoals: number;
  match: string;
  score: string;
  date: string;
}

export interface BestStreakRecord {
  wins: number;
  team: string;
  period: string;
}

export interface BestDefenseRecord {
  goalsAgainst: number;
  team: string;
  matchesPlayed: number;
}

export interface BestOffenseRecord {
  goalsFor: number;
  team: string;
  matchesPlayed: number;
}

export interface CleanSheetsRecord {
  count: number;
  team: string;
  goalkeeper: string;
}

export interface FairPlayRecord {
  team: string;
  yellowCards: number;
  redCards: number;
  totalCards: number;
}

// Goles por jornada
export interface GoalsByMatchDay {
  matchday: number;
  goals: number;
}

// Distribución de resultados
export interface ResultsDistribution {
  homeWins: number;
  homeWinPercentage: number;
  draws: number;
  drawPercentage: number;
  awayWins: number;
  awayWinPercentage: number;
}

// Goleador desde API
export interface TopScorerApi {
  name: string;
  team: string;
  goals: number;
  matches: number;
  imageUrl?: string;
  teamLogoUrl?: string;
}

// Análisis del torneo
export interface TournamentAnalysis {
  avgGoalsPerMatch: number;
  avgCardsPerMatch: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
}

// Parámetros para la consulta del API
export interface TournamentStatsParams {
  phaseId: number;
  groupId: number;
}
