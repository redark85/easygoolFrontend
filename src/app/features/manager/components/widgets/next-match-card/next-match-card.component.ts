import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { interval, Subject, takeUntil } from 'rxjs';

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
export class NextMatchCardComponent implements OnInit, OnDestroy {
  nextMatch: NextMatch = {
    id: 1,
    homeTeam: {
      name: 'Mi Equipo',
      logoUrl: 'assets/team-placeholder.png'
    },
    awayTeam: {
      name: 'Rival FC',
      logoUrl: 'assets/team-placeholder.png'
    },
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días desde ahora
    venue: 'Estadio Municipal',
    matchday: 11
  };

  countdown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
