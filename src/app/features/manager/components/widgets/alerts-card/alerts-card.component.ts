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
  alerts: Alert[] = [
    {
      id: 1,
      type: 'warning',
      icon: 'warning',
      title: 'Jugador Suspendido',
      message: 'Carlos Rodríguez no podrá jugar el próximo partido por acumulación de tarjetas amarillas.',
      date: new Date(),
      actionLabel: 'Ver Jugador',
      actionRoute: '/players/1'
    },
    {
      id: 2,
      type: 'info',
      icon: 'event',
      title: 'Próximo Partido',
      message: 'Recuerda confirmar la asistencia de tus jugadores para el partido del sábado.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actionLabel: 'Confirmar',
      actionRoute: '/matches/1'
    },
    {
      id: 3,
      type: 'success',
      icon: 'check_circle',
      title: 'Registro Completo',
      message: 'Todos los jugadores han completado su registro para el torneo.',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: 4,
      type: 'info',
      icon: 'notifications',
      title: 'Mensaje del Organizador',
      message: 'Se ha publicado el calendario de la siguiente fase del torneo.',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      actionLabel: 'Ver Calendario',
      actionRoute: '/matches'
    }
  ];

  ngOnInit(): void {
    // TODO: Cargar alertas reales
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
