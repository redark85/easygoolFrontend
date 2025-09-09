export interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
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
  phaseId: number;
  dateTime: string;
  venue?: string;
  referee?: string;
  status: number; // 1: Programado, 2: En Curso, 3: Finalizado, 4: Suspendido, 5: Cancelado
  homeTeamScore?: number;
  awayTeamScore?: number;
  round?: number;
  tournamentId: number;
  createdAt: string;
  updatedAt?: string;
}
