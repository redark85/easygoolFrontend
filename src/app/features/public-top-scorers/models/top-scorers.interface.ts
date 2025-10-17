/**
 * Interfaces para las estadísticas de jugadores (goleadores y tarjetas)
 */

// Response del API
export interface TopScorersApiResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TopScorersData;
}

export interface TopScorersData {
  players: PlayerScorer[];
  cards: PlayerCard[];
}

// Jugador goleador desde API
export interface PlayerScorer {
  name: string;
  imageUrl: string;
  teamName: string;
  teamLogoUrl: string;
  goals: number;
  matchesPlayed: number;
  goalAverage: number;
}

// Jugador con tarjetas desde API
export interface PlayerCard {
  name: string;
  imageUrl: string;
  teamName: string;
  teamLogoUrl: string;
  goals: number;
  yellowCards: number;
  redCards: number;
  totalCards: number;
  matchesPlayed: number;
}

// Interfaces para uso interno en el componente (con posición agregada)
export interface TopScorerDisplay extends PlayerScorer {
  position: number;
}

export interface PlayerCardDisplay extends PlayerCard {
  position: number;
}

// Parámetros para la consulta del API
export interface TopScorersParams {
  phaseId: number;
  groupId: number;
}
