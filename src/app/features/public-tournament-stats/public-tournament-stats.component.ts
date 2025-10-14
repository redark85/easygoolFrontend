import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

interface TournamentRecord {
  biggestWin: {
    score: string;
    winner: string;
    loser: string;
    date: Date;
  };
  highestScoring: {
    totalGoals: number;
    match: string;
    score: string;
    date: Date;
  };
  bestStreak: {
    wins: number;
    team: string;
    period: string;
  };
  bestDefense: {
    goalsAgainst: number;
    team: string;
    matchesPlayed: number;
  };
  bestAttack: {
    goalsFor: number;
    team: string;
    matchesPlayed: number;
  };
  mostCleanSheets: {
    count: number;
    team: string;
    goalkeeper: string;
  };
  fairPlayLeader: {
    team: string;
    yellowCards: number;
    redCards: number;
  };
  longestWinningStreak: {
    team: string;
    matches: number;
  };
}

interface GoalsPerMatchday {
  matchday: number;
  goals: number;
}

interface ResultDistribution {
  homeWins: number;
  draws: number;
  awayWins: number;
}

interface AttendanceData {
  matchday: number;
  attendance: number;
  capacity: number;
}

interface TopScorer {
  name: string;
  team: string;
  goals: number;
  matches: number;
}

interface TournamentStats {
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalPenalties: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
  drawPercentage: number;
}

/**
 * Componente para mostrar estadísticas completas del torneo
 */
@Component({
  selector: 'app-public-tournament-stats',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './public-tournament-stats.component.html',
  styleUrls: ['./public-tournament-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTournamentStatsComponent implements OnInit, OnDestroy {
  tournamentId: number = 0;
  isLoading = false;
  
  records: TournamentRecord | null = null;
  stats: TournamentStats | null = null;
  goalsPerMatchday: GoalsPerMatchday[] = [];
  resultDistribution: ResultDistribution | null = null;
  attendanceData: AttendanceData[] = [];
  topScorers: TopScorer[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener tournamentId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('tournamentId');
        if (id) {
          this.tournamentId = +id;
          this.loadTournamentStats();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las estadísticas del torneo
   */
  private loadTournamentStats(): void {
    this.isLoading = true;
    
    // TODO: Cargar desde API
    // Por ahora usar datos dummy
    this.loadDummyData();
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /**
   * Carga datos dummy
   */
  private loadDummyData(): void {
    // Records
    this.records = {
      biggestWin: {
        score: '7-0',
        winner: 'Real Madrid',
        loser: 'Valencia CF',
        date: new Date(2024, 2, 15)
      },
      highestScoring: {
        totalGoals: 9,
        match: 'Barcelona vs Sevilla',
        score: '5-4',
        date: new Date(2024, 3, 10)
      },
      bestStreak: {
        wins: 12,
        team: 'Real Madrid',
        period: 'Jornadas 5-16'
      },
      bestDefense: {
        goalsAgainst: 8,
        team: 'Atlético Madrid',
        matchesPlayed: 25
      },
      bestAttack: {
        goalsFor: 72,
        team: 'Barcelona',
        matchesPlayed: 25
      },
      mostCleanSheets: {
        count: 15,
        team: 'Atlético Madrid',
        goalkeeper: 'Jan Oblak'
      },
      fairPlayLeader: {
        team: 'Real Sociedad',
        yellowCards: 32,
        redCards: 1
      },
      longestWinningStreak: {
        team: 'Real Madrid',
        matches: 12
      }
    };

    // Tournament Stats
    this.stats = {
      totalMatches: 150,
      totalGoals: 412,
      averageGoalsPerMatch: 2.75,
      totalYellowCards: 456,
      totalRedCards: 23,
      totalPenalties: 45,
      homeWinPercentage: 48.5,
      awayWinPercentage: 28.3,
      drawPercentage: 23.2
    };

    // Goals per matchday
    this.goalsPerMatchday = Array.from({ length: 15 }, (_, i) => ({
      matchday: i + 1,
      goals: Math.floor(Math.random() * 20) + 15
    }));

    // Result distribution
    this.resultDistribution = {
      homeWins: 73,
      draws: 35,
      awayWins: 42
    };

    // Attendance data
    this.attendanceData = Array.from({ length: 15 }, (_, i) => ({
      matchday: i + 1,
      attendance: Math.floor(Math.random() * 20000) + 30000,
      capacity: 50000
    }));

    // Top scorers
    this.topScorers = [
      { name: 'Karim Benzema', team: 'Real Madrid', goals: 28, matches: 25 },
      { name: 'Robert Lewandowski', team: 'Barcelona', goals: 26, matches: 24 },
      { name: 'Vinícius Jr', team: 'Real Madrid', goals: 22, matches: 25 },
      { name: 'Antoine Griezmann', team: 'Atlético Madrid', goals: 19, matches: 25 },
      { name: 'Iago Aspas', team: 'Celta Vigo', goals: 17, matches: 24 }
    ];
  }

  /**
   * Obtiene el porcentaje de ocupación promedio
   */
  getAverageAttendancePercentage(): number {
    if (this.attendanceData.length === 0) return 0;
    const total = this.attendanceData.reduce((sum, data) => 
      sum + (data.attendance / data.capacity * 100), 0);
    return total / this.attendanceData.length;
  }

  /**
   * Obtiene el total de asistencia
   */
  getTotalAttendance(): number {
    return this.attendanceData.reduce((sum, data) => sum + data.attendance, 0);
  }

  /**
   * Obtiene el promedio de goles por jornada
   */
  getAverageGoalsPerMatchday(): number {
    if (this.goalsPerMatchday.length === 0) return 0;
    const total = this.goalsPerMatchday.reduce((sum, data) => sum + data.goals, 0);
    return total / this.goalsPerMatchday.length;
  }

  /**
   * Obtiene el máximo de goles en una jornada
   */
  getMaxGoalsInMatchday(): number {
    if (this.goalsPerMatchday.length === 0) return 0;
    return Math.max(...this.goalsPerMatchday.map(d => d.goals));
  }

  /**
   * Obtiene el color para el gráfico de barras
   */
  getBarColor(value: number, max: number): string {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return '#48bb78';
    if (percentage >= 60) return '#4299e1';
    if (percentage >= 40) return '#ed8936';
    return '#f56565';
  }

  /**
   * Obtiene el ancho de la barra en porcentaje
   */
  getBarWidth(value: number, max: number): string {
    return `${(value / max) * 100}%`;
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
    this.router.navigate(['/tournament-home', this.tournamentId]);
  }

  /**
   * Navega al detalle del equipo
   */
  viewTeamDetail(teamName: string): void {
    // TODO: Implementar navegación con ID real del equipo
    console.log('Ver equipo:', teamName);
  }

  /**
   * Formatea la fecha
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  }
}
