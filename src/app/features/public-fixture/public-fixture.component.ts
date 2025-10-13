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

interface Phase {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
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
    MatchCardComponent
  ],
  templateUrl: './public-fixture.component.html',
  styleUrls: ['./public-fixture.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicFixtureComponent implements OnInit, OnDestroy {
  // Filtros
  phases: Phase[] = [];
  groups: Group[] = [];
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  selectedStatus: string = 'all';

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener tournamentId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('tournamentId');
        if (id) {
          this.tournamentId = +id;
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos del fixture
   */
  private loadData(): void {
    this.isLoading = true;
    
    // TODO: Cargar desde API
    // Por ahora usar datos dummy
    this.loadDummyData();
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /**
   * Carga datos dummy para demostración
   */
  private loadDummyData(): void {
    // Fases
    this.phases = [
      { id: 1, name: 'Fase de Grupos' },
      { id: 2, name: 'Octavos de Final' },
      { id: 3, name: 'Cuartos de Final' }
    ];

    // Grupos
    this.groups = [
      { id: 1, name: 'Grupo A' },
      { id: 2, name: 'Grupo B' },
      { id: 3, name: 'Grupo C' }
    ];

    // Seleccionar primera fase y grupo
    this.selectedPhaseId = this.phases[0].id;
    this.selectedGroupId = this.groups[0].id;

    // Generar jornadas con partidos
    this.matchdays = this.generateDummyMatchdays();
    this.filteredMatchdays = [...this.matchdays];
    this.calculateStats();
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
   * Maneja el cambio de fase
   */
  onPhaseChange(): void {
    console.log('Fase seleccionada:', this.selectedPhaseId);
    this.applyFilters();
  }

  /**
   * Maneja el cambio de grupo
   */
  onGroupChange(): void {
    console.log('Grupo seleccionado:', this.selectedGroupId);
    this.applyFilters();
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
