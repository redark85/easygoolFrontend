export interface Tournament {
  id: string;
  name: string;
  description: string;
  image: string;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  season: string;
  teamsCount: number;
  matchesCount: number;
  location: string;
  prize: string;
  organizer: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export interface TournamentFilters {
  search?: string;
  status?: TournamentStatus;
  season?: string;
}

export interface TournamentStats {
  total: number;
  active: number;
  finished: number;
  upcoming: number;
}
