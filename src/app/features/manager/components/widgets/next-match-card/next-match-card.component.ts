import { Component, OnInit, OnDestroy, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { interval, Subject, takeUntil } from 'rxjs';
import { TeamDetail } from '../../../models/team-detail.interface';

interface NextMatch {
  id: number;
  homeTeam: {
    name: string;
    logoUrl: string;
  };
  awayTeam: {
    name: string;
    logoUrl: string;
  };
  date: Date;
  venue: string;
  matchday: number;
  formattedDate : string;
}

/**
 * Widget que muestra el próximo partido del equipo
 */
@Component({
  selector: 'app-next-match-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './next-match-card.component.html',
  styleUrls: ['./next-match-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NextMatchCardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() teamDetail: TeamDetail | null = null;
  
  nextMatch: NextMatch | null = null;

  countdown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateNextMatch();
    this.startCountdown();
  }

  ngOnChanges(): void {
    this.updateNextMatch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualiza los datos del próximo partido con datos reales del API
   */
  private updateNextMatch(): void {
    if (this.teamDetail && this.teamDetail.nextMatch) {
      const nextMatchData = this.teamDetail.nextMatch;
      const date = new Date(nextMatchData.matchDate);
    // 👇 Esto genera "sábado, 25 de octubre de 2025"
    var formattedDate = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
      this.nextMatch = {
        id: nextMatchData.matchId,
        homeTeam: {
          name: nextMatchData.isHome ? this.teamDetail.teamName : nextMatchData.opponent,
          logoUrl: nextMatchData.isHome ? (this.teamDetail.logoUrl || 'assets/default-team.png') : (this.teamDetail.nextMatch.imageUrl || 'assets/default-team.png')
        },
        awayTeam: {
          name: nextMatchData.isHome ? nextMatchData.opponent : this.teamDetail.teamName,
          logoUrl: nextMatchData.isHome ? (this.teamDetail.nextMatch.imageUrl || 'assets/default-team.png') : (this.teamDetail.logoUrl || 'assets/default-team.png')
        },
        date: new Date(nextMatchData.matchDate),
        formattedDate: formattedDate,
        venue: nextMatchData.phaseName || 'Sin información de venue',
        matchday: 0 // No viene en el API
      };
    } else {
      // Si no hay próximo partido o teamDetail es null
      this.nextMatch = null;
    }
  }

  /**
   * Inicia el countdown hasta el próximo partido
   */
  private startCountdown(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateCountdown();
      });
  }

  /**
   * Actualiza el countdown
   */
  private updateCountdown(): void {
    if (!this.nextMatch) return;
    
    const now = new Date().getTime();
    const matchTime = this.nextMatch.date.getTime();
    const distance = matchTime - now;

    if (distance > 0) {
      this.countdown.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.countdown.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.countdown.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.countdown.seconds = Math.floor((distance % (1000 * 60)) / 1000);
      this.cdr.detectChanges();
    }
  }
}
