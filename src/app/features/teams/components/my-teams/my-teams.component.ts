import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeamService, ToastService } from '@core/services';
import { ManagerTeam } from '@core/models';
import { Subject, takeUntil } from 'rxjs';
import { RegisterTeamModalComponent, RegisterTeamModalData } from '../register-team-modal/register-team-modal.component';
import { CreateTeamModalComponent } from '../create-team-modal/create-team-modal.component';

@Component({
  selector: 'app-my-teams',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './my-teams.component.html',
  styleUrls: ['./my-teams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyTeamsComponent implements OnInit, OnDestroy {
  teams: ManagerTeam[] = [];
  isLoading = false;
  tournamentToken: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    // Capturar el token del history.state (persiste después de la navegación)
    const state = this.router.getCurrentNavigation()?.extras?.state || window.history.state;
    console.log('Navigation state:', state);
    if (state && state['tournamentToken']) {
      this.tournamentToken = state['tournamentToken'];
      console.log('Token capturado en constructor:', this.tournamentToken);
    }
  }

  ngOnInit(): void {
    // Validar token si existe
    if (this.tournamentToken) {
      this.validateTournamentToken(this.tournamentToken);
    }
    this.loadTeams();
  }

  /**
   * Valida el token del torneo y obtiene información
   */
  private validateTournamentToken(token: string): void {
    this.teamService.validateTournamentToken(token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournamentInfo) => {
          if (tournamentInfo && tournamentInfo.id > 0) {
            console.log('Información del torneo:', tournamentInfo);
            this.toastService.showSuccess(`Token validado para el torneo: ${tournamentInfo.name}`);
            // Abrir modal para registrar equipo
            this.openRegisterTeamModal(tournamentInfo);
          } else {
            this.tournamentToken = null;
            if (window.history.state && window.history.state['tournamentToken']) {
              const newState = { ...window.history.state };
              delete newState['tournamentToken'];
              window.history.replaceState(newState, '');
            }
          }
        },
        error: (error) => {
            this.tournamentToken = null;
            if (window.history.state && window.history.state['tournamentToken']) {
              const newState = { ...window.history.state };
              delete newState['tournamentToken'];
              window.history.replaceState(newState, '');
            }
        }
      });
  }

  /**
   * Abre el modal para registrar un equipo en el torneo
   */
  private openRegisterTeamModal(tournamentInfo: { id: number; name: string; imageUrl: string }): void {
    const dialogData: RegisterTeamModalData = {
      tournamentId: tournamentInfo.id,
      tournamentName: tournamentInfo.name,
      tournamentImageUrl: tournamentInfo.imageUrl
    };

    const dialogRef = this.dialog.open(RegisterTeamModalComponent, {
      width: '600px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Equipo registrado:', result);
        // Recargar la lista de equipos
        this.loadTeams();
        // Limpiar el token del state después de cerrar el modal
        this.tournamentToken = null;
        if (window.history.state && window.history.state['tournamentToken']) {
          const newState = { ...window.history.state };
          delete newState['tournamentToken'];
          window.history.replaceState(newState, '');
        }
      }
      
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTeams(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.teamService.getManagerTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams: ManagerTeam[]) => {
          this.teams = teams;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.teams = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  viewTeamDetails(tournamentId: number): void {
    console.log('Ver detalles del torneo:', tournamentId);
    // Navegar a la tabla de posiciones enviando el tournamentId
    this.router.navigate(['/teams/standings', tournamentId]);
  }

  getTeamLogo(logoUrl: string): string {
    return logoUrl || 'assets/logo.png';
  }

  /**
   * Abre el modal para crear un nuevo equipo
   */
  openCreateTeamModal(): void {
    const dialogRef = this.dialog.open(CreateTeamModalComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Equipo creado:', result);
        // Recargar la lista de equipos
        this.loadTeams();
      }
    });
  }
}
