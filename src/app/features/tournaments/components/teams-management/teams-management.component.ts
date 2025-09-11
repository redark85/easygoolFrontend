import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Team, TeamStatus } from '../../models/team.interface';
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
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule
  ],
  templateUrl: './teams-management.component.html',
  styleUrls: ['./teams-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsManagementComponent implements OnInit, OnDestroy {
  @Input() tournamentId!: number;
  @Input() teams: Team[] = [];
  @Output() teamsUpdated = new EventEmitter<Team[]>();

  searchTerm = '';
  filteredTeams: Team[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  /**
   * Carga los equipos desde el backend
   */
  private loadTeams(): void {
    if (!this.tournamentId) {
      console.warn('Tournament ID is required to load teams');
      return;
    }

    this.teamService.getTeamsByTournament(this.tournamentId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (teams) => {
        this.teams = teams;
        this.updateFilteredTeams();
        this.teamsUpdated.emit(teams);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        this.teams = [];
        this.updateFilteredTeams();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualiza la lista filtrada de equipos basada en el término de búsqueda
   */
  updateFilteredTeams(): void {
    if (!this.searchTerm.trim()) {
      this.filteredTeams = [...this.teams];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredTeams = this.teams.filter(team => 
        team.name.toLowerCase().includes(term) ||
        team.shortName.toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  /**
   * Maneja el cambio en el campo de búsqueda
   */
  onSearchChange(): void {
    this.updateFilteredTeams();
  }

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
        this.teamService.removeTeam(team.tournamentTeamId).pipe(
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
    this.loadTeams();
  }

  /**
   * TrackBy function para optimizar el renderizado de equipos
   */
  trackByTeamId(index: number, team: Team): number {
    return team.id;
  }



  /**
   * Copia la URL de registro al portapapeles
   */
  copyRegistrationUrl(url: string): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
          title: '¡Copiado!',
          text: 'URL de registro copiada al portapapeles',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }).catch(() => {
        this.fallbackCopyTextToClipboard(url);
      });
    } else {
      this.fallbackCopyTextToClipboard(url);
    }
  }

  /**
   * Copia la URL de registro específica del equipo al portapapeles
   */
  copyTeamRegistrationUrl(team: Team): void {
    if (!team.urlRegistration) {
      Swal.fire({
        title: 'Error',
        text: 'Este equipo no tiene URL de registro disponible',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(team.urlRegistration).then(() => {
        Swal.fire({
          title: '¡Enlace Copiado!',
          text: `Enlace de registro del equipo "${team.name}" copiado al portapapeles`,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false
        });
      }).catch(() => {
        this.fallbackCopyTextToClipboard(team.urlRegistration!);
      });
    } else {
      this.fallbackCopyTextToClipboard(team.urlRegistration);
    }
  }

  /**
   * Descalifica un equipo con confirmación
   * @param team Equipo a descalificar
   */
  disqualifyTeam(team: Team): void {
    Swal.fire({
      title: '¿Descalificar equipo?',
      html: `¿Estás seguro de que deseas descalificar al equipo <strong>"${team.name}"</strong>?<br><br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, descalificar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.teamService.disqualifyTeam(team.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Equipo descalificado!',
              text: `El equipo "${team.name}" ha sido descalificado exitosamente`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.refreshTeams();
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.message || 'No se pudo descalificar el equipo',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  /**
   * Obtiene la clase CSS para el badge de estado del equipo
   * @param status Estado del equipo
   * @returns Clase CSS correspondiente
   */
  getTeamStatusClass(status: TeamStatus): string {
    switch (status) {
      case TeamStatus.Active:
        return 'status-badge status-active';
      case TeamStatus.Disqualified:
        return 'status-badge status-disqualified';
      case TeamStatus.Deleted:
        return 'status-badge status-deleted';
      default:
        return 'status-badge status-active';
    }
  }

  /**
   * Obtiene el texto del estado del equipo
   * @param status Estado del equipo
   * @returns Texto del estado
   */
  getTeamStatusText(status: TeamStatus): string {
    switch (status) {
      case TeamStatus.Active:
        return 'Activo';
      case TeamStatus.Disqualified:
        return 'Descalificado';
      case TeamStatus.Deleted:
        return 'Eliminado';
      default:
        return 'Activo';
    }
  }

  /**
   * Obtiene el ícono del estado del equipo
   * @param status Estado del equipo
   * @returns Ícono del estado
   */
  getTeamStatusIcon(status: TeamStatus): string {
    switch (status) {
      case TeamStatus.Active:
        return 'check_circle';
      case TeamStatus.Disqualified:
        return 'gavel';
      case TeamStatus.Deleted:
        return 'delete';
      default:
        return 'check_circle';
    }
  }

  /**
   * Verifica si un equipo puede ser descalificado
   * @param team Equipo a verificar
   * @returns true si puede ser descalificado
   */
  canDisqualifyTeam(team: Team): boolean {
    return team.status === TeamStatus.Active;
  }

  /**
   * Método alternativo para copiar texto al portapapeles
   */
  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      Swal.fire({
        title: '¡Copiado!',
        text: 'URL de registro copiada al portapapeles',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo copiar la URL al portapapeles',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }

    document.body.removeChild(textArea);
  }
}
