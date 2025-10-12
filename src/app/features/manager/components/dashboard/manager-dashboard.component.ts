import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

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
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos del dashboard
   */
  private loadDashboardData(): void {
    // Simular carga de datos
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  /**
   * Refresca los datos del dashboard
   */
  onRefresh(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.loadDashboardData();
  }
}
