import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { AuthService } from '@core/services';
import { User } from '@core/models';
import { Observable, map, switchMap, of, combineLatest } from 'rxjs';
import { UserProfileService } from '@core/services/user-profile.service';
import { UserProfileModalComponent } from '../user-profile-modal/user-profile-modal.component';
import {
  UserProfileModalData,
  UserProfileModalResult,
  UserProfileData
} from '@core/models/user-profile.interface';

// Interfaz para los datos del usuario que usa el header
interface HeaderUser {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    BreadcrumbComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  @Input() isMobile = false;
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  currentUser$: Observable<HeaderUser | null>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private userProfileService: UserProfileService
  ) {
    // Combinar datos del token con datos del perfil desde localStorage
    this.currentUser$ = this.authService.authState$.pipe(
      map(state => {
        if (!state.user) {
          return null;
        }

        // Obtener datos del perfil desde localStorage
        const userProfile = this.userProfileService.getUserProfileFromStorage();
        
        if (userProfile) {
          // Si hay datos del perfil, usarlos para crear el HeaderUser
          console.log('📱 Using user profile data from localStorage for header');
          return {
            firstName: userProfile.name,
            lastName: `${userProfile.secondName ? userProfile.secondName + ' ' : ''}${userProfile.lastName}${userProfile.secondLastName ? ' ' + userProfile.secondLastName : ''}`.trim(),
            email: userProfile.email,
            avatar: userProfile.profileImagePath || undefined
          } as HeaderUser;
        } else {
          // Fallback a datos del token si no hay perfil en localStorage
          console.log('🔄 Using token data as fallback for header (no profile in localStorage)');
          return {
            firstName: state.user.firstName,
            lastName: state.user.lastName,
            email: state.user.email,
            avatar: undefined // No hay avatar en los datos del token
          } as HeaderUser;
        }
      })
    );
  }

  ngOnInit(): void {}

  onToggleSidebar(): void {
    if (this.isMobile) {
      this.toggleMobileSidebar.emit();
    } else {
      this.toggleSidebar.emit();
    }
  }

  getProfile(): void {
    console.log('Opening user profile modal...');

    // Obtener el perfil del usuario desde localStorage (optimización)
    const userProfile = this.userProfileService.getUserProfileFromStorage();
    
    if (userProfile) {
      // Si hay datos en localStorage, usarlos directamente
      console.log('📱 Using user profile from localStorage for modal');
      this.openProfileModal(userProfile);
    } else {
      // Fallback: Si no hay datos en localStorage, cargar desde API
      console.log('🔄 No profile in localStorage, loading from API as fallback');
      this.userProfileService.getUserProfile().pipe(
        switchMap(apiUserProfile => {
          console.log('User profile loaded from API:', apiUserProfile);
          return this.openProfileModal(apiUserProfile);
        })
      ).subscribe({
        next: (result: UserProfileModalResult | undefined) => {
          this.handleProfileModalResult(result);
        },
        error: (error) => {
          console.error('Error loading user profile from API:', error);
          // El error ya se maneja en el servicio con toast
        }
      });
    }
  }

  /**
   * Abre el modal de perfil con los datos proporcionados
   */
  private openProfileModal(userProfile: UserProfileData): Observable<UserProfileModalResult | undefined> {
    // Configurar datos del modal
    const modalData: UserProfileModalData = {
      userProfile: userProfile,
      isEditing: false // Inicialmente en modo solo lectura
    };

    // Abrir modal
    const dialogRef = this.dialog.open(UserProfileModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: modalData,
      disableClose: false,
      autoFocus: true,
      restoreFocus: true
    });

    // Si se abrió desde localStorage, manejar el resultado directamente
    if (userProfile) {
      dialogRef.afterClosed().subscribe({
        next: (result: UserProfileModalResult | undefined) => {
          this.handleProfileModalResult(result);
        }
      });
    }

    return dialogRef.afterClosed();
  }

  /**
   * Maneja el resultado del modal de perfil
   */
  private handleProfileModalResult(result: UserProfileModalResult | undefined): void {
    if (result && result.success && result.action === 'update') {
      console.log('Profile updated successfully:', result.updatedProfile);
      // Forzar actualización del header recargando el observable
      this.refreshUserData();
    } else {
      console.log('Profile modal closed without changes');
    }
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
  }

  /**
   * Fuerza la actualización de los datos del usuario en el header
   * Útil después de actualizar el perfil
   */
  private refreshUserData(): void {
    console.log('🔄 Refreshing user data in header...');
    // El observable se actualizará automáticamente ya que está basado en authState$
    // y getUserProfileFromStorage() siempre obtiene los datos más recientes del localStorage
  }
}
