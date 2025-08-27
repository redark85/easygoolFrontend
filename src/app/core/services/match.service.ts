import { Injectable } from '@angular/core';
import { Observable, of, delay, map, BehaviorSubject } from 'rxjs';
import { Match, MatchFilters, MatchStatistics, MatchStatus, MatchGroup } from '../models/match.model';
import { MOCK_MATCHES, getMatchesByDate, getMatchesByStatus, getLiveMatches } from '../data/matches.mock';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private matches$ = new BehaviorSubject<Match[]>(MOCK_MATCHES);
  private readonly API_DELAY = 0;

  constructor() {
    // Simulate live match updates every 30 seconds
    this.simulateLiveUpdates();
  }

  // Get all matches
  getMatches(): Observable<Match[]> {
    return of(MOCK_MATCHES).pipe(
      delay(this.API_DELAY)
    );
  }

  // Get matches grouped by date
  getMatchesGroupedByDate(): Observable<MatchGroup[]> {
    return this.getMatches().pipe(
      map(matches => this.groupMatchesByDate(matches))
    );
  }

  // Get match by ID
  getMatchById(id: string): Observable<Match | undefined> {
    return of(MOCK_MATCHES.find(match => match.id === id)).pipe(
      delay(this.API_DELAY)
    );
  }

  // Get matches by status
  getMatchesByStatus(status: MatchStatus): Observable<Match[]> {
    return of(getMatchesByStatus(MOCK_MATCHES, status)).pipe(
      delay(this.API_DELAY)
    );
  }

  // Get live matches
  getLiveMatches(): Observable<Match[]> {
    return of(getLiveMatches(MOCK_MATCHES)).pipe(
      delay(this.API_DELAY)
    );
  }

  // Get matches by team
  getMatchesByTeam(teamId: string): Observable<Match[]> {
    return of(MOCK_MATCHES.filter(match => 
      match.homeTeam.id === teamId || match.awayTeam.id === teamId
    )).pipe(
      delay(this.API_DELAY)
    );
  }

  // Get matches by tournament
  getMatchesByTournament(tournament: string): Observable<Match[]> {
    return of(MOCK_MATCHES.filter(match => 
      match.tournament.toLowerCase().includes(tournament.toLowerCase())
    )).pipe(
      delay(this.API_DELAY)
    );
  }

  // Filter matches
  filterMatches(filters: MatchFilters): Observable<Match[]> {
    return of(MOCK_MATCHES.filter(match => {
      if (filters.status && match.status !== filters.status) return false;
      if (filters.tournament && !match.tournament.toLowerCase().includes(filters.tournament.toLowerCase())) return false;
      if (filters.team && match.homeTeam.id !== filters.team && match.awayTeam.id !== filters.team) return false;
      if (filters.dateFrom && match.date < filters.dateFrom) return false;
      if (filters.dateTo && match.date > filters.dateTo) return false;
      return true;
    })).pipe(
      delay(this.API_DELAY)
    );
  }

  // Search matches
  searchMatches(query: string): Observable<Match[]> {
    if (!query.trim()) {
      return this.getMatches();
    }

    const searchTerm = query.toLowerCase();
    return of(MOCK_MATCHES.filter(match =>
      match.homeTeam.name.toLowerCase().includes(searchTerm) ||
      match.homeTeam.shortName.toLowerCase().includes(searchTerm) ||
      match.awayTeam.name.toLowerCase().includes(searchTerm) ||
      match.awayTeam.shortName.toLowerCase().includes(searchTerm) ||
      match.tournament.toLowerCase().includes(searchTerm) ||
      match.venue.toLowerCase().includes(searchTerm) ||
      (match.round && match.round.toLowerCase().includes(searchTerm))
    )).pipe(
      delay(this.API_DELAY)
    );
  }

  // Get match statistics
  getMatchStatistics(): Observable<MatchStatistics> {
    const totalMatches = MOCK_MATCHES.length;
    const liveMatches = getLiveMatches(MOCK_MATCHES).length;
    const finishedMatches = getMatchesByStatus(MOCK_MATCHES, MatchStatus.FINISHED).length;
    const scheduledMatches = getMatchesByStatus(MOCK_MATCHES, MatchStatus.SCHEDULED).length;
    
    const finishedMatchesWithScores = MOCK_MATCHES.filter(match => match.status === MatchStatus.FINISHED);
    const totalGoals = finishedMatchesWithScores.reduce((sum, match) => 
      sum + match.score.homeScore + match.score.awayScore, 0
    );
    const averageGoals = finishedMatchesWithScores.length > 0 ? 
      totalGoals / finishedMatchesWithScores.length : 0;

    return of({
      totalMatches,
      liveMatches,
      finishedMatches,
      scheduledMatches,
      averageGoals: Math.round(averageGoals * 100) / 100
    }).pipe(
      delay(this.API_DELAY)
    );
  }

  // CRUD operations (simulated)
  createMatch(match: Omit<Match, 'id'>): Observable<Match> {
    const newMatch: Match = {
      ...match,
      id: (MOCK_MATCHES.length + 1).toString()
    };
    MOCK_MATCHES.push(newMatch);
    return of(newMatch).pipe(delay(this.API_DELAY));
  }

  updateMatch(id: string, updates: Partial<Match>): Observable<Match> {
    const index = MOCK_MATCHES.findIndex(match => match.id === id);
    if (index !== -1) {
      MOCK_MATCHES[index] = { ...MOCK_MATCHES[index], ...updates };
      return of(MOCK_MATCHES[index]).pipe(delay(this.API_DELAY));
    }
    throw new Error('Match not found');
  }

  deleteMatch(id: string): Observable<boolean> {
    const index = MOCK_MATCHES.findIndex(match => match.id === id);
    if (index !== -1) {
      MOCK_MATCHES.splice(index, 1);
      return of(true).pipe(delay(this.API_DELAY));
    }
    return of(false).pipe(delay(this.API_DELAY));
  }

  // Private helper methods
  private groupMatchesByDate(matches: Match[]): MatchGroup[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const grouped = getMatchesByDate(matches);
    const groups: MatchGroup[] = [];

    Object.keys(grouped).forEach(dateKey => {
      const matchDate = new Date(dateKey);
      const isToday = this.isSameDay(matchDate, today);
      const isTomorrow = this.isSameDay(matchDate, tomorrow);
      const isYesterday = this.isSameDay(matchDate, yesterday);

      let displayDate = '';
      if (isToday) displayDate = 'Hoy';
      else if (isTomorrow) displayDate = 'Mañana';
      else if (isYesterday) displayDate = 'Ayer';
      else displayDate = this.formatDate(matchDate);

      groups.push({
        date: dateKey,
        displayDate,
        matches: grouped[dateKey].sort((a, b) => a.date.getTime() - b.date.getTime()),
        isToday,
        isTomorrow,
        isYesterday
      });
    });

    // Sort groups by date
    return groups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  // Simulate live match updates
  private simulateLiveUpdates(): void {
    setInterval(() => {
      const liveMatches = MOCK_MATCHES.filter(match => 
        match.status === MatchStatus.LIVE || match.status === MatchStatus.HALF_TIME
      );

      liveMatches.forEach(match => {
        if (match.status === MatchStatus.LIVE && match.minute) {
          // Simulate minute progression
          match.minute = Math.min(match.minute + 1, 90);
          
          // Simulate random score changes (very low probability)
          if (Math.random() < 0.02) { // 2% chance
            if (Math.random() < 0.5) {
              match.score.homeScore++;
            } else {
              match.score.awayScore++;
            }
          }
        }
      });

      this.matches$.next([...MOCK_MATCHES]);
    }, 30000); // Update every 30 seconds
  }
}
