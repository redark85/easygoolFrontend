import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { Phase, Group, PhaseType } from '../../models/phase.interface';
import { Team } from '../../models/team.interface';
import { PhaseService } from '../../services/phase.service';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { GroupFormComponent } from '../group-form/group-form.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PhaseFormData, PhaseModalResult } from '../../models/phase-form.interface';
import { GroupFormData, GroupModalResult } from '../../models/group-form.interface';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '@shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-phases-groups-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './phases-groups-management.component.html',
  styleUrls: ['./phases-groups-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhasesGroupsManagementComponent implements OnInit {
  @Input() tournamentId!: number;
  @Input() phases: Phase[] = [];
  @Output() phasesUpdated = new EventEmitter<Phase[]>();

  // Control de expansión de grupos
  expandedGroupIndex: number = -1;

  private destroy$ = new Subject<void>();

  constructor(
    private phaseService: PhaseService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea una nueva fase
   */
  createPhase(): void {
    const dialogRef = this.dialog.open(PhaseFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'create',
        isEdit: false,
        tournamentId: this.tournamentId
      } as PhaseFormData
    });

    dialogRef.afterClosed().subscribe((result: PhaseModalResult) => {
      if (result && result.action === 'create') {
        this.refreshPhases();
      }
    });
  }

  /**
   * Edita una fase existente
   */
  editPhase(phase: Phase): void {
    const dialogRef = this.dialog.open(PhaseFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        isEdit: true,
        phase: phase,
        tournamentId: this.tournamentId
      } as PhaseFormData
    });

    dialogRef.afterClosed().subscribe((result: PhaseModalResult) => {
      if (result && result.action === 'update') {
        this.refreshPhases();
      }
    });
  }

  /**
   * Elimina una fase
   */
  deletePhase(phase: Phase): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Eliminar Fase',
      message: `¿Estás seguro de que deseas eliminar la fase "${phase.name}"? Esta acción eliminará también todos los grupos asociados.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Implementar eliminación de fase cuando esté disponible en el API
        console.log('Eliminar fase:', phase.id);
      }
    });
  }

  /**
   * Crea un nuevo grupo en una fase
   */
  createGroup(phase: Phase): void {
    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'create',
        isEdit: false,
        phaseId: phase.id
      } as GroupFormData
    });

    dialogRef.afterClosed().subscribe((result: GroupModalResult) => {
      if (result && result.action === 'create') {
        this.refreshPhases();
      }
    });
  }

  /**
   * Edita un grupo existente
   */
  editGroup(group: Group): void {
    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        isEdit: true,
        group: group,
        phaseId: group.phaseId
      } as GroupFormData
    });

    dialogRef.afterClosed().subscribe((result: GroupModalResult) => {
      if (result && result.action === 'update') {
        this.refreshPhases();
      }
    });
  }

  /**
   * Elimina un grupo
   */
  deleteGroup(group: Group): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Eliminar Grupo',
      message: `¿Estás seguro de que deseas eliminar el grupo "${group.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Implementar eliminación de grupo cuando esté disponible en el API
        console.log('Eliminar grupo:', group.id);
      }
    });
  }

  /**
   * Agrega un equipo a un grupo
   */
  addTeamToGroup(phaseId: number, groupId: number): void {
    // TODO: Implementar modal para seleccionar equipo y agregarlo al grupo
    console.log('Agregar equipo al grupo:', { phaseId, groupId });
  }

  /**
   * Remueve un equipo de un grupo
   */
  removeTeamFromGroup(team: any, group: any): void {
    // TODO: Implementar lógica para remover equipo del grupo
    console.log('Remove team from group:', team, group);
  }

  /**
   * Descalifica un equipo del torneo
   * @param team Equipo a descalificar
   * @param group Grupo del equipo
   */
  disqualifyTeam(team: any, group: any): void {
    // TODO: Implementar lógica para descalificar equipo
    console.log('Disqualify team:', team, group);
  }

  /**
   * Refresca la lista de fases
   */
  private refreshPhases(): void {
    this.phaseService.getPhasesByTournament(this.tournamentId).subscribe({
      next: (phases) => {
        this.phases = phases;
        this.phasesUpdated.emit(phases);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error refreshing phases:', error);
      }
    });
  }

  /**
   * Obtiene el ícono para el tipo de fase
   */
  getPhaseTypeIcon(phaseType: PhaseType): string {
    switch (phaseType) {
      case PhaseType.GroupStage:
        return 'group_work';
      case PhaseType.Knockout:
        return 'emoji_events';
      default:
        return 'sports_soccer';
    }
  }

  /**
   * Obtiene el texto para el tipo de fase
   */
  getPhaseTypeText(phaseType: PhaseType): string {
    switch (phaseType) {
      case PhaseType.GroupStage:
        return 'Fase de Grupos';
      case PhaseType.Knockout:
        return 'Eliminatoria';
      default:
        return 'Tipo desconocido';
    }
  }

  /**
   * TrackBy function para fases
   */
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id || 0;
  }

  /**
   * TrackBy function para grupos
   */
  trackByGroupId(index: number, group: Group): number {
    return group.id || 0;
  }

  /**
   * TrackBy function para equipos
   */
  trackByTeamId(index: number, team: Team): number {
    return team.id || index;
  }
}
