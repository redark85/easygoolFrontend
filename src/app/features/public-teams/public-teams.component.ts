import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ManagerService, TournamentPhase, TournamentGroup, PhaseType, ToastService, ApiService } from '@core/services';
import { FIXTURE_GET_TOURNAMENT_TEAMS_SUMMARY_ENDPOINT } from '@core/config/endpoints';
import { TournamentTeamsSummaryApiResponse, TournamentTeamsSummaryData, TournamentTeamsSummaryParams, TeamSummary } from './models/tournament-teams-summary.interface';
import { PublicLoadingComponent } from '@shared/components/public-loading/public-loading.component';

interface Team {
  id?: number; // Opcional para compatibilidad
  name: string; // Mapea de teamName
  shortName?: string; // Opcional, no viene del API
  logoUrl: string; // Mapea de teamLogoUrl
  position: number;
  points: number;
  matchesPlayed?: number; // Calculado de wins + draws + losses
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  totalPlayers: number; // Mapea de playersCount
  groupId?: number; // Opcional, calculado del groupName
  groupName: string;
  // Campos adicionales para UI (no vienen del API)
  coach?: string;
  stadium?: string;
  founded?: number;
}

interface Group {
  id: number;
  name: string;
}

interface PositionFilter {
  id: string;
  name: string;
  range: { min: number; max: number };
}

/**
 * Componente para mostrar todos los equipos participantes del torneo
 */
