import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { Match, MatchGroup, MatchStatus, MatchPeriod } from '@core/models/match.model';
import { MatchService } from '@core/services';

@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './matches-list.component.html',
  styleUrls: ['./matches-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchesListComponent implements OnInit, OnDestroy {
  private readonly matchService = inject(MatchService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  matchGroups: MatchGroup[] = [];
  filteredMatchGroups: MatchGroup[] = [];
  isLoading = false;
  searchControl = new FormControl('');

  // Expose enums to template
  MatchStatus = MatchStatus;
  MatchPeriod = MatchPeriod;

  ngOnInit(): void {
    this.loadMatches();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMatches(): void {
    this.isLoading = true;
    this.matchService.getMatchesGroupedByDate()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.matchGroups = groups;
          this.filteredMatchGroups = groups;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading matches:', error);
          this.isLoading = false;
        }
      });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filterMatches(searchTerm || '');
        this.cdr.markForCheck();
      });
  }

  private filterMatches(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredMatchGroups = this.matchGroups;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredMatchGroups = this.matchGroups
      .map(group => ({
        ...group,
        matches: group.matches.filter(match =>
          match.homeTeam.name.toLowerCase().includes(term) ||
          match.homeTeam.shortName.toLowerCase().includes(term) ||
          match.awayTeam.name.toLowerCase().includes(term) ||
          match.awayTeam.shortName.toLowerCase().includes(term) ||
          match.tournament.toLowerCase().includes(term) ||
          match.venue.toLowerCase().includes(term)
        )
      }))
      .filter(group => group.matches.length > 0);
  }

  // Navigation methods
  viewMatchDetails(matchId: string): void {
    this.router.navigate(['/dashboard/matches', matchId]);
  }

  createMatch(): void {
    this.router.navigate(['/dashboard/matches/create']);
  }

  editMatch(matchId: string): void {
    this.router.navigate(['/dashboard/matches/edit', matchId]);
  }

  // Utility methods for template
  getStatusChipColor(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.LIVE:
        return 'accent';
      case MatchStatus.HALF_TIME:
        return 'warn';
      case MatchStatus.FINISHED:
        return 'primary';
      case MatchStatus.SCHEDULED:
        return '';
      case MatchStatus.POSTPONED:
      case MatchStatus.CANCELLED:
        return 'warn';
      default:
        return '';
    }
  }

  getStatusText(match: Match): string {
    switch (match.status) {
      case MatchStatus.LIVE:
        return match.minute ? `${match.minute}'` : 'EN VIVO';
      case MatchStatus.HALF_TIME:
        return 'DESCANSO';
      case MatchStatus.FINISHED:
        return 'FINALIZADO';
      case MatchStatus.SCHEDULED:
        return this.formatTime(match.date);
      case MatchStatus.POSTPONED:
        return 'APLAZADO';
      case MatchStatus.CANCELLED:
        return 'CANCELADO';
      default:
        return '';
    }
  }


  isLiveMatch(status: MatchStatus): boolean {
    return status === MatchStatus.LIVE || status === MatchStatus.HALF_TIME;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLiveMatchesCount(matches: Match[]): number {
    return matches.filter(match => this.isLiveMatch(match.status)).length;
  }

  // TrackBy functions for performance
  trackByGroupDate(index: number, group: MatchGroup): string {
    return group.date;
  }

  trackByMatchId(index: number, match: Match): string {
    return match.id;
  }

  // Panel state management
  getPanelClass(group: MatchGroup): string {
    if (group.isToday) return 'today-panel';
    if (group.isTomorrow) return 'tomorrow-panel';
    if (group.isYesterday) return 'yesterday-panel';
    return '';
  }

  shouldExpandByDefault(group: MatchGroup): boolean {
    return group.isToday || group.matches.some(match => this.isLiveMatch(match.status));
  }
}
