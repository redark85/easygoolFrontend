import { Match, MatchStatus, MatchPeriod, Team } from '../models/match.model';

// Teams data
export const MOCK_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Real Madrid',
    shortName: 'RMA',
    logo: '/assets/team-1.jpg',
    color: '#FFFFFF'
  },
  {
    id: '2',
    name: 'FC Barcelona',
    shortName: 'BAR',
    logo: '/assets/team-2.jpg',
    color: '#A50044'
  },
  {
    id: '3',
    name: 'Atlético Madrid',
    shortName: 'ATM',
    logo: '/assets/team-1.jpg',
    color: '#CE2029'
  },
  {
    id: '4',
    name: 'Valencia CF',
    shortName: 'VAL',
    logo: '/assets/team-2.jpg',
    color: '#FF8C00'
  },
  {
    id: '5',
    name: 'Sevilla FC',
    shortName: 'SEV',
    logo: '/assets/team-1.jpg',
    color: '#D2001F'
  },
  {
    id: '6',
    name: 'Real Betis',
    shortName: 'BET',
    logo: '/assets/team-2.jpg',
    color: '#00954C'
  },
  {
    id: '7',
    name: 'Athletic Bilbao',
    shortName: 'ATH',
    logo: '/assets/team-1.jpg',
    color: '#EE2523'
  },
  {
    id: '8',
    name: 'Real Sociedad',
    shortName: 'RSO',
    logo: '/assets/team-2.jpg',
    color: '#004A9F'
  }
];

