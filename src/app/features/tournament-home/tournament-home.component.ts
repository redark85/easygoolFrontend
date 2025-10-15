import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, interval } from 'rxjs';

interface Tournament {
  id: number;
  name: string;
  season: string;
  bannerUrl: string;
  logoUrl: string;
  totalTeams: number;
  totalMatches: number;
  totalGoals: number;
  currentPhase: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  startDate: Date;
  endDate: Date;
}

interface NextMatch {
  id: number;
  homeTeam: {
    name: string;
    logo: string;
    position: number;
  };
  awayTeam: {
    name: string;
    logo: string;
    position: number;
  };
  date: Date;
  venue: string;
  matchday: number;
}

interface RecentMatch {
  id: number;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  homeScore: number;
  awayScore: number;
  date: Date;
  matchday: number;
}

interface TopScorer {
  id: number;
  name: string;
  photo: string;
  team: string;
  teamLogo: string;
  goals: number;
  matches: number;
}

interface QuickLink {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

/**
 * Componente para la landing page pública del torneo
 */
@Component({
  selector: 'app-tournament-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './tournament-home.component.html',
  styleUrls: ['./tournament-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TournamentHomeComponent implements OnInit, OnDestroy {
  // Tournament Info
  tournament: Tournament = {
    id: 1,
    name: 'Liga Amateur 2025',
    season: 'Temporada 2025',
    bannerUrl: 'assets/tournament-banner.jpg',
    logoUrl: 'assets/tournament-logo.png',
    totalTeams: 12,
    totalMatches: 66,
    totalGoals: 156,
    currentPhase: 'Fase de Grupos',
    status: 'ongoing',
    startDate: new Date(2025, 0, 15),
    endDate: new Date(2025, 5, 30)
  };

  // Next Featured Match
  nextMatch: NextMatch = {
    id: 1,
    homeTeam: {
      name: 'Deportivo FC',
      logo: 'assets/team-placeholder.png',
      position: 3
    },
    awayTeam: {
      name: 'Atlético United',
      logo: 'assets/team-placeholder.png',
      position: 5
    },
    date: new Date(2025, 9, 15, 18, 0),
    venue: 'Estadio Municipal',
    matchday: 11
  };

  // Recent Matches
  recentMatches: RecentMatch[] = [
    {
      id: 1,
      homeTeam: { name: 'Real FC', logo: 'assets/team-placeholder.png' },
      awayTeam: { name: 'Sporting Club', logo: 'assets/team-placeholder.png' },
      homeScore: 3,
      awayScore: 1,
      date: new Date(2025, 9, 10),
      matchday: 10
    },
    {
      id: 2,
      homeTeam: { name: 'Unidos FC', logo: 'assets/team-placeholder.png' },
      awayTeam: { name: 'Victoria United', logo: 'assets/team-placeholder.png' },
      homeScore: 2,
      awayScore: 2,
      date: new Date(2025, 9, 10),
      matchday: 10
    },
    {
      id: 3,
      homeTeam: { name: 'Campeones SC', logo: 'assets/team-placeholder.png' },
      awayTeam: { name: 'Estrella FC', logo: 'assets/team-placeholder.png' },
      homeScore: 1,
      awayScore: 0,
      date: new Date(2025, 9, 9),
      matchday: 10
    },
    {
      id: 4,
      homeTeam: { name: 'Tigres FC', logo: 'assets/team-placeholder.png' },
      awayTeam: { name: 'Leones United', logo: 'assets/team-placeholder.png' },
      homeScore: 4,
      awayScore: 2,
      date: new Date(2025, 9, 9),
      matchday: 10
    }
  ];

  // Top Scorers Preview
  topScorers: TopScorer[] = [
    {
      id: 1,
      name: 'Carlos Gómez',
      photo: 'assets/person.jpg',
      team: 'Real FC',
      teamLogo: 'assets/team-placeholder.png',
      goals: 12,
      matches: 10
    },
    {
      id: 2,
      name: 'Juan Martínez',
      photo: 'assets/person.jpg',
      team: 'Deportivo FC',
      teamLogo: 'assets/team-placeholder.png',
      goals: 10,
      matches: 10
    },
    {
      id: 3,
      name: 'Pedro López',
      photo: 'assets/person.jpg',
      team: 'Atlético United',
      teamLogo: 'assets/team-placeholder.png',
      goals: 9,
      matches: 9
    }
  ];

  // Quick Links
  quickLinks: QuickLink[] = [
    {
      title: 'Tabla de Posiciones',
      description: 'Consulta la clasificación actual',
      icon: 'leaderboard',
      route: '/public-standings/1',
      color: '#1976d2'
    },
    {
      title: 'Fixture Completo',
      description: 'Todos los partidos del torneo',
      icon: 'calendar_month',
      route: '/public-fixture/1',
      color: '#ff9800'
    },
    {
      title: 'Goleadores',
      description: 'Tabla de máximos goleadores',
      icon: 'sports_soccer',
      route: '/public-top-scorers/1',
      color: '#4caf50'
    },
    {
      title: 'Equipos',
      description: 'Información de todos los equipos',
      icon: 'groups',
      route: '/public-teams/1',
      color: '#9c27b0'
    },
    {
      title: 'Estadísticas',
      description: 'Números y récords del torneo',
      icon: 'analytics',
      route: '/public-tournament-stats/1',
      color: '#f44336'
    },
    {
      title: 'Reglamento',
      description: 'Normas y formato del torneo',
      icon: 'gavel',
      route: '/rules',
      color: '#607d8b'
    }
  ];

  // Countdown
  countdown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startCountdown();
    // TODO: Cargar datos reales del torneo
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicia el countdown para el próximo partido
   */
  private startCountdown(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateCountdown();
      });
  }

  /**
   * Actualiza el countdown
   */
  private updateCountdown(): void {
    const now = new Date().getTime();
    const matchTime = this.nextMatch.date.getTime();
    const distance = matchTime - now;

    if (distance > 0) {
      this.countdown.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.countdown.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.countdown.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.countdown.seconds = Math.floor((distance % (1000 * 60)) / 1000);
      this.cdr.detectChanges();
    }
  }

  /**
   * Obtiene el badge de estado del torneo
   */
  getStatusBadge(): { label: string; color: string } {
    const badges: { [key: string]: { label: string; color: string } } = {
      upcoming: { label: 'Próximamente', color: '#ff9800' },
      ongoing: { label: 'En Curso', color: '#4caf50' },
      finished: { label: 'Finalizado', color: '#607d8b' }
    };
    return badges[this.tournament.status] || badges['ongoing'];
  }

  /**
   * Obtiene el ícono de estado del torneo
   */
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      upcoming: 'schedule',
      ongoing: 'play_circle',
      finished: 'check_circle'
    };
    return icons[status] || icons['ongoing'];
  }

  /**
   * Obtiene el resultado de un partido
   */
  getMatchResult(match: RecentMatch): 'home' | 'away' | 'draw' {
    if (match.homeScore > match.awayScore) return 'home';
    if (match.awayScore > match.homeScore) return 'away';
    return 'draw';
  }

  /**
   * Formatea la fecha del partido
   */
  formatMatchDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
  }
}
