import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';

import { Team } from '../../models/team.interface';
import { Match, MatchStatus } from '../../models/match.interface';
import { Phase } from '../../models/phase.interface';
import { Tournament } from '../../models/tournament.interface';

export interface TeamStatistics {
  team: Team;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TournamentStatistics {
  totalMatches: number;
  completedMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  topScorer: { team: Team; goals: number } | null;
  mostWins: { team: Team; wins: number } | null;
}

@Component({
  selector: 'app-statistics-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatTabsModule
  ],
  templateUrl: './statistics-management.component.html',
  styleUrls: ['./statistics-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsManagementComponent implements OnInit, OnDestroy {
  @Input() tournamentId!: number;
  @Input() tournament: any = null;
  @Input() teams: Team[] = [];
  @Input() matches: Match[] = [];
  @Input() phases: Phase[] = [];
  @Output() statisticsUpdated = new EventEmitter<any>();

  teamStatistics: TeamStatistics[] = [];
  tournamentStatistics: TournamentStatistics = {
    totalMatches: 0,
    completedMatches: 0,
    totalGoals: 0,
    averageGoalsPerMatch: 0,
    topScorer: null,
    mostWins: null
  };

  selectedView: 'general' | 'teams' | 'phases' = 'general';
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.calculateStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calcula todas las estadísticas del torneo
   */
  private calculateStatistics(): void {
    this.calculateTeamStatistics();
    this.calculateTournamentStatistics();
    this.cdr.detectChanges();
  }

  /**
   * Calcula las estadísticas por equipo
   */
  private calculateTeamStatistics(): void {
    this.teamStatistics = this.teams.map(team => {
      const teamMatches = this.matches.filter(match => 
        (match.homeTeam?.id === team.id || match.awayTeam?.id === team.id) && 
        match.status === MatchStatus.FINISHED // Solo partidos finalizados
      );

      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      teamMatches.forEach(match => {
        const isHome = match.homeTeam?.id === team.id;
        const teamScore = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
        const opponentScore = isHome ? (match.awayScore || 0) : (match.homeScore || 0);

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          wins++;
        } else if (teamScore === opponentScore) {
          draws++;
        } else {
          losses++;
        }
      });

      return {
        team,
        matchesPlayed: teamMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: (wins * 3) + draws
      };
    });

    // Ordenar por puntos, diferencia de goles y goles a favor
    this.teamStatistics.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  }

  /**
   * Calcula las estadísticas generales del torneo
   */
  private calculateTournamentStatistics(): void {
    const completedMatches = this.matches.filter(match => match.status === MatchStatus.FINISHED);
    const totalGoals = completedMatches.reduce((sum, match) => 
      sum + (match.homeScore || 0) + (match.awayScore || 0), 0
    );

    this.tournamentStatistics = {
      totalMatches: this.matches.length,
      completedMatches: completedMatches.length,
      totalGoals,
      averageGoalsPerMatch: completedMatches.length > 0 ? totalGoals / completedMatches.length : 0,
      topScorer: this.getTopScorer(),
      mostWins: this.getMostWins()
    };
  }

  /**
   * Obtiene el equipo con más goles
   */
  private getTopScorer(): { team: Team; goals: number } | null {
    if (this.teamStatistics.length === 0) return null;
    
    const topScorer = this.teamStatistics.reduce((max, current) => 
      current.goalsFor > max.goalsFor ? current : max
    );

    return topScorer.goalsFor > 0 ? { team: topScorer.team, goals: topScorer.goalsFor } : null;
  }

  /**
   * Obtiene el equipo con más victorias
   */
  private getMostWins(): { team: Team; wins: number } | null {
    if (this.teamStatistics.length === 0) return null;
    
    const mostWins = this.teamStatistics.reduce((max, current) => 
      current.wins > max.wins ? current : max
    );

    return mostWins.wins > 0 ? { team: mostWins.team, wins: mostWins.wins } : null;
  }

  /**
   * Cambia la vista seleccionada basada en el índice del tab
   */
  onViewChange(index: number): void {
    const views: ('general' | 'teams' | 'phases')[] = ['general', 'teams', 'phases'];
    this.selectedView = views[index] || 'general';
    this.cdr.detectChanges();
  }

  /**
   * Obtiene las estadísticas por fase
   */
  getPhaseStatistics(phase: Phase): any {
    const phaseMatches = this.matches.filter(match => match.phaseId === phase.id);
    const completedMatches = phaseMatches.filter(match => match.status === MatchStatus.FINISHED);
    const totalGoals = completedMatches.reduce((sum, match) => 
      sum + (match.homeScore || 0) + (match.awayScore || 0), 0
    );

    return {
      totalMatches: phaseMatches.length,
      completedMatches: completedMatches.length,
      totalGoals,
      averageGoalsPerMatch: completedMatches.length > 0 ? totalGoals / completedMatches.length : 0
    };
  }

  /**
   * TrackBy function para optimizar el renderizado
   */
  trackByTeamId(index: number, stat: TeamStatistics): number {
    return stat.team.id;
  }

  /**
   * TrackBy function para fases
   */
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id;
  }

  /**
   * Obtiene la posición del equipo en la tabla
   */
  getTeamPosition(index: number): number {
    return index + 1;
  }

  /**
   * Obtiene la clase CSS para la posición
   */
  getPositionClass(position: number): string {
    if (position === 1) return 'position-first';
    if (position <= 3) return 'position-podium';
    if (position <= this.teamStatistics.length / 2) return 'position-top-half';
    return 'position-bottom-half';
  }

  /**
   * Formatea números decimales
   */
  formatDecimal(value: number): string {
    return value.toFixed(2);
  }
}
