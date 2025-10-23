import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ApiService, ToastService } from '@core/services';
import { MANAGER_GET_TEAM_PERFORMANCE_ENDPOINT } from '@core/config/endpoints';
import { ActivatedRoute } from '@angular/router';

// Interfaces del API
interface PerformanceData {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  effectiveness: number;
}

interface PhasePerformance {
  phaseName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  effectiveness: number;
  goalDifference: number;
}

interface EvolutionPoint {
  matchDayName: string;
  position: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface MomentData {
  startMatchDay: number;
  endMatchDay: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface Evolution {
  evolution: EvolutionPoint[];
  currentStreak: number;
  bestMoment: MomentData;
  worstMoment: MomentData;
}

interface TeamPerformanceResult {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
  drawPercentage: number;
  lossPercentage: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  cleanSheets: number;
  homePerformance: PerformanceData;
  awayPerformance: PerformanceData;
  phasePerformance: PhasePerformance[];
  evolution: Evolution;
}

interface TeamPerformanceResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: TeamPerformanceResult | null;
}

/**
 * Componente para estadísticas del equipo
 */
@Component({
  selector: 'app-team-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './team-stats.component.html',
  styleUrls: ['./team-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamStatsComponent implements OnInit, OnDestroy {
  tournamentTeamId: number = 0;
  isLoading = false;
  hasData = false;
  
  // Datos del API
  performanceData: TeamPerformanceResult | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener tournamentTeamId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('teamId');
        if (id) {
          this.tournamentTeamId = +id;
          this.loadTeamPerformance();
        }
      });
  }

  /**
   * Carga el rendimiento del equipo desde el API
   */
  private loadTeamPerformance(): void {
    if (!this.tournamentTeamId) {
      console.warn('No hay tournamentTeamId disponible');
      return;
    }

    this.isLoading = true;
    this.hasData = false;
    this.cdr.detectChanges();

    this.apiService.get<TeamPerformanceResponse>(
      `${MANAGER_GET_TEAM_PERFORMANCE_ENDPOINT}/${this.tournamentTeamId}`
    )
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response) => {
        if (response.succeed && response.result) {
          this.performanceData = response.result;
          this.hasData = true;
          console.log('Rendimiento del equipo cargado:', this.performanceData);
        } else {
          this.performanceData = null;
          this.hasData = false;
          console.log('No hay datos de rendimiento disponibles');
        }
      },
      error: (error) => {
        console.error('Error al cargar rendimiento del equipo:', error);
        this.toastService.showError('Error al cargar las estadísticas del equipo');
        this.performanceData = null;
        this.hasData = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Obtiene el tipo de racha actual
   */
  getStreakType(): 'win' | 'draw' | 'loss' | null {
    if (!this.performanceData?.evolution) return null;
    const streak = this.performanceData.evolution.currentStreak;
    if (streak > 0) return 'win';
    if (streak < 0) return 'loss';
    return 'draw';
  }

  /**
   * Obtiene el conteo de la racha actual
   */
  getStreakCount(): number {
    if (!this.performanceData?.evolution) return 0;
    return Math.abs(this.performanceData.evolution.currentStreak);
  }

  /**
   * Obtiene el icono de la racha
   */
  getStreakIcon(): string {
    const type = this.getStreakType();
    if (!type) return 'help';
    const icons: { [key: string]: string } = {
      win: 'trending_up',
      draw: 'trending_flat',
      loss: 'trending_down'
    };
    return icons[type] || 'help';
  }

  /**
   * Obtiene el color de la racha
   */
  getStreakColor(): string {
    const type = this.getStreakType();
    if (!type) return '#666';
    const colors: { [key: string]: string } = {
      win: '#4caf50',
      draw: '#ff9800',
      loss: '#f44336'
    };
    return colors[type] || '#666';
  }

  /**
   * Obtiene el label de la racha
   */
  getStreakLabel(): string {
    const type = this.getStreakType();
    if (!type) return '';
    const labels: { [key: string]: string } = {
      win: 'Victorias',
      draw: 'Empates',
      loss: 'Derrotas'
    };
    return labels[type] || '';
  }
}
