import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatchCardComponent } from './components/match-card/match-card.component';
import { PublicLoadingComponent } from '@shared/components';
import { ManagerService, TournamentPhase, TournamentGroup, PhaseType, ToastService } from '@core/services';

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
}

interface Match {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  date: Date;
  venue: string;
  status: 'upcoming' | 'live' | 'finished' | 'suspended';
  isLive: boolean;
  isFinished: boolean;
  matchday: number;
}

interface Matchday {
  number: number;
  date: Date;
  matches: Match[];
}


/**
 * Componente para mostrar el fixture completo del torneo
 */
@Component({
  selector: 'app-public-fixture',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    FormsModule,
    MatchCardComponent,
    PublicLoadingComponent
  ],
  templateUrl: './public-fixture.component.html',
  styleUrls: ['./public-fixture.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicFixtureComponent implements OnInit, OnDestroy {
  // Filtros - Usando los mismos tipos que tournament-home
  phases: TournamentPhase[] = [];
  groups: TournamentGroup[] = [];
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  selectedStatus: string = 'all';
  PhaseType = PhaseType; // Exponer el enum al template

  // Datos
  matchdays: Matchday[] = [];
  filteredMatchdays: Matchday[] = [];
  isLoading = false;
  tournamentId: number = 0;

  // Estadísticas
  stats = {
    total: 0,
    upcoming: 0,
    live: 0,
    finished: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private managerService: ManagerService,
    private toastService: ToastService
  ) {}

    goBack(): void {
    this.router.navigate(['/tournament-home', this.tournamentId]);
  }
  ngOnInit(): void {
    // Obtener tournamentId de la ruta
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
   * Carga las fases del torneo
   */
  private loadPhases(): void {
    this.managerService.getTournamentPhases(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournamentDetails) => {
          console.log('Detalles del torneo recibidos:', tournamentDetails);
          
          // Cargar fases
          this.phases = tournamentDetails.phases || [];
          console.log('Fases cargadas:', this.phases);
          
          // Seleccionar la primera fase por defecto
          if (this.phases.length > 0) {
            this.selectedPhaseId = this.phases[0].id;
            this.onPhaseChange();
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar fases:', error);
          this.toastService.showError('Error al cargar las fases del torneo');
        }
      });
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
      this.loadFixtureData();
    } else {
      this.loadFixtureData();
    }
    
    this.cdr.detectChanges();
  }

  /**
   * Carga los datos del fixture desde el API
   */
  private loadFixtureData(): void {
    this.isLoading = true;
    
    // TODO: Implementar llamada al API del fixture
    // Por ahora usar datos dummy
    setTimeout(() => {
      this.matchdays = this.generateDummyMatchdays();
      this.filteredMatchdays = [...this.matchdays];
      this.calculateStats();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  /**
   * Genera jornadas dummy
   */
  private generateDummyMatchdays(): Matchday[] {
    const teams: Team[] = [
      { id: 1, name: 'Real Madrid', shortName: 'RMA', logoUrl: 'assets/team-placeholder.png' },
      { id: 2, name: 'Barcelona', shortName: 'BAR', logoUrl: 'assets/team-placeholder.png' },
      { id: 3, name: 'Atlético Madrid', shortName: 'ATM', logoUrl: 'assets/team-placeholder.png' },
      { id: 4, name: 'Sevilla FC', shortName: 'SEV', logoUrl: 'assets/team-placeholder.png' },
      { id: 5, name: 'Valencia CF', shortName: 'VAL', logoUrl: 'assets/team-placeholder.png' },
      { id: 6, name: 'Real Betis', shortName: 'BET', logoUrl: 'assets/team-placeholder.png' }
    ];

    const matchdays: Matchday[] = [];
    const now = new Date();

    for (let i = 1; i <= 5; i++) {
      const matchdayDate = new Date(now);
      matchdayDate.setDate(now.getDate() + (i - 3) * 7); // -2 semanas a +2 semanas

      const matches: Match[] = [];
      
      // Generar 3 partidos por jornada
      for (let j = 0; j < 3; j++) {
        const matchDate = new Date(matchdayDate);
        matchDate.setHours(18 + j * 2, 0, 0, 0);

        const homeTeamIndex = j * 2;
        const awayTeamIndex = j * 2 + 1;

        let status: 'upcoming' | 'live' | 'finished' | 'suspended';
        let homeScore: number | null = null;
        let awayScore: number | null = null;

        // Determinar estado según la fecha
        if (matchDate < now) {
          status = 'finished';
          homeScore = Math.floor(Math.random() * 4);
          awayScore = Math.floor(Math.random() * 4);
        } else if (Math.abs(matchDate.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) {
          status = 'live';
          homeScore = Math.floor(Math.random() * 3);
          awayScore = Math.floor(Math.random() * 3);
        } else {
          status = 'upcoming';
        }

        matches.push({
          id: (i - 1) * 3 + j + 1,
          homeTeam: teams[homeTeamIndex],
          awayTeam: teams[awayTeamIndex],
          homeScore,
          awayScore,
          date: matchDate,
          venue: `Estadio ${teams[homeTeamIndex].name}`,
          status,
          isLive: status === 'live',
          isFinished: status === 'finished',
          matchday: i
        });
      }

      matchdays.push({
        number: i,
        date: matchdayDate,
        matches
      });
    }

    return matchdays;
  }

  /**
   * Calcula estadísticas de partidos
   */
  private calculateStats(): void {
    this.stats = {
      total: 0,
      upcoming: 0,
      live: 0,
      finished: 0
    };

    this.matchdays.forEach(matchday => {
      matchday.matches.forEach(match => {
        this.stats.total++;
        if (match.status === 'upcoming') this.stats.upcoming++;
        if (match.status === 'live') this.stats.live++;
        if (match.status === 'finished') this.stats.finished++;
      });
    });
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
        this.loadFixtureData();
      }
      
      this.cdr.detectChanges();
    }
  }

  /**
   * Maneja el cambio de grupo seleccionado
   */
  onGroupChange(): void {
    const selectedGroup = this.groups.find(g => g.id === this.selectedGroupId);
    
    if (selectedGroup) {
      console.log('Grupo seleccionado:', selectedGroup);
      this.loadFixtureData();
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
   * Maneja el cambio de estado
   */
  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  /**
   * Aplica los filtros seleccionados
   */
  private applyFilters(): void {
    this.filteredMatchdays = this.matchdays.map(matchday => ({
      ...matchday,
      matches: matchday.matches.filter(match => {
        if (this.selectedStatus === 'all') return true;
        return match.status === this.selectedStatus;
      })
    })).filter(matchday => matchday.matches.length > 0);

    this.cdr.detectChanges();
  }

  /**
   * Maneja el evento de ver detalles de un partido
   */
  onViewMatchDetails(match: Match): void {
    console.log('Ver detalles del partido:', match);
    this.router.navigate(['/public-match-detail', match.id]);
  }

  /**
   * Obtiene el badge de estado
   */
  getStatusBadge(status: string): { label: string; color: string } {
    const badges: { [key: string]: { label: string; color: string } } = {
      upcoming: { label: 'Próximos', color: '#2196f3' },
      live: { label: 'En Vivo', color: '#f44336' },
      finished: { label: 'Finalizados', color: '#4caf50' },
      suspended: { label: 'Suspendidos', color: '#ff9800' }
    };
    return badges[status] || badges['upcoming'];
  }
}
