import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { PlayerService } from '../../services/player.service';
import { ImageUploaderComponent } from '@shared/components';
import {
  Player,
  PlayerFormData,
  PlayerModalResult,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  PlayerPositionOption
} from '@core/models';
import { ToastService } from '@core/services';

/**
 * Componente modal para crear y editar jugadores
 * Implementa principios SOLID:
 * - SRP: Responsabilidad única de gestionar formulario de jugador
 * - OCP: Abierto para extensión, cerrado para modificación
 * - DIP: Depende de abstracciones (PlayerService)
 */
@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ImageUploaderComponent
  ],
  templateUrl: './player-form.component.html',
  styleUrls: ['./player-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerFormComponent implements OnInit, OnDestroy {
  playerForm!: FormGroup;
  isSubmitting = false;
  isEdit = false;
  playerPositions: PlayerPositionOption[] = [];
  isPlayerFound = false;
  foundPlayerId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService,
    private dialogRef: MatDialogRef<PlayerFormComponent>,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,    
    @Inject(MAT_DIALOG_DATA) public data: PlayerFormData
  ) {
    this.isEdit = data.mode === 'edit';
    this.playerPositions = this.playerService.getPlayerPositions();
  }

  ngOnInit(): void {
    this.initializeForm();
    if (this.isEdit && this.data.player) {
      this.patchForm(this.data.player);
      if (!this.data.player.allowUpdateInfo) {
         // Deshabilitar los campos de nombres
            this.playerForm.get('name')?.disable();
            this.playerForm.get('secondName')?.disable();
            this.playerForm.get('lastName')?.disable();
            this.playerForm.get('secondLastName')?.disable();
            this.playerForm.get('identification')?.disable();
            this.playerForm.get('photo')?.disable();

      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario reactivo con validaciones
   */
  private initializeForm(): void {
    this.playerForm = this.fb.group({
      photo: ['', this.isEdit ? [] : [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      secondName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      secondLastName: ['', [Validators.maxLength(50)]],
      identification: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      position: ['', [Validators.required]],
      jerseyNumber: ['', [Validators.required, Validators.min(1), Validators.max(99)]]
    });
  }

  /**
   * Rellena el formulario con datos del jugador en modo edición
   */
  private async patchForm(player: Player): Promise<void> {
    try {
      console.log('Patching form with player data:', player);
      
      this.playerForm.patchValue({
        name: player.name,
        secondName: player.secondName,
        lastName: player.lastName,
        secondLastName: player.secondLastName,
        identification: player.identification,
        position: player.position,
        jerseyNumber: player.jerseyNumber
      });

      // Cargar imagen si existe - usar setTimeout para asegurar que el componente esté listo
      if (player.photoUrl) {
        console.log('Setting player photo URL:', player.photoUrl);
        
        // Usar setTimeout para asegurar que el image-uploader esté completamente inicializado
        setTimeout(() => {
          this.playerForm.get('photo')?.setValue(player.photoUrl);
          this.cdr.detectChanges();
          console.log('Photo URL set in form control');
        }, 100);
      }
    } catch (error) {
      console.error('Error patching form:', error);
    }
  }

  /**
   * Maneja el evento de imagen cargada
   */
  onImageUploaded(imageData: { base64: string; contentType: string }): void {
    this.playerForm.get('photo')?.setValue(imageData);
  }

  /**
   * Maneja el evento blur del campo de identificación
   * Busca si existe un jugador con esa identificación
   */
  onIdentificationBlur(): void {
    const identificationControl = this.playerForm.get('identification');
    const identificationNumber = identificationControl?.value?.trim();

    // Solo buscar si hay un valor y no estamos en modo edición
    if (!identificationNumber || this.isEdit) {
      return;
    }

    // Validar que tenga al menos 8 caracteres
    if (identificationNumber.length < 8) {
      return;
    }

    // Llamar al servicio para buscar el jugador
    this.playerService.getPlayerByIdentification(identificationNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (player) => {
          if (player) {
            // Si se encuentra un jugador, autocompletar el formulario
            console.log('Jugador encontrado:', player);
            this.isPlayerFound = true;
            this.foundPlayerId = player.id; // Guardar el ID del jugador encontrado
            
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Jugador encontrado!',
              text: `Hemos encontrado un jugador en nuestro sistema con el número de identificación ingresado.`,
              icon: 'success',
              timer: 5000,
              showConfirmButton: false
            });

            // Autocompletar el formulario
            this.playerForm.patchValue({
              name: player.name,
              secondName: player.secondName,
              lastName: player.lastName,
              secondLastName: player.secondLastName,
              position: player.position,
              jerseyNumber: player.jerseyNumber
            });

            // Deshabilitar los campos de nombres
            this.playerForm.get('name')?.disable();
            this.playerForm.get('secondName')?.disable();
            this.playerForm.get('lastName')?.disable();
            
            this.playerForm.get('secondLastName')?.disable();

            // Cargar la foto si existe
            if (player.photoUrl) {
              setTimeout(() => {
                this.playerForm.get('photo')?.setValue(player.photoUrl);
                this.cdr.detectChanges();
              }, 100);
            }
          } else {
            // No se encontró jugador, limpiar y habilitar campos
            this.isPlayerFound = false;
            this.foundPlayerId = null;
            this.clearAndEnableFields();
          }
        },
        error: (error) => {
          // No se encontró jugador, limpiar y habilitar campos
          console.log('No se encontró jugador con esa identificación');
          this.isPlayerFound = false;
          this.foundPlayerId = null;
          this.clearAndEnableFields();
        }
      });
  }

  /**
   * Limpia los campos del formulario y los habilita
   */
  private clearAndEnableFields(): void {
    // Limpiar todos los campos excepto identificación
    this.playerForm.patchValue({
      name: '',
      secondName: '',
      lastName: '',
      secondLastName: '',
      position: '',
      jerseyNumber: '',
      photo: ''
    });

    // Habilitar los campos de nombres
    this.playerForm.get('name')?.enable();
    this.playerForm.get('secondName')?.enable();
    this.playerForm.get('lastName')?.enable();
    this.playerForm.get('secondLastName')?.enable();

    this.cdr.detectChanges();
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.playerForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    if (this.isEdit) {
      this.updatePlayer();
    } else {
      if (this.isPlayerFound) {
        this.addExistingPlayer();
      }
      else{
        this.createPlayer();
      }  
    }
  }

  /**
   * Agrega un jugador existente al equipo
   */
  private addExistingPlayer(): void {
    if (!this.foundPlayerId) {
      this.isSubmitting = false;
      return;
    }
    this.cdr.detectChanges();

    const formValue = this.playerForm.getRawValue();

    const addTeamPlayerRequest = {
      playerId: this.foundPlayerId,
      tournamentTeamId: this.data.tournamentTeamId,
      position: formValue.position,
      jerseyNumber: parseInt(formValue.jerseyNumber, 10)
    };

    this.playerService.addTeamPlayer(addTeamPlayerRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (player) => {
        this.isSubmitting = false;
        const result: PlayerModalResult = { success: true, player };
        this.dialogRef.close(result);
      },
      error: (error) => {
        if (error.response.data.messageId === 'EGOL_124') {
           this.toastService.showError('Jugador ya pertenece al torneo.');
          }
        this.isSubmitting = false;
        this.cdr.detectChanges();

      }
    });
  }

  /**
   * Crea un nuevo jugador
   */
  private createPlayer(): void {
    // Usar getRawValue() para incluir campos deshabilitados
    const formValue = this.playerForm.getRawValue();
    const photoData = formValue.photo;

    // Procesar datos de imagen
    const { base64, extension } = this.processImageData(photoData);

    const createRequest: CreatePlayerRequest = {
      name: formValue.name.trim(),
      secondName: formValue.secondName?.trim() || '',
      lastName: formValue.lastName.trim(),
      secondLastName: formValue.secondLastName?.trim() || '',
      identification: formValue.identification.trim(),
      photoBase64: base64,
      photoContentType: extension,
      tournamentTeamId: this.data.tournamentTeamId,
      position: formValue.position,
      jerseyNumber: parseInt(formValue.jerseyNumber, 10),
    };

    this.playerService.createPlayer(createRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (player) => {
        this.isSubmitting = false;
        const result: PlayerModalResult = { success: true, player };
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error creating player:', error);
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Actualiza un jugador existente
   */
  private updatePlayer(): void {
    if (!this.data.player) return;

    this.cdr.detectChanges();

    // Usar getRawValue() para incluir campos deshabilitados
    const formValue = this.playerForm.getRawValue();
    const photoData = formValue.photo;

    const updateRequest: UpdatePlayerRequest = {
      id: this.data.player.id,
      name: formValue.name.trim(),
      secondName: formValue.secondName?.trim() || '',
      lastName: formValue.lastName.trim(),
      secondLastName: formValue.secondLastName?.trim() || '',
      identification: formValue.identification.trim(),
      tournamentTeamId: this.data.tournamentTeamId,
      position: formValue.position,
      jerseyNumber: parseInt(formValue.jerseyNumber, 10)
    };

    // Solo incluir foto si se cambió
    if (photoData && typeof photoData === 'object' && photoData.base64) {
      const { base64, extension } = this.processImageData(photoData);
      updateRequest.photoBase64 = base64;
      updateRequest.photoContentType = extension;
    }

    this.playerService.updatePlayer(this.data.player.id, updateRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (player) => {
        this.isSubmitting = false;
        const result: PlayerModalResult = { success: true, player };
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error updating player:', error);
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Cancela y cierra el modal
   */
  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.playerForm.controls).forEach(key => {
      const control = this.playerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para errores de validación
  get nameErrors(): string | null {
    const control = this.playerForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre es requerido';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 50 caracteres';
    }
    return null;
  }

  get lastNameErrors(): string | null {
    const control = this.playerForm.get('lastName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El apellido es requerido';
      if (control.errors['minlength']) return 'El apellido debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El apellido no puede exceder 50 caracteres';
    }
    return null;
  }

  get identificationErrors(): string | null {
    const control = this.playerForm.get('identification');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La identificación es requerida';
      if (control.errors['minlength']) return 'La identificación debe tener al menos 8 caracteres';
      if (control.errors['maxlength']) return 'La identificación no puede exceder 20 caracteres';
    }
    return null;
  }

  get positionErrors(): string | null {
    const control = this.playerForm.get('position');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La posición es requerida';
    }
    return null;
  }

  get jerseyNumberErrors(): string | null {
    const control = this.playerForm.get('jerseyNumber');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El número de camiseta es requerido';
      if (control.errors['min']) return 'El número debe ser mayor a 0';
      if (control.errors['max']) return 'El número no puede ser mayor a 99';
    }
    return null;
  }

  get photoErrors(): string | null {
    const control = this.playerForm.get('photo');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La foto del jugador es requerida';
    }
    return null;
  }

  /**
   * Procesa los datos de imagen para extraer base64 limpio y extensión
   * @param photoData Datos de la imagen del formulario
   * @returns Objeto con base64 limpio y extensión
   */
  private processImageData(photoData: any): { base64: string; extension: string } {
    if (!photoData || !photoData.base64 || !photoData.contentType) {
      return { base64: '', extension: '' };
    }

    // Extraer base64 sin el prefijo data:image/...;base64,
    let cleanBase64 = photoData.base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    // Extraer solo la extensión del contentType
    let extension = '';
    if (photoData.contentType) {
      // De "image/jpeg" extraer "jpeg"
      // De "image/png" extraer "png"
      const parts = photoData.contentType.split('/');
      if (parts.length > 1) {
        extension = parts[1];
      }
    }

    return {
      base64: cleanBase64,
      extension: extension
    };
  }
}
