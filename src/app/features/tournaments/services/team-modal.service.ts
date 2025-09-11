import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { TeamFormComponent, TeamFormData } from '../components/team-form/team-form.component';
import { CreateTeamRequest, UpdateTeamRequest, Team } from '../models/team.interface';

export interface TeamModalResult {
  action: 'create' | 'update';
  data: CreateTeamRequest | UpdateTeamRequest;
}

@Injectable({
  providedIn: 'root'
})
export class TeamModalService {
  constructor(private dialog: MatDialog) {}

  /**
   * Abre el modal para crear un nuevo equipo
   * @param tournamentId ID del torneo al que pertenecerá el equipo
   * @returns Observable con el resultado del modal
   */
  openCreateTeamModal(tournamentId: number): Observable<TeamModalResult | undefined> {
    const dialogRef: MatDialogRef<TeamFormComponent, TeamModalResult> = this.dialog.open(
      TeamFormComponent,
      {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        disableClose: true,
        autoFocus: true,
        data: {
          mode: 'create',
          tournamentId
        } as TeamFormData
      }
    );

    return dialogRef.afterClosed();
  }

  /**
   * Abre el modal para editar un equipo existente
   * @param team Equipo a editar
   * @param tournamentId ID del torneo
   * @returns Observable con el resultado del modal
   */
  openEditTeamModal(team: Team, tournamentId: number): Observable<TeamModalResult | undefined> {
    const dialogRef: MatDialogRef<TeamFormComponent, TeamModalResult> = this.dialog.open(
      TeamFormComponent,
      {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        disableClose: true,
        autoFocus: true,
        data: {
          mode: 'edit',
          team,
          tournamentId
        } as TeamFormData
      }
    );

    return dialogRef.afterClosed();
  }

  /**
   * Cierra todos los modales de equipo abiertos
   */
  closeAllTeamModals(): void {
    this.dialog.closeAll();
  }
}
