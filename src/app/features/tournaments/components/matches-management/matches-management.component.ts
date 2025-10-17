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
import { Team } from '../../models/team.interface';
import { MatchService, MatchDay, MatchStatusType, CreateRandomMatchesRequest } from '@core/services/match.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchesManagementComponent implements OnInit, OnDestroy, OnChanges {
  @Input() tournamentId!: number;
  @Input() phases: Phase[] = [];
  @Input() teams: Team[] = [];
  @Input() matches: Match[] = [];
  @Output() matchesUpdated = new EventEmitter<Match[]>();

  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  matchDays: MatchDay[] = [];
  loading = false;
  isCreatingMatchDay = false;
  matchStatusType = MatchStatusType;
  private destroy$ = new Subject<void>();


  constructor(
    private cdr: ChangeDetectorRef,
    private matchService: MatchService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit - phases available:', this.phases?.length || 0);
    // Inicializar con datos disponibles
    this.initializeDefaultSelections();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reinicializar cuando cambien las fases
    if (changes['phases']) {
      console.log('Phases changed, reinitializing:', this.phases?.length || 0);

      // Resetear estado antes de reinicializar
      this.selectedPhaseId = null;
      this.selectedGroupId = null;
      this.matchDays = [];
      this.loading = false;
      this.isCreatingMatchDay = false;

      // Reinicializar con timeout para asegurar renderizado
      setTimeout(() => {
        this.initializeDefaultSelections();
      }, 50);
    }
  }

  /**
   * Inicializa las selecciones por defecto al abrir el tab
   */
  private initializeDefaultSelections(): void {
    console.log('Initializing default selections, phases:', this.phases?.length || 0);

    if (this.phases && this.phases.length > 0) {
      // Seleccionar la primera fase por defecto
      this.selectedPhaseId = this.phases[0].id;
      console.log('Selected default phase:', this.selectedPhaseId);

      // Obtener los grupos de la primera fase
      const firstPhase = this.phases[0];
      const phaseGroups = this.getPhaseGroups(firstPhase);
      console.log('Groups found in first phase:', phaseGroups?.length || 0);

      if (phaseGroups && phaseGroups.length > 0) {
        // Seleccionar el primer grupo automáticamente
        this.selectedGroupId = phaseGroups[0].id;
        console.log('Auto-selected first group:', this.selectedGroupId);

        // Cargar partidos del primer grupo
        this.loadMatchesByGroup(this.selectedGroupId);
      } else {
        // Si no hay grupos, verificar si es fase eliminatoria
        if (firstPhase.phaseType === PhaseType.Knockout) {
          console.log('Knockout phase detected, loading matches by phase');
          this.loadMatchesByPhase(this.selectedPhaseId);
        } else {
          console.log('No groups found and not knockout phase');
          this.matchDays = [];
        }
      }

      // Forzar detección de cambios
      setTimeout(() => {
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      }, 100);
    } else {
      // Si no hay fases, limpiar todo
      console.log('No phases available, clearing data');
      this.selectedPhaseId = null;
      this.selectedGroupId = null;
      this.matchDays = [];
      this.cdr.detectChanges();
    }
  }

  /**
   * Valida y carga los datos por defecto de manera robusta
   */
  private validateAndLoadDefaults(): void {
    // Validar que hay fases disponibles
    if (!this.phases || this.phases.length === 0) {
      this.selectedPhaseId = null;
      this.selectedGroupId = null;
      this.matchDays = [];
      return;
    }

    // Si no hay fase seleccionada, seleccionar la primera
    if (!this.selectedPhaseId) {
      this.selectedPhaseId = this.phases[0].id;
    }

    // Validar que la fase seleccionada existe
    const selectedPhase = this.phases.find(p => p.id === this.selectedPhaseId);
    if (!selectedPhase) {
      this.selectedPhaseId = this.phases[0].id;
      this.selectedGroupId = null;
      this.matchDays = [];
    }

    // Cargar grupos y seleccionar el primero si es necesario
    this.loadGroupsForPhase(this.selectedPhaseId!, true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Obtiene los partidos filtrados por fase seleccionada
   */
  getMatchesByPhase(): Match[] {
    if (!this.selectedPhaseId) return [];
    return this.matches.filter(match => match.phaseId === this.selectedPhaseId);
  }

  /**
   * Maneja el cambio de fase seleccionada (método legacy para compatibilidad)
   */
  onPhaseChange(phaseIndex: number): void {
    if (phaseIndex >= 0 && phaseIndex < this.phases.length) {
      const selectedPhase = this.phases[phaseIndex];
      this.onPhaseSelectionChange(selectedPhase.id);
    }
  }

  /**
   * Maneja el cambio de fase seleccionada desde el select
   */
  onPhaseSelectionChange(phaseId: number): void {
    console.log('Phase selection changed to:', phaseId);
    this.selectedPhaseId = phaseId;
    this.selectedGroupId = null;
    this.matchDays = [];
    this.isCreatingMatchDay = false;

    // Buscar la fase seleccionada
    const selectedPhase = this.phases.find(p => p.id === phaseId);

    if (selectedPhase && selectedPhase.phaseType === PhaseType.Knockout) {
      // Si es fase eliminatoria (Knockout), cargar partidos directamente
      console.log('Fase eliminatoria detectada, cargando partidos...');
      this.loadMatchesByPhase(phaseId);
    } else {
      // Si no es eliminatoria, cargar grupos como antes
      this.loadGroupsForPhase(phaseId, true);
    }

    // Forzar detección de cambios múltiple
    setTimeout(() => {
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    }, 10);
  }

  /**
   * Carga los grupos para una fase específica
   * @param phaseId ID de la fase
   * @param autoSelectFirst Si debe seleccionar automáticamente el primer grupo
   */
  private loadGroupsForPhase(phaseId: number, autoSelectFirst: boolean = false): void {
    // TODO: Implementar llamada a API para cargar grupos por fase
    // Endpoint sugerido: GET /api/Group/GetByPhase/{phaseId}
    // Por ahora usamos los grupos que ya están en la fase
    const selectedPhase = this.phases.find(p => p.id === phaseId);
    const phaseGroups = this.getPhaseGroups(selectedPhase);

    if (selectedPhase && phaseGroups.length > 0) {
      if (autoSelectFirst) {
        // Seleccionar el primer grupo automáticamente
        this.selectedGroupId = phaseGroups[0].id;
        console.log(`Auto-selecting first group: ${this.selectedGroupId} for phase: ${phaseId}`);

        // Cargar partidos del grupo seleccionado
        this.loadMatchesByGroup(this.selectedGroupId!);
      } else if (this.selectedGroupId) {
        // Si ya hay un grupo seleccionado, verificar que existe en esta fase
        const groupExists = phaseGroups.some(g => g.id === this.selectedGroupId);
        if (groupExists) {
          this.loadMatchesByGroup(this.selectedGroupId!);
        } else {
          // El grupo seleccionado no existe en esta fase, seleccionar el primero
          this.selectedGroupId = phaseGroups[0].id;
          this.loadMatchesByGroup(this.selectedGroupId!);
        }
      }
    } else {
      // Si no hay grupos, limpiar selección
      console.log(`No groups found for phase: ${phaseId}`);
      this.selectedGroupId = null;
      this.matchDays = [];
    }

    // Forzar detección de cambios después de cargar grupos con timeout más largo
    setTimeout(() => {
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    }, 50);
  }

  /**
   * Cambia el grupo seleccionado y carga sus partidos
   */
  onGroupChange(groupId: number): void {
    console.log('Group selection changed to:', groupId);
    this.selectedGroupId = groupId;
    this.isCreatingMatchDay = false;
    this.loadMatchesByGroup(groupId);

    // Forzar detección de cambios
    setTimeout(() => {
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    }, 10);
  }

  /**
   * Obtiene los grupos de la fase seleccionada (compatible con ambos formatos)
   */
  getGroupsForSelectedPhase(): Group[] {
    if (!this.selectedPhaseId) return [];
    const phase = this.phases.find(p => p.id === this.selectedPhaseId);
    return this.getPhaseGroups(phase) || [];
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
    return this.phases.find(p => p.id === this.selectedPhaseId) || null;
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
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id;
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
    console.log(`Loading matches for group: ${groupId}`);
    this.loading = true;

    this.matchService.getAllMatchesByGroup(groupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matchDays) => {
          console.log(`Loaded ${matchDays.length} match days for group ${groupId}`);
          this.matchDays = matchDays;
          this.loading = false;

          // Forzar detección de cambios múltiple
          setTimeout(() => {
            this.cdr.detectChanges();
            this.cdr.markForCheck();
          }, 0);
        },
        error: (error) => {
          console.error('Error loading matches by group:', error);
          this.matchDays = [];
          this.loading = false;

          setTimeout(() => {
            this.cdr.detectChanges();
            this.cdr.markForCheck();
          }, 0);
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
    console.log(`Loading matches for phase: ${phaseId}`);
    this.loading = true;
    this.cdr.detectChanges();

    this.matchService.getAllMatchesByPhase(phaseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matchDays) => {
          console.log(`Loaded ${matchDays.length} match days for phase ${phaseId}`);
          this.matchDays = matchDays;
          this.loading = false;

          // Forzar detección de cambios múltiple
          setTimeout(() => {
            this.cdr.detectChanges();
            this.cdr.markForCheck();
          }, 0);
        },
        error: (error) => {
          console.error('Error loading matches by phase:', error);
          this.matchDays = [];
          this.loading = false;

          setTimeout(() => {
            this.cdr.detectChanges();
            this.cdr.markForCheck();
          }, 0);
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
