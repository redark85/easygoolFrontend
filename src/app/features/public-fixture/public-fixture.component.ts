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
import { ManagerService, TournamentPhase, TournamentGroup, PhaseType, ToastService, FixtureService } from '@core/services';
import { MatchStatusType } from '../../core/services/match.service';
import { CompleteFixtureResponse, FixtureMatchDay, FixtureMatch } from '@core/interfaces/fixture.interface';

// Interfaces adaptadas para la UI
interface UIMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogoUrl: string;
  awayTeamLogoUrl: string;
  homeScore: number | null;
  awayScore: number | null;
  date: Date;
  status: MatchStatusType;
  isLive: boolean;
  isFinished: boolean;
  matchday: number;
}

interface UIMatchday {
  id: number;
  name: string;
  date: Date;
  matches: UIMatch[];
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
  matchdays: UIMatchday[] = [];
  filteredMatchdays: UIMatchday[] = [];
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
    private toastService: ToastService,
    private fixtureService: FixtureService
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
          //this.phases = tournamentDetails.phases || [];
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
    if (!this.selectedPhaseId) {
      console.warn('No hay fase seleccionada');
      return;
    }

    this.isLoading = true;
    
    this.fixtureService.getCompleteFixture(this.selectedPhaseId, this.selectedGroupId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.succeed && response.result) {
            console.log('Datos del fixture recibidos:', response.result);
            this.processFixtureData(response.result);
            this.updateStats(response.result);
          } else {
            console.error('Error en la respuesta:', response.message);
            this.toastService.showError(response.message || 'Error al cargar el fixture');
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar fixture:', error);
          this.toastService.showError('Error al cargar los datos del fixture');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Procesa los datos del fixture del API y los convierte al formato de la UI
   */
  private processFixtureData(fixtureResult: any): void {
    this.matchdays = fixtureResult.matches.map((matchday: FixtureMatchDay) => ({
      id: matchday.matchDayId,
      name: matchday.matchDayName,
      date: new Date(), // Se puede obtener de la primera fecha de partido si es necesario
      matches: matchday.matches.map((match: FixtureMatch) => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeTeamLogoUrl: match.homeTeamLogoUrl,
        awayTeamLogoUrl: match.awayTeamLogoUrl,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        date: new Date(match.matchDate),
        status: this.mapApiStatusToMatchStatusType(match.status),
        isLive: match.status === 1, // MatchStatusType.inProgress
        isFinished: match.status === 2, // MatchStatusType.played
        matchday: matchday.matchDayId
      }))
    }));

    this.filteredMatchdays = [...this.matchdays];
    this.applyFilters();
  }

  /**
   * Mapea el estado del API al MatchStatusType
   */
  private mapApiStatusToMatchStatusType(apiStatus: number): MatchStatusType {
    switch (apiStatus) {
      case 0:
        return MatchStatusType.scheduled;
      case 1:
        return MatchStatusType.inProgress;
      case 2:
        return MatchStatusType.played;
      case 3:
        return MatchStatusType.canceled;
      case 4:
        return MatchStatusType.postponed;
      default:
        return MatchStatusType.scheduled;
    }
  }

  /**
   * Actualiza las estadísticas con los datos del API
   */
  private updateStats(fixtureResult: any): void {
    this.stats = {
      total: fixtureResult.totalMatches,
      upcoming: fixtureResult.nextMatches,
      live: fixtureResult.liveMatches,
      finished: fixtureResult.playedMatches
    };
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
   * Mapea el filtro de string a MatchStatusType
   */
  private mapFilterToMatchStatusType(filter: string): MatchStatusType | null {
    switch (filter) {
      case 'upcoming':
        return MatchStatusType.scheduled;
      case 'live':
        return MatchStatusType.inProgress;
      case 'finished':
        return MatchStatusType.played;
      case 'suspended':
        return MatchStatusType.postponed;
      case 'cancelled':
        return MatchStatusType.canceled;
      default:
        return null;
    }
  }

  /**
   * Aplica los filtros seleccionados
   */
  private applyFilters(): void {
    this.filteredMatchdays = this.matchdays.map(matchday => ({
      ...matchday,
      matches: matchday.matches.filter(match => {
        if (this.selectedStatus === 'all') return true;
        const filterStatus = this.mapFilterToMatchStatusType(this.selectedStatus);
        return filterStatus !== null && match.status === filterStatus;
      })
    })).filter(matchday => matchday.matches.length > 0);

    this.cdr.detectChanges();
  }

  /**
   * Maneja el evento de ver detalles de un partido
   */
  onViewMatchDetails(match: UIMatch): void {
    console.log('Ver detalles del partido:', match);
    this.router.navigate(['/public-match-detail', match.id]);
  }

  /**
   * Obtiene el badge de estado basado en MatchStatusType
   */
  getStatusBadge(status: string): { label: string; color: string } {
    const badges: { [key: string]: { label: string; color: string } } = {
      upcoming: { label: 'Programados', color: '#1976d2' },
      live: { label: 'En Vivo', color: '#4caf50' },
      finished: { label: 'Jugados', color: '#9c27b0' },
      suspended: { label: 'Postergados', color: '#ff9800' },
      cancelled: { label: 'Cancelados', color: '#f44336' }
    };
    return badges[status] || badges['upcoming'];
  }

  /**
   * Obtiene el texto del estado basado en MatchStatusType
   */
  getMatchStatusText(status: MatchStatusType): string {
    switch (status) {
      case MatchStatusType.scheduled:
        return 'PROGRAMADO';
      case MatchStatusType.inProgress:
        return 'EN VIVO';
      case MatchStatusType.played:
        return 'JUGADO';
      case MatchStatusType.canceled:
        return 'CANCELADO ELIMINADO';
      case MatchStatusType.postponed:
        return 'POSTERGADO';
      default:
        return 'DESCONOCIDO';
    }
  }
}
