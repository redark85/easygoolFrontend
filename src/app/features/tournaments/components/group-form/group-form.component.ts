import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '@core/services/toast.service';
import { PhaseService } from '../../services/phase.service';
import { GroupFormData, CreateGroupRequest, UpdateGroupRequest } from '../../models/group-form.interface';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.scss']
})
export class GroupFormComponent implements OnInit {
  groupForm: FormGroup;
  isEdit: boolean;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GroupFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupFormData,
    private toastService: ToastService,
    private phaseService: PhaseService
  ) {
    this.isEdit = data.isEdit;
    this.groupForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.group) {
      this.patchForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]]
    });
  }

  private patchForm(): void {
    if (this.data.group) {
      this.groupForm.patchValue({
        name: this.data.group.name
      });
    }
  }

  get nameErrors(): string | null {
    const nameControl = this.groupForm.get('name');
    if (nameControl?.errors && nameControl.touched) {
      if (nameControl.errors['required']) {
        return 'El nombre del grupo es obligatorio';
      }
      if (nameControl.errors['minlength']) {
        return 'El nombre debe tener al menos 1 caracter';
      }
      if (nameControl.errors['maxlength']) {
        return 'El nombre no puede exceder 30 caracteres';
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.groupForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.groupForm.value;
      
      if (this.isEdit && this.data.group) {
        // TODO: Implementar actualización de grupo cuando esté disponible en la API
        const updateData: UpdateGroupRequest = {
          id: this.data.group.id,
          name: formValue.name.trim()
        };
        
        this.toastService.showWarning('Funcionalidad de edición no disponible aún');
        this.isSubmitting = false;
        this.dialogRef.close({
          action: 'update',
          data: updateData
        });
      } else {
        // Crear nuevo grupo usando la API
        const createData: CreateGroupRequest = {
          name: formValue.name.trim()
        };
        
        this.phaseService.createGroup(this.data.phaseId, createData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.succeed) {
              this.dialogRef.close({
                action: 'create',
                data: response.result
              });
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error creating group:', error);
          }
        });
      }
    } else {
      this.groupForm.markAllAsTouched();
      this.toastService.showError('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
