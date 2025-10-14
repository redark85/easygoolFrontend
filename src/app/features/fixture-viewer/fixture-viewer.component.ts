import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { FixtureService, TournamentListItem } from '@core/services/fixture.service';
import { ToastService } from '@core/services';

@Component({
  selector: 'app-fixture-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fixture-viewer.component.html',
  styleUrls: ['./fixture-viewer.component.scss']
})
export class FixtureViewerComponent implements OnInit, OnDestroy {
  loading = false;
  tournaments: TournamentListItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private fixtureService: FixtureService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTournaments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTournaments(): void {
    this.loading = true;
    
    this.fixtureService.getTournamentList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournaments) => {
          this.tournaments = tournaments;
          this.loading = false;
          console.log('Torneos cargados:', tournaments);
        },
        error: (error) => {
          console.error('Error al cargar torneos:', error);
          this.toastService.showError('Error al cargar la lista de torneos');
          this.loading = false;
        }
      });
  }

  /**
   * Obtiene el texto del estado del torneo
   */
  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Programado';
      case 1: return 'En curso';
      case 2: return 'Finalizado';
      case 3: return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS del estado del torneo
   */
  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-scheduled';
      case 1: return 'status-active';
      case 2: return 'status-finished';
      case 3: return 'status-cancelled';
      default: return '';
    }
  }

  viewFixture(tournamentId: number): void {
    console.log('Ver fixture del torneo:', tournamentId);
    this.router.navigate(['/tournament-home', tournamentId]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
