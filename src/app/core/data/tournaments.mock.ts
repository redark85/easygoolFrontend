import { Tournament, TournamentStatus } from '../models/tournament.model';

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'Liga Nacional',
    description: 'Torneo principal de fútbol profesional con los mejores equipos del país',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.ACTIVE,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-11-30'),
    season: 'Temporada 2024',
    teamsCount: 20,
    matchesCount: 380,
    location: 'Nacional',
    prize: '$500,000',
    organizer: 'Federación Nacional de Fútbol',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: '2',
    name: 'Copa Libertadores',
    description: 'El torneo más prestigioso de América del Sur',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.ACTIVE,
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-11-23'),
    season: 'Temporada 2024',
    teamsCount: 32,
    matchesCount: 125,
    location: 'Sudamérica',
    prize: '$2,000,000',
    organizer: 'CONMEBOL',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: '3',
    name: 'Copa Nacional',
    description: 'Torneo eliminatorio nacional con equipos de todas las divisiones',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.FINISHED,
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-05-25'),
    season: 'Temporada 2024',
    teamsCount: 64,
    matchesCount: 63,
    location: 'Nacional',
    prize: '$200,000',
    organizer: 'Asociación de Fútbol',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-05-25')
  },
  {
    id: '4',
    name: 'Liga Juvenil',
    description: 'Campeonato para jugadores menores de 21 años',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.UPCOMING,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-12-15'),
    season: 'Temporada 2024',
    teamsCount: 16,
    matchesCount: 240,
    location: 'Nacional',
    prize: '$50,000',
    organizer: 'Liga Juvenil de Fútbol',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-15')
  },
  {
    id: '5',
    name: 'Torneo Apertura',
    description: 'Primera fase del campeonato nacional de fútbol',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.FINISHED,
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-06-30'),
    season: 'Temporada 2024',
    teamsCount: 18,
    matchesCount: 153,
    location: 'Nacional',
    prize: '$300,000',
    organizer: 'Liga Profesional',
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-06-30')
  },
  {
    id: '6',
    name: 'Copa Internacional',
    description: 'Torneo amistoso con equipos internacionales',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.UPCOMING,
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-08-15'),
    season: 'Temporada 2024',
    teamsCount: 8,
    matchesCount: 15,
    location: 'Internacional',
    prize: '$100,000',
    organizer: 'FIFA',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-15')
  },
  {
    id: '7',
    name: 'Liga Femenina',
    description: 'Campeonato nacional de fútbol femenino',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.ACTIVE,
    startDate: new Date('2024-03-10'),
    endDate: new Date('2024-10-20'),
    season: 'Temporada 2024',
    teamsCount: 12,
    matchesCount: 132,
    location: 'Nacional',
    prize: '$150,000',
    organizer: 'Federación de Fútbol Femenino',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: '8',
    name: 'Torneo Clausura',
    description: 'Segunda fase del campeonato nacional de fútbol',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.UPCOMING,
    startDate: new Date('2024-08-01'),
    endDate: new Date('2024-12-20'),
    season: 'Temporada 2024',
    teamsCount: 18,
    matchesCount: 153,
    location: 'Nacional',
    prize: '$300,000',
    organizer: 'Liga Profesional',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-15')
  },
  {
    id: '9',
    name: 'Copa Regional Norte',
    description: 'Torneo regional para equipos del norte del país',
    image: '/assets/tournament-card.jpg',
    status: TournamentStatus.ACTIVE,
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-09-30'),
    season: 'Temporada 2024',
    teamsCount: 10,
    matchesCount: 45,
    location: 'Región Norte',
    prize: '$75,000',
    organizer: 'Liga Regional Norte',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-04-01')
  }
];

export const getTournamentsByStatus = (status: TournamentStatus): Tournament[] => {
  return MOCK_TOURNAMENTS.filter(tournament => tournament.status === status);
};

export const searchTournaments = (query: string): Tournament[] => {
  const lowercaseQuery = query.toLowerCase();
  return MOCK_TOURNAMENTS.filter(tournament => 
    tournament.name.toLowerCase().includes(lowercaseQuery) ||
    tournament.description.toLowerCase().includes(lowercaseQuery) ||
    tournament.season.toLowerCase().includes(lowercaseQuery)
  );
};

export const getTournamentStats = () => {
  return {
    total: MOCK_TOURNAMENTS.length,
    active: MOCK_TOURNAMENTS.filter(t => t.status === TournamentStatus.ACTIVE).length,
    finished: MOCK_TOURNAMENTS.filter(t => t.status === TournamentStatus.FINISHED).length,
    upcoming: MOCK_TOURNAMENTS.filter(t => t.status === TournamentStatus.UPCOMING).length
  };
};
