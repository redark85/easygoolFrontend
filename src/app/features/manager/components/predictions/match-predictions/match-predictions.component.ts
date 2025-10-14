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
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil } from 'rxjs';

interface UpcomingMatch {
  id: number;
  date: Date;
  opponent: {
    id: number;
    name: string;
    logo: string;
    position: number;
    points: number;
  };
  isHome: boolean;
  venue: string;
  matchday: number;
}

interface MatchPrediction {
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  predictedScore: {
    home: number;
    away: number;
  };
  confidence: 'high' | 'medium' | 'low';
}

interface TeamForm {
  last5Matches: ('W' | 'D' | 'L')[];
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface HeadToHead {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  lastMeetings: {
    date: Date;
    result: string;
    score: string;
  }[];
}

interface OpponentAnalysis {
  strengths: string[];
  weaknesses: string[];
  bestFormation: string;
  dangerousPlayers: {
    name: string;
    position: string;
    goals: number;
    assists: number;
    rating: number;
  }[];
  defensiveStats: {
    goalsAgainst: number;
    cleanSheets: number;
    averageGoalsAgainst: number;
  };
  offensiveStats: {
    goalsFor: number;
    averageGoalsFor: number;
    shotsPerGame: number;
  };
}

interface TacticalRecommendation {
  suggestedFormation: string;
  formationReason: string;
  keyPlayersToMark: string[];
  offensiveStrategy: string;
  defensiveStrategy: string;
  setPiecesFocus: string;
}

/**
 * Componente para predicciones de partidos
 */
@Component({
  selector: 'app-match-predictions',
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
    MatTooltipModule,
    MatExpansionModule
  ],
  templateUrl: './match-predictions.component.html',
  styleUrls: ['./match-predictions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchPredictionsComponent implements OnInit, OnDestroy {
  // Upcoming Matches
  upcomingMatches: UpcomingMatch[] = [
    {
      id: 1,
      date: new Date(2025, 9, 15, 18, 0),
      opponent: {
        id: 2,
        name: 'Rival FC',
        logo: 'assets/team-placeholder.png',
        position: 5,
        points: 18
      },
      isHome: true,
      venue: 'Estadio Municipal',
      matchday: 11
    },
    {
      id: 2,
      date: new Date(2025, 9, 20, 16, 30),
      opponent: {
        id: 3,
        name: 'Deportivo Unidos',
        logo: 'assets/team-placeholder.png',
        position: 8,
        points: 12
      },
      isHome: false,
      venue: 'Estadio Central',
      matchday: 12
    }
  ];

  selectedMatch: UpcomingMatch = this.upcomingMatches[0];

  // Prediction for selected match
  prediction: MatchPrediction = {
    winProbability: 65,
    drawProbability: 25,
    lossProbability: 10,
    predictedScore: {
      home: 2,
      away: 1
    },
    confidence: 'high'
  };

  // Team Forms
  myTeamForm: TeamForm = {
    last5Matches: ['W', 'W', 'D', 'W', 'W'],
    points: 23,
    goalsFor: 15,
    goalsAgainst: 4
  };

  opponentForm: TeamForm = {
    last5Matches: ['L', 'W', 'L', 'D', 'L'],
    points: 18,
    goalsFor: 8,
    goalsAgainst: 12
  };

  // Head to Head
  headToHead: HeadToHead = {
    totalMatches: 6,
    wins: 3,
    draws: 2,
    losses: 1,
    lastMeetings: [
      { date: new Date(2025, 5, 10), result: 'W', score: '2-1' },
      { date: new Date(2025, 2, 15), result: 'D', score: '1-1' },
      { date: new Date(2024, 11, 5), result: 'W', score: '3-0' }
    ]
  };

  // Opponent Analysis
  opponentAnalysis: OpponentAnalysis = {
    strengths: [
      'Fuerte en transiciones rápidas',
      'Buen juego aéreo en balones parados',
      'Presión alta efectiva'
    ],
    weaknesses: [
      'Vulnerable en defensa por bandas',
      'Problemas para mantener la posesión',
      'Baja efectividad en definición'
    ],
    bestFormation: '4-4-2',
    dangerousPlayers: [
      {
        name: 'Carlos Striker',
        position: 'Delantero',
        goals: 6,
        assists: 2,
        rating: 7.8
      },
      {
        name: 'Miguel Midfielder',
        position: 'Mediocampista',
        goals: 3,
        assists: 5,
        rating: 7.5
      }
    ],
    defensiveStats: {
      goalsAgainst: 12,
      cleanSheets: 2,
      averageGoalsAgainst: 1.2
    },
    offensiveStats: {
      goalsFor: 8,
      averageGoalsFor: 0.8,
      shotsPerGame: 12
    }
  };

  // Tactical Recommendations
  tacticalRecommendation: TacticalRecommendation = {
    suggestedFormation: '4-3-3',
    formationReason: 'Aprovechar las bandas donde el rival es vulnerable',
    keyPlayersToMark: ['Carlos Striker', 'Miguel Midfielder'],
    offensiveStrategy: 'Juego por las bandas con centros al área. Aprovechar la velocidad de nuestros extremos.',
    defensiveStrategy: 'Línea defensiva alta para reducir espacios. Presión en salida del rival.',
    setPiecesFocus: 'Especial atención en corners y tiros libres. El rival es fuerte en juego aéreo.'
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
   * Selecciona un partido para análisis
   */
  selectMatch(match: UpcomingMatch): void {
    this.selectedMatch = match;
    // TODO: Cargar predicción y análisis del partido seleccionado
    this.cdr.detectChanges();
  }

  /**
   * Obtiene el color de la probabilidad
   */
  getProbabilityColor(probability: number): string {
    if (probability >= 60) return '#4caf50';
    if (probability >= 40) return '#ff9800';
    return '#f44336';
  }

  /**
   * Obtiene el label de confianza
   */
  getConfidenceLabel(confidence: string): string {
    const labels: { [key: string]: string } = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };
    return labels[confidence] || confidence;
  }

  /**
   * Obtiene el color de confianza
   */
  getConfidenceColor(confidence: string): string {
    const colors: { [key: string]: string } = {
      high: '#4caf50',
      medium: '#ff9800',
      low: '#f44336'
    };
    return colors[confidence] || '#666';
  }

  /**
   * Obtiene el icono del resultado
   */
  getResultIcon(result: string): string {
    const icons: { [key: string]: string } = {
      W: 'check_circle',
      D: 'remove_circle',
      L: 'cancel'
    };
    return icons[result] || 'help';
  }

  /**
   * Obtiene el color del resultado
   */
  getResultColor(result: string): string {
    const colors: { [key: string]: string } = {
      W: '#4caf50',
      D: '#ff9800',
      L: '#f44336'
    };
    return colors[result] || '#666';
  }

  /**
   * Calcula el porcentaje de victorias en historial
   */
  get headToHeadWinRate(): number {
    if (this.headToHead.totalMatches === 0) return 0;
    return (this.headToHead.wins / this.headToHead.totalMatches) * 100;
  }
}