@Component({
  selector: 'app-public-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormsModule,
    PublicLoadingComponent
  ],
  templateUrl: './public-teams.component.html',
  styleUrls: ['./public-teams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTeamsComponent implements OnInit, OnDestroy {
  // Filtros - Fases y Grupos como public-top-scorers
  phases: TournamentPhase[] = [];
  groups: TournamentGroup[] = [];
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  PhaseType = PhaseType; // Exponer el enum al template

  // Datos
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  positionFilters: PositionFilter[] = [];
  
  // Filtros adicionales
  selectedPositionFilter: string = 'all';
  searchText: string = '';
  
  isLoading = false;
  tournamentId: number = 0;

  // Estadísticas
  stats = {
    totalTeams: 0,
    totalPlayers: 0,
    totalGoals: 0,
    averageGoals: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private managerService: ManagerService,
    private toastService: ToastService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initializePositionFilters();
    
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
   * Inicializa los filtros de posición
   */
  private initializePositionFilters(): void {
    this.positionFilters = [
      { id: 'all', name: 'Todas las posiciones', range: { min: 1, max: 999 } },
      { id: 'top3', name: 'Top 3', range: { min: 1, max: 3 } },
      { id: 'top5', name: 'Top 5', range: { min: 1, max: 5 } },
      { id: 'mid', name: 'Medio (6-10)', range: { min: 6, max: 10 } },
      { id: 'bottom', name: 'Últimos lugares', range: { min: 11, max: 999 } }
    ];
  }

  /**
   * Carga los datos de los equipos desde el API
   */
  private loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    const params: TournamentTeamsSummaryParams = {
      phaseId: this.selectedPhaseId || 0,
      groupId: this.selectedGroupId || 0
    };
    
    console.log('🏆 Cargando equipos para:', params);
    
    this.apiService.get<TournamentTeamsSummaryApiResponse>(
      `${FIXTURE_GET_TOURNAMENT_TEAMS_SUMMARY_ENDPOINT}?PhaseId=${params.phaseId}&GroupId=${params.groupId}`
    )
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response) => {
        console.log('✅ Respuesta del API de equipos:', response);
        
        if (response.succeed && response.result) {
          this.processApiData(response.result);
        } else {
          console.warn('⚠️ API response no exitosa:', response.message);
          this.toastService.showWarning(response.message || 'No se pudieron cargar los equipos');
          this.clearData();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar equipos:', error);
        this.toastService.showError('Error al cargar los equipos del torneo');
        this.clearData();
      }
    });
  }

  /**
   * Procesa los datos recibidos del API
   */
  private processApiData(data: TournamentTeamsSummaryData): void {
    console.log('🔄 Procesando datos del API:', data);
    console.log('📊 Teams recibidos del API:', data.teams?.length || 0);
    
    // Procesar estadísticas principales
    this.stats = {
      totalTeams: data.totalTeams || 0,
      totalPlayers: data.totalPlayers || 0,
      totalGoals: data.totalGoals || 0,
      averageGoals: data.goalsAverage || 0
    };
    
    // Procesar equipos
    this.teams = data.teams?.map((teamData: TeamSummary, index: number) => ({
      id: teamData.tournamentTeamId, 
      name: teamData.teamName || 'Equipo sin nombre',
      shortName: teamData.teamName?.substring(0, 3).toUpperCase() || 'TBD', // Generar shortName
      logoUrl: teamData.teamLogoUrl || 'assets/default-team.png',
      position: teamData.position || 0,
      points: teamData.points || 0,
      matchesPlayed: (teamData.wins || 0) + (teamData.draws || 0) + (teamData.losses || 0),
      wins: teamData.wins || 0,
      draws: teamData.draws || 0,
      losses: teamData.losses || 0,
      goalsFor: teamData.goalsFor || 0,
      goalsAgainst: teamData.goalsAgainst || 0,
      goalDifference: teamData.goalDifference || 0,
      totalPlayers: teamData.playersCount || 0,
      groupId: index + 1, // Generar groupId basado en el índice
      groupName: teamData.groupName || 'Sin grupo',
      // Campos adicionales para UI (valores por defecto)
      coach: 'Entrenador no disponible',
      stadium: 'Estadio no disponible',
      founded: 2000
    })) || [];
    
    // Aplicar filtros después de procesar
    this.applyFilters();
    
    console.log('✅ Datos procesados correctamente');
    console.log('📈 Stats:', this.stats);
    console.log('🏆 Teams procesados:', this.teams.length);
    console.log('🔍 Teams filtrados:', this.filteredTeams.length);
    console.log('👥 Equipos:', this.teams.map(t => ({ name: t.name, group: t.groupName, position: t.position })));
  }
  
  /**
   * Limpia los datos cuando hay error o no hay resultados
   */
  private clearData(): void {
    // Resetear a valores por defecto
    this.stats = {
      totalTeams: 0,
      totalPlayers: 0,
      totalGoals: 0,
      averageGoals: 0
    };
    
    this.teams = [];
    this.filteredTeams = [];
  }

  /**
   * Genera equipos dummy
   */
  private generateDummyTeams(): void {
    // Asegurar que tenemos grupos disponibles
    if (!this.groups || this.groups.length === 0) {
      console.warn('No hay grupos disponibles, usando grupos por defecto');
      this.groups = [
        { id: 1, name: 'Grupo A' },
        { id: 2, name: 'Grupo B' },
        { id: 3, name: 'Grupo C' },
        { id: 4, name: 'Grupo D' }
      ];
    }

    console.log('Generando equipos con grupos:', this.groups);

    // Equipos
    const teamNames = [
      { name: 'Real Madrid', short: 'RMA', coach: 'Carlo Ancelotti', stadium: 'Santiago Bernabéu', founded: 1902 },
      { name: 'Barcelona', short: 'BAR', coach: 'Xavi Hernández', stadium: 'Camp Nou', founded: 1899 },
      { name: 'Atlético Madrid', short: 'ATM', coach: 'Diego Simeone', stadium: 'Wanda Metropolitano', founded: 1903 },
      { name: 'Sevilla FC', short: 'SEV', coach: 'José Luis Mendilibar', stadium: 'Ramón Sánchez-Pizjuán', founded: 1890 },
      { name: 'Valencia CF', short: 'VAL', coach: 'Rubén Baraja', stadium: 'Mestalla', founded: 1919 },
      { name: 'Real Betis', short: 'BET', coach: 'Manuel Pellegrini', stadium: 'Benito Villamarín', founded: 1907 },
      { name: 'Real Sociedad', short: 'RSO', coach: 'Imanol Alguacil', stadium: 'Anoeta', founded: 1909 },
      { name: 'Athletic Bilbao', short: 'ATH', coach: 'Ernesto Valverde', stadium: 'San Mamés', founded: 1898 },
      { name: 'Villarreal CF', short: 'VIL', coach: 'Quique Setién', stadium: 'La Cerámica', founded: 1923 },
      { name: 'Getafe CF', short: 'GET', coach: 'José Bordalás', stadium: 'Coliseum Alfonso Pérez', founded: 1983 },
      { name: 'Osasuna', short: 'OSA', coach: 'Jagoba Arrasate', stadium: 'El Sadar', founded: 1920 },
      { name: 'Celta de Vigo', short: 'CEL', coach: 'Rafael Benítez', stadium: 'Balaídos', founded: 1923 }
    ];

    this.teams = teamNames.map((team, index) => {
      const matchesPlayed = 20 + Math.floor(Math.random() * 5);
      const wins = Math.floor(Math.random() * 15) + 5;
      const draws = Math.floor(Math.random() * 8);
      const losses = matchesPlayed - wins - draws;
      const goalsFor = wins * 2 + draws + Math.floor(Math.random() * 10);
      const goalsAgainst = losses * 2 + Math.floor(Math.random() * 10);

      // Calcular grupo de forma segura
      const groupIndex = index % this.groups.length;
      const selectedGroup = this.groups[groupIndex];

      return {
        id: index + 1,
        name: team.name,
        shortName: team.short,
        logoUrl: 'assets/team-placeholder.png',
        position: index + 1,
        points: wins * 3 + draws,
        matchesPlayed,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        totalPlayers: 20 + Math.floor(Math.random() * 10),
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        coach: team.coach,
        stadium: team.stadium,
        founded: team.founded
      };
    });

    // Ordenar por puntos
    this.teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Actualizar posiciones
    this.teams.forEach((team, index) => {
      team.position = index + 1;
    });
  }

  /**
   * Calcula las estadísticas generales
   */
  private calculateStats(): void {
    this.stats.totalTeams = this.teams.length;
    this.stats.totalPlayers = this.teams.reduce((sum, team) => sum + team.totalPlayers, 0);
    this.stats.totalGoals = this.teams.reduce((sum, team) => sum + team.goalsFor, 0);
    this.stats.averageGoals = this.stats.totalTeams > 0 
      ? this.stats.totalGoals / this.stats.totalTeams 
      : 0;
  }

  /**
   * Aplica los filtros locales (sin grupo, ya que el grupo se maneja via API)
   */
  applyFilters(): void {
    let filtered = [...this.teams];

    // NOTA: El filtro por grupo se eliminó porque ahora se maneja via API
    // Cada cambio de grupo consume el API directamente

    // Filtro por posición
    if (this.selectedPositionFilter !== 'all') {
      const posFilter = this.positionFilters.find(f => f.id === this.selectedPositionFilter);
      if (posFilter) {
        filtered = filtered.filter(team => 
          team.position >= posFilter.range.min && team.position <= posFilter.range.max
        );
      }
    }

    // Filtro por búsqueda
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(search) ||
        team.shortName?.toLowerCase().includes(search) ||
        team.coach?.toLowerCase().includes(search) ||
        team.stadium?.toLowerCase().includes(search)
      );
    }

    this.filteredTeams = filtered;
    this.cdr.detectChanges();
  }


  /**
   * Maneja el cambio de posición
   */
  onPositionChange(): void {
    this.applyFilters();
  }

  /**
   * Maneja el cambio de búsqueda
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    // NOTA: No resetear selectedGroupId porque se maneja via API
    // Solo limpiar filtros locales
    this.selectedPositionFilter = 'all';
    this.searchText = '';
    this.applyFilters();
  }

  /**
   * Navega al detalle del equipo
   */
  viewTeam(team: Team): void {
    console.log('Ver detalle del equipo:', team);
    this.router.navigate(['/public-team-detail', team.id]);
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
        this.router.navigate(['/tournament-home', this.tournamentId]);
  }

  /**
   * Obtiene la clase de posición
   */
  getPositionClass(position: number): string {
    if (position <= 3) return 'top3';
    if (position <= 5) return 'top5';
    if (position >= this.teams.length - 2) return 'bottom3';
    return '';
  }

  /**
   * Obtiene el color de la diferencia de goles
   */
  getGoalDifferenceColor(diff: number): string {
    if (diff > 0) return '#4caf50';
    if (diff < 0) return '#f44336';
    return '#666';
  }

  /**
   * Obtiene el nombre del grupo seleccionado
   */
  getSelectedGroupName(): string {
    if (!this.selectedGroupId) return '';
    const group = this.groups.find(g => g.id === this.selectedGroupId);
    return group ? group.name : '';
  }

  /**
   * Obtiene el nombre del filtro de posición seleccionado
   */
  getSelectedPositionFilterName(): string {
    const filter = this.positionFilters.find(f => f.id === this.selectedPositionFilter);
    return filter ? filter.name : '';
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
          } else {
            // Si no hay fases, cargar datos dummy
            this.loadData();
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar fases:', error);
          this.toastService.showError('Error al cargar las fases del torneo');
          // Cargar datos dummy como fallback
          this.loadData();
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
      this.loadData();
    } else {
      this.loadData();
    }
    
    this.cdr.detectChanges();
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
        this.loadData();
      }
      
      this.cdr.detectChanges();
    }
  }

  /**
   * Maneja el cambio de grupo seleccionado
   */
  onGroupChange(): void {
    console.log('🔄 Cambio de grupo:', this.selectedGroupId);
    // Consumir API con el nuevo grupo seleccionado
    this.loadData();
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
}
