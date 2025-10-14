import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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
export class QuickStatsCardComponent implements OnInit {
  quickStats: QuickStat[] = [
    {
      icon: 'sports_score',
      label: 'Goles a Favor',
      value: 25,
      color: '#4caf50',
      trend: 'up',
      trendValue: '+3'
    },
    {
      icon: 'shield',
      label: 'Goles en Contra',
      value: 8,
      color: '#f44336',
      trend: 'down',
      trendValue: '-2'
    },
    {
      icon: 'trending_up',
      label: 'Racha Actual',
      value: '5V',
      color: '#2196f3',
      trend: 'up',
      trendValue: 'Invicto'
    },
    {
      icon: 'emoji_events',
      label: 'Máximo Goleador',
      value: 'Juan Pérez (8)',
      color: '#ff9800',
      trend: 'neutral'
    },
    {
      icon: 'people',
      label: 'Total Jugadores',
      value: 18,
      color: '#9c27b0',
      trend: 'neutral'
    },
    {
      icon: 'star',
      label: 'Promedio Goles/Partido',
      value: '2.5',
      color: '#00bcd4',
      trend: 'up',
      trendValue: '+0.3'
    }
  ];

  ngOnInit(): void {
    // TODO: Cargar datos reales
  }
}
