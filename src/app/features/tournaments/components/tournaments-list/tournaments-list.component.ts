import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { Tournament, TournamentStatus } from '../../models/tournament.interface';
import { TournamentService } from '../../services/tournament.service';
import { TournamentFormComponent } from '../tournament-form/tournament-form.component';

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

  constructor(
    private tournamentService: TournamentService,
    private dialog: MatDialog,
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
   * Carga todos los torneos (mock data por ahora)
   */
  private loadTournaments(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Mock data temporal hasta implementar getAllTournaments
    setTimeout(() => {
      this.tournaments = [];
      this.filteredTournaments = [];
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 1000);
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
  private filterTournaments(query: string = ''): void {
    const searchTerm = query.toLowerCase();
    this.filteredTournaments = this.tournaments.filter(tournament =>
      tournament.name.toLowerCase().includes(searchTerm) ||
      tournament.description.toLowerCase().includes(searchTerm) ||
      tournament.manager.managerName.toLowerCase().includes(searchTerm)
    );
    this.cdr.detectChanges();
  }

  /**
   * Abre modal para ver detalles del torneo
   */
  viewTournamentDetails(tournament: Tournament): void {
    // TODO: Implementar modal de detalles del torneo
    console.log('Ver detalles del torneo:', tournament.name);
  }

  /**
   * Abre modal para crear nuevo torneo
   */
  createTournament(): void {
    const dialogRef = this.dialog.open(TournamentFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTournaments(); // Recargar lista después de crear
      }
    });
  }

  /**
   * Edita un torneo existente
   */
  editTournament(tournament: Tournament): void {
    const dialogRef = this.dialog.open(TournamentFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { mode: 'edit', tournament }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTournaments(); // Recargar lista después de editar
      }
    });
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
    return tournament.tournamentLink; // Usar tournamentLink como ID único
  }

  /**
   * Obtiene la clase CSS para el estado del torneo
   */
  getStatusClass(status: TournamentStatus): string {
    switch (status) {
      case TournamentStatus.Active:
        return 'status-active';
      case TournamentStatus.Completed:
        return 'status-finished';
      case TournamentStatus.Draft:
        return 'status-upcoming';
      case TournamentStatus.Cancelled:
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
      case TournamentStatus.Active:
        return 'Activo';
      case TournamentStatus.Completed:
        return 'Finalizado';
      case TournamentStatus.Draft:
        return 'Borrador';
      case TournamentStatus.Cancelled:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
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
