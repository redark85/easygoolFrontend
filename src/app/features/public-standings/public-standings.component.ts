import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FixtureService, FixtureTeam } from '@core/services/fixture.service';
import { ToastService, ManagerService, TournamentPhase, TournamentGroup, PhaseType, TournamentDetails } from '@core/services';

// Interfaces para Partidos y Goleadores
interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  status: 'scheduled' | 'live' | 'finished';
  venue: string;
}

interface TopScorer {
  id: number;
  playerName: string;
  teamName: string;
  goals: number;
  matches: number;
  averageGoals: number;
}

@Component({
  selector: 'app-public-standings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './public-standings.component.html',
  styleUrls: ['./public-standings.component.scss']
})
export class PublicStandingsComponent implements OnInit, OnDestroy {
  standings: FixtureTeam[] = [];
  matches: Match[] = [];
  filteredMatches: Match[] = [];
  topScorers: TopScorer[] = [];
  isLoading = false;
  displayedColumns: string[] = ['position', 'teamName', 'played', 'wins', 'draws', 'losses', 'goalsFor', 'goalsAgainst', 'goalDifference', 'lastFiveResults', 'points'];
  selectedTabIndex = 0;
  tournamentId: number = 0;
  matchSearchTerm: string = '';
  
  // Selects de Categoría, Fase y Grupo
  categories: any[] = [];
  phases: TournamentPhase[] = [];
  groups: TournamentGroup[] = [];
  selectedCategoryId: number | null = null;
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  PhaseType = PhaseType; // Exponer el enum al template
  
  // Información del torneo
  tournamentDetails: TournamentDetails | null = null;
  tournamentInfo = {
    name: '',
    season: '',
    status: '',
    category: '',
    phase: '',
    group: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fixtureService: FixtureService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private managerService: ManagerService
  ) {}

