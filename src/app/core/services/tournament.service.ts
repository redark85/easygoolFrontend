import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { Tournament, TournamentStatus, TournamentFilters, TournamentStats } from '../models/tournament.model';
import { MOCK_TOURNAMENTS, getTournamentsByStatus, searchTournaments, getTournamentStats } from '../data/tournaments.mock';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private tournamentsSubject = new BehaviorSubject<Tournament[]>(MOCK_TOURNAMENTS);
  public tournaments$ = this.tournamentsSubject.asObservable();

  constructor() {}

  /**
   * Obtiene todos los torneos
   */
  getAllTournaments(): Observable<Tournament[]> {
    return of(MOCK_TOURNAMENTS).pipe(delay(500)); // Simula latencia de API
  }

  /**
   * Obtiene un torneo por ID
   */
  getTournamentById(id: string): Observable<Tournament | undefined> {
    const tournament = MOCK_TOURNAMENTS.find(t => t.id === id);
    return of(tournament).pipe(delay(300));
  }

  /**
   * Obtiene torneos filtrados por estado
   */
  getTournamentsByStatus(status: TournamentStatus): Observable<Tournament[]> {
    const filteredTournaments = getTournamentsByStatus(status);
    return of(filteredTournaments).pipe(delay(400));
  }

  /**
   * Busca torneos por texto
   */
  searchTournaments(query: string): Observable<Tournament[]> {
    if (!query.trim()) {
      return this.getAllTournaments();
    }
    
    const results = searchTournaments(query);
    return of(results).pipe(delay(300));
  }

  /**
   * Obtiene torneos con filtros aplicados
   */
  getFilteredTournaments(filters: TournamentFilters): Observable<Tournament[]> {
    return this.getAllTournaments().pipe(
      map(tournaments => {
        let filtered = [...tournaments];

        // Filtrar por búsqueda
        if (filters.search && filters.search.trim()) {
          const query = filters.search.toLowerCase();
          filtered = filtered.filter(tournament => 
            tournament.name.toLowerCase().includes(query) ||
            tournament.description.toLowerCase().includes(query) ||
            tournament.season.toLowerCase().includes(query)
          );
        }

        // Filtrar por estado
        if (filters.status) {
          filtered = filtered.filter(tournament => tournament.status === filters.status);
        }

        // Filtrar por temporada
        if (filters.season) {
          filtered = filtered.filter(tournament => tournament.season === filters.season);
        }

        return filtered;
      })
    );
  }

  /**
   * Obtiene estadísticas de torneos
   */
  getTournamentStats(): Observable<TournamentStats> {
    const stats = getTournamentStats();
    return of(stats).pipe(delay(200));
  }

  /**
   * Crea un nuevo torneo (simulado)
   */
  createTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Observable<Tournament> {
    const newTournament: Tournament = {
      ...tournament,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // En una implementación real, esto haría una llamada HTTP POST
    return of(newTournament).pipe(delay(800));
  }

  /**
   * Actualiza un torneo existente (simulado)
   */
  updateTournament(id: string, updates: Partial<Tournament>): Observable<Tournament | null> {
    const tournament = MOCK_TOURNAMENTS.find(t => t.id === id);
    
    if (!tournament) {
      return of(null);
    }

    const updatedTournament: Tournament = {
      ...tournament,
      ...updates,
      updatedAt: new Date()
    };

    // En una implementación real, esto haría una llamada HTTP PUT/PATCH
    return of(updatedTournament).pipe(delay(600));
  }

  /**
   * Elimina un torneo (simulado)
   */
  deleteTournament(id: string): Observable<boolean> {
    const exists = MOCK_TOURNAMENTS.some(t => t.id === id);
    
    // En una implementación real, esto haría una llamada HTTP DELETE
    return of(exists).pipe(delay(400));
  }

  /**
   * Obtiene las temporadas disponibles
   */
  getAvailableSeasons(): Observable<string[]> {
    const seasons = [...new Set(MOCK_TOURNAMENTS.map(t => t.season))];
    return of(seasons).pipe(delay(200));
  }
}
