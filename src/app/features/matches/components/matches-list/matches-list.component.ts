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
import { Match, MatchGroup, MatchStatus, MatchPeriod } from '@features/tournaments/models/match.interface';
// import { MatchService } from '@core/services'; // Comentado temporalmente

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
  // private readonly matchService = inject(MatchService); // Comentado temporalmente
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
    // Datos mock temporales hasta implementar MatchService
    setTimeout(() => {
      this.matchGroups = this.getMockMatchGroups();
      this.filteredMatchGroups = this.matchGroups;
      this.isLoading = false;
      this.cdr.markForCheck();
    }, 1000);
    
    // TODO: Implementar cuando MatchService esté disponible
    // this.matchService.getMatchesGroupedByDate()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (groups: MatchGroup[]) => {
    //       this.matchGroups = groups;
    //       this.filteredMatchGroups = groups;
    //       this.isLoading = false;
    //       this.cdr.markForCheck();
    //     },
    //     error: (error: any) => {
    //       console.error('Error loading matches:', error);
    //       this.isLoading = false;
    //     }
    //   });
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
    this.router.navigate(['/matches', matchId]);
  }

  createMatch(): void {
    this.router.navigate(['/matches/create']);
  }

  editMatch(matchId: string): void {
    this.router.navigate(['/matches/edit', matchId]);
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

  private getMockMatchGroups(): MatchGroup[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return [
      {
        date: this.formatDate(yesterday),
        displayDate: 'Ayer',
        isToday: false,
        isTomorrow: false,
        isYesterday: true,
        matches: [
          {
            id: '1',
            homeTeam: {
              id: '1',
              name: 'Real Madrid FC',
              shortName: 'RMA',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#FFFFFF'
            },
            awayTeam: {
              id: '2',
              name: 'FC Barcelona',
              shortName: 'BAR',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#004D98'
            },
            homeScore: 2,
            awayScore: 1,
            score: { homeScore: 2, awayScore: 1, halfTimeHome: 1, halfTimeAway: 0 },
            date: new Date(yesterday.getTime() + 20 * 60 * 60 * 1000), // 8:00 PM
            status: MatchStatus.FINISHED,
            tournament: 'Liga EasyGool',
            venue: 'Estadio Santiago Bernabéu',
            minute: null,
            period: MatchPeriod.FINISHED
          }
        ]
      },
      {
        date: this.formatDate(today),
        displayDate: 'Hoy',
        isToday: true,
        isTomorrow: false,
        isYesterday: false,
        matches: [
          {
            id: '2',
            homeTeam: {
              id: '3',
              name: 'Atlético Madrid',
              shortName: 'ATM',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#CB3524'
            },
            awayTeam: {
              id: '4',
              name: 'Valencia CF',
              shortName: 'VAL',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#FF6600'
            },
            homeScore: 1,
            awayScore: 0,
            score: { homeScore: 1, awayScore: 0 },
            date: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3:00 PM
            status: MatchStatus.LIVE,
            tournament: 'Liga EasyGool',
            venue: 'Wanda Metropolitano',
            minute: 67,
            period: MatchPeriod.SECOND_HALF
          },
          {
            id: '3',
            homeTeam: {
              id: '5',
              name: 'Sevilla FC',
              shortName: 'SEV',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#D50000'
            },
            awayTeam: {
              id: '6',
              name: 'Real Betis',
              shortName: 'BET',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#00A651'
            },
            homeScore: 0,
            awayScore: 0,
            score: { homeScore: 0, awayScore: 0 },
            date: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM
            status: MatchStatus.SCHEDULED,
            tournament: 'Liga EasyGool',
            venue: 'Ramón Sánchez-Pizjuán',
            minute: null,
            period: MatchPeriod.NOT_STARTED
          }
        ]
      },
      {
        date: this.formatDate(tomorrow),
        displayDate: 'Mañana',
        isToday: false,
        isTomorrow: true,
        isYesterday: false,
        matches: [
          {
            id: '4',
            homeTeam: {
              id: '7',
              name: 'Athletic Bilbao',
              shortName: 'ATH',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#EE2523'
            },
            awayTeam: {
              id: '8',
              name: 'Real Sociedad',
              shortName: 'RSO',
              logo: 'assets/team-1.jpg',
              logoUrl: 'assets/team-1.jpg',
              color: '#004C99'
            },
            homeScore: null,
            awayScore: null,
            score: { homeScore: 0, awayScore: 0 },
            date: new Date(tomorrow.getTime() + 16 * 60 * 60 * 1000), // 4:00 PM
            status: MatchStatus.SCHEDULED,
            tournament: 'Liga EasyGool',
            venue: 'San Mamés',
            minute: null,
            period: MatchPeriod.NOT_STARTED
          }
        ]
      }
    ];
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
