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
import { Subject, takeUntil, finalize } from 'rxjs';
import { ManagerService, TournamentPhase, TournamentGroup, PhaseType, ToastService, ApiService } from '@core/services';
import { FIXTURE_GET_TOP_SCORERS_ENDPOINT } from '@core/config/endpoints';
import { TopScorersApiResponse, TopScorerDisplay, PlayerCardDisplay, TopScorersParams } from './models/top-scorers.interface';
import { PublicLoadingComponent } from '@shared/components/public-loading/public-loading.component';

// Interfaces movidas a archivo separado para mejor organización

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
    FormsModule,
    PublicLoadingComponent
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
  topScorers: TopScorerDisplay[] = [];
  cardPlayers: PlayerCardDisplay[] = [];
  
  isLoading = false;
  tournamentId: number = 0;

  // Columnas de las tablas
  scorersColumns: string[] = ['position', 'player', 'goals', 'matches', 'average'];
  cardsColumns: string[] = ['position', 'player', 'yellow', 'red', 'total', 'matches'];

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
   * Carga los datos de las estadísticas desde el API
   */
  private loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    const params: TopScorersParams = {
      phaseId: this.selectedPhaseId || 0,
      groupId: this.selectedGroupId || 0
    };
    
    console.log('🏆 Cargando goleadores para:', params);
    
    this.apiService.get<TopScorersApiResponse>(
      `${FIXTURE_GET_TOP_SCORERS_ENDPOINT}?PhaseId=${params.phaseId}&GroupId=${params.groupId}`
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
        console.log('✅ Respuesta del API de goleadores:', response);
        
        if (response.succeed && response.result) {
          this.processApiData(response.result);
        } else {
          console.warn('⚠️ API response no exitosa:', response.message);
          this.toastService.showWarning(response.message || 'No se pudieron cargar las estadísticas');
          this.clearData();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar goleadores:', error);
        this.toastService.showError('Error al cargar las estadísticas de jugadores');
        this.clearData();
      }
    });
  }

  /**
   * Procesa los datos recibidos del API
   */
  private processApiData(data: any): void {
    console.log('🔄 Procesando datos del API:', data);
    
    // Procesar goleadores
    if (data.players && Array.isArray(data.players)) {
      this.topScorers = data.players.map((player: any, index: number) => ({
        position: index + 1,
        name: player.name || 'Jugador sin nombre',
        imageUrl: player.imageUrl || 'assets/person.jpg',
        teamName: player.teamName || 'Equipo sin nombre',
        teamLogoUrl: player.teamLogoUrl || 'assets/team-placeholder.png',
        goals: player.goals || 0,
        matchesPlayed: player.matchesPlayed || 0,
        goalAverage: player.goalAverage || 0,
        penaltyGoals: player.penaltyGoals || 0
      }));
      
      console.log('⚽ Goleadores procesados:', this.topScorers.length);
    } else {
      this.topScorers = [];
      console.log('⚠️ No se encontraron goleadores en la respuesta');
    }
    
    // Procesar tarjetas
    if (data.cards && Array.isArray(data.cards)) {
      this.cardPlayers = data.cards.map((card: any, index: number) => ({
        position: index + 1,
        name: card.name || 'Jugador sin nombre',
        imageUrl: card.imageUrl || 'assets/person.jpg',
        teamName: card.teamName || 'Equipo sin nombre',
        teamLogoUrl: card.teamLogoUrl || 'assets/team-placeholder.png',
        goals: card.goals || 0,
        yellowCards: card.yellowCards || 0,
        redCards: card.redCards || 0,
        totalCards: card.totalCards || 0,
        matchesPlayed: card.matchesPlayed || 0
      }));
      
      console.log('🟨 Tarjetas procesadas:', this.cardPlayers.length);
    } else {
      this.cardPlayers = [];
      console.log('⚠️ No se encontraron tarjetas en la respuesta');
    }
  }
  
  /**
   * Limpia los datos cuando hay error o no hay resultados
   */
  private clearData(): void {
    this.topScorers = [];
    this.cardPlayers = [];
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
  viewPlayerDetail(playerName: string): void {
    console.log('Ver detalle del jugador:', playerName);
    // TODO: Implementar navegación al detalle del jugador
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
        this.router.navigate(['/tournament-home', this.tournamentId]);
  }

  /**
   * Formatea el promedio de goles
   */
  formatGoalAverage(average: number): string {
    return average ? average.toFixed(2) : '0.00';
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
