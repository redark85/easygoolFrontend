import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { Category, CategoryFormData, CategoryModalResult } from '../../models/category.interface';
import { Phase } from '../../models/phase.interface';
import { CategoryService } from '../../services/category.service';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { PhasesGroupsManagementComponent } from '../phases-groups-management/phases-groups-management.component';
import { PhaseFormData } from '../../models/phase-form.interface';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatBadgeModule,
    MatExpansionModule,
    PhasesGroupsManagementComponent
  ],
  templateUrl: './categories-management.component.html',
  styleUrls: ['./categories-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesManagementComponent implements OnInit {
  @Input() tournamentId!: number;
  @Input() categories: Category[] = [];
  @Output() categoriesUpdated = new EventEmitter<Category[]>();

  loading = false;
  selectedCategoryId: number | null = null;
  selectedCategory: Category | null = null;

  constructor(
    public categoryService: CategoryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Carga las categorías del torneo
   */
  loadCategories(): void {
    if (!this.tournamentId) return;
    
    this.loading = true;
    this.cdr.detectChanges();

    this.categoryService.getCategoriesByTournament(this.tournamentId).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
        
        // Seleccionar la primera categoría por defecto
        if (categories.length > 0 && !this.selectedCategoryId) {
          this.selectedCategoryId = categories[0].categoryId;
          this.selectedCategory = categories[0];
        }
        
        this.categoriesUpdated.emit(this.categories);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Abre el modal para crear una nueva categoría
   */
  createCategory(): void {
    const dialogData: CategoryFormData = {
      mode: 'create',
      tournamentId: this.tournamentId
    };

    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: CategoryModalResult) => {
      if (result?.success) {
        this.loadCategories();
      }
    });
  }

  /**
   * Abre el modal para editar una categoría
   */
  editCategory(category: Category): void {
    const dialogData: CategoryFormData = {
      mode: 'edit',
      tournamentId: this.tournamentId,
      category: category
    };

    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: CategoryModalResult) => {
      if (result?.success) {
        this.loadCategories();
      }
    });
  }

  /**
   * Elimina una categoría con confirmación
   */
  deleteCategory(category: Category): void {
    Swal.fire({
      title: '¿Eliminar categoría?',
      html: `¿Estás seguro de que deseas eliminar la categoría <strong>"${category.name}"</strong>?<br><br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(category.categoryId).subscribe({
          next: (success) => {
            if (success) {
              this.loadCategories();
              Swal.fire({
                title: '¡Eliminada!',
                text: 'La categoría ha sido eliminada exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            }
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la categoría. Inténtalo de nuevo.',
              icon: 'error'
            });
          }
        });
      }
    });
  }

  /**
   * Maneja el cambio de categoría seleccionada
   */
  onCategorySelectionChange(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.selectedCategory = this.categories.find(cat => cat.categoryId === categoryId) || null;
    this.cdr.detectChanges();
  }

  /**
   * Selecciona una categoría para mostrar sus detalles
   */
  selectCategory(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.selectedCategory = this.categories.find(cat => cat.categoryId === categoryId) || null;
    this.cdr.detectChanges();
  }

  /**
   * Maneja la actualización de fases desde el componente hijo
   */
  onPhasesUpdated(phases: Phase[]): void {
    if (this.selectedCategory) {
      this.selectedCategory.phases = phases;
      // Actualizar también en el array principal
      const categoryIndex = this.categories.findIndex(cat => cat.categoryId === this.selectedCategory!.categoryId);
      if (categoryIndex !== -1) {
        this.categories[categoryIndex].phases = phases;
      }
      this.cdr.detectChanges();
    }
  }

  /**
   * TrackBy function para optimizar el rendimiento
   */
  trackByCategoryId(index: number, category: Category): number {
    return category.categoryId;
  }

  /**
   * Método para crear fase - delegado al componente hijo
   */
  createPhase(categoryId: number): void {
    const dialogRef = this.dialog.open(PhaseFormComponent, {
      width: '500px',
      data: {
        isEdit: false,
        tournamentId: this.tournamentId
      } as PhaseFormData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'create') {
        // Recargar las categorías para mostrar la nueva fase
        this.loadCategories();
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'La fase ha sido creada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }
}
