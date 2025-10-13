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
import { Observable, map, switchMap, of } from 'rxjs';
import { UserProfileService } from '@core/services/user-profile.service';
import { UserProfileModalComponent } from '../user-profile-modal/user-profile-modal.component';
import {
  UserProfileModalData,
  UserProfileModalResult
} from '@core/models/user-profile.interface';

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

  currentUser$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private userProfileService: UserProfileService
  ) {
    this.currentUser$ = this.authService.authState$.pipe(map(state => state.user));
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

    // Obtener el perfil del usuario desde la API
    this.userProfileService.getUserProfile().pipe(
      switchMap(userProfile => {
        console.log('User profile loaded:', userProfile);

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

        return dialogRef.afterClosed();
      })
    ).subscribe({
      next: (result: UserProfileModalResult | undefined) => {
        if (result && result.success && result.action === 'update') {
          console.log('Profile updated successfully:', result.updatedProfile);
          // Aquí podrías actualizar el estado global del usuario si es necesario
        } else {
          console.log('Profile modal closed without changes');
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        // El error ya se maneja en el servicio con toast
      }
    });
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
  }
}
