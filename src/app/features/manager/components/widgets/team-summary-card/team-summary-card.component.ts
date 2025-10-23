import { Component, OnInit, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TeamDetail } from '../../../models/team-detail.interface';

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
export class TeamSummaryCardComponent implements OnInit, OnChanges {
  @Input() teamDetail: TeamDetail | null = null;
  
  teamSummary: TeamSummary | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateTeamSummary();
  }

  ngOnChanges(): void {
    this.updateTeamSummary();
  }

  /**
   * Actualiza el resumen del equipo con datos reales del API
   */
  private updateTeamSummary(): void {
    if (this.teamDetail) {
      // Convertir URL HTTP a HTTPS si es necesario y usar imagen por defecto si no hay logoUrl
      let logoUrl = this.teamDetail.logoUrl || 'assets/default-team.png';
      if (logoUrl.startsWith('http://')) {
        logoUrl = logoUrl.replace('http://', 'https://');
      }
      
      this.teamSummary = {
        teamName: this.teamDetail.teamName,
        logoUrl: logoUrl,
        currentPosition: this.teamDetail.position,
        points: this.teamDetail.points,
        matchesPlayed: this.teamDetail.played,
        wins: this.teamDetail.wins,
        draws: this.teamDetail.draws,
        losses: this.teamDetail.losses,
        goalsFor: this.teamDetail.goalsFor,
        goalsAgainst: this.teamDetail.goalsAgainst
      };
    } else {
      // Si no hay datos del API, limpiar el resumen
      this.teamSummary = null;
    }
    
    // Forzar detección de cambios
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  get goalDifference(): number {
    if (!this.teamSummary) return 0;
    return this.teamSummary.goalsFor - this.teamSummary.goalsAgainst;
  }

  get winPercentage(): number {
    if (!this.teamSummary || this.teamSummary.matchesPlayed === 0) return 0;
    return (this.teamSummary.wins / this.teamSummary.matchesPlayed) * 100;
  }
}
