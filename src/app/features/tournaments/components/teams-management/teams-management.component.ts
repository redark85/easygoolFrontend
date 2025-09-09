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
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Team } from '../../models/team.interface';
import { TeamService } from '../../services/team.service';
import { TeamFormComponent } from '../team-form/team-form.component';
import Swal from 'sweetalert2';

export interface TeamFormData {
  mode: 'create' | 'edit';
  team?: Team;
  tournamentId: number;
}

export interface TeamModalResult {
  success: boolean;
  team?: Team;
}

@Component({
  selector: 'app-teams-management',
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
    MatBadgeModule
  ],
  templateUrl: './teams-management.component.html',
  styleUrls: ['./teams-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsManagementComponent implements OnInit, OnDestroy {
  @Input() tournamentId!: number;
  @Input() teams: Team[] = [];
  @Output() teamsUpdated = new EventEmitter<Team[]>();

  private destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Abre el modal para crear un nuevo equipo
   */
  createTeam(): void {
    const dialogRef = this.dialog.open(TeamFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        mode: 'create', 
        tournamentId: this.tournamentId 
      } as TeamFormData
    });

    dialogRef.afterClosed().subscribe((result: TeamModalResult) => {
      if (result && result.success) {
        this.refreshTeams();
      }
    });
  }

  /**
   * Abre el modal para editar un equipo existente
   */
  editTeam(team: Team): void {
    const dialogRef = this.dialog.open(TeamFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        mode: 'edit', 
        team: team,
        tournamentId: this.tournamentId 
      } as TeamFormData
    });

    dialogRef.afterClosed().subscribe((result: TeamModalResult) => {
      if (result && result.success) {
        this.refreshTeams();
      }
    });
  }

  /**
   * Elimina un equipo después de confirmación
   */
  deleteTeam(team: Team): void {
    Swal.fire({
      title: 'Eliminar Equipo',
      text: `¿Estás seguro de que deseas eliminar el equipo "${team.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.teamService.deleteTeam(team.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.refreshTeams();
            
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El equipo ha sido eliminado correctamente.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error deleting team:', error);
            
            // Mostrar mensaje de error
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el equipo. Inténtalo de nuevo.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  /**
   * Refresca la lista de equipos desde el backend
   */
  private refreshTeams(): void {
    this.teamService.getTeamsByTournament(this.tournamentId).subscribe({
      next: (teams) => {
        this.teams = teams;
        this.teamsUpdated.emit(teams);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error refreshing teams:', error);
      }
    });
  }

  /**
   * TrackBy function para optimizar el renderizado de equipos
   */
  trackByTeamId(index: number, team: Team): number {
    return team.id;
  }

  /**
   * Obtiene el texto del estado del equipo
   */
  getTeamStatusText(status: number | undefined): string {
    if (status === undefined) return 'Sin estado';
    switch (status) {
      case 1: return 'Activo';
      case 2: return 'Inactivo';
      case 3: return 'Suspendido';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del equipo
   */
  getTeamStatusClass(status: number | undefined): string {
    if (status === undefined) return 'status-unknown';
    switch (status) {
      case 1: return 'status-active';
      case 2: return 'status-inactive';
      case 3: return 'status-suspended';
      default: return 'status-unknown';
    }
  }

  /**
   * Obtiene el color del chip para el estado del equipo
   */
  getTeamStatusColor(status: number | undefined): 'primary' | 'accent' | 'warn' {
    if (status === undefined) return 'accent';
    switch (status) {
      case 1: return 'primary';
      case 2: return 'accent';
      case 3: return 'warn';
      default: return 'accent';
    }
  }
}
