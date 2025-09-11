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
import { Subject } from 'rxjs';

import { Match, MatchStatus } from '../../models/match.interface';
import { Phase } from '../../models/phase.interface';
import { Team } from '../../models/team.interface';

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
    MatTabsModule
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
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Seleccionar la primera fase por defecto si existe
    if (this.phases.length > 0) {
      this.selectedPhaseId = this.phases[0].id;
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
  onPhaseChange(phaseId: number): void {
    this.selectedPhaseId = phaseId;
    this.cdr.detectChanges();
  }

  /**
   * Crea un nuevo partido
   */
  createMatch(): void {
    // TODO: Implementar modal de creación de partido
    console.log('Create match for phase:', this.selectedPhaseId);
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
}
