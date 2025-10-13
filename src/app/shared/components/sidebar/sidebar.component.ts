import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/services';
import { User, RoleType } from '@core/models';
import { Observable, map, combineLatest, BehaviorSubject, takeUntil, Subject } from 'rxjs';
import { UserProfileService } from '@core/services/user-profile.service';
import { UserProfileEventsService } from '@core/services/user-profile-events.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  tooltip?: string;
}

// Interfaz para los datos del usuario que usa el sidebar
interface SidebarUser {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: RoleType;
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
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Input() isMobile = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();

  currentUser$: Observable<SidebarUser | null>;
  userRole$: Observable<RoleType | null>;
  RoleType = RoleType; // Exponer el enum al template
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private destroy$ = new Subject<void>();

  menuItems: MenuItem[] = [
    {
      icon: 'sports_soccer',
      label: 'Partidos',
      route: '/matches',
      tooltip: 'Gestión de partidos'
    },
    {
      icon: 'groups',
      label: 'Equipos',
      route: '/teams',
      tooltip: 'Gestión de equipos'
    },
    {
      icon: 'person',
      label: 'Jugadores',
      route: '/players',
      tooltip: 'Gestión de jugadores'
    },
    {
      icon: 'emoji_events',
      label: 'Ligas',
      route: '/leagues'
    },
    {
      icon: 'military_tech',
      label: 'Torneos',
      route: '/tournaments'
    },
    {
      icon: 'analytics',
      label: 'Estadísticas',
      route: '/stats',
      tooltip: 'Estadísticas y análisis'
    },
    {
      icon: 'settings',
      label: 'Configuración',
      route: '/settings',
      tooltip: 'Configuración del sistema'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private userProfileService: UserProfileService,
    private userProfileEventsService: UserProfileEventsService,
    private cdr: ChangeDetectorRef
  ) {
    // Combinar datos del token con datos del perfil desde localStorage
    // y un trigger para forzar actualizaciones (igual que en header)
    this.currentUser$ = combineLatest([
      this.authService.authState$,
      this.refreshTrigger$
    ]).pipe(
      map(([state, _]) => {
        if (!state.user) {
          return null;
        }

        // Obtener datos del perfil desde localStorage
        const userProfile = this.userProfileService.getUserProfileFromStorage();
        
        if (userProfile) {
          // Si hay datos del perfil, usarlos para crear el SidebarUser
          console.log('📱 Sidebar - Using user profile data from localStorage:', {
            name: userProfile.name,
            email: userProfile.email,
            hasImage: !!userProfile.profileImagePath,
            imagePath: userProfile.profileImagePath
          });
          return {
            firstName: userProfile.name,
            lastName: `${userProfile.secondName ? userProfile.secondName + ' ' : ''}${userProfile.lastName}${userProfile.secondLastName ? ' ' + userProfile.secondLastName : ''}`.trim(),
            email: userProfile.email,
            avatar: userProfile.profileImagePath || undefined,
            role: state.user.role
          } as SidebarUser;
        } else {
          // Fallback a datos del token si no hay perfil en localStorage
          console.log('🔄 Sidebar - Using token data as fallback (no profile in localStorage)');
          return {
            firstName: state.user.firstName,
            lastName: state.user.lastName,
            email: state.user.email,
            avatar: undefined, // No hay avatar en los datos del token
            role: state.user.role
          } as SidebarUser;
        }
      })
    );

    this.userRole$ = this.authService.authState$.pipe(map(state => state.user?.role ?? null));
  }

  ngOnInit(): void {
    // Suscribirse a las notificaciones de actualización del perfil
    this.userProfileEventsService.profileUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('📱 Sidebar - Received profile update notification');
        this.refreshUserData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
  }

  /**
   * Verifica si el usuario tiene acceso a la sección de Administrar Torneos
   */
  canAccessTournaments(role: RoleType | null): boolean {
    if (role === null) return false;
    return role === RoleType.League || role === RoleType.Superadmin;
  }

  /**
   * Verifica si el usuario tiene acceso a la sección de Administrar Equipos
   */
  canAccessTeams(role: RoleType | null): boolean {
    if (role === null) return false;
    return role === RoleType.Team || role === RoleType.Superadmin;
  }

  /**
   * Fuerza la actualización de los datos del usuario en el sidebar
   * Útil después de actualizar el perfil
   */
  refreshUserData(): void {
    console.log('🔄 Refreshing user data in sidebar...');
    // Emitir un nuevo valor para forzar la actualización del observable
    this.refreshTrigger$.next();
    // Forzar detección de cambios
    this.cdr.detectChanges();
    console.log('✅ Sidebar user data refreshed');
  }
}
