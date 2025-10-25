import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

// Services
import { ManagerService } from '../../../../core/services/manager.service';
import { ToastService } from '../../../../core/services/toast.service';

// Models
import { TeamDetail } from '../../models/team-detail.interface';

// Widgets
import { TeamSummaryCardComponent } from '../widgets/team-summary-card/team-summary-card.component';
import { NextMatchCardComponent } from '../widgets/next-match-card/next-match-card.component';
import { QuickStatsCardComponent } from '../widgets/quick-stats-card/quick-stats-card.component';
import { AlertsCardComponent } from '../widgets/alerts-card/alerts-card.component';

/**
 * Dashboard principal para el Manager de Equipo
 * Muestra resumen ejecutivo con widgets informativos
 */
@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TeamSummaryCardComponent,
    NextMatchCardComponent,
    QuickStatsCardComponent,
    AlertsCardComponent
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  hasError = false;
  errorMessage = '';
  teamDetail: TeamDetail | null = null;
  tournamentTeamId: number = 0;
  tournamentId: number = 0; // ✅ Agregado para capturar del state
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private managerService: ManagerService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Capturar tournamentId del state de navegación
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;
    if (state && state['tournamentId']) {
      this.tournamentId = state['tournamentId'];
      console.log('📊 Dashboard - Tournament ID from state:', this.tournamentId);
    }

    // Obtener el tournamentTeamId de la ruta
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const tournamentTeamId = +params['tournamentTeamId']; // Convertir a número
      if (tournamentTeamId && tournamentTeamId > 0) {
        this.tournamentTeamId = tournamentTeamId;
        console.log('📊 Dashboard - Tournament Team ID from route:', this.tournamentTeamId);
        this.loadDashboardData();
      } else {
        console.error('📊 Dashboard - Invalid tournament team ID from route:', params['tournamentTeamId']);
        this.toastService.showError('ID de equipo inválido');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos del dashboard desde el API
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.managerService.getTeamDetail(this.tournamentTeamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teamDetail: TeamDetail) => {
          this.teamDetail = teamDetail;
          this.isLoading = false;
          this.hasError = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.teamDetail = null;
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'Error al cargar los datos del equipo. El API devolvió null o falló la conexión.';
          this.toastService.showError(this.errorMessage);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Refresca los datos del dashboard
   */
  onRefresh(): void {
    this.loadDashboardData();
  }
}
