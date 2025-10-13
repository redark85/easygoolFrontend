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
import { Subject, takeUntil } from 'rxjs';

interface TeamPerformance {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  averageGoalsFor: number;
  averageGoalsAgainst: number;
  averagePossession: number;
  cleanSheets: number;
}

interface ContextPerformance {
  home: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  away: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
}

interface TournamentPhase {
  phase: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

interface OpponentLevel {
  level: 'top' | 'mid' | 'bottom';
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

interface PositionHistory {
  matchday: number;
  position: number;
  points: number;
}

interface ResultStreak {
  type: 'win' | 'draw' | 'loss';
  count: number;
  matches: string[];
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
  // General Performance
  performance: TeamPerformance = {
    totalMatches: 10,
    wins: 7,
    draws: 2,
    losses: 1,
    goalsFor: 25,
    goalsAgainst: 8,
    averageGoalsFor: 2.5,
    averageGoalsAgainst: 0.8,
    averagePossession: 58,
    cleanSheets: 5
  };

  // Context Performance
  contextPerformance: ContextPerformance = {
    home: {
      matches: 5,
      wins: 4,
      draws: 1,
      losses: 0,
      goalsFor: 15,
      goalsAgainst: 3
    },
    away: {
      matches: 5,
      wins: 3,
      draws: 1,
      losses: 1,
      goalsFor: 10,
      goalsAgainst: 5
    }
  };

  // Tournament Phases
  tournamentPhases: TournamentPhase[] = [
    { phase: 'Fase Inicial (J1-J4)', matches: 4, wins: 3, draws: 1, losses: 0, points: 10 },
    { phase: 'Fase Media (J5-J7)', matches: 3, wins: 2, draws: 0, losses: 1, points: 6 },
    { phase: 'Fase Final (J8-J10)', matches: 3, wins: 2, draws: 1, losses: 0, points: 7 }
  ];

  // Opponent Levels
  opponentLevels: OpponentLevel[] = [
    { level: 'top', matches: 3, wins: 1, draws: 1, losses: 1, winRate: 33.3 },
    { level: 'mid', matches: 4, wins: 3, draws: 1, losses: 0, winRate: 75 },
    { level: 'bottom', matches: 3, wins: 3, draws: 0, losses: 0, winRate: 100 }
  ];

  // Position History
  positionHistory: PositionHistory[] = [
    { matchday: 1, position: 5, points: 3 },
    { matchday: 2, position: 4, points: 6 },
    { matchday: 3, position: 3, points: 10 },
    { matchday: 4, position: 3, points: 13 },
    { matchday: 5, position: 2, points: 16 },
    { matchday: 6, position: 2, points: 19 },
    { matchday: 7, position: 3, points: 19 },
    { matchday: 8, position: 3, points: 22 },
    { matchday: 9, position: 3, points: 24 },
    { matchday: 10, position: 3, points: 27 }
  ];

  // Current Streak
  currentStreak: ResultStreak = {
    type: 'win',
    count: 3,
    matches: ['3-1 vs Rival FC', '2-0 vs Deportivo', '1-0 vs Atlético']
  };

  // Best/Worst Moments
  bestMoment = {
    period: 'Jornadas 3-5',
    description: '3 victorias consecutivas',
    points: 9,
    goalsFor: 8,
    goalsAgainst: 1
  };

  worstMoment = {
    period: 'Jornada 7',
    description: 'Derrota 0-3',
    points: 0,
    goalsFor: 0,
    goalsAgainst: 3
  };

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // TODO: Cargar datos reales
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calcula el porcentaje de victorias
   */
  get winPercentage(): number {
    if (this.performance.totalMatches === 0) return 0;
    return (this.performance.wins / this.performance.totalMatches) * 100;
  }

  /**
   * Calcula el porcentaje de empates
   */
  get drawPercentage(): number {
    if (this.performance.totalMatches === 0) return 0;
    return (this.performance.draws / this.performance.totalMatches) * 100;
  }

  /**
   * Calcula el porcentaje de derrotas
   */
  get lossPercentage(): number {
    if (this.performance.totalMatches === 0) return 0;
    return (this.performance.losses / this.performance.totalMatches) * 100;
  }

  /**
   * Calcula la diferencia de goles
   */
  get goalDifference(): number {
    return this.performance.goalsFor - this.performance.goalsAgainst;
  }

  /**
   * Calcula el porcentaje de victorias en casa
   */
  getHomeWinRate(): number {
    if (this.contextPerformance.home.matches === 0) return 0;
    return (this.contextPerformance.home.wins / this.contextPerformance.home.matches) * 100;
  }

  /**
   * Calcula el porcentaje de victorias fuera
   */
  getAwayWinRate(): number {
    if (this.contextPerformance.away.matches === 0) return 0;
    return (this.contextPerformance.away.wins / this.contextPerformance.away.matches) * 100;
  }

  /**
   * Obtiene el color del nivel de oponente
   */
  getOpponentLevelColor(level: string): string {
    const colors: { [key: string]: string } = {
      top: '#f44336',
      mid: '#ff9800',
      bottom: '#4caf50'
    };
    return colors[level] || '#666';
  }

  /**
   * Obtiene el label del nivel de oponente
   */
  getOpponentLevelLabel(level: string): string {
    const labels: { [key: string]: string } = {
      top: 'Top 5',
      mid: 'Medio',
      bottom: 'Bottom 5'
    };
    return labels[level] || level;
  }

  /**
   * Obtiene el icono de la racha
   */
  getStreakIcon(): string {
    const icons: { [key: string]: string } = {
      win: 'trending_up',
      draw: 'trending_flat',
      loss: 'trending_down'
    };
    return icons[this.currentStreak.type] || 'help';
  }

  /**
   * Obtiene el color de la racha
   */
  getStreakColor(): string {
    const colors: { [key: string]: string } = {
      win: '#4caf50',
      draw: '#ff9800',
      loss: '#f44336'
    };
    return colors[this.currentStreak.type] || '#666';
  }

  /**
   * Obtiene el label de la racha
   */
  getStreakLabel(): string {
    const labels: { [key: string]: string } = {
      win: 'Victorias',
      draw: 'Empates',
      loss: 'Derrotas'
    };
    return labels[this.currentStreak.type] || '';
  }
}
