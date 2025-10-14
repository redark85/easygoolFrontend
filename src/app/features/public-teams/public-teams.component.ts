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
import { Subject, takeUntil } from 'rxjs';

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  totalPlayers: number;
  groupId: number;
  groupName: string;
  coach: string;
  stadium: string;
  founded: number;
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
    FormsModule
  ],
  templateUrl: './public-teams.component.html',
  styleUrls: ['./public-teams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTeamsComponent implements OnInit, OnDestroy {
  // Datos
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  groups: Group[] = [];
  positionFilters: PositionFilter[] = [];
  
  // Filtros
  selectedGroupId: number | null = null;
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
    private cdr: ChangeDetectorRef
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
          this.loadData();
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
   * Carga los datos de los equipos
   */
  private loadData(): void {
    this.isLoading = true;
    
    // TODO: Cargar desde API
    // Por ahora usar datos dummy
    this.loadDummyData();
    
    this.calculateStats();
    this.applyFilters();
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /**
   * Carga datos dummy
   */
  private loadDummyData(): void {
    // Grupos
    this.groups = [
      { id: 1, name: 'Grupo A' },
      { id: 2, name: 'Grupo B' },
      { id: 3, name: 'Grupo C' },
      { id: 4, name: 'Grupo D' }
    ];

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
        groupId: (index % 4) + 1,
        groupName: this.groups[index % 4].name,
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
   * Aplica los filtros
   */
  applyFilters(): void {
    let filtered = [...this.teams];

    // Filtro por grupo
    if (this.selectedGroupId) {
      filtered = filtered.filter(team => team.groupId === this.selectedGroupId);
    }

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
        team.shortName.toLowerCase().includes(search) ||
        team.coach.toLowerCase().includes(search) ||
        team.stadium.toLowerCase().includes(search)
      );
    }

    this.filteredTeams = filtered;
    this.cdr.detectChanges();
  }

  /**
   * Maneja el cambio de grupo
   */
  onGroupChange(): void {
    this.applyFilters();
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
    this.selectedGroupId = null;
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
}