  ngOnInit(): void {
    // Cargar datos dummy
    this.loadDummyMatches();
    this.loadDummyTopScorers();
    
    // Obtener el tournamentId de los parámetros de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('tournamentId');
        if (id) {
          this.tournamentId = +id;
          console.log('Tournament ID recibido:', this.tournamentId);
          this.loadPhases();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las categorías del torneo
   */
  private loadPhases(): void {
    this.isLoading = true;
    
    this.managerService.getTournamentPhases(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Respuesta del torneo recibida:', response);
          
          if (response) {
            const tournamentDetails = response;
            
            // Guardar detalles del torneo
            this.tournamentDetails = tournamentDetails;
            
            // Actualizar información del torneo
            this.tournamentInfo = {
              name: tournamentDetails.name,
              season: new Date(tournamentDetails.startDate).getFullYear().toString(),
              status: this.getStatusText(tournamentDetails.status),
              category: '',
              phase: '',
              group: ''
            };
            
            // Cargar categorías
            this.categories = tournamentDetails.categories || [];
            console.log('Categorías cargadas:', this.categories);
            
            // Seleccionar la primera categoría por defecto
            if (this.categories.length > 0) {
              this.selectedCategoryId = this.categories[0].id;
              this.onCategoryChange();
            } else {
              this.isLoading = false;
            }
          }
          this.cdr.detectChanges();

        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
          this.toastService.showError('Error al cargar las categorías del torneo');
          this.isLoading = false;
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
      this.tournamentInfo.category = selectedCategory.name;
      
      // Cargar fases de la categoría seleccionada
      this.phases = selectedCategory.phases || [];
      console.log('Fases de la categoría:', this.phases);
      
      // Limpiar selecciones de fase y grupo
      this.selectedPhaseId = null;
      this.selectedGroupId = null;
      this.groups = [];
      this.tournamentInfo.phase = '';
      this.tournamentInfo.group = '';
      this.loadStandings();
      
      // Seleccionar la primera fase por defecto
      if (this.phases.length > 0) {
        this.onPhaseChange();
      } else {
        this.isLoading = false;
      }
      
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
      this.tournamentInfo.phase = selectedPhase.name;
      
      // Si es fase de grupos, cargar los grupos
      if (selectedPhase.phaseType === PhaseType.Groups) {
        this.loadGroups(selectedPhase);
      } else {
        // Si es knockout, limpiar grupos y cargar datos
        this.groups = [];
        this.selectedGroupId = null;
        this.tournamentInfo.group = '';
        this.isLoading = false;
      }
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
      this.tournamentInfo.group = this.groups[0].name;
      this.loadStandings();
    } else {
      this.isLoading = false;
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
      this.tournamentInfo.group = selectedGroup.name;
      this.loadStandings();
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

  private loadStandings(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Por ahora usar IDs quemados
    const phaseId = this.selectedPhaseId || 0;
    const groupId = this.selectedGroupId || 0;
    const categoryId = this.selectedCategoryId;

    this.fixtureService.getFixture(categoryId!, phaseId, groupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (standings) => {
          console.log('Standings recibidos:', standings);
          this.standings = standings;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar standings:', error);
          this.toastService.showError('Error al cargar la tabla de posiciones');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Obtiene el texto del estado del torneo
   */
  private getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Programado';
      case 1: return 'En curso';
      case 2: return 'Finalizado';
      case 3: return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  goBack(): void {
    this.router.navigate(['/tournament-home', this.tournamentId]);
  }

  getPositionClass(position: number): string {
    if (position <= 2) return 'position-qualify';
    if (position <= 4) return 'position-playoff';
    return '';
  }

  /**
   * Obtiene los últimos 5 resultados, rellenando con 'E' (empty) si hay menos de 5
   */
  getLastFiveResults(results: string[]): string[] {
    if (!results || results.length === 0) {
      return ['E', 'E', 'E', 'E', 'E'];
    }
    
    const lastFive = [...results];
    while (lastFive.length < 5) {
      lastFive.push('E');
    }
    
    return lastFive.slice(0, 5);
  }

  /**
   * Filtra los partidos por nombre de equipo
   */
  filterMatches(): void {
    const searchTerm = this.matchSearchTerm.toLowerCase().trim();
    
    if (!searchTerm) {
      this.filteredMatches = [...this.matches];
      return;
    }
    
    this.filteredMatches = this.matches.filter(match => 
      match.homeTeam.toLowerCase().includes(searchTerm) ||
      match.awayTeam.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Limpia el filtro de búsqueda
   */
  clearMatchSearch(): void {
    this.matchSearchTerm = '';
    this.filterMatches();
  }

  /**
   * Maneja el error de carga de imagen
   */
  onImageError(event: any): void {
    console.error('Error loading tournament image');
    // Ocultar la imagen si falla la carga
    event.target.style.display = 'none';
  }

  /**
   * Carga datos dummy de partidos
   */
  private loadDummyMatches(): void {
    this.matches = [
      {
        id: 1,
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        homeScore: 2,
        awayScore: 1,
        date: '2025-10-15T20:00:00',
        status: 'finished',
        venue: 'Santiago Bernabéu'
      },
      {
        id: 2,
        homeTeam: 'Bayern Munich',
        awayTeam: 'Manchester City',
        homeScore: 3,
        awayScore: 3,
        date: '2025-10-16T18:45:00',
        status: 'finished',
        venue: 'Allianz Arena'
      },
      {
        id: 3,
        homeTeam: 'Liverpool',
        awayTeam: 'PSG',
        homeScore: 1,
        awayScore: 0,
        date: '2025-10-17T21:00:00',
        status: 'live',
        venue: 'Anfield'
      },
      {
        id: 4,
        homeTeam: 'Juventus',
        awayTeam: 'Inter Milan',
        homeScore: null,
        awayScore: null,
        date: '2025-10-20T19:30:00',
        status: 'scheduled',
        venue: 'Allianz Stadium'
      },
      {
        id: 5,
        homeTeam: 'Chelsea',
        awayTeam: 'Arsenal',
        homeScore: null,
        awayScore: null,
        date: '2025-10-22T20:00:00',
        status: 'scheduled',
        venue: 'Stamford Bridge'
      },
      {
        id: 6,
        homeTeam: 'Barcelona',
        awayTeam: 'Bayern Munich',
        homeScore: 1,
        awayScore: 2,
        date: '2025-10-12T21:00:00',
        status: 'finished',
        venue: 'Camp Nou'
      },
      {
        id: 7,
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        homeScore: 2,
        awayScore: 2,
        date: '2025-10-18T19:00:00',
        status: 'finished',
        venue: 'Etihad Stadium'
      }
    ];
    
    // Inicializar filteredMatches
    this.filteredMatches = [...this.matches];
  }

  /**
   * Carga datos dummy de goleadores
   */
  private loadDummyTopScorers(): void {
    this.topScorers = [
      {
        id: 1,
        playerName: 'Erling Haaland',
        teamName: 'Manchester City',
        goals: 12,
        matches: 8,
        averageGoals: 1.5
      },
      {
        id: 2,
        playerName: 'Kylian Mbappé',
        teamName: 'Real Madrid',
        goals: 11,
        matches: 8,
        averageGoals: 1.38
      },
      {
        id: 3,
        playerName: 'Harry Kane',
        teamName: 'Bayern Munich',
        goals: 10,
        matches: 7,
        averageGoals: 1.43
      },
      {
        id: 4,
        playerName: 'Mohamed Salah',
        teamName: 'Liverpool',
        goals: 9,
        matches: 8,
        averageGoals: 1.13
      },
      {
        id: 5,
        playerName: 'Robert Lewandowski',
        teamName: 'Barcelona',
        goals: 8,
        matches: 7,
        averageGoals: 1.14
      },
      {
        id: 6,
        playerName: 'Victor Osimhen',
        teamName: 'Napoli',
        goals: 7,
        matches: 6,
        averageGoals: 1.17
      },
      {
        id: 7,
        playerName: 'Vinícius Jr.',
        teamName: 'Real Madrid',
        goals: 7,
        matches: 8,
        averageGoals: 0.88
      },
      {
        id: 8,
        playerName: 'Julián Álvarez',
        teamName: 'Manchester City',
        goals: 6,
        matches: 7,
        averageGoals: 0.86
      },
      {
        id: 9,
        playerName: 'Lautaro Martínez',
        teamName: 'Inter Milan',
        goals: 6,
        matches: 6,
        averageGoals: 1.0
      },
      {
        id: 10,
        playerName: 'Bukayo Saka',
        teamName: 'Arsenal',
        goals: 5,
        matches: 7,
        averageGoals: 0.71
      }
    ];
  }
}
