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
import { Subject, takeUntil } from 'rxjs';

import { Match, MatchStatus } from '../../models/match.interface';
import { Phase, Group } from '../../models/phase.interface';
import { Team } from '../../models/team.interface';
import { MatchService, MatchDay } from '@core/services/match.service';

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
    private matchService: MatchService
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
}
