import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { MatchService, MatchDay } from '@core/services/match.service';
import { CreateMatchModalComponent } from '../create-match-modal/create-match-modal.component';
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
export class MatchesManagementComponent implements OnInit, OnDestroy {
  @Input() tournamentId!: number;
  @Input() phases: Phase[] = [];
  @Input() teams: Team[] = [];
  @Input() matches: Match[] = [];
  @Output() matchesUpdated = new EventEmitter<Match[]>();

  selectedPhaseId: number | null = null;
  selectedGroupId: number | null = null;
  matchDays: MatchDay[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private matchService: MatchService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Seleccionar la primera fase por defecto si existe
    if (this.phases.length > 0) {
      this.selectedPhaseId = this.phases[0].id;
      // Seleccionar el primer grupo si existe
      const firstPhase = this.phases[0];
      if (firstPhase.groups && firstPhase.groups.length > 0) {
        this.selectedGroupId = firstPhase.groups[0].id;
        this.loadMatchesByGroup(this.selectedGroupId);
      }
    }
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
   * Maneja el cambio de fase seleccionada
   */
  onPhaseChange(phaseIndex: number): void {
    if (phaseIndex >= 0 && phaseIndex < this.phases.length) {
      const selectedPhase = this.phases[phaseIndex];
      this.selectedPhaseId = selectedPhase.id;
      this.selectedGroupId = null;
      this.matchDays = [];
      
      // Consumir API para cargar grupos de la fase seleccionada
      this.loadGroupsForPhase(selectedPhase.id);
      
      this.cdr.detectChanges();
    }
  }

  /**
   * Carga los grupos para una fase específica
   */
  private loadGroupsForPhase(phaseId: number): void {
    // Aquí se haría la llamada a la API para cargar grupos
    // Por ahora usamos los grupos que ya están en la fase
    const selectedPhase = this.phases.find(p => p.id === phaseId);
    if (selectedPhase && selectedPhase.groups && selectedPhase.groups.length > 0) {
      // Seleccionar el primer grupo automáticamente
      this.selectedGroupId = selectedPhase.groups[0].id;
      this.loadMatchesByGroup(this.selectedGroupId);
    }
  }

  /**
   * Cambia el grupo seleccionado y carga sus partidos
   */
  onGroupChange(groupId: number): void {
    this.selectedGroupId = groupId;
    this.loadMatchesByGroup(groupId);
  }

  /**
   * Obtiene los grupos de la fase seleccionada
   */
  getGroupsForSelectedPhase(): Group[] {
    if (!this.selectedPhaseId) return [];
    const phase = this.phases.find(p => p.id === this.selectedPhaseId);    
    return phase?.groups || [];
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
   */
  createMatch(): void {
    const phase = this.getSelectedPhase();
    if (!phase) return;
    this.createNewMatchDay();
  }

  /**
   * Crea una nueva jornada
   */
  private createNewMatchDay(): void {
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
    this.matchService.createMatchDay(this.selectedPhaseId, groupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            title: '¡Jornada creada!',
            text: 'La nueva jornada se ha creado exitosamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Recargar los partidos del grupo (si aplica)
          if (this.selectedGroupId) {
            this.loadMatchesByGroup(this.selectedGroupId);
          }
        },
        error: (error) => {
          console.error('Error creating match day:', error);
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo crear la jornada',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.loading = false;
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
    this.loading = true;
    this.matchService.getAllMatchesByGroup(groupId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matchDays) => {
          this.matchDays = matchDays;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading matches by group:', error);
          this.matchDays = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Carga los partidos de una phase organizados por jornadas
   */
  private loadMatchesByPhase(phaseId: number): void {
    this.loading = true;
    this.matchService.getAllMatchesByPhase(phaseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matchDays) => {
          this.matchDays = matchDays;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading matches by phase:', error);
          this.matchDays = [];
          this.loading = false;
          this.cdr.detectChanges();
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
    // Método no existe en el servicio, implementar lógica alternativa
    console.log('Generating random matches for group:', this.selectedGroupId);
    this.loading = false;
    Swal.fire({
      title: 'Función no disponible',
      text: 'La generación de partidos aleatorios para grupo no está implementada',
      icon: 'info',
      confirmButtonText: 'Aceptar'
    });
    /*
    this.matchService.generateRandomMatchesForGroup(this.selectedGroupId)
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
          
          // Recargar los partidos del grupo
          if (this.selectedGroupId) {
            this.loadMatchesByGroup(this.selectedGroupId);
          }
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
    */
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
        // Recargar los partidos del grupo (si aplica)
        if (this.selectedGroupId) {
          this.loadMatchesByGroup(this.selectedGroupId);
        } else if (this.selectedPhaseId) {
          this.loadMatchesByPhase(this.selectedPhaseId);
        }
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
          Swal.fire({
            title: '¡Partidos generados!',
            text: `Se han generado ${response.matchesCreated} partidos para ${matchDay.matchDayName}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Recargar los partidos del grupo (si aplica)
          if (this.selectedGroupId) {
            this.loadMatchesByGroup(this.selectedGroupId);
          } else if (this.selectedPhaseId) {
            this.loadMatchesByPhase(this.selectedPhaseId);
          }
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
        this.matchService.deleteMatchDay(matchDay.matchDayId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                title: '¡Eliminada!',
                text: 'La jornada ha sido eliminada exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              
              // Recargar los partidos del grupo (si aplica)
              if (this.selectedGroupId) {
                this.loadMatchesByGroup(this.selectedGroupId);
              } else if (this.selectedPhaseId) {
                this.loadMatchesByPhase(this.selectedPhaseId);
              }
            },
            error: (error) => {
              console.error('Error deleting match day:', error);
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo eliminar la jornada',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              this.loading = false;
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
      case 0: return 'Programado';
      case 1: return 'En Curso';
      case 2: return 'Finalizado';
      case 3: return 'Suspendido';
      case 4: return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del partido por número
   */
  getMatchStatusClassByNumber(status: number): string {
    switch (status) {
      case 0: return 'status-scheduled';
      case 1: return 'status-in-progress';
      case 2: return 'status-finished';
      case 3: return 'status-suspended';
      case 4: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  /**
   * Actualiza la fecha de un partido
   */
  updateMatchDate(match: any): void {
    // Implementar lógica para actualizar fecha del partido
    console.log('Updating match date for:', match);
  }

  /**
   * Cambia el estado de un partido
   */
  changeMatchStatus(match: any): void {
    // Implementar lógica para cambiar estado del partido
    console.log('Changing match status for:', match);
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
                // Recargar los partidos del grupo
                if (this.selectedGroupId) {
                  this.loadMatchesByGroup(this.selectedGroupId);
                }
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
}
