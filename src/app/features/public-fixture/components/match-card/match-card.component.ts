import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogoUrl: string;
  awayTeamLogoUrl: string;
  homeScore: number | null;
  awayScore: number | null;
  date: Date;
  status: 'upcoming' | 'live' | 'finished' | 'suspended';
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
   * Obtiene el label del estado
   */
  getStatusLabel(): string {
    const labels: { [key: string]: string } = {
      upcoming: 'PRÓXIMO',
      live: 'EN VIVO',
      finished: 'FINALIZADO',
      suspended: 'SUSPENDIDO'
    };
    return labels[this.match.status] || '';
  }

  /**
   * Obtiene la clase CSS del estado
   */
  getStatusClass(): string {
    return `status-${this.match.status}`;
  }

  /**
   * Verifica si debe mostrar el score
   */
  shouldShowScore(): boolean {
    return this.match.isLive || this.match.isFinished;
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
