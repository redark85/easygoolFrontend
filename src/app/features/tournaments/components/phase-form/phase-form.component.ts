import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UppercaseDirective } from '@shared/directives/uppercase.directive';
import { ToastService } from '@core/services/toast.service';
import { PhaseService } from '../../services/phase.service';
import { PhaseFormData, CreatePhaseRequest, PhaseType } from '../../models/phase-form.interface';
import { UpdatePhaseRequest as PhaseUpdateRequest } from '../../models/phase.interface';

@Component({
  selector: 'app-phase-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './phase-form.component.html',
  styleUrls: ['./phase-form.component.scss']
})
export class PhaseFormComponent implements OnInit, OnDestroy {
  phaseForm!: FormGroup;
  isEdit: boolean;
  isSubmitting = false;
  categoryId: number | null = null;
  private destroy$ = new Subject<void>();

  phaseTypeOptions = [
    { value: PhaseType.GroupStage, label: 'Fase de Grupos' },
    { value: PhaseType.Knockout, label: 'Eliminación Directa' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PhaseFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhaseFormData,
    private toastService: ToastService,
    private phaseService: PhaseService,
    private route: ActivatedRoute
  ) {
    this.isEdit = data.isEdit;
    this.initializeForm();
  }

  ngOnInit(): void {
    // Obtener categoryId del data
    if (this.data.categoryId) {
      this.categoryId = this.data.categoryId;
    } else {
      this.toastService.showError('ID de categoría no disponible');
      this.dialogRef.close();
      return;
    }

    if (this.isEdit && this.data.phase) {
      this.patchForm();
    }

    // Suscribirse a cambios del formulario para debugging
    this.phaseForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      console.log('Form value changed:', value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.phaseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phaseType: [PhaseType.GroupStage, [Validators.required]]
    });
  }

  private patchForm(): void {
    if (this.data.phase) {
      console.log('Patching form with phase data:', this.data.phase);
      console.log('Phase type from data:', this.data.phase.phaseType, typeof this.data.phase.phaseType);
      
      // Asegurar que phaseType sea exactamente el mismo tipo que las opciones
      const phaseTypeValue = Number(this.data.phase.phaseType);
      
      // Usar patchValue con emitEvent: false para evitar triggers automáticos
      this.phaseForm.patchValue({
        name: this.data.phase.name,
        phaseType: phaseTypeValue
      }, { emitEvent: false });

      // Forzar la actualización del control de phaseType si es necesario
      setTimeout(() => {
        const currentValue = this.phaseForm.get('phaseType')?.value;
        if (currentValue !== phaseTypeValue) {
          console.log('Correcting phaseType value from', currentValue, 'to', phaseTypeValue);
          this.phaseForm.get('phaseType')?.setValue(phaseTypeValue, { emitEvent: false });
        }
      }, 0);

      // Verificar que el valor se haya establecido correctamente
      console.log('Form value after patch:', this.phaseForm.value);
      console.log('PhaseType control value:', this.phaseForm.get('phaseType')?.value);
      console.log('Converted phaseType value:', phaseTypeValue);
      
      // Verificar que el valor coincida con alguna opción
      const matchingOption = this.phaseTypeOptions.find(opt => opt.value === phaseTypeValue);
      console.log('Matching option found:', matchingOption);
    }
  }

  get nameErrors(): string | null {
    const nameControl = this.phaseForm.get('name');
    if (nameControl?.errors && nameControl.touched) {
      if (nameControl.errors['required']) {
        return 'El nombre de la fase es obligatorio';
      }
      if (nameControl.errors['minlength']) {
        return 'El nombre debe tener al menos 2 caracteres';
      }
      if (nameControl.errors['maxlength']) {
        return 'El nombre no puede exceder 100 caracteres';
      }
    }
    return null;
  }

  get phaseTypeErrors(): string | null {
    const phaseTypeControl = this.phaseForm.get('phaseType');
    if (phaseTypeControl?.errors && phaseTypeControl.touched) {
      if (phaseTypeControl.errors['required']) {
        return 'El tipo de fase es obligatorio';
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.phaseForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.phaseForm.value;
      console.log('Form value on submit:', formValue);
      console.log('Original phase data:', this.data.phase);

      if (this.isEdit && this.data.phase) {
        const updateData: PhaseUpdateRequest = {
          id: this.data.phase.id,
          name: formValue.name.trim()
          // phaseType no se incluye en actualizaciones
        };

        console.log('Update data being sent:', updateData);

        this.isSubmitting = false;
        this.dialogRef.close({
          action: 'update',
          data: updateData
        });
      } else {
        // Crear nueva fase usando la API
        const createData: CreatePhaseRequest = {
          name: formValue.name.trim(),
          phaseType: formValue.phaseType
        };

        // Validar que categoryId esté disponible
        if (!this.categoryId) {
          this.toastService.showError('ID de categoría no disponible');
          this.isSubmitting = false;
          return;
        }

        console.log('🚀 Creando fase con categoryId:', this.categoryId, 'data:', createData);
        this.phaseService.createPhase(this.categoryId, createData).subscribe({
          next: (response) => {
            console.log('✅ Respuesta de creación de fase:', response);
            this.isSubmitting = false;
            if (response.succeed) {
              console.log('🎉 Fase creada exitosamente, cerrando modal');
              this.dialogRef.close({
                action: 'create',
                data: response.result
              });
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error creating phase:', error);
          }
        });
      }
    } else {
      this.phaseForm.markAllAsTouched();
      this.toastService.showError('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Función para comparar valores en el mat-select
   * @param option1 Primera opción a comparar
   * @param option2 Segunda opción a comparar
   * @returns true si son iguales
   */
  comparePhaseTypes(option1: any, option2: any): boolean {
    console.log('Comparing values:', option1, option2, 'Types:', typeof option1, typeof option2);
    const result = Number(option1) === Number(option2);
    console.log('Comparison result:', result);
    return result;
  }

  /**
   * Maneja el cambio de selección en el mat-select de tipo de fase
   * @param event Evento de cambio de selección
   */
  onPhaseTypeChange(event: any): void {
    console.log('PhaseType selection changed:', event);
    console.log('Selected value:', event.value);
    console.log('Form control value after change:', this.phaseForm.get('phaseType')?.value);
    console.log('Complete form value:', this.phaseForm.value);
    
    // Forzar actualización del control si es necesario
    if (this.phaseForm.get('phaseType')?.value !== event.value) {
      console.log('Forcing form control update');
      this.phaseForm.get('phaseType')?.setValue(event.value);
      this.phaseForm.get('phaseType')?.markAsDirty();
      this.phaseForm.get('phaseType')?.updateValueAndValidity();
    }
  }

  /**
   * Obtiene la etiqueta del tipo de fase
   * @param phaseType Tipo de fase
   * @returns Etiqueta del tipo de fase
   */
  getPhaseTypeLabel(phaseType: PhaseType): string {
    const option = this.phaseTypeOptions.find(opt => opt.value === phaseType);
    return option ? option.label : 'Desconocido';
  }
}
