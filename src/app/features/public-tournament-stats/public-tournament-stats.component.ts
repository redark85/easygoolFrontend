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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ManagerService, TournamentPhase, TournamentGroup, PhaseType, ToastService, ApiService } from '@core/services';
import { PublicLoadingComponent } from '@shared/components/public-loading/public-loading.component';
import { FIXTURE_GET_TOURNAMENT_STATS_ENDPOINT } from '@core/config/endpoints';
import { TournamentStatsApiResponse, TournamentStatsData, TournamentStatsParams } from './models/tournament-stats.interface';

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
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    PublicLoadingComponent
  ],
  templateUrl: './public-tournament-stats.component.html',
  styleUrls: ['./public-tournament-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTournamentStatsComponent implements OnInit, OnDestroy {
  tournamentId: number = 0;
  isLoading = false;
  
  // Filtros - Fases y Grupos
  phases: TournamentPhase[] = [];
  groups: TournamentGroup[] = [];
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  PhaseType = PhaseType; // Exponer el enum al template
  
  records: TournamentRecord = {
    biggestWin: {
      score: 'N/A',
      winner: 'Sin datos',
      loser: 'Sin datos',
      date: new Date()
    },
    highestScoring: {
      totalGoals: 0,
      match: 'Sin datos',
      score: 'N/A',
      date: new Date()
    },
    bestStreak: {
      wins: 0,
      team: 'Sin datos',
      period: 'N/A'
    },
    bestDefense: {
      goalsAgainst: 0,
      team: 'Sin datos',
      matchesPlayed: 0
    },
    bestAttack: {
      goalsFor: 0,
      team: 'Sin datos',
      matchesPlayed: 0
    },
    mostCleanSheets: {
      count: 0,
      team: 'Sin datos',
      goalkeeper: 'Sin datos'
    },
    fairPlayLeader: {
      team: 'Sin datos',
      yellowCards: 0,
      redCards: 0
    },
    longestWinningStreak: {
      team: 'Sin datos',
      matches: 0
    }
  };
  stats: TournamentStats = {
    totalMatches: 0,
    totalGoals: 0,
    averageGoalsPerMatch: 0,
    totalYellowCards: 0,
    totalRedCards: 0,
    totalPenalties: 0,
    homeWinPercentage: 0,
    awayWinPercentage: 0,
    drawPercentage: 0
  };
  goalsPerMatchday: GoalsPerMatchday[] = [];
  resultDistribution: ResultDistribution = {
    homeWins: 0,
    draws: 0,
    awayWins: 0
  };
  attendanceData: AttendanceData[] = [];
  topScorers: TopScorer[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private managerService: ManagerService,
    private toastService: ToastService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Obtener tournamentId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('tournamentId');
        if (id) {
          this.tournamentId = +id;
          console.log('Tournament ID recibido:', this.tournamentId);
          this.loadPhases();
        } else {
          // Si no hay ID en la ruta, usar el ID por defecto
          this.loadPhases();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las fases del torneo
   */
  private loadPhases(): void {
    this.managerService.getTournamentPhases(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournamentDetails) => {
          console.log('Detalles del torneo recibidos:', tournamentDetails);
          
          // Cargar fases
          this.phases = tournamentDetails.phases || [];
          console.log('Fases cargadas:', this.phases);
          
          // Seleccionar la primera fase por defecto
          if (this.phases.length > 0) {
            this.selectedPhaseId = this.phases[0].id;
            this.onPhaseChange();
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar fases:', error);
          this.toastService.showError('Error al cargar las fases del torneo');
        }
      });
  }

  /**
   * Carga los grupos de la fase seleccionada
   */
  private loadGroups(selectedPhase: TournamentPhase): void {
    // Cargar los grupos desde la fase seleccionada
    this.groups = selectedPhase.groups || [];
    
    console.log('Grupos cargados:', this.groups);

    // Seleccionar el primer grupo por defecto
    if (this.groups.length > 0) {
      this.selectedGroupId = this.groups[0].id;
      this.loadTournamentStats();
    } else {
      this.loadTournamentStats();
    }
    
    this.cdr.detectChanges();
  }

  /**
   * Carga las estadísticas del torneo desde el API
   */
  private loadTournamentStats(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    const params: TournamentStatsParams = {
      phaseId: this.selectedPhaseId || 0,
      groupId: this.selectedGroupId || 0
    };
    
    console.log('🏆 Cargando estadísticas para:', params);
    
    this.apiService.get<TournamentStatsApiResponse>(
      `${FIXTURE_GET_TOURNAMENT_STATS_ENDPOINT}?PhaseId=${params.phaseId}&GroupId=${params.groupId}`
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
        console.log('✅ Respuesta del API de estadísticas:', response);
        
        if (response.succeed && response.result) {
          this.processApiData(response.result);
        } else {
          console.warn('⚠️ API response no exitosa:', response.message);
          this.toastService.showWarning(response.message || 'No se pudieron cargar las estadísticas');
          this.clearData();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
        this.toastService.showError('Error al cargar las estadísticas del torneo');
        this.clearData();
      }
    });
  }

  /**
   * Procesa los datos recibidos del API
   */
  private processApiData(data: TournamentStatsData): void {
    console.log('🔄 Procesando datos del API:', data);
    
    // Procesar estadísticas principales
    this.stats = {
      totalMatches: data.matchesPlayed || 0,
      totalGoals: data.totalGoals || 0,
      averageGoalsPerMatch: data.goalsPerMatch || 0,
      totalYellowCards: data.yellowCards || 0,
      totalRedCards: data.redCards || 0,
      totalPenalties: 0, // No viene en el API, mantener en 0
      homeWinPercentage: data.resultsDistribution?.homeWinPercentage || 0,
      awayWinPercentage: data.resultsDistribution?.awayWinPercentage || 0,
      drawPercentage: data.resultsDistribution?.drawPercentage || 0
    };
    
    // Procesar récords
    this.records = {
      biggestWin: data.records?.biggestWin ? {
        score: data.records.biggestWin.score,
        winner: data.records.biggestWin.winner,
        loser: data.records.biggestWin.loser,
        date: new Date(data.records.biggestWin.date)
      } : {
        score: 'N/A',
        winner: 'Sin datos',
        loser: 'Sin datos',
        date: new Date()
      },
      
      highestScoring: data.records?.highestScoringMatch ? {
        totalGoals: data.records.highestScoringMatch.totalGoals,
        match: data.records.highestScoringMatch.match,
        score: data.records.highestScoringMatch.score,
        date: new Date(data.records.highestScoringMatch.date)
      } : {
        totalGoals: 0,
        match: 'Sin datos',
        score: 'N/A',
        date: new Date()
      },
      
      bestStreak: data.records?.bestStreak ? {
        wins: data.records.bestStreak.wins,
        team: data.records.bestStreak.team,
        period: data.records.bestStreak.period
      } : {
        wins: 0,
        team: 'Sin datos',
        period: 'N/A'
      },
      
      bestDefense: data.records?.bestDefense ? {
        goalsAgainst: data.records.bestDefense.goalsAgainst,
        team: data.records.bestDefense.team,
        matchesPlayed: data.records.bestDefense.matchesPlayed
      } : {
        goalsAgainst: 0,
        team: 'Sin datos',
        matchesPlayed: 0
      },
      
      bestAttack: data.records?.bestOffense ? {
        goalsFor: data.records.bestOffense.goalsFor,
        team: data.records.bestOffense.team,
        matchesPlayed: data.records.bestOffense.matchesPlayed
      } : {
        goalsFor: 0,
        team: 'Sin datos',
        matchesPlayed: 0
      },
      
      mostCleanSheets: data.records?.mostCleanSheets ? {
        count: data.records.mostCleanSheets.count,
        team: data.records.mostCleanSheets.team,
        goalkeeper: data.records.mostCleanSheets.goalkeeper
      } : {
        count: 0,
        team: 'Sin datos',
        goalkeeper: 'Sin datos'
      },
      
      fairPlayLeader: data.records?.fairPlayLeader ? {
        team: data.records.fairPlayLeader.team,
        yellowCards: data.records.fairPlayLeader.yellowCards,
        redCards: data.records.fairPlayLeader.redCards
      } : {
        team: 'Sin datos',
        yellowCards: 0,
        redCards: 0
      },
      
      longestWinningStreak: data.records?.bestStreak ? {
        team: data.records.bestStreak.team,
        matches: data.records.bestStreak.wins
      } : {
        team: 'Sin datos',
        matches: 0
      }
    };
    
    // Procesar goles por jornada
    this.goalsPerMatchday = data.goalsByMatchDay?.map(item => ({
      matchday: item.matchday,
      goals: item.goals
    })) || [];
    
    // Procesar distribución de resultados
    this.resultDistribution = data.resultsDistribution ? {
      homeWins: data.resultsDistribution.homeWins,
      draws: data.resultsDistribution.draws,
      awayWins: data.resultsDistribution.awayWins
    } : {
      homeWins: 0,
      draws: 0,
      awayWins: 0
    };
    
    // Procesar goleadores
    this.topScorers = data.topScorers?.map(scorer => ({
      name: scorer.name || 'Jugador sin nombre',
      team: scorer.team || 'Equipo sin nombre',
      goals: scorer.goals || 0,
      matches: scorer.matches || 0
    })) || [];
    
    // Datos de asistencia (no vienen del API, mantener vacío)
    this.attendanceData = [];
    
    console.log('✅ Datos procesados correctamente');
    console.log('Stats:', this.stats);
    console.log('Records:', this.records);
    console.log('Top Scorers:', this.topScorers.length);
  }
  
  /**
   * Limpia los datos cuando hay error o no hay resultados
   */
  private clearData(): void {
    // Resetear a valores por defecto en lugar de null
    this.stats = {
      totalMatches: 0,
      totalGoals: 0,
      averageGoalsPerMatch: 0,
      totalYellowCards: 0,
      totalRedCards: 0,
      totalPenalties: 0,
      homeWinPercentage: 0,
      awayWinPercentage: 0,
      drawPercentage: 0
    };
    
    this.records = {
      biggestWin: {
        score: 'N/A',
        winner: 'Sin datos',
        loser: 'Sin datos',
        date: new Date()
      },
      highestScoring: {
        totalGoals: 0,
        match: 'Sin datos',
        score: 'N/A',
        date: new Date()
      },
      bestStreak: {
        wins: 0,
        team: 'Sin datos',
        period: 'N/A'
      },
      bestDefense: {
        goalsAgainst: 0,
        team: 'Sin datos',
        matchesPlayed: 0
      },
      bestAttack: {
        goalsFor: 0,
        team: 'Sin datos',
        matchesPlayed: 0
      },
      mostCleanSheets: {
        count: 0,
        team: 'Sin datos',
        goalkeeper: 'Sin datos'
      },
      fairPlayLeader: {
        team: 'Sin datos',
        yellowCards: 0,
        redCards: 0
      },
      longestWinningStreak: {
        team: 'Sin datos',
        matches: 0
      }
    };
    
    this.resultDistribution = {
      homeWins: 0,
      draws: 0,
      awayWins: 0
    };
    
    this.goalsPerMatchday = [];
    this.topScorers = [];
    this.attendanceData = [];
  }
  
  /**
   * Carga datos dummy (mantenido como fallback)
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

    // Top scorers (datos dummy como fallback)
    this.topScorers = [
      { name: 'Karim Benzema', team: 'Real Madrid', goals: 28, matches: 25 },
      { name: 'Robert Lewandowski', team: 'Barcelona', goals: 26, matches: 24 },
      { name: 'Vinícius Jr', team: 'Real Madrid', goals: 22, matches: 25 },
      { name: 'Antoine Griezmann', team: 'Atlético Madrid', goals: 19, matches: 25 },
      { name: 'Iago Aspas', team: 'Celta Vigo', goals: 17, matches: 24 }
    ];
    
    console.log('⚠️ Usando datos dummy como fallback');
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

  /**
   * Maneja el cambio de fase seleccionada
   */
  onPhaseChange(): void {
    const selectedPhase = this.selectedPhase;
    
    if (selectedPhase) {
      console.log('Fase seleccionada:', selectedPhase);
      
      // Si es fase de grupos, cargar los grupos
      if (selectedPhase.phaseType === PhaseType.Groups) {
        this.loadGroups(selectedPhase);
      } else {
        // Si es knockout, limpiar grupos y cargar datos
        this.groups = [];
        this.selectedGroupId = null;
        this.loadTournamentStats();
      }
      
      this.cdr.detectChanges();
    }
  }

  /**
   * Maneja el cambio de grupo seleccionado
   */
  onGroupChange(): void {
    const selectedGroup = this.groups.find(g => g.id === this.selectedGroupId);
    
    if (selectedGroup) {
      console.log('Grupo seleccionado:', selectedGroup);
      this.loadTournamentStats();
    }
  }

  /**
   * Obtiene la fase seleccionada
   */
  get selectedPhase(): TournamentPhase | undefined {
    return this.phases.find(p => p.id === this.selectedPhaseId);
  }

  /**
   * Verifica si debe mostrar el select de grupos
   */
  get shouldShowGroupSelect(): boolean {
    return this.selectedPhase?.phaseType === PhaseType.Groups && this.groups.length > 0;
  }
}
