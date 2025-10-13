import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { 
  UserProfileData, 
  UserProfileModalData, 
  UserProfileModalResult,
  UpdateUserProfileRequest 
} from '@core/models/user-profile.interface';
import { UserProfileService } from '@core/services/user-profile.service';
import { ImageUploaderComponent, ImageUploadData } from '../image-uploader/image-uploader.component';
import { UppercaseDirective } from '../../directives/uppercase.directive';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    ImageUploaderComponent,
    UppercaseDirective
  ],
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'user-profile-modal' // Agregar clase específica para estilos
  }
})
export class UserProfileModalComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup; // Usando definite assignment assertion
  isSubmitting = false;
  isEditing = false;
  userProfile: UserProfileData;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<UserProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserProfileModalData
  ) {
    console.log('🔍 UserProfileModal - Received data:', data);
    console.log('🔍 UserProfileModal - User profile:', data.userProfile);
    
    this.userProfile = data.userProfile;
    this.isEditing = data.isEditing || false;
    this.createForm();
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      secondName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      secondLastName: ['', [Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phoneNUmber: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/), Validators.maxLength(20)]],
      profileImage: [null]
    });

    // Deshabilitar formulario si no está en modo edición
    if (!this.isEditing) {
      this.profileForm.disable();
    }
  }

  private loadProfileData(): void {
    console.log('🔍 UserProfileModal - Loading profile data:', this.userProfile);
    
    if (this.userProfile) {
      const formData = {
        name: this.userProfile.name || '',
        secondName: this.userProfile.secondName || '',
        lastName: this.userProfile.lastName || '',
        secondLastName: this.userProfile.secondLastName || '',
        email: this.userProfile.email || '',
        phoneNUmber: this.userProfile.phoneNUmber || ''
      };
      
      console.log('🔍 UserProfileModal - Form data to patch:', formData);
      
      this.profileForm.patchValue(formData);

      // Cargar imagen de perfil si existe
      if (this.userProfile.profileImagePath) {
        this.profileForm.get('profileImage')?.setValue(this.userProfile.profileImagePath);
      }

      this.cdr.detectChanges();
    } else {
      console.log('❌ UserProfileModal - No user profile data available');
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      this.profileForm.enable();
    } else {
      this.profileForm.disable();
      // Recargar datos originales al cancelar edición
      this.loadProfileData();
    }
    
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.profileForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.cdr.detectChanges();

      const formData = this.profileForm.value;
      const updateRequest: UpdateUserProfileRequest = {
        name: formData.name,
        secondName: formData.secondName || '',
        lastName: formData.lastName,
        secondLastName: formData.secondLastName || '',
        email: formData.email,
        phoneNUmber: formData.phoneNUmber
      };

      // Procesar imagen si se ha seleccionado una nueva
      const profileImageData = formData.profileImage;
      if (profileImageData && typeof profileImageData === 'object' && profileImageData.base64) {
        const processedImage = this.userProfileService.processImageData(profileImageData);
        updateRequest.profileImageBase64 = processedImage.base64;
        updateRequest.profileImageContentType = processedImage.extension;
      }

      this.userProfileService.updateUserProfile(updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProfile) => {
            console.log('Profile updated successfully:', updatedProfile);
            this.isSubmitting = false;
            this.isEditing = false;
            this.userProfile = updatedProfile;
            
            // Actualizar formulario con datos actualizados
            this.loadProfileData();
            this.profileForm.disable();
            
            this.cdr.detectChanges();

            // Cerrar modal con resultado exitoso
            const result: UserProfileModalResult = {
              success: true,
              updatedProfile: updatedProfile,
              action: 'update'
            };
            this.dialogRef.close(result);
          },
          error: (error) => {
            console.error('Error updating profile:', error);
            this.isSubmitting = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      this.cdr.detectChanges();
    }
  }

  onCancel(): void {
    const result: UserProfileModalResult = {
      success: false,
      action: 'close'
    };
    this.dialogRef.close(result);
  }

  onImageUploaded(imageData: ImageUploadData): void {
    console.log('Image uploaded:', imageData);
    this.profileForm.get('profileImage')?.setValue(imageData);
    this.cdr.detectChanges();
  }

  // Getters para facilitar el acceso en el template
  get nameControl() { return this.profileForm.get('name'); }
  get secondNameControl() { return this.profileForm.get('secondName'); }
  get lastNameControl() { return this.profileForm.get('lastName'); }
  get secondLastNameControl() { return this.profileForm.get('secondLastName'); }
  get emailControl() { return this.profileForm.get('email'); }
  get phoneControl() { return this.profileForm.get('phoneNUmber'); }

  // Métodos utilitarios
  getUserStatusText(): string {
    return this.userProfileService.getUserStatusText(this.userProfile.status);
  }

  getUserRoleText(): string {
    return this.userProfileService.getUserRoleText(this.userProfile.role);
  }

  getUserStatusClass(): string {
    return this.userProfileService.getUserStatusClass(this.userProfile.status);
  }

  getUserRoleClass(): string {
    return this.userProfileService.getUserRoleClass(this.userProfile.role);
  }
}
