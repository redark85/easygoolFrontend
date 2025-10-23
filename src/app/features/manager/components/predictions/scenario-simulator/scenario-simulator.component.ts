import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil } from 'rxjs';
import { MatProgressBar } from '@angular/material/progress-bar';

interface TeamStanding {
  position: number;
  team: string;
  logo: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isMyTeam?: boolean;
}

interface RemainingMatch {
  matchday: number;
  opponent: string;
  isHome: boolean;
  result?: 'W' | 'D' | 'L';
}

interface Scenario {
  name: string;
  description: string;
  results: { [matchday: number]: 'W' | 'D' | 'L' };
  projectedPosition: number;
  projectedPoints: number;
  probability: number;
}

interface QualificationChance {
  scenario: string;
  probability: number;
  requiredPoints: number;
  currentPoints: number;
  pointsNeeded: number;
}

/**
 * Componente para simulador de escenarios
 */
@Component({
  selector: 'app-scenario-simulator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatTooltipModule,
    MatExpansionModule, 
    MatProgressBar
  ],
  templateUrl: './scenario-simulator.component.html',
  styleUrls: ['./scenario-simulator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioSimulatorComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['position', 'team', 'matches', 'wins', 'draws', 'losses', 'goalDifference', 'points'];

  // Current Standings
  currentStandings: TeamStanding[] = [
    { position: 1, team: 'Líder FC', logo: 'assets/default-team.png', matches: 10, wins: 8, draws: 1, losses: 1, goalsFor: 24, goalsAgainst: 6, goalDifference: 18, points: 25 },
    { position: 2, team: 'Segundo United', logo: 'assets/default-team.png', matches: 10, wins: 7, draws: 2, losses: 1, goalsFor: 21, goalsAgainst: 8, goalDifference: 13, points: 23 },
    { position: 3, team: 'Mi Equipo', logo: 'assets/default-team.png', matches: 10, wins: 7, draws: 2, losses: 1, goalsFor: 25, goalsAgainst: 8, goalDifference: 17, points: 23, isMyTeam: true },
    { position: 4, team: 'Cuarto City', logo: 'assets/default-team.png', matches: 10, wins: 6, draws: 3, losses: 1, goalsFor: 18, goalsAgainst: 9, goalDifference: 9, points: 21 },
    { position: 5, team: 'Rival FC', logo: 'assets/default-team.png', matches: 10, wins: 6, draws: 0, losses: 4, goalsFor: 16, goalsAgainst: 12, goalDifference: 4, points: 18 },
    { position: 6, team: 'Deportivo Unidos', logo: 'assets/default-team.png', matches: 10, wins: 4, draws: 2, losses: 4, goalsFor: 14, goalsAgainst: 15, goalDifference: -1, points: 14 },
    { position: 7, team: 'Atlético City', logo: 'assets/default-team.png', matches: 10, wins: 3, draws: 3, losses: 4, goalsFor: 12, goalsAgainst: 16, goalDifference: -4, points: 12 },
    { position: 8, team: 'Real Deportivo', logo: 'assets/default-team.png', matches: 10, wins: 2, draws: 2, losses: 6, goalsFor: 9, goalsAgainst: 18, goalDifference: -9, points: 8 }
  ];

  projectedStandings: TeamStanding[] = [...this.currentStandings];

  // Remaining Matches
  remainingMatches: RemainingMatch[] = [
    { matchday: 11, opponent: 'Rival FC', isHome: true },
    { matchday: 12, opponent: 'Deportivo Unidos', isHome: false },
    { matchday: 13, opponent: 'Atlético City', isHome: true },
    { matchday: 14, opponent: 'Real Deportivo', isHome: false },
    { matchday: 15, opponent: 'Líder FC', isHome: true }
  ];

  // Match Result Controls
  matchResultControls: { [matchday: number]: FormControl } = {};

  // Predefined Scenarios
  predefinedScenarios: Scenario[] = [
    {
      name: 'Escenario Optimista',
      description: 'Ganar los próximos 3 partidos',
      results: { 11: 'W', 12: 'W', 13: 'W' },
      projectedPosition: 1,
      projectedPoints: 32,
      probability: 45
    },
    {
      name: 'Escenario Realista',
      description: '2 victorias, 2 empates, 1 derrota',
      results: { 11: 'W', 12: 'D', 13: 'W', 14: 'D', 15: 'L' },
      projectedPosition: 3,
      projectedPoints: 30,
      probability: 65
    },
    {
      name: 'Escenario Pesimista',
      description: 'Perder los próximos 2 partidos',
      results: { 11: 'L', 12: 'L' },
      projectedPosition: 5,
      projectedPoints: 23,
      probability: 15
    }
  ];

  // Qualification Scenarios
  qualificationChances: QualificationChance[] = [
    {
      scenario: 'Clasificar a Playoffs',
      probability: 85,
      requiredPoints: 30,
      currentPoints: 23,
      pointsNeeded: 7
    },
    {
      scenario: 'Clasificar Directo',
      probability: 55,
      requiredPoints: 35,
      currentPoints: 23,
      pointsNeeded: 12
    },
    {
      scenario: 'Ser Campeón',
      probability: 35,
      requiredPoints: 40,
      currentPoints: 23,
      pointsNeeded: 17
    }
  ];

  // What-if Scenarios
  whatIfScenarios = [
    {
      question: '¿Qué pasa si ganamos los próximos 3 partidos?',
      answer: 'Subiríamos a la 1° posición con 32 puntos',
      impact: 'high',
      icon: 'trending_up'
    },
    {
      question: '¿Qué necesitamos para clasificar?',
      answer: 'Necesitamos 7 puntos más (2 victorias y 1 empate)',
      impact: 'medium',
      icon: 'flag'
    },
    {
      question: '¿Podemos ser campeones?',
      answer: 'Sí, necesitamos ganar 4 de los 5 partidos restantes y que el líder pierda 2',
      impact: 'high',
      icon: 'emoji_events'
    },
    {
      question: '¿Qué pasa si perdemos los próximos 2?',
      answer: 'Bajaríamos a la 5° posición, complicando la clasificación',
      impact: 'low',
      icon: 'trending_down'
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initializeMatchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los controles de resultados
   */
  private initializeMatchControls(): void {
    this.remainingMatches.forEach(match => {
      this.matchResultControls[match.matchday] = new FormControl('');
      
      this.matchResultControls[match.matchday].valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateProjection();
        });
    });
  }

  /**
   * Actualiza la proyección de tabla
   */
  private updateProjection(): void {
    // Clonar standings actuales
    this.projectedStandings = this.currentStandings.map(team => ({ ...team }));

    // Calcular puntos adicionales para mi equipo
    let additionalPoints = 0;
    this.remainingMatches.forEach(match => {
      const result = this.matchResultControls[match.matchday].value;
      if (result === 'W') additionalPoints += 3;
      else if (result === 'D') additionalPoints += 1;
    });

    // Actualizar puntos de mi equipo
    const myTeamIndex = this.projectedStandings.findIndex(t => t.isMyTeam);
    if (myTeamIndex !== -1) {
      this.projectedStandings[myTeamIndex].points += additionalPoints;
    }

    // Reordenar tabla
    this.projectedStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Actualizar posiciones
    this.projectedStandings.forEach((team, index) => {
      team.position = index + 1;
    });

    this.cdr.detectChanges();
  }

  /**
   * Aplica un escenario predefinido
   */
  applyScenario(scenario: Scenario): void {
    Object.keys(scenario.results).forEach(matchday => {
      const md = parseInt(matchday);
      if (this.matchResultControls[md]) {
        this.matchResultControls[md].setValue(scenario.results[md]);
      }
    });
  }

  /**
   * Limpia todos los resultados
   */
  clearResults(): void {
    Object.values(this.matchResultControls).forEach(control => {
      control.setValue('');
    });
  }

  /**
   * Obtiene el color del impacto
   */
  getImpactColor(impact: string): string {
    const colors: { [key: string]: string } = {
      high: '#4caf50',
      medium: '#ff9800',
      low: '#f44336'
    };
    return colors[impact] || '#666';
  }

  /**
   * Obtiene el label del resultado
   */
  getResultLabel(result: string): string {
    const labels: { [key: string]: string } = {
      W: 'Victoria',
      D: 'Empate',
      L: 'Derrota'
    };
    return labels[result] || 'Sin definir';
  }

  /**
   * Obtiene la posición proyectada de mi equipo
   */
  get myTeamProjectedPosition(): number {
    const myTeam = this.projectedStandings.find(t => t.isMyTeam);
    return myTeam?.position || 0;
  }

  /**
   * Obtiene los puntos proyectados de mi equipo
   */
  get myTeamProjectedPoints(): number {
    const myTeam = this.projectedStandings.find(t => t.isMyTeam);
    return myTeam?.points || 0;
  }

  /**
   * Calcula el cambio de posición
   */
  get positionChange(): number {
    const currentPosition = this.currentStandings.find(t => t.isMyTeam)?.position || 0;
    return currentPosition - this.myTeamProjectedPosition;
  }
}
