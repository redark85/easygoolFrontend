import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { CategoryService } from '../../services/category.service';
import { CategoryFormData, CategoryModalResult, CreateCategoryRequest } from '../../models/category.interface';

@Component({
  selector: 'app-category-form',
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
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  categoryForm!: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryFormData
  ) {
    this.isEditMode = this.data?.mode === 'edit';
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.category) {
      this.patchForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  private patchForm(): void {
    if (this.data.category) {
      this.categoryForm.patchValue({
        name: this.data.category.name,
        description: this.data.category.description
      });
    }
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.isSubmitting = true;

      const formValue = this.categoryForm.value;
      const categoryData: CreateCategoryRequest = {
        tournamentId: this.data.tournamentId,
        name: formValue.name,
        description: formValue.description
      };

      const operation = this.isEditMode && this.data.category
        ? this.categoryService.updateCategory(this.data.category.categoryId, categoryData)
        : this.categoryService.createCategory(categoryData);

      operation
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.succeed) {
              const result: CategoryModalResult = {
                success: true,
                category: response.result
              };
              this.dialogRef.close(result);
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error saving category:', error);
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      this.categoryForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.categoryForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength']?.requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Editar Categoría' : 'Crear Nueva Categoría';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Actualizar' : 'Crear Categoría';
  }
}
