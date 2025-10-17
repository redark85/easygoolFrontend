import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ManagerService, TournamentPhase, TournamentGroup, PhaseType, ToastService } from '@core/services';

interface Team {
  id: number;
  name: string;
  logoUrl: string;
}

interface Player {
  id: number;
  name: string;
  photoUrl: string;
  team: Team;
}

interface TopScorer {
  position: number;
  player: Player;
  goals: number;
  assists: number;
  matchesPlayed: number;
  goalsPerMatch: number;
  penaltyGoals: number;
}

interface MVPPlayer {
  position: number;
  player: Player;
  goals: number;
  assists: number;
  matchesPlayed: number;
  rating: number;
  motmAwards: number; // Man of the Match awards
}

interface CardPlayer {
  position: number;
  player: Player;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  totalCards: number;
}

/**
 * Componente para mostrar las tablas de estadísticas de jugadores
 */
@Component({
  selector: 'app-public-top-scorers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './public-top-scorers.component.html',
  styleUrls: ['./public-top-scorers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTopScorersComponent implements OnInit, OnDestroy {
  // Filtros - Usando los mismos tipos que public-fixture
  phases: TournamentPhase[] = [];
  groups: TournamentGroup[] = [];
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  PhaseType = PhaseType; // Exponer el enum al template

  // Datos
  topScorers: TopScorer[] = [];
  mvpPlayers: MVPPlayer[] = [];
  cardPlayers: CardPlayer[] = [];
  
  isLoading = false;
  tournamentId: number = 0;

  // Columnas de las tablas
  scorersColumns: string[] = ['position', 'player', 'goals', 'assists', 'matches', 'average'];
  mvpColumns: string[] = ['position', 'player', 'goals', 'assists', 'rating', 'motm'];
  cardsColumns: string[] = ['position', 'player', 'yellow', 'red', 'total', 'matches'];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private managerService: ManagerService,
    private toastService: ToastService
  ) {}

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
   * Carga los datos de las estadísticas
   */
  private loadData(): void {
    this.isLoading = true;
    
    // TODO: Integrar con APIs reales de estadísticas
    // Por ahora usar datos dummy filtrados por fase/grupo
    console.log('Cargando datos para fase:', this.selectedPhaseId, 'grupo:', this.selectedGroupId);
    this.loadDummyData();
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /**
   * Carga datos dummy
   */
  private loadDummyData(): void {
    // Generar equipos
    const teams: Team[] = [
      { id: 1, name: 'Real Madrid', logoUrl: 'assets/team-placeholder.png' },
      { id: 2, name: 'Barcelona', logoUrl: 'assets/team-placeholder.png' },
      { id: 3, name: 'Atlético Madrid', logoUrl: 'assets/team-placeholder.png' },
      { id: 4, name: 'Sevilla FC', logoUrl: 'assets/team-placeholder.png' },
      { id: 5, name: 'Valencia CF', logoUrl: 'assets/team-placeholder.png' }
    ];

    // Generar goleadores
    const playerNames = [
      'Karim Benzema', 'Robert Lewandowski', 'Antoine Griezmann',
      'Youssef En-Nesyri', 'Edinson Cavani', 'Vinicius Jr',
      'Pedri González', 'Álvaro Morata', 'Iago Aspas', 'Gerard Moreno'
    ];

    this.topScorers = playerNames.map((name, index) => {
      const goals = 25 - index * 2;
      const matchesPlayed = 20 + Math.floor(Math.random() * 5);
      
      return {
        position: index + 1,
        player: {
          id: index + 1,
          name,
          photoUrl: 'assets/player-placeholder.png',
          team: teams[index % teams.length]
        },
        goals,
        assists: Math.floor(Math.random() * 10) + 3,
        matchesPlayed,
        goalsPerMatch: goals / matchesPlayed,
        penaltyGoals: Math.floor(Math.random() * 5)
      };
    });

    // Generar MVP
    this.mvpPlayers = playerNames.map((name, index) => {
      const goals = 25 - index * 2;
      const assists = Math.floor(Math.random() * 15) + 5;
      
      return {
        position: index + 1,
        player: {
          id: index + 1,
          name,
          photoUrl: 'assets/player-placeholder.png',
          team: teams[index % teams.length]
        },
        goals,
        assists,
        matchesPlayed: 20 + Math.floor(Math.random() * 5),
        rating: 9.5 - index * 0.3,
        motmAwards: 10 - index
      };
    });

    // Generar tarjetas
    const cardPlayerNames = [
      'Sergio Ramos', 'Casemiro', 'Diego Costa',
      'Sergio Busquets', 'Raúl García', 'José Giménez',
      'Marcos Llorente', 'Thomas Partey', 'Dani Carvajal', 'Jordi Alba'
    ];

    this.cardPlayers = cardPlayerNames.map((name, index) => {
      const yellowCards = 12 - index;
      const redCards = Math.floor(Math.random() * 3);
      
      return {
        position: index + 1,
        player: {
          id: index + 11,
          name,
          photoUrl: 'assets/player-placeholder.png',
          team: teams[index % teams.length]
        },
        yellowCards,
        redCards,
        matchesPlayed: 20 + Math.floor(Math.random() * 5),
        totalCards: yellowCards + redCards
      };
    });
  }

  /**
   * Verifica si la posición es top 3
   */
  isTop3(position: number): boolean {
    return position <= 3;
  }

  /**
   * Obtiene la clase de la posición
   */
  getPositionClass(position: number): string {
    if (position === 1) return 'gold';
    if (position === 2) return 'silver';
    if (position === 3) return 'bronze';
    return '';
  }

  /**
   * Navega al detalle del jugador
   */
  viewPlayerDetail(playerId: number): void {
    console.log('Ver detalle del jugador:', playerId);
    // TODO: Implementar navegación
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
        this.router.navigate(['/tournament-home', this.tournamentId]);
  }

  /**
   * Obtiene el color del rating
   */
  getRatingColor(rating: number): string {
    if (rating >= 9) return '#4caf50';
    if (rating >= 8) return '#8bc34a';
    if (rating >= 7) return '#ffc107';
    return '#ff9800';
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
    const selectedGroup = this.groups.find(g => g.id === this.selectedGroupId);
    
    if (selectedGroup) {
      console.log('Grupo seleccionado:', selectedGroup);
      this.loadData();
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
}
