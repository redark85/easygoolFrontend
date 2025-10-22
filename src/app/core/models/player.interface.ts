/**
 * Interface para la entidad Player
 */
export interface Player {
  id: number;
  name: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  identification: string;
  photoUrl?: string;
  tournamentTeamId: number;
  position: string;
  jerseyNumber: number;
  isCapitan: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  tournamentTeamPlayerId : number;
  allowUpdateInfo : boolean;
}

/**
 * Request para crear un nuevo jugador
 */
export interface CreatePlayerRequest {
  name: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  identification: string;
  photoBase64: string;
  photoContentType: string;
  tournamentTeamId: number;
  position: string;
  jerseyNumber: number;
  isCapitan: boolean;
}

/**
 * Request para actualizar un jugador existente
 */
export interface UpdatePlayerRequest {
  id: number;
  name: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  identification: string;
  photoBase64?: string;
  photoContentType?: string;
  tournamentTeamId: number;
  position: string;
  jerseyNumber: number;
  isCapitan: boolean;
}

/**
 * Datos del formulario de jugador
 */
export interface PlayerFormData {
  mode: 'create' | 'edit';
  player?: Player;
  tournamentTeamId: number;
  teamName?: string;
  allowUpdateInfo : boolean;
}

/**
 * Resultado del modal de jugador
 */
export interface PlayerModalResult {
  success: boolean;
  player?: Player;
}

/**
 * Posiciones de jugadores en fútbol
 */
export enum PlayerPosition {
  PORTERO = 'Portero',
  DEFENSA = 'Defensa',
  MEDIOCAMPISTA = 'Mediocampista',
  DELANTERO = 'Delantero'
}

/**
 * Opciones de posiciones para formularios
 */
export interface PlayerPositionOption {
  value: string;
  label: string;
  icon: string;
}

/**
 * Constantes para posiciones de jugadores
 */
export const PLAYER_POSITIONS: PlayerPositionOption[] = [
  { value: PlayerPosition.PORTERO, label: 'Portero', icon: 'sports_handball' },
  { value: PlayerPosition.DEFENSA, label: 'Defensa', icon: 'shield' },
  { value: PlayerPosition.MEDIOCAMPISTA, label: 'Mediocampista', icon: 'swap_horiz' },
  { value: PlayerPosition.DELANTERO, label: 'Delantero', icon: 'sports_soccer' }
];