// Mock matches data
export const MOCK_MATCHES: Match[] = [
  // Hoy - Partidos en vivo y finalizados
  {
    id: '1',
    homeTeam: MOCK_TEAMS[0], // Real Madrid
    awayTeam: MOCK_TEAMS[1], // Barcelona
    score: { homeScore: 2, awayScore: 1, halfTimeHome: 1, halfTimeAway: 0 },
    status: MatchStatus.LIVE,
    period: MatchPeriod.SECOND_HALF,
    minute: 67,
    date: new Date(),
    venue: 'Santiago Bernabéu',
    tournament: 'La Liga',
    round: 'Jornada 15',
    referee: 'Antonio Mateu Lahoz',
    attendance: 81044
  },
  {
    id: '2',
    homeTeam: MOCK_TEAMS[2], // Atlético Madrid
    awayTeam: MOCK_TEAMS[3], // Valencia
    score: { homeScore: 3, awayScore: 1, halfTimeHome: 2, halfTimeAway: 0 },
    status: MatchStatus.FINISHED,
    period: MatchPeriod.FINISHED,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    venue: 'Wanda Metropolitano',
    tournament: 'La Liga',
    round: 'Jornada 15',
    referee: 'José Luis Munuera',
    attendance: 68456
  },
  {
    id: '3',
    homeTeam: MOCK_TEAMS[4], // Sevilla
    awayTeam: MOCK_TEAMS[5], // Betis
    score: { homeScore: 0, awayScore: 0 },
    status: MatchStatus.HALF_TIME,
    period: MatchPeriod.HALF_TIME,
    minute: 45,
    date: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
    venue: 'Ramón Sánchez-Pizjuán',
    tournament: 'La Liga',
    round: 'Jornada 15',
    referee: 'Jesús Gil Manzano',
    attendance: 43883
  },
  {
    id: '4',
    homeTeam: MOCK_TEAMS[6], // Athletic Bilbao
    awayTeam: MOCK_TEAMS[7], // Real Sociedad
    score: { homeScore: 1, awayScore: 2, halfTimeHome: 0, halfTimeAway: 1 },
    status: MatchStatus.FINISHED,
    period: MatchPeriod.FINISHED,
    date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
    venue: 'San Mamés',
    tournament: 'La Liga',
    round: 'Jornada 15',
    referee: 'Ricardo de Burgos',
    attendance: 53289
  },

  // Mañana - Partidos programados
  {
    id: '5',
    homeTeam: MOCK_TEAMS[1], // Barcelona
    awayTeam: MOCK_TEAMS[4], // Sevilla
    score: { homeScore: 0, awayScore: 0 },
    status: MatchStatus.SCHEDULED,
    period: MatchPeriod.NOT_STARTED,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
    venue: 'Camp Nou',
    tournament: 'La Liga',
    round: 'Jornada 16',
    referee: 'Mateo Lahoz'
  },
  {
    id: '6',
    homeTeam: MOCK_TEAMS[3], // Valencia
    awayTeam: MOCK_TEAMS[0], // Real Madrid
    score: { homeScore: 0, awayScore: 0 },
    status: MatchStatus.SCHEDULED,
    period: MatchPeriod.NOT_STARTED,
    date: new Date(Date.now() + 26 * 60 * 60 * 1000), // Mañana tarde
    venue: 'Mestalla',
    tournament: 'La Liga',
    round: 'Jornada 16',
    referee: 'José Munuera'
  },

  // Ayer - Partidos finalizados
  {
    id: '7',
    homeTeam: MOCK_TEAMS[5], // Betis
    awayTeam: MOCK_TEAMS[2], // Atlético Madrid
    score: { homeScore: 1, awayScore: 3, halfTimeHome: 1, halfTimeAway: 1 },
    status: MatchStatus.FINISHED,
    period: MatchPeriod.FINISHED,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
    venue: 'Benito Villamarín',
    tournament: 'La Liga',
    round: 'Jornada 14',
    referee: 'Alejandro Hernández',
    attendance: 60721
  },
  {
    id: '8',
    homeTeam: MOCK_TEAMS[7], // Real Sociedad
    awayTeam: MOCK_TEAMS[6], // Athletic Bilbao
    score: { homeScore: 2, awayScore: 0, halfTimeHome: 1, halfTimeAway: 0 },
    status: MatchStatus.FINISHED,
    period: MatchPeriod.FINISHED,
    date: new Date(Date.now() - 22 * 60 * 60 * 1000), // Ayer tarde
    venue: 'Reale Arena',
    tournament: 'La Liga',
    round: 'Jornada 14',
    referee: 'Pablo González',
    attendance: 39500
  },

  // Partidos de Copa del Rey - Próximos
  {
    id: '9',
    homeTeam: MOCK_TEAMS[0], // Real Madrid
    awayTeam: MOCK_TEAMS[2], // Atlético Madrid
    score: { homeScore: 0, awayScore: 0 },
    status: MatchStatus.SCHEDULED,
    period: MatchPeriod.NOT_STARTED,
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
    venue: 'Santiago Bernabéu',
    tournament: 'Copa del Rey',
    round: 'Cuartos de Final',
    referee: 'Antonio Mateu'
  },
  {
    id: '10',
    homeTeam: MOCK_TEAMS[1], // Barcelona
    awayTeam: MOCK_TEAMS[4], // Sevilla
    score: { homeScore: 0, awayScore: 0 },
    status: MatchStatus.SCHEDULED,
    period: MatchPeriod.NOT_STARTED,
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // En 4 días
    venue: 'Camp Nou',
    tournament: 'Copa del Rey',
    round: 'Cuartos de Final',
    referee: 'José Munuera'
  }
];

// Utility functions
export function getMatchesByDate(matches: Match[]): { [key: string]: Match[] } {
  const grouped: { [key: string]: Match[] } = {};
  
  matches.forEach(match => {
    const dateKey = match.date.toDateString();
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(match);
  });
  
  return grouped;
}

export function getMatchesByStatus(matches: Match[], status: MatchStatus): Match[] {
  return matches.filter(match => match.status === status);
}

export function getLiveMatches(matches: Match[]): Match[] {
  return matches.filter(match => 
    match.status === MatchStatus.LIVE || 
    match.status === MatchStatus.HALF_TIME
  );
}

export function getMatchesForTeam(matches: Match[], teamId: string): Match[] {
  return matches.filter(match => 
    match.homeTeam.id === teamId || match.awayTeam.id === teamId
  );
}
