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
    if (!this.selectedPhaseId) {
      return this.matches;
    }
    return this.matches.filter(match => match.phaseId === this.selectedPhaseId);
  }

  /**
   * Cambia la fase seleccionada
   */
  onPhaseChange(phaseIndex: number): void {
    const phase = this.phases[phaseIndex];
    if (phase) {
      this.selectedPhaseId = phase.id;
      // Resetear grupo seleccionado y cargar el primero si existe
      if (phase.groups && phase.groups.length > 0) {
        this.selectedGroupId = phase.groups[0].id;
        this.loadMatchesByGroup(this.selectedGroupId);
      } else {
        this.selectedGroupId = null;
        this.matchDays = [];
      }
      this.cdr.detectChanges();
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
   * Obtiene los grupos de la fase seleccionada
   */
  getGroupsForSelectedPhase(): Group[] {
    if (!this.selectedPhaseId) return [];
    const phase = this.phases.find(p => p.id === this.selectedPhaseId);
    return phase?.groups || [];
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
   * Formatea la fecha del partido
   */
  formatMatchDate(dateString: string): string {
    if (!dateString || dateString === '0001-01-01T00:00:00') {
      return 'Fecha por definir';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    const phase = this.getSelectedPhase();
    if (!phase) return 'Nuevo Partido';
    return phase.phaseType === PhaseType.GroupStage ? 'Nueva Jornada' : 'Nuevo Partido';
  }

  /**
   * Maneja el clic en el botón FAB principal
   */
  createMatch(): void {
    const phase = this.getSelectedPhase();
    if (!phase) return;

    if (phase.phaseType === PhaseType.GroupStage) {
      // Fase de grupos: crear nueva jornada
      this.createNewMatchDay();
    } else {
      // Eliminatoria directa: abrir modal para crear partido
      this.openCreateMatchModalForKnockout();
    }
  }

  /**
   * Crea una nueva jornada (para fase de grupos)
   */
  private createNewMatchDay(): void {
    if (!this.selectedPhaseId || !this.selectedGroupId) {
      Swal.fire({
        title: 'Error',
        text: 'Debes seleccionar un grupo primero',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.loading = true;
    this.matchService.createMatchDay(this.selectedPhaseId, this.selectedGroupId)
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
          
          // Recargar los partidos del grupo
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
   * Abre el modal para crear partido en eliminatoria directa
   */
  private openCreateMatchModalForKnockout(): void {
    if (!this.selectedPhaseId) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha seleccionado una fase',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Para eliminatoria directa, usamos matchDayId = 1 por defecto
    const dialogRef = this.dialog.open(CreateMatchModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: false,
      data: {
        groupId: 0, // No hay grupo en eliminatorias
        phaseId: this.selectedPhaseId,
        matchDayId: 1,
        matchDayName: 'Eliminatoria'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        Swal.fire({
          title: '¡Partido creado!',
          text: 'El partido se ha creado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        // TODO: Recargar los partidos de la fase
      }
    });
  }

  /**
   * Edita un partido existente
   */
  editMatch(match: Match): void {
    // TODO: Implementar modal de edición de partido
    console.log('Edit match:', match);
  }

  /**
   * Elimina un partido
   */
  deleteMatch(match: Match): void {
    // TODO: Implementar confirmación y eliminación de partido
    console.log('Delete match:', match);
  }

  /**
   * TrackBy function para optimizar el renderizado de partidos
   */
  trackByMatchId(index: number, match: Match): string {
    return match.id;
  }

  /**
   * TrackBy function para optimizar el renderizado de fases
   */
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id;
  }

  /**
   * Obtiene el texto del estado del partido
   */
  getMatchStatusText(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.SCHEDULED: return 'Programado';
      case MatchStatus.LIVE: return 'En Curso';
      case MatchStatus.FINISHED: return 'Finalizado';
      case MatchStatus.POSTPONED: return 'Suspendido';
      case MatchStatus.CANCELLED: return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del partido
   */
  getMatchStatusClass(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.SCHEDULED: return 'status-scheduled';
      case MatchStatus.LIVE: return 'status-in-progress';
      case MatchStatus.FINISHED: return 'status-finished';
      case MatchStatus.POSTPONED: return 'status-suspended';
      case MatchStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  /**
   * Obtiene el color del chip para el estado del partido
   */
  getMatchStatusColor(status: MatchStatus): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case MatchStatus.SCHEDULED: return 'primary';
      case MatchStatus.LIVE: return 'accent';
      case MatchStatus.FINISHED: return 'primary';
      case MatchStatus.POSTPONED: return 'warn';
      case MatchStatus.CANCELLED: return 'warn';
      default: return 'accent';
    }
  }

  /**
   * Formatea la fecha y hora del partido
   */
  formatMatchDateTime(dateTime: Date | string | undefined): string {
    if (!dateTime) return 'Fecha no disponible';
    
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el resultado del partido
   */
  getMatchResult(match: Match): string {
    if (match.status === MatchStatus.FINISHED) { // Finalizado
      return `${match.homeScore || 0} - ${match.awayScore || 0}`;
    }
    return 'vs';
  }

  /**
   * TrackBy para jornadas
   */
  trackByMatchDayId(index: number, matchDay: MatchDay): number {
    return matchDay.matchDayId;
  }

  /**
   * TrackBy para partidos de jornada
   */
  trackByMatchInfoId(index: number, match: any): number {
    return match.id;
  }

  /**
   * Verifica si una jornada es la última (tiene el matchDayId más alto)
   */
  isLastMatchDay(matchDay: MatchDay): boolean {
    if (!this.matchDays || this.matchDays.length === 0) {
      return false;
    }
    const maxMatchDayId = Math.max(...this.matchDays.map(md => md.matchDayId));
    return matchDay.matchDayId === maxMatchDayId;
  }

  /**
   * Crea un nuevo partido para una jornada específica
   */
  createMatchForMatchDay(matchDay: MatchDay): void {
    if (!this.selectedGroupId || !this.selectedPhaseId) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha seleccionado un grupo o fase',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const dialogRef = this.dialog.open(CreateMatchModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: false,
      data: {
        groupId: this.selectedGroupId,
        phaseId: this.selectedPhaseId,
        matchDayId: matchDay.matchDayId,
        matchDayName: matchDay.matchDayName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        Swal.fire({
          title: '¡Partido creado!',
          text: 'El partido se ha creado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Recargar los partidos del grupo
        if (this.selectedGroupId) {
          this.loadMatchesByGroup(this.selectedGroupId);
        }
      }
    });
  }

  /**
   * Genera partidos aleatorios para una jornada
   */
  generateRandomMatches(matchDay: MatchDay): void {
    if (!this.selectedGroupId || !this.selectedPhaseId) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha seleccionado un grupo o fase',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Confirmar antes de generar
    Swal.fire({
      title: '¿Generar partidos aleatorios?',
      text: `Se generarán partidos aleatorios para ${matchDay.matchDayName}. Esta acción no se puede deshacer.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cdr.detectChanges();

        const request = {
          phaseId: this.selectedPhaseId!,
          groupId: this.selectedGroupId!,
          matchDayId: matchDay.matchDayId
        };

        this.matchService.createRandomMatchesForMatchDay(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              Swal.fire({
                title: '¡Éxito!',
                text: 'Los partidos aleatorios se han generado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              }).then(() => {
                // Recargar los partidos del grupo
                if (this.selectedGroupId) {
                  this.loadMatchesByGroup(this.selectedGroupId);
                }
              });
            },
            error: (error) => {
              this.loading = false;
              console.error('Error generating random matches:', error);
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudieron generar los partidos aleatorios',
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
   * Elimina una jornada completa
   */
  deleteMatchDay(matchDay: MatchDay): void {
    Swal.fire({
      title: '¿Eliminar jornada?',
      html: `
        <p>¿Estás seguro de que deseas eliminar la jornada <strong>${matchDay.matchDayName}</strong>?</p>        
        <p style="color: #d33; margin-top: 10px;">Esta acción eliminará la jornada y no se puede deshacer.</p>
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

        this.matchService.deleteMatchDay(matchDay.matchDayId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              Swal.fire({
                title: '¡Jornada eliminada!',
                text: 'La jornada se ha eliminado correctamente',
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
            error: (error) => {
              this.loading = false;
              console.error('Error deleting match day:', error);
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
   * Actualiza la fecha de un partido
   */
  updateMatchDate(match: any): void {
    Swal.fire({
      title: 'Actualizar fecha del partido',
      html: `
        <div style="text-align: left;">
          <p><strong>${match.homeTeam}</strong> vs <strong>${match.awayTeam}</strong></p>
          <label for="match-date" style="display: block; margin-top: 15px; margin-bottom: 5px;">Nueva fecha y hora:</label>
          <input type="datetime-local" id="match-date" class="swal2-input" style="width: 90%;">
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const dateInput = document.getElementById('match-date') as HTMLInputElement;
        const dateValue = dateInput.value;
        
        if (!dateValue) {
          Swal.showValidationMessage('Por favor ingresa una fecha');
          return false;
        }
        
        return dateValue;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // TODO: Llamar al API para actualizar la fecha
        console.log('Actualizar fecha del partido:', match.id, 'Nueva fecha:', result.value);
        
        Swal.fire({
          title: '¡Fecha actualizada!',
          text: 'La fecha del partido se ha actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          // Recargar los partidos del grupo
          if (this.selectedGroupId) {
            this.loadMatchesByGroup(this.selectedGroupId);
          }
        });
      }
    });
  }

  /**
   * Cambia el estado de un partido
   */
  changeMatchStatus(match: any): void {
    const statusOptions: { [key: string]: string } = {
      '0': 'Programado',
      '1': 'En Curso',
      '2': 'Finalizado',
      '3': 'Suspendido',
      '4': 'Cancelado'
    };

    Swal.fire({
      title: 'Cambiar estado del partido',
      html: `
        <div style="text-align: left;">
          <p><strong>${match.homeTeam}</strong> vs <strong>${match.awayTeam}</strong></p>
          <p style="margin-top: 10px;">Estado actual: <strong>${this.getMatchStatusTextByNumber(match.status)}</strong></p>
          <label for="match-status" style="display: block; margin-top: 15px; margin-bottom: 5px;">Nuevo estado:</label>
          <select id="match-status" class="swal2-input" style="width: 90%;">
            ${Object.entries(statusOptions).map(([key, value]) => 
              `<option value="${key}" ${key === match.status.toString() ? 'selected' : ''}>${value}</option>`
            ).join('')}
          </select>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const statusSelect = document.getElementById('match-status') as HTMLSelectElement;
        return parseInt(statusSelect.value);
      }
    }).then((result) => {
      if (result.isConfirmed && result.value !== undefined) {
        // TODO: Llamar al API para cambiar el estado
        console.log('Cambiar estado del partido:', match.id, 'Nuevo estado:', result.value);
        
        Swal.fire({
          title: '¡Estado actualizado!',
          text: 'El estado del partido se ha actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          // Recargar los partidos del grupo
          if (this.selectedGroupId) {
            this.loadMatchesByGroup(this.selectedGroupId);
          }
        });
      }
    });
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
            error: (error) => {
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
