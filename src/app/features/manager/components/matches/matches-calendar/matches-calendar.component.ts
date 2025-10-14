import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface Match {
  id: number;
  date: Date;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  venue: string;
  matchday: number;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  result?: {
    homeGoals: number;
    awayGoals: number;
  };
  isHome: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  matches: Match[];
}

/**
 * Componente para gestionar el calendario y partidos del equipo
 */
@Component({
  selector: 'app-matches-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './matches-calendar.component.html',
  styleUrls: ['./matches-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchesCalendarComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  
  calendarDays: CalendarDay[] = [];
  upcomingMatches: Match[] = [];
  
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Mock data
  allMatches: Match[] = [
    {
      id: 1,
      date: new Date(2025, 9, 15, 18, 0), // Oct 15, 2025
      homeTeam: { id: 1, name: 'Mi Equipo', logo: 'assets/team-placeholder.png' },
      awayTeam: { id: 2, name: 'Rival FC', logo: 'assets/team-placeholder.png' },
      venue: 'Estadio Municipal',
      matchday: 11,
      status: 'scheduled',
      isHome: true
    },
    {
      id: 2,
      date: new Date(2025, 9, 20, 16, 30), // Oct 20, 2025
      homeTeam: { id: 3, name: 'Deportivo Unidos', logo: 'assets/team-placeholder.png' },
      awayTeam: { id: 1, name: 'Mi Equipo', logo: 'assets/team-placeholder.png' },
      venue: 'Estadio Central',
      matchday: 12,
      status: 'scheduled',
      isHome: false
    },
    {
      id: 3,
      date: new Date(2025, 9, 25, 19, 0), // Oct 25, 2025
      homeTeam: { id: 1, name: 'Mi Equipo', logo: 'assets/team-placeholder.png' },
      awayTeam: { id: 4, name: 'Atlético City', logo: 'assets/team-placeholder.png' },
      venue: 'Estadio Municipal',
      matchday: 13,
      status: 'scheduled',
      isHome: true
    },
    {
      id: 4,
      date: new Date(2025, 9, 5, 17, 0), // Oct 5, 2025 (past)
      homeTeam: { id: 1, name: 'Mi Equipo', logo: 'assets/team-placeholder.png' },
      awayTeam: { id: 5, name: 'Real Deportivo', logo: 'assets/team-placeholder.png' },
      venue: 'Estadio Municipal',
      matchday: 10,
      status: 'finished',
      result: { homeGoals: 3, awayGoals: 1 },
      isHome: true
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUpcomingMatches();
    this.generateCalendar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los próximos partidos
   */
  private loadUpcomingMatches(): void {
    const now = new Date();
    this.upcomingMatches = this.allMatches
      .filter(match => match.date > now && match.status === 'scheduled')
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }

  /**
   * Genera el calendario del mes actual
   */
  private generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const prevLastDay = new Date(this.currentYear, this.currentMonth, 0);
    
    const firstDayIndex = firstDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();

    this.calendarDays = [];

    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth - 1, prevLastDayDate - i);
      this.calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        matches: this.getMatchesForDate(date)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayDate; i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      const isToday = this.isToday(date);
      this.calendarDays.push({
        date,
        isCurrentMonth: true,
        isToday,
        matches: this.getMatchesForDate(date)
      });
    }

    // Next month days
    const remainingDays = 42 - this.calendarDays.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, i);
      this.calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        matches: this.getMatchesForDate(date)
      });
    }
  }

  /**
   * Obtiene los partidos para una fecha específica
   */
  private getMatchesForDate(date: Date): Match[] {
    return this.allMatches.filter(match => 
      match.date.getDate() === date.getDate() &&
      match.date.getMonth() === date.getMonth() &&
      match.date.getFullYear() === date.getFullYear()
    );
  }

  /**
   * Verifica si una fecha es hoy
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  /**
   * Navega al mes anterior
   */
  onPreviousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  /**
   * Navega al mes siguiente
   */
  onNextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  /**
   * Vuelve al mes actual
   */
  onToday(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  /**
   * Obtiene el color del estado del partido
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      scheduled: 'primary',
      live: 'accent',
      finished: '',
      postponed: 'warn',
      cancelled: 'warn'
    };
    return colors[status] || '';
  }

  /**
   * Obtiene el label del estado
   */
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      scheduled: 'Programado',
      live: 'En Vivo',
      finished: 'Finalizado',
      postponed: 'Pospuesto',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  }

  /**
   * Obtiene los días restantes para un partido
   */
  getDaysUntilMatch(match: Match): number {
    const now = new Date();
    const matchDate = new Date(match.date);
    const diff = matchDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Navega a los detalles del partido
   */
  onViewMatchDetails(matchId: number): void {
    // TODO: Navegar a detalles del partido
    console.log('Ver detalles del partido:', matchId);
  }
}
