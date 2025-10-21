import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { Match, MatchStatus } from '../../models/match.interface';
import { Phase, Group, PhaseType } from '../../models/phase.interface';
import { Category } from '../../models/category.interface';
import { Team } from '../../models/team.interface';
import { MatchService, MatchDay, MatchStatusType, CreateRandomMatchesRequest } from '@core/services/match.service';
import { CategoryService } from '../../services/category.service';
import { PhaseService } from '../../services/phase.service';
import { CreateMatchModalComponent } from '../create-match-modal/create-match-modal.component';
import { MatchStatusModalComponent, MatchStatusModalData, MatchStatusModalResult } from '@shared/components/match-status-modal';
import { MatchDatetimeModalComponent, MatchDateTimeData, MatchDateTimeResult } from '../match-datetime-modal/match-datetime-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-matches-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatExpansionModule
  ],
  templateUrl: './matches-management.component.html',
  styleUrls: ['./matches-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MatchesManagementComponent implements OnInit, OnDestroy, OnChanges {
  @Input() tournamentId!: number;
  @Input() phases: Phase[] = [];
  @Input() teams: Team[] = [];
  @Input() matches: Match[] = [];
  @Output() matchesUpdated = new EventEmitter<Match[]>();

  // Datos para los selects en cascada
  categories: Category[] = [];
  availablePhases: Phase[] = [];
  availableGroups: Group[] = [];

  // Selecciones actuales
  selectedCategoryId: number | null = null;
  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;

  // Estado y datos
  matchDays: MatchDay[] = [];
  loading = false;
  loadingCategories = false;
  loadingPhases = false;
  loadingGroups = false;
  isCreatingMatchDay = false;
  matchStatusType = MatchStatusType;
  private destroy$ = new Subject<void>();


  constructor(
    private cdr: ChangeDetectorRef,
    private matchService: MatchService,
    private categoryService: CategoryService,
    private phaseService: PhaseService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log('🚀 Initializing matches-management with tournamentId:', this.tournamentId);
    if (this.tournamentId) {
      this.loadCategories();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recargar categorías si cambia el tournamentId
    if (changes['tournamentId'] && this.tournamentId) {
      console.log('🔄 Tournament ID changed, reloading categories:', this.tournamentId);
      this.resetAllSelections();
      this.loadCategories();
    }
  }

  /**
   * Resetea todas las selecciones
   */
  private resetAllSelections(): void {
    this.selectedCategoryId = null;
    this.selectedPhaseId = null;
    this.selectedGroupId = null;
    this.availablePhases = [];
    this.availableGroups = [];
    this.matchDays = [];
  }

  /**
   * Carga las categorías del torneo
   */
  private loadCategories(): void {
    console.log('📂 Loading categories for tournament:', this.tournamentId);
    this.loadingCategories = true;
    this.resetAllSelections();

    this.categoryService.getCategoriesByTournament(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          console.log('✅ Categories loaded:', categories.length);
          this.categories = categories;
          this.loadingCategories = false;

          // Auto-seleccionar primera categoría si existe
          if (categories.length > 0) {
            this.selectedCategoryId = categories[0].categoryId;
            this.onCategoryChange(this.selectedCategoryId);
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error loading categories:', error);
          this.loadingCategories = false;
          this.categories = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Maneja el cambio de categoría seleccionada
   */
  onCategoryChange(categoryId: number): void {
    console.log('📂 Category changed to:', categoryId);
    this.selectedCategoryId = categoryId;
    this.selectedPhaseId = null;
    this.selectedGroupId = null;
    this.availableGroups = [];
    this.matchDays = [];
    this.loading = false; // Reset loading state

    // Obtener fases de la categoría seleccionada
    const selectedCategory = this.categories.find(c => c.categoryId === categoryId);
    if (selectedCategory && selectedCategory.phases) {
      this.availablePhases = selectedCategory.phases;
      console.log('🎯 Available phases for category:', this.availablePhases.length);

      // Auto-seleccionar primera fase si existe
      if (this.availablePhases.length > 0) {
        this.selectedPhaseId = this.availablePhases[0].id;
        this.onPhaseChange(this.selectedPhaseId);
      }
    } else {
      this.availablePhases = [];
    }
  }

  /**
   * Maneja el cambio de fase seleccionada
   */
  onPhaseChange(phaseId: number): void {
    console.log('🎯 Phase changed to:', phaseId);
    this.selectedPhaseId = phaseId;
    this.selectedGroupId = null;
    this.matchDays = [];
    this.loading = false; // Reset loading state

    // Obtener grupos de la fase seleccionada
    const selectedPhase = this.availablePhases.find(p => p.id === phaseId);
    if (selectedPhase) {
      const phaseGroups = this.getPhaseGroups(selectedPhase);
      this.availableGroups = phaseGroups;
      console.log('👥 Available groups for phase:', this.availableGroups.length);

      if (phaseGroups.length > 0) {
        // Fase con grupos - auto-seleccionar primer grupo
        this.selectedGroupId = phaseGroups[0].id;
        this.onGroupChange(this.selectedGroupId);
      } else if (selectedPhase.phaseType === PhaseType.Knockout) {
        // Fase eliminatoria sin grupos - cargar partidos directamente
        console.log('🏆 Knockout phase without groups, loading matches by phase');
        this.loadMatchesByPhase(phaseId);
      }
    } else {
      this.availableGroups = [];
    }
  }

  /**
   * Maneja el cambio de grupo seleccionado
   */
  onGroupChange(groupId: number): void {
    console.log('👥 Group changed to:', groupId);
    this.selectedGroupId = groupId;
    this.loading = false; // Reset loading state before API call
    this.loadMatchesByGroup(groupId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  /**
   * Obtiene los grupos de una fase de manera compatible
   * @param phase Fase de la cual obtener los grupos
   */
  private getPhaseGroups(phase?: Phase): Group[] {
    if (!phase) return [];
    // Priorizar 'groups' sobre 'grups' para compatibilidad
    return phase.groups || phase.grups || [];
  }

  /**
   * Obtiene los grupos de una fase (para uso en templates)
   * @param phase Fase de la cual obtener los grupos
   */
  getGroupsForPhase(phase: Phase): Group[] {
    return this.getPhaseGroups(phase);
  }

  /**
   * Obtiene la fase seleccionada actualmente
   */
  getSelectedPhase(): Phase | null {
    if (!this.selectedPhaseId) return null;
    return this.availablePhases.find(p => p.id === this.selectedPhaseId) || null;
  }

  /**
   * Obtiene el texto del botón FAB según el tipo de fase
   */
  getFabButtonText(): string {
    return 'Nueva Jornada';
  }

  /**
   * Maneja el clic en el botón FAB principal
   * Crea una nueva jornada
   */
  createMatch(): void {
    this.createNewMatchDay();
  }

  /**
   * Crea una nueva jornada
   */
  private createNewMatchDay(): void {
    // Prevenir dobles clicks
    if (this.isCreatingMatchDay || this.loading) {
      return;
    }

    const phase = this.getSelectedPhase();
    if (!this.selectedPhaseId) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha seleccionado una fase',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Para fase de grupos, verificar que haya grupo seleccionado
    if (phase?.phaseType === PhaseType.GroupStage && !this.selectedGroupId) {
      Swal.fire({
        title: 'Error',
        text: 'Debes seleccionar un grupo primero',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Para eliminatoria directa, usar groupId = 0
    const groupId = phase?.phaseType === PhaseType.GroupStage ? this.selectedGroupId! : 0;

    this.loading = true;
    this.isCreatingMatchDay = true;
    this.cdr.detectChanges();

    console.log(`Creating match day for phase: ${this.selectedPhaseId}, group: ${groupId}`);

    this.matchService.createMatchDay(this.selectedPhaseId, groupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Match day created successfully:', response);

          this.loading = false;
          this.isCreatingMatchDay = false;

          Swal.fire({
            title: '¡Jornada creada!',
            text: 'La nueva jornada se ha creado exitosamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });

          // Recargar los partidos según el tipo de fase
          if (phase?.phaseType === PhaseType.GroupStage && this.selectedGroupId) {
            console.log('Reloading matches by group:', this.selectedGroupId);
            this.loadMatchesByGroup(this.selectedGroupId);
          } else if (this.selectedPhaseId) {
            console.log('Reloading matches by phase:', this.selectedPhaseId);
            this.loadMatchesByPhase(this.selectedPhaseId);
          }
        },
        error: (error) => {
          console.error('Error creating match day:', error);

          this.loading = false;
          this.isCreatingMatchDay = false;

          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo crear la jornada',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });

          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Track by functions para optimización de rendimiento
   */
  trackByCategoryId(index: number, category: Category): number {
    return category.categoryId;
  }

  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id;
  }

  trackByGroupId(index: number, group: Group): number {
    return group.id;
  }

  trackByMatchDayId(index: number, matchDay: MatchDay): number {
    return matchDay.matchDayId;
  }

  trackByMatchInfoId(index: number, match: any): number {
    return match.id;
  }

  /**
   * Carga los partidos de un grupo organizados por jornadas
   */
  private loadMatchesByGroup(groupId: number): void {
    console.log(`🔄 Loading matches for group: ${groupId}`);
    this.loading = true;

    this.matchService.getAllMatchesByGroup(groupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matchDays) => {
          console.log(`✅ Loaded ${matchDays.length} match days for group ${groupId}`);
          this.matchDays = matchDays;
          this.loading = false;
          console.log('🔄 Loading state set to false, matchDays updated');
        },
        error: (error) => {
          console.error('❌ Error loading matches by group:', error);
          this.matchDays = [];
          this.loading = false;
          console.log('🔄 Loading state set to false after error');
        }
      });
  }

  /**
   * Recarga los partidos según el tipo de fase seleccionada
   * Método centralizado para evitar duplicación de código
   */
  private reloadCurrentMatches(context: string = ''): void {
    const phase = this.getSelectedPhase();
    const logPrefix = context ? `[${context}]` : '';

    if (phase?.phaseType === PhaseType.GroupStage && this.selectedGroupId) {
      console.log(`${logPrefix} Reloading matches by group:`, this.selectedGroupId);
      this.loadMatchesByGroup(this.selectedGroupId);
    } else if (phase?.phaseType === PhaseType.Knockout && this.selectedPhaseId) {
      console.log(`${logPrefix} Reloading matches by phase (Knockout):`, this.selectedPhaseId);
      this.loadMatchesByPhase(this.selectedPhaseId);
    } else if (this.selectedPhaseId) {
      console.log(`${logPrefix} Reloading matches by phase (fallback):`, this.selectedPhaseId);
      this.loadMatchesByPhase(this.selectedPhaseId);
    } else {
      console.warn(`${logPrefix} No phase or group selected for reload`);
    }
  }

  /**
   * Carga los partidos de una phase organizados por jornadas
   */
  private loadMatchesByPhase(phaseId: number): void {
    console.log(`🔄 Loading matches for phase: ${phaseId}`);
    this.loading = true;

    this.matchService.getAllMatchesByPhase(phaseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matchDays) => {
          console.log(`✅ Loaded ${matchDays.length} match days for phase ${phaseId}`);
          this.matchDays = matchDays;
          this.loading = false;
          console.log('🔄 Loading state set to false, matchDays updated');
        },
        error: (error) => {
          console.error('❌ Error loading matches by phase:', error);
          this.matchDays = [];
          this.loading = false;
          console.log('🔄 Loading state set to false after error');
        }
      });
  }

  /**
   * Genera partidos aleatorios para el grupo seleccionado
   */
  generateRandomMatchesForGroup(): void {
    if (!this.selectedGroupId) {
      Swal.fire({
        title: 'Error',
        text: 'Debes seleccionar un grupo primero',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.loading = true;

    const request : CreateRandomMatchesRequest = {
      phaseId: this.selectedPhaseId!,
      groupId: this.selectedGroupId
    }

    this.matchService.createRandomMatches(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            title: '¡Partidos generados!',
            text: 'Los partidos aleatorios se han generado exitosamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });

          // Recargar los partidos según el tipo de fase
          this.reloadCurrentMatches('Random Generation');
        },
        error: (error: any) => {
          console.error('Error generating random matches:', error);
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudieron generar los partidos',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.loading = false;
          this.cdr.detectChanges();
        }
      });

  }

  /**
   * Crea un partido para una jornada específica
   */
  createMatchForMatchDay(matchDay: MatchDay): void {
    if (!this.selectedPhaseId) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha seleccionado una fase',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Para fase de grupos, verificar que haya grupo seleccionado
    const phase = this.getSelectedPhase();
    if (phase?.phaseType === PhaseType.GroupStage && !this.selectedGroupId) {
      Swal.fire({
        title: 'Error',
        text: 'Debes seleccionar un grupo primero',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Para eliminatoria directa, usar groupId = 0
    const groupId = phase?.phaseType === PhaseType.GroupStage ? this.selectedGroupId! : 0;

    const dialogRef = this.dialog.open(CreateMatchModalComponent, {
      width: '600px',
      data: {
        tournamentId: this.tournamentId,
        phaseId: this.selectedPhaseId,
        groupId: groupId,
        matchDayId: matchDay.matchDayId,
        matchDayName: matchDay.matchDayName,
        teams: this.teams
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Recargar los partidos según el tipo de fase
        this.reloadCurrentMatches('Match Creation');
      }
    });
  }

  /**
   * Genera partidos aleatorios para una jornada específica
   */
  generateRandomMatches(matchDay: MatchDay): void {
    if (!this.selectedPhaseId) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha seleccionado una fase',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const phase = this.getSelectedPhase();
    const groupId = phase?.phaseType === PhaseType.GroupStage ? this.selectedGroupId! : 0;

    this.matchService.createRandomMatchesForMatchDay({
      matchDayId: matchDay.matchDayId,
      phaseId: this.selectedPhaseId!,
      groupId: groupId
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loading = false;

          Swal.fire({
            title: '¡Partidos generados!',
            text: `Se han generado ${response.matchesCreated || 'varios'} partidos para ${matchDay.matchDayName}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });

          // Recargar los partidos según el tipo de fase
          if (phase?.phaseType === PhaseType.GroupStage && this.selectedGroupId) {
            this.loadMatchesByGroup(this.selectedGroupId);
          } else if (this.selectedPhaseId) {
            this.loadMatchesByPhase(this.selectedPhaseId);
          }
        },
        error: (error: any) => {
          console.error('Error generating random matches:', error);
          this.loading = false;

          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudieron generar los partidos',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });

          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Elimina una jornada
   */
  deleteMatchDay(matchDay: MatchDay): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la jornada "${matchDay.matchDayName}" y todos sus partidos`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cdr.detectChanges();

        this.matchService.deleteMatchDay(matchDay.matchDayId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loading = false;

              Swal.fire({
                title: '¡Eliminada!',
                text: 'La jornada ha sido eliminada exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });

              // Recargar los partidos según el tipo de fase
              const phase = this.getSelectedPhase();
              if (phase?.phaseType === PhaseType.GroupStage && this.selectedGroupId) {
                this.loadMatchesByGroup(this.selectedGroupId);
              } else if (this.selectedPhaseId) {
                this.loadMatchesByPhase(this.selectedPhaseId);
              }
            },
            error: (error) => {
              console.error('Error deleting match day:', error);
              this.loading = false;

              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo eliminar la jornada',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });

              this.cdr.detectChanges();
            }
          });
      }
    });
  }

  /**
   * Verifica si es la última jornada
   */
  isLastMatchDay(matchDay: MatchDay): boolean {
    if (!this.matchDays || this.matchDays.length === 0) return false;
    const lastMatchDay = this.matchDays[this.matchDays.length - 1];
    return lastMatchDay.matchDayId === matchDay.matchDayId;
  }

  /**
   * Obtiene el texto del estado del partido por número
   */
  getMatchStatusTextByNumber(status: number): string {
    switch (status) {
      case MatchStatusType.scheduled: return 'Programado';
      case MatchStatusType.inProgress: return 'En vivo';
      case MatchStatusType.played: return 'Jugado';
      case MatchStatusType.canceled: return 'Cancelado Eliminado';
      case MatchStatusType.postponed: return 'Postergado';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del partido por número
   */
  getMatchStatusClassByNumber(status: MatchStatusType): string {
    switch (status) {
      case MatchStatusType.scheduled: return 'status-scheduled';
      case MatchStatusType.inProgress: return 'status-in-progress';
      case MatchStatusType.played: return 'status-played';
      case MatchStatusType.canceled: return 'status-canceled';
      case MatchStatusType.postponed: return 'status-postponed';
      default: return 'status-unknown';
    }
  }

  /**
  }

  /**
   * Elimina un partido por su ID
   */
  deleteMatchById(match: any): void {
    Swal.fire({
      title: '¿Eliminar partido?',
      html: `
        <p>¿Estás seguro de que deseas eliminar este partido?</p>
        <p><strong>${match.homeTeam}</strong> vs <strong>${match.awayTeam}</strong></p>
        <p style="color: #d33; margin-top: 10px;">Esta acción no se puede deshacer.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cdr.detectChanges();

        this.matchService.deleteMatch(match.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              Swal.fire({
                title: '¡Partido eliminado!',
                text: 'El partido se ha eliminado correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              }).then(() => {
                // Recargar los partidos según el tipo de fase
                this.reloadCurrentMatches('Match Deletion');
              });
            },
            error: (error: any) => {
              this.loading = false;
              console.error('Error deleting match:', error);
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo eliminar el partido',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              this.cdr.detectChanges();
            }
          });
      }
    });
  }

  /**
   * Formatea la fecha del partido
   */
  formatMatchDate(dateString: string): string {
    if (!dateString || dateString === '0001-01-01T00:00:00') {
      return 'Por definir';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';

    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * Formatea la hora del partido
   */
  formatMatchTime(timeString?: string): string {

    console.log(timeString);
    if (!timeString) {
      return '--:--';
    }

    // Si es una fecha completa, extraer solo la hora
    if (timeString.includes('T')) {
      // Verificar si la hora es 00:00:00
      const timePart = timeString.split('T')[1];
      if (timePart && timePart.startsWith('00:00:00')) {
        return '--:--';
      }

      const date = new Date(timeString);
      console.log('da',date);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }) + 'h';
      }
    }

    // Si ya es solo hora, formatear
    return timeString.includes('h') ? timeString : timeString + 'h';
  }

  /**
   * Actualiza la fecha de un partido
   */
  updateMatchDate(match: any): void {
    const dialogRef = this.dialog.open(MatchDatetimeModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        currentDate: match.matchDate,
        currentTime: match.matchTime,
        currentStatus: match.status
      } as MatchDateTimeData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: MatchDateTimeResult) => {
        if (result && result.success) {
          console.log('Match date updated to:', result.date);
          
          // Recargar los partidos después de actualizar la fecha
          this.reloadCurrentMatches('Match Date Update');
        }
      });
  }

  /**
   * Cambia el estado de un partido
   */
  changeMatchStatus(match: any): void {
    const dialogRef = this.dialog.open(MatchStatusModalComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        currentStatus: match.status,
        currentMatchDate: match.matchDate
      } as MatchStatusModalData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: MatchStatusModalResult) => {
        if (result && result.success) {
          console.log('Match status changed to:', result.newStatus);
          
          // Recargar los partidos después de cambiar el estado
          this.reloadCurrentMatches('Match Status Change');
        }
      });
  }


}
