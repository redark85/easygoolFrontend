import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

interface TopPlayer {
  id: number;
  name: string;
  photo: string;
  jerseyNumber: number;
  position: string;
  value: number;
  matches: number;
  additionalInfo?: string;
}

interface PlayerComparison {
  id: number;
  name: string;
  photo: string;
  position: string;
  goals: number;
  assists: number;
  matches: number;
  minutes: number;
  rating: number;
  teamAverage: number;
  tournamentAverage: number;
}

interface PlayerEvolution {
  matchday: number;
  goals: number;
  assists: number;
  rating: number;
}

/**
 * Componente para análisis de jugadores
 */
@Component({
  selector: 'app-player-analysis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './player-analysis.component.html',
  styleUrls: ['./player-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerAnalysisComponent implements OnInit, OnDestroy {
  // Top Scorers
  topScorers: TopPlayer[] = [
    {
      id: 1,
      name: 'Juan García',
      photo: 'assets/person.jpg',
      jerseyNumber: 9,
      position: 'Delantero',
      value: 8,
      matches: 10,
      additionalInfo: '0.8 goles/partido'
    },
    {
      id: 2,
      name: 'Pedro Martínez',
      photo: 'assets/person.jpg',
      jerseyNumber: 10,
      position: 'Mediocampista',
      value: 5,
      matches: 10,
      additionalInfo: '0.5 goles/partido'
    },
    {
      id: 3,
      name: 'Luis González',
      photo: 'assets/person.jpg',
      jerseyNumber: 7,
      position: 'Delantero',
      value: 4,
      matches: 8,
      additionalInfo: '0.5 goles/partido'
    }
  ];

  // Top Assisters
  topAssisters: TopPlayer[] = [
    {
      id: 2,
      name: 'Pedro Martínez',
      photo: 'assets/person.jpg',
      jerseyNumber: 10,
      position: 'Mediocampista',
      value: 7,
      matches: 10,
      additionalInfo: '0.7 asistencias/partido'
    },
    {
      id: 1,
      name: 'Juan García',
      photo: 'assets/person.jpg',
      jerseyNumber: 9,
      position: 'Delantero',
      value: 5,
      matches: 10,
      additionalInfo: '0.5 asistencias/partido'
    },
    {
      id: 5,
      name: 'Carlos Rodríguez',
      photo: 'assets/person.jpg',
      jerseyNumber: 8,
      position: 'Mediocampista',
      value: 3,
      matches: 10,
      additionalInfo: '0.3 asistencias/partido'
    }
  ];

  // Most Disciplined
  mostDisciplined: TopPlayer[] = [
    {
      id: 4,
      name: 'Miguel Hernández',
      photo: 'assets/person.jpg',
      jerseyNumber: 1,
      position: 'Portero',
      value: 0,
      matches: 10,
      additionalInfo: '0 tarjetas'
    },
    {
      id: 6,
      name: 'Antonio López',
      photo: 'assets/person.jpg',
      jerseyNumber: 3,
      position: 'Defensa',
      value: 1,
      matches: 10,
      additionalInfo: '1 amarilla'
    },
    {
      id: 2,
      name: 'Pedro Martínez',
      photo: 'assets/person.jpg',
      jerseyNumber: 10,
      position: 'Mediocampista',
      value: 2,
      matches: 10,
      additionalInfo: '2 amarillas'
    }
  ];

  // Most Minutes
  mostMinutes: TopPlayer[] = [
    {
      id: 4,
      name: 'Miguel Hernández',
      photo: 'assets/person.jpg',
      jerseyNumber: 1,
      position: 'Portero',
      value: 900,
      matches: 10,
      additionalInfo: '90 min/partido'
    },
    {
      id: 2,
      name: 'Pedro Martínez',
      photo: 'assets/person.jpg',
      jerseyNumber: 10,
      position: 'Mediocampista',
      value: 870,
      matches: 10,
      additionalInfo: '87 min/partido'
    },
    {
      id: 1,
      name: 'Juan García',
      photo: 'assets/person.jpg',
      jerseyNumber: 9,
      position: 'Delantero',
      value: 850,
      matches: 10,
      additionalInfo: '85 min/partido'
    }
  ];

  // Team MVP
  teamMVP = {
    id: 2,
    name: 'Pedro Martínez',
    photo: 'assets/person.jpg',
    jerseyNumber: 10,
    position: 'Mediocampista',
    rating: 8.5,
    goals: 5,
    assists: 7,
    matches: 10,
    minutes: 870,
    keyPasses: 45,
    successfulDribbles: 32,
    tackles: 28,
    interceptions: 15
  };

  // Player Comparisons
  playerComparisons: PlayerComparison[] = [
    {
      id: 1,
      name: 'Juan García',
      photo: 'assets/person.jpg',
      position: 'Delantero',
      goals: 8,
      assists: 5,
      matches: 10,
      minutes: 850,
      rating: 8.2,
      teamAverage: 7.5,
      tournamentAverage: 7.0
    },
    {
      id: 2,
      name: 'Pedro Martínez',
      photo: 'assets/person.jpg',
      position: 'Mediocampista',
      goals: 5,
      assists: 7,
      matches: 10,
      minutes: 870,
      rating: 8.5,
      teamAverage: 7.5,
      tournamentAverage: 7.0
    },
    {
      id: 3,
      name: 'Carlos Rodríguez',
      photo: 'assets/person.jpg',
      position: 'Defensa',
      goals: 1,
      assists: 2,
      matches: 9,
      minutes: 810,
      rating: 7.8,
      teamAverage: 7.5,
      tournamentAverage: 7.0
    }
  ];

  // Player Evolution (example for one player)
  playerEvolution: PlayerEvolution[] = [
    { matchday: 1, goals: 1, assists: 0, rating: 7.5 },
    { matchday: 2, goals: 2, assists: 1, rating: 8.0 },
    { matchday: 3, goals: 3, assists: 2, rating: 8.2 },
    { matchday: 4, goals: 4, assists: 3, rating: 8.5 },
    { matchday: 5, goals: 5, assists: 4, rating: 8.7 },
    { matchday: 6, goals: 6, assists: 5, rating: 8.8 },
    { matchday: 7, goals: 6, assists: 5, rating: 8.3 },
    { matchday: 8, goals: 7, assists: 6, rating: 8.6 },
    { matchday: 9, goals: 8, assists: 6, rating: 8.4 },
    { matchday: 10, goals: 8, assists: 7, rating: 8.5 }
  ];

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
   * Obtiene el color del badge según la posición
   */
  getPositionBadge(position: number): string {
    if (position === 1) return 'gold';
    if (position === 2) return 'silver';
    if (position === 3) return 'bronze';
    return 'default';
  }

  /**
   * Obtiene el icono del badge según la posición
   */
  getPositionIcon(position: number): string {
    if (position <= 3) return 'emoji_events';
    return 'star';
  }

  /**
   * Calcula la diferencia con el promedio del equipo
   */
  getTeamDifference(rating: number, teamAverage: number): number {
    return rating - teamAverage;
  }

  /**
   * Calcula la diferencia con el promedio del torneo
   */
  getTournamentDifference(rating: number, tournamentAverage: number): number {
    return rating - tournamentAverage;
  }

  /**
   * Obtiene el color de la diferencia
   */
  getDifferenceColor(difference: number): string {
    if (difference > 0) return '#4caf50';
    if (difference < 0) return '#f44336';
    return '#666';
  }

  /**
   * Formatea la diferencia con signo
   */
  formatDifference(difference: number): string {
    if (difference > 0) return `+${difference.toFixed(1)}`;
    return difference.toFixed(1);
  }
}
