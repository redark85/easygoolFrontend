import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeamService } from '@core/services';
import { ManagerTeam } from '@core/models';
import { Subject, takeUntil } from 'rxjs';

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

  private destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeams();
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

  viewTeamDetails(teamId: number): void {
    console.log('Ver detalles del equipo:', teamId);
    // TODO: Navegar a detalles del equipo
  }

  getTeamLogo(logoUrl: string): string {
    return logoUrl || 'assets/logo.png';
  }
}
