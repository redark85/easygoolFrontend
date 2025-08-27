import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { Tournament, TournamentStatus, TournamentFilters } from '../../../../core/models/tournament.model';
import { TournamentService } from '../../../../core/services/tournament.service';

@Component({
  selector: 'app-tournaments-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './tournaments-list.component.html',
  styleUrls: ['./tournaments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TournamentsListComponent implements OnInit, OnDestroy {
  tournaments: Tournament[] = [];
  filteredTournaments: Tournament[] = [];
  isLoading = false;
  searchControl = new FormControl('');
  
  private destroy$ = new Subject<void>();

  // Enum para usar en template
  TournamentStatus = TournamentStatus;

  constructor(
    private tournamentService: TournamentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTournaments();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todos los torneos
   */
  private loadTournaments(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.tournamentService.getAllTournaments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournaments) => {
          this.tournaments = tournaments;
          this.filteredTournaments = tournaments;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading tournaments:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Configura la búsqueda con debounce
   */
  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filterTournaments(searchTerm || '');
      });
  }

  /**
   * Filtra torneos por término de búsqueda
   */
  private filterTournaments(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredTournaments = this.tournaments;
    } else {
      const query = searchTerm.toLowerCase();
      this.filteredTournaments = this.tournaments.filter(tournament =>
        tournament.name.toLowerCase().includes(query) ||
        tournament.description.toLowerCase().includes(query) ||
        tournament.season.toLowerCase().includes(query)
      );
    }
    this.cdr.detectChanges();
  }

  /**
   * Navega a los detalles del torneo
   */
  viewTournamentDetails(tournament: Tournament): void {
    this.router.navigate(['/dashboard/tournaments', tournament.id]);
  }

  /**
   * Navega a crear nuevo torneo
   */
  createTournament(): void {
    this.router.navigate(['/dashboard/tournaments/create']);
  }

  /**
   * Edita un torneo existente
   */
  editTournament(tournament: Tournament): void {
    this.router.navigate(['/dashboard/tournaments/edit', tournament.id]);
  }

  /**
   * Duplica un torneo existente
   */
  duplicateTournament(tournament: Tournament): void {
    // Implementar lógica de duplicación
    console.log('Duplicating tournament:', tournament.name);
  }

  /**
   * Elimina un torneo
   */
  deleteTournament(tournament: Tournament): void {
    // Implementar lógica de eliminación con confirmación
    console.log('Deleting tournament:', tournament.name);
  }

  /**
   * TrackBy function para optimizar el rendering
   */
  trackByTournamentId(index: number, tournament: Tournament): string {
    return tournament.id;
  }

  /**
   * Obtiene la clase CSS para el estado del torneo
   */
  getStatusClass(status: TournamentStatus): string {
    switch (status) {
      case TournamentStatus.ACTIVE:
        return 'status-active';
      case TournamentStatus.FINISHED:
        return 'status-finished';
      case TournamentStatus.UPCOMING:
        return 'status-upcoming';
      case TournamentStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  /**
   * Obtiene el texto del estado del torneo
   */
  getStatusText(status: TournamentStatus): string {
    switch (status) {
      case TournamentStatus.ACTIVE:
        return 'Activo';
      case TournamentStatus.FINISHED:
        return 'Finalizado';
      case TournamentStatus.UPCOMING:
        return 'Próximo';
      case TournamentStatus.CANCELLED:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtiene el rango de fechas del torneo
   */
  getDateRange(tournament: Tournament): string {
    const startDate = this.formatDate(tournament.startDate);
    const endDate = this.formatDate(tournament.endDate);
    return `${startDate} - ${endDate}`;
  }
}
