import { Component, OnInit, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TeamDetail } from '../../../models/team-detail.interface';

interface QuickStat {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

/**
 * Widget que muestra estadísticas rápidas del equipo
 */
@Component({
  selector: 'app-quick-stats-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './quick-stats-card.component.html',
  styleUrls: ['./quick-stats-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickStatsCardComponent implements OnInit, OnChanges {
  @Input() teamDetail: TeamDetail | null = null;
  
  quickStats: QuickStat[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateQuickStats();
  }

  ngOnChanges(): void {
    this.updateQuickStats();
  }

  /**
   * Actualiza las estadísticas rápidas con datos reales del API
   */
  private updateQuickStats(): void {
    if (this.teamDetail) {
      // Calcular efectividad como porcentaje
      const effectiveness = Math.round(this.teamDetail.effectiveness);
      const effectivenessText = effectiveness >= 70 ? 'Excelente' : effectiveness >= 50 ? 'Buena' : 'Regular';
      
      this.quickStats = [
        {
          icon: 'trending_up',
          label: 'Efectividad',
          value: `${effectiveness}%`,
          color: '#2196f3',
          trend: effectiveness >= 70 ? 'up' : effectiveness >= 50 ? 'neutral' : 'down',
          trendValue: effectivenessText
        },
        {
          icon: 'emoji_events',
          label: 'Máximo Goleador',
          value: this.teamDetail.topScorer ? `${this.teamDetail.topScorer.name} (${this.teamDetail.topScorer.goals})` : 'Sin datos',
          color: '#ff9800',
          trend: 'neutral'
        },
        {
          icon: 'people',
          label: 'Total Jugadores',
          value: this.teamDetail.totalPlayers,
          color: '#9c27b0',
          trend: 'neutral'
        },
        {
          icon: 'star',
          label: 'Puntos por Partido',
          value: this.teamDetail.pointsPerMatch.toFixed(1),
          color: '#00bcd4',
          trend: this.teamDetail.pointsPerMatch >= 2 ? 'up' : this.teamDetail.pointsPerMatch >= 1 ? 'neutral' : 'down',
          trendValue: this.teamDetail.pointsPerMatch >= 2 ? 'Excelente' : this.teamDetail.pointsPerMatch >= 1 ? 'Bueno' : 'Mejorable'
        }
      ];
    } else {
      // Si no hay datos del API, limpiar las estadísticas
      this.quickStats = [];
    }
    
    // Forzar detección de cambios
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
}
