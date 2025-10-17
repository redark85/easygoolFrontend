import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatchStatusType } from '../../../../core/services/match.service';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogoUrl: string;
  awayTeamLogoUrl: string;
  homeScore: number | null;
  awayScore: number | null;
  date: Date;
  status: MatchStatusType;
  isLive: boolean;
  isFinished: boolean;
  matchday: number;
}

/**
 * Componente para mostrar una tarjeta de partido
 */
@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './match-card.component.html',
  styleUrls: ['./match-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchCardComponent {
  @Input() match!: Match;
  @Output() viewDetails = new EventEmitter<Match>();

  /**
   * Emite el evento para ver detalles
   */
  onViewDetails(): void {
    this.viewDetails.emit(this.match);
  }

  /**
   * Obtiene el label del estado basado en MatchStatusType
   */
  getStatusLabel(): string {
    switch (this.match.status) {
      case MatchStatusType.scheduled:
        return 'PROGRAMADO';
      case MatchStatusType.inProgress:
        return 'EN VIVO';
      case MatchStatusType.played:
        return 'JUGADO';
      case MatchStatusType.canceled:
        return 'CANCELADO ELIMINADO';
      case MatchStatusType.postponed:
        return 'POSTERGADO';
      default:
        return 'DESCONOCIDO';
    }
  }

  /**
   * Obtiene la clase CSS del estado basado en MatchStatusType
   */
  getStatusClass(): string {
    switch (this.match.status) {
      case MatchStatusType.scheduled:
        return 'status-scheduled';
      case MatchStatusType.inProgress:
        return 'status-live';
      case MatchStatusType.played:
        return 'status-completed';
      case MatchStatusType.canceled:
        return 'status-cancelled';
      case MatchStatusType.postponed:
        return 'status-postponed';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Verifica si debe mostrar el score
   */
  shouldShowScore(): boolean {
    return this.match.isLive || this.match.isFinished;
  }

  /**
   * Verifica si el partido está programado
   */
  isScheduled(): boolean {
    return this.match.status === MatchStatusType.scheduled;
  }

  /**
   * Verifica si el partido está postergado
   */
  isPostponed(): boolean {
    return this.match.status === MatchStatusType.postponed;
  }

  /**
   * Verifica si el partido está cancelado
   */
  isCancelled(): boolean {
    return this.match.status === MatchStatusType.canceled;
  }

  /**
   * Obtiene el texto de la fecha/hora
   */
  getDateTimeText(): string {
    if (this.match.isLive || this.match.isFinished) {
      return '';
    }
    return this.match.date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
