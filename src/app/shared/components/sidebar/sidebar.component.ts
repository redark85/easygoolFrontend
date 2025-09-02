import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { Observable, map } from 'rxjs';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  tooltip?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Input() isMobile = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();

  currentUser$: Observable<User | null>;

  menuItems: MenuItem[] = [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard/home',
      tooltip: 'Panel principal'
    },
    {
      icon: 'sports_soccer',
      label: 'Partidos',
      route: '/dashboard/matches',
      tooltip: 'Gestión de partidos'
    },
    {
      icon: 'groups',
      label: 'Equipos',
      route: '/dashboard/teams',
      tooltip: 'Gestión de equipos'
    },
    {
      icon: 'person',
      label: 'Jugadores',
      route: '/dashboard/players',
      tooltip: 'Gestión de jugadores'
    },
    {
      icon: 'emoji_events',
      label: 'Ligas',
      route: './leagues'
    },
    {
      icon: 'military_tech',
      label: 'Torneos',
      route: './tournaments'
    },
    {
      icon: 'analytics',
      label: 'Estadísticas',
      route: '/dashboard/stats',
      tooltip: 'Estadísticas y análisis'
    },
    {
      icon: 'settings',
      label: 'Configuración',
      route: '/dashboard/settings',
      tooltip: 'Configuración del sistema'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.authState$.pipe(map(state => state.user));
  }

  ngOnInit(): void {}

  onMenuItemClick(item: MenuItem): void {
    this.router.navigate([item.route]);
    
    // Cerrar sidebar en móvil después de navegar
    if (this.isMobile) {
      this.closeSidebar.emit();
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
