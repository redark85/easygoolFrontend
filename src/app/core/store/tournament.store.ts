import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TournamentStoreState {
  currentTournamentName: string | null;
  currentTournamentId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class TournamentStore {
  private readonly initialState: TournamentStoreState = {
    currentTournamentName: null,
    currentTournamentId: null
  };

  private readonly state$ = new BehaviorSubject<TournamentStoreState>(this.initialState);

  /**
   * Obtiene el estado actual del store
   */
  get state(): TournamentStoreState {
    return this.state$.value;
  }

  /**
   * Observable del estado completo
   */
  getState$(): Observable<TournamentStoreState> {
    return this.state$.asObservable();
  }

  /**
   * Observable del nombre del torneo actual
   */
  getCurrentTournamentName$(): Observable<string | null> {
    return this.state$.pipe(map((state: TournamentStoreState) => state.currentTournamentName));
  }

  /**
   * Observable del ID del torneo actual
   */
  getCurrentTournamentId$(): Observable<number | null> {
    return this.state$.pipe(map((state: TournamentStoreState) => state.currentTournamentId));
  }

  /**
   * Actualiza el torneo actual en el store
   */
  setCurrentTournament(id: number, name: string): void {
    this.updateState({
      currentTournamentId: id,
      currentTournamentName: name
    });
  }

  /**
   * Limpia el torneo actual del store
   */
  clearCurrentTournament(): void {
    this.updateState({
      currentTournamentId: null,
      currentTournamentName: null
    });
  }

  /**
   * Actualiza solo el nombre del torneo actual
   */
  setCurrentTournamentName(name: string): void {
    this.updateState({
      ...this.state,
      currentTournamentName: name
    });
  }

  /**
   * Método privado para actualizar el estado
   */
  private updateState(newState: Partial<TournamentStoreState>): void {
    const updatedState = { ...this.state, ...newState };
    this.state$.next(updatedState);
  }
}
