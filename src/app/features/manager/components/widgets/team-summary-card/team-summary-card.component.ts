import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

interface TeamSummary {
  teamName: string;
  logoUrl: string;
  currentPosition: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

/**
 * Widget que muestra el resumen del equipo
 */
@Component({
  selector: 'app-team-summary-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './team-summary-card.component.html',
  styleUrls: ['./team-summary-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamSummaryCardComponent implements OnInit {
  teamSummary: TeamSummary = {
    teamName: 'Mi Equipo',
    logoUrl: 'assets/team-placeholder.png',
    currentPosition: 3,
    points: 24,
    matchesPlayed: 10,
    wins: 7,
    draws: 3,
    losses: 0,
    goalsFor: 25,
    goalsAgainst: 8
  };

  ngOnInit(): void {
    // TODO: Cargar datos reales del equipo
  }

  get goalDifference(): number {
    return this.teamSummary.goalsFor - this.teamSummary.goalsAgainst;
  }

  get winPercentage(): number {
    if (this.teamSummary.matchesPlayed === 0) return 0;
    return (this.teamSummary.wins / this.teamSummary.matchesPlayed) * 100;
  }
}
