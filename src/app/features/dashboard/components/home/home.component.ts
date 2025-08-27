import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models';
import { Observable } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

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

interface TopScorer {
  name: string;
  goals: number;
  color: string;
}

interface MatchData {
  date: string;
  matches: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('matchesChart') matchesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('goalscorersChart') goalscorersChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentUser$: Observable<User | null>;
  startDateControl = new FormControl();
  endDateControl = new FormControl();
  
  private matchesChart?: Chart;
  private goalscorersChart?: Chart;

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

  ngOnInit(): void {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.startDateControl.setValue(startDate);
    this.endDateControl.setValue(endDate);
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  private initializeCharts(): void {
    this.createMatchesChart();
    this.createGoalscorersChart();
  }

  private createMatchesChart(): void {
    const ctx = this.matchesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: this.matchesData.map(d => d.date),
        datasets: [{
          label: 'Partidos Realizados',
          data: this.matchesData.map(d => d.matches),
          borderColor: '#1976D2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1976D2',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          }
        }
      }
    };

    this.matchesChart = new Chart(ctx, config);
  }

  private createGoalscorersChart(): void {
    const ctx = this.goalscorersChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: this.topScorers.map(s => s.name),
        datasets: [{
          data: this.topScorers.map(s => s.goals),
          backgroundColor: this.topScorers.map(s => s.color),
          borderWidth: 0,
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        cutout: '60%'
      }
    };

    this.goalscorersChart = new Chart(ctx, config);
  }

  applyDateFilter(): void {
    // Simulate filtering data based on date range
    console.log('Filtering from:', this.startDateControl.value, 'to:', this.endDateControl.value);
    
    // Update charts with filtered data
    this.updateChartsWithFilteredData();
  }

  private updateChartsWithFilteredData(): void {
    // Update matches chart
    if (this.matchesChart) {
      this.matchesChart.data.datasets[0].data = this.getFilteredMatchesData();
      this.matchesChart.update();
    }

    // Update goalscorers chart
    if (this.goalscorersChart) {
      this.goalscorersChart.data.datasets[0].data = this.topScorers.map(s => s.goals);
      this.goalscorersChart.update();
    }
  }

  private getFilteredMatchesData(): number[] {
    // Simulate filtered data - in real app, filter based on date range
    return this.matchesData.map(d => Math.floor(d.matches * (0.7 + Math.random() * 0.6)));
  }

  getCardClass(color: string): string {
    return `dashboard-card ${color}`;
  }

  // Mock data for charts
  matchesData: MatchData[] = [
    { date: '01/12', matches: 5 },
    { date: '02/12', matches: 8 },
    { date: '03/12', matches: 3 },
    { date: '04/12', matches: 12 },
    { date: '05/12', matches: 7 },
    { date: '06/12', matches: 15 },
    { date: '07/12', matches: 9 },
    { date: '08/12', matches: 11 },
    { date: '09/12', matches: 6 },
    { date: '10/12', matches: 14 },
    { date: '11/12', matches: 8 },
    { date: '12/12', matches: 10 },
    { date: '13/12', matches: 13 },
    { date: '14/12', matches: 7 }
  ];

  topScorers: TopScorer[] = [
    { name: 'Lionel Messi', goals: 25, color: '#1976D2' },
    { name: 'Cristiano Ronaldo', goals: 22, color: '#4CAF50' },
    { name: 'Kylian Mbappé', goals: 18, color: '#FF9800' },
    { name: 'Erling Haaland', goals: 16, color: '#9C27B0' },
    { name: 'Robert Lewandowski', goals: 14, color: '#F44336' },
    { name: 'Karim Benzema', goals: 12, color: '#607D8B' }
  ];
}
