import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Alert {
  id: number;
  type: 'warning' | 'info' | 'success' | 'error';
  icon: string;
  title: string;
  message: string;
  date: Date;
  actionLabel?: string;
  actionRoute?: string;
}

/**
 * Widget que muestra alertas y notificaciones importantes
 */
@Component({
  selector: 'app-alerts-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './alerts-card.component.html',
  styleUrls: ['./alerts-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertsCardComponent implements OnInit {
  alerts: Alert[] = [];

  ngOnInit(): void {
    // Las alertas se cargarían desde un servicio real
    // Por ahora mantenemos el array vacío hasta que se implemente el API
  }

  getAlertColor(type: string): string {
    const colors: { [key: string]: string } = {
      warning: '#ff9800',
      info: '#2196f3',
      success: '#4caf50',
      error: '#f44336'
    };
    return colors[type] || '#666';
  }

  dismissAlert(alertId: number): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }
}
