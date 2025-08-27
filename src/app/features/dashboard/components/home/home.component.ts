import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models';
import { Observable } from 'rxjs';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  currentUser$: Observable<User | null>;

  dashboardCards: DashboardCard[] = [
    {
      title: 'Partidos Jugados',
      value: 24,
      icon: 'sports_soccer',
      color: 'primary',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Equipos Activos',
      value: 8,
      icon: 'groups',
      color: 'secondary',
      trend: { value: 2, isPositive: true }
    },
    {
      title: 'Jugadores Registrados',
      value: 156,
      icon: 'person',
      color: 'accent',
      trend: { value: 8, isPositive: false }
    },
    {
      title: 'Torneos en Curso',
      value: 3,
      icon: 'emoji_events',
      color: 'warn',
      trend: { value: 1, isPositive: true }
    }
  ];

  recentActivities = [
    {
      icon: 'sports_soccer',
      title: 'Partido Real Madrid vs Barcelona',
      description: 'Finalizado - 2:1',
      time: 'Hace 2 horas',
      color: 'primary'
    },
    {
      icon: 'person_add',
      title: 'Nuevo jugador registrado',
      description: 'Carlos Rodríguez se unió al equipo',
      time: 'Hace 4 horas',
      color: 'secondary'
    },
    {
      icon: 'emoji_events',
      title: 'Torneo Liga Local iniciado',
      description: '16 equipos participando',
      time: 'Hace 1 día',
      color: 'accent'
    },
    {
      icon: 'analytics',
      title: 'Reporte semanal generado',
      description: 'Estadísticas actualizadas',
      time: 'Hace 2 días',
      color: 'primary'
    }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.getCurrentUser();
  }

  ngOnInit(): void {}

  getCardClass(color: string): string {
    return `dashboard-card ${color}`;
  }
}
