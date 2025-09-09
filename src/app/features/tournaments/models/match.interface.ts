export interface Match {
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
