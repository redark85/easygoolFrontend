import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { ManagerService, TournamentPhase, TournamentGroup, PhaseType, TournamentDetails, ToastService, TournamentHomeService } from '@core/services';
import { TournamentHomeData, OutstandingMatch, LastMatch, BestScorer } from '@core/interfaces/tournament-home.interface';
import { DefaultImageDirective } from '@shared/directives/default-image.directive';
import { PublicLoadingComponent } from '@shared/components';

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
  type: string;
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
    MatSelectModule,
    MatProgressSpinnerModule,
    FormsModule,
    DefaultImageDirective,
    PublicLoadingComponent
  ],
  templateUrl: './tournament-home.component.html',
  styleUrls: ['./tournament-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TournamentHomeComponent implements OnInit, OnDestroy {
  // Tournament Info
  tournament: Tournament = {
    id: 1,
    name: 'Cargando...',
    season: 'Temporada 2025',
    bannerUrl: 'assets/tournament-banner.jpg',
    logoUrl: 'assets/logo.png',
    totalTeams: 0,
    totalMatches: 0,
    totalGoals: 0,
    currentPhase: 'Cargando...',
    status: 'upcoming',
    startDate: new Date(),
    endDate: new Date(),
    type : 'Cargando...'
  };

  // Next Featured Match
  nextMatch: NextMatch = {
    id: 0,
    homeTeam: {
      name: 'Cargando...',
      logo: 'assets/team-placeholder.png',
      position: 0
    },
    awayTeam: {
      name: 'Cargando...',
      logo: 'assets/team-placeholder.png',
      position: 0
    },
    date: new Date(),
    venue: 'Cargando...',
    matchday: 0
  };

  // Recent Matches
  recentMatches: RecentMatch[] = [];

  // Top Scorers Preview
  topScorers: TopScorer[] = [];

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

  // Selects de Categoría, Fase y Grupo
  categories: any[] = [];
  phases: TournamentPhase[] = [];
  groups: TournamentGroup[] = [];
  selectedCategoryId: number | null = null;
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  PhaseType = PhaseType; // Exponer el enum al template
  tournamentId: number = 1; // Por defecto torneo 1
  
  // Información del torneo desde API
  tournamentDetails: TournamentDetails | null = null;
  isLoadingTournamentData = false;

  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private managerService: ManagerService,
    private toastService: ToastService,
    private tournamentHomeService: TournamentHomeService
  ) {}

  ngOnInit(): void {
    this.startCountdown();
    
    // Obtener el tournamentId de los parámetros de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('tournamentId');
        if (id) {
          this.tournamentId = +id;
          console.log('Tournament ID recibido:', this.tournamentId);
          this.loadPhases();
        } else {
          // Si no hay ID en la ruta, usar el ID por defecto
          this.loadPhases();
        }
      });
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

  /**
   * Carga las categorías del torneo
   */
  private loadPhases(): void {
    this.managerService.getTournamentPhases(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Respuesta del torneo recibida:', response);
          
          if (response ) {
            const tournamentDetails = response;
            
            // Guardar detalles del torneo
            this.tournamentDetails = tournamentDetails;
            
            // Actualizar información del torneo existente
            this.tournament.name = tournamentDetails.name;
            this.tournament.startDate = new Date(tournamentDetails.startDate);
            this.tournament.endDate = new Date(tournamentDetails.endDate);
            this.tournament.logoUrl = tournamentDetails.imageUrl || 'assets/logo.png';
            
            // Cargar categorías
            this.categories = tournamentDetails.categories || [];
            console.log('Categorías cargadas:', this.categories);
            
            // Seleccionar la primera categoría por defecto
            if (this.categories.length > 0) {
              this.selectedCategoryId = this.categories[0].id;
              this.onCategoryChange();
            }
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
          this.toastService.showError('Error al cargar las categorías del torneo');
        }
      });
  }

  /**
   * Maneja el cambio de categoría seleccionada
   */
  onCategoryChange(): void {
    const selectedCategory = this.categories.find(c => c.id === this.selectedCategoryId);
    
    if (selectedCategory) {
      console.log('Categoría seleccionada:', selectedCategory);
      
      // Cargar fases de la categoría seleccionada
      this.phases = selectedCategory.phases || [];
      console.log('Fases de la categoría:', this.phases);
      
      // Limpiar selecciones de fase y grupo
      this.selectedPhaseId = null;
      this.selectedGroupId = null;
      this.groups = [];
      this.loadTournamentHomeData();
      this.cdr.detectChanges();
    }
  }

  /**
   * Maneja el cambio de fase seleccionada
   */
  onPhaseChange(): void {
    const selectedPhase = this.selectedPhase;
    
    if (selectedPhase) {
      console.log('Fase seleccionada:', selectedPhase);
      
      // Si es fase de grupos, cargar los grupos
      if (selectedPhase.phaseType === PhaseType.Groups) {
        this.loadGroups(selectedPhase);
      } else {
        // Si es knockout, limpiar grupos y cargar datos
        this.groups = [];
        this.selectedGroupId = null;
        this.loadTournamentHomeData();
      }
      
      this.cdr.detectChanges();
    }
  }

  /**
   * Carga los grupos de la fase seleccionada
   */
  private loadGroups(selectedPhase: TournamentPhase): void {
    // Cargar los grupos desde la fase seleccionada
    this.groups = selectedPhase.groups || [];
    
    console.log('Grupos cargados:', this.groups);

    // Seleccionar el primer grupo por defecto
    if (this.groups.length > 0) {
      this.selectedGroupId = this.groups[0].id;
      this.loadTournamentHomeData();
    }
    
    this.cdr.detectChanges();
  }

  /**
   * Maneja el cambio de grupo seleccionado
   */
  onGroupChange(): void {
    const selectedGroup = this.groups.find(g => g.id === this.selectedGroupId);
    
    if (selectedGroup) {
      console.log('Grupo seleccionado:', selectedGroup);
      this.loadTournamentHomeData();
    }
  }

  /**
   * Obtiene la fase seleccionada
   */
  get selectedPhase(): TournamentPhase | undefined {
    return this.phases.find(p => p.id === this.selectedPhaseId);
  }

  /**
   * Verifica si debe mostrar el select de grupos
   */
  get shouldShowGroupSelect(): boolean {
    return this.selectedPhase?.phaseType === PhaseType.Groups && this.groups.length > 0;
  }

  /**
   * Verifica si hay categorías disponibles
   */
  get hasCategoriesData(): boolean {
    return this.categories && this.categories.length > 0;
  }

  /**
   * Carga los datos del home del torneo desde el API
   */
  private loadTournamentHomeData(): void {
    if (!this.selectedCategoryId) {
      console.warn('No hay fase seleccionada');
      return;
    }

    this.isLoadingTournamentData = true;
    const groupId = this.selectedGroupId || 0; // 0 si no hay grupo seleccionado

    const phaseId = this.selectedPhaseId || 0; // 0 si no hay grupo seleccionado

    this.tournamentHomeService.getTournamentHome(this.tournamentId, this.selectedCategoryId!, phaseId, groupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeed && response.result) {
            console.log('Datos del torneo recibidos:', response.result);
            this.updateTournamentData(response.result);
          } else {
            console.error('Error en la respuesta:', response.message);
            this.toastService.showError(response.message || 'Error al cargar los datos del torneo');
          }
          this.isLoadingTournamentData = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar datos del torneo:', error);
          this.toastService.showError('Error al cargar los datos del torneo');
          this.isLoadingTournamentData = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Actualiza los datos del torneo con la respuesta del API
   */
  private updateTournamentData(data: TournamentHomeData): void {
    console.log('Updating tournament data:', data);
    
    // Actualizar información general del torneo
    this.tournament = {
      ...this.tournament,
      name: data.name,
      totalTeams: data.totalTeams,
      totalMatches: data.totalMatches,
      totalGoals: data.goals,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      currentPhase: data.phaseName,
      status: this.mapApiStatusToTournamentStatus(data.status)
    };
    
    // Mantener la imagen por defecto si no viene logoUrl del API
    // (el logoUrl del torneo se obtiene desde tournamentDetails, no desde este API)

    // Actualizar próximo partido destacado
    if (data.outstandingMatch) {
      this.updateNextMatch(data.outstandingMatch);
    } else {
      console.warn('No outstanding match data received');
    }

    // Actualizar últimos partidos
    if (data.lastMatches && data.lastMatches.length > 0) {
      this.updateRecentMatches(data.lastMatches);
    } else {
      console.warn('No recent matches data received');
      this.recentMatches = []; // Limpiar si no hay datos
    }

    // Actualizar goleadores
    if (data.bestScorers && data.bestScorers.length > 0) {
      this.updateTopScorers(data.bestScorers);
    } else {
      console.warn('No top scorers data received');
      this.topScorers = []; // Limpiar si no hay datos
    }
    
    // Forzar detección de cambios
    console.log('Forcing change detection...');
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * Actualiza el próximo partido con datos del API
   */
  private updateNextMatch(match: OutstandingMatch): void {
    this.nextMatch = {
      ...this.nextMatch,
      id: 1,
      homeTeam: {
        name: match.homeTeamName,
        logo: match.homeTeamLogoUrl,
        position: match.homeTeamPosition
      },
      awayTeam: {
        name: match.awayTeamName,
        logo: match.awayTeamLogoUrl,
        position: match.awayTeamPosition
      },
      date: new Date(match.matchDate),
      venue: match.groupName || match.phaseName,
      matchday: parseInt(match.matchDayName.replace(/\D/g, '')) || 1
    };
    
    console.log('Next match updated:', this.nextMatch);
  }

  /**
   * Actualiza los últimos partidos con datos del API
   */
  private updateRecentMatches(matches: LastMatch[]): void {
    // Crear nuevo array para forzar detección de cambios
    const newRecentMatches = matches.slice(0, 4).map((match, index) => ({
      id: index + 1,
      homeTeam: {
        name: match.homeTeamName,
        logo: match.homeTeamLogoUrl
      },
      awayTeam: {
        name: match.awayTeamName,
        logo: match.awayTeamLogoUrl
      },
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      date: new Date(match.matchDate),
      matchday: parseInt(match.matchDayName.replace(/\D/g, '')) || 1
    }));
    
    this.recentMatches = [...newRecentMatches];
    console.log('Recent matches updated:', this.recentMatches);
  }

  /**
   * Actualiza los goleadores con datos del API
   */
  private updateTopScorers(scorers: BestScorer[]): void {
    // Crear nuevo array para forzar detección de cambios
    const newTopScorers = scorers.slice(0, 3).map((scorer, index) => ({
      id: index + 1,
      name: scorer.name,
      photo: scorer.imageUrl,
      team: scorer.teamName,
      teamLogo: scorer.teamLogoUrl,
      goals: scorer.goals,
      matches: 10 // Este campo no viene del API, usar valor por defecto
    }));
    
    this.topScorers = [...newTopScorers];
    console.log('Top scorers updated:', this.topScorers);
  }

  /**
   * Mapea el status del API al status del componente
   */
  private mapApiStatusToTournamentStatus(apiStatus: number): 'upcoming' | 'ongoing' | 'finished' {
    switch (apiStatus) {
      case 0: return 'upcoming';
      case 1: return 'ongoing';
      case 2: return 'finished';
      default: return 'ongoing';
    }
  }

}
