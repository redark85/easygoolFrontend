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
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FixtureService, FixtureTeam } from '@core/services/fixture.service';
import { ToastService, ManagerService, TournamentPhase, TournamentGroup, PhaseType, TournamentDetails } from '@core/services';

@Component({
  selector: 'app-standings',
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
    FormsModule
  ],
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.scss']
})
export class StandingsComponent implements OnInit, OnDestroy {
  standings: FixtureTeam[] = [];
  isLoading = false;
  displayedColumns: string[] = ['position', 'teamName', 'played', 'wins', 'draws', 'losses', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points'];
  selectedTabIndex = 0;
  tournamentId: number = 0;
  
  // Selects de Fase y Grupo
  phases: TournamentPhase[] = [];
  groups: TournamentGroup[] = [];
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  PhaseType = PhaseType; // Exponer el enum al template
  
  // Información del torneo
  tournamentDetails: TournamentDetails | null = null;
  tournamentInfo = {
    name: '',
    phase: '',
    group: '',
    season: '',
    status: ''
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

  /**
   * Carga las fases del torneo desde el API
   */
  private loadPhases(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.managerService.getTournamentPhases(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournamentDetails) => {
          console.log('Tournament details:', tournamentDetails);
          
          // Guardar los detalles del torneo
          this.tournamentDetails = tournamentDetails;
          
          // Actualizar información del torneo
          this.tournamentInfo = {
            name: tournamentDetails.name,
            phase: '',
            group: '',
            season: new Date(tournamentDetails.startDate).getFullYear().toString(),
            status: this.getStatusText(tournamentDetails.status)
          };
          
          // Cargar las fases
          this.phases = tournamentDetails.phases || [];
          
          // Seleccionar la primera fase por defecto
          if (this.phases.length > 0) {
            this.selectedPhaseId = this.phases[0].id;
            this.onPhaseChange();
          } else {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error loading tournament phases:', error);
          this.toastService.showError('Error al cargar las fases del torneo');
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

  /**
   * Maneja el cambio de fase seleccionada
   */
  onPhaseChange(): void {
    const selectedPhase = this.phases.find(p => p.id === this.selectedPhaseId);
    
    if (selectedPhase) {
      console.log('Fase seleccionada:', selectedPhase);
      
      // Actualizar información del torneo
      this.tournamentInfo.phase = selectedPhase.name;
      
      // Si es fase de grupos, cargar los grupos
      if (selectedPhase.phaseType === PhaseType.Groups) {
        this.loadGroups(selectedPhase);
      } else {
        // Si es knockout, limpiar grupos y cargar datos
        this.groups = [];
        this.selectedGroupId = null;
        this.tournamentInfo.group = '';
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStandings(): void {
    this.isLoading = true;
        this.cdr.detectChanges();
    
    // Por ahora usar IDs quemados
    const phaseId = this.selectedPhaseId;
    const groupId = this.selectedGroupId;

    this.fixtureService.getFixture(phaseId!, groupId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (standings) => {
          console.log('standings', standings);
          this.isLoading = false;

          this.standings = standings;
            this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading standings:', error);
          this.toastService.showError('Error al cargar la tabla de posiciones');
          this.isLoading = false;
          this.cdr.detectChanges();

        }
      });
  }

  goBack(): void {
    this.router.navigate(['/teams/my-teams']);
  }

  getPositionClass(position: number): string {
    if (position <= 2) return 'position-qualify';
    if (position <= 4) return 'position-playoff';
    return '';
  }

  /**
   * Maneja el error de carga de imagen
   */
  onImageError(event: any): void {
    console.error('Error loading tournament image');
    // Ocultar la imagen si falla la carga
    event.target.style.display = 'none';
  }
}
