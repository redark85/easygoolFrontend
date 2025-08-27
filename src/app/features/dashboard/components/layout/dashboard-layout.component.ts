import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  isMobile = false;
  sidebarCollapsed = false;
  sidenavOpened = true;
  private destroy$ = new Subject<void>();

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.observeBreakpoints();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeBreakpoints(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        
        if (this.isMobile) {
          this.sidenavOpened = false;
          this.sidebarCollapsed = false;
        } else {
          this.sidenavOpened = true;
        }
      });
  }

  onToggleSidebar(): void {
    if (this.isMobile) {
      this.sidenavOpened = !this.sidenavOpened;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      // Force layout recalculation
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
    }
  }

  onCloseMobileSidebar(): void {
    if (this.isMobile) {
      this.sidenavOpened = false;
    }
  }

  onToggleMobileSidebar(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
