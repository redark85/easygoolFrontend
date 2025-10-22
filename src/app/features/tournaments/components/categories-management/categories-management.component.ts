import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    MatSelectModule,
    MatFormFieldModule,
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
  @ViewChild('phasesGroupsComponent') phasesGroupsComponent!: PhasesGroupsManagementComponent;

  loading = false;
  selectedCategoryId: number | null = null;
  selectedCategory: Category | null = null;
  deletingCategoryId: number | null = null; // ID de la categoría que se está eliminando

  constructor(
    public categoryService: CategoryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
        console.log('📊 Categorías cargadas:', categories.length);
        this.categories = [...categories]; // Nueva referencia para detección de cambios
        this.loading = false;
        
        // Validar si la categoría seleccionada aún existe
        this.validateAndUpdateSelection(categories);
        
        this.categoriesUpdated.emit(this.categories);
        this.forceChangeDetectionComplete();
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
        if (result.category) {
          console.log('✅ Categoría editada exitosamente:', result.category.categoryId);
          // Actualizar la categoría específica con los nuevos datos
          this.updateCategoryInPlace(result.category);
        } else {
          console.log('🔄 Recargando todas las categorías después de edición');
          this.loadCategories();
        }
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
        // Activar loading para esta categoría específica
        this.deletingCategoryId = category.categoryId;
        this.cdr.detectChanges();

        console.log('🗑️ Eliminando categoría:', category.name, 'ID:', category.categoryId);

        this.categoryService.deleteCategory(category.categoryId).subscribe({
          next: (success) => {
            // Desactivar loading
            this.deletingCategoryId = null;
            this.cdr.detectChanges();

            if (success) {
              console.log('✅ Categoría eliminada exitosamente, recargando lista');
              // Limpiar selección antes de recargar para forzar nueva selección
              this.clearSelection();
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
            // Desactivar loading en caso de error
            this.deletingCategoryId = null;
            this.cdr.detectChanges();

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
  onPhasesUpdated(event: any): void {
    console.log('📥 Evento de actualización de fases recibido:', event);
    
    // Recargar la categoría específica desde la API para obtener fases actualizadas
    if (event && event.categoryId) {
      console.log('🎯 Actualizando fases de categoría:', event.categoryId);
      this.refreshCategoryFromAPI(event.categoryId);
    } else if (this.selectedCategoryId) {
      console.log('🔄 Actualizando fases de categoría seleccionada');
      this.refreshCategoryFromAPI(this.selectedCategoryId);
    } else {
      console.warn('⚠️ No hay categoría para actualizar fases');
    }
  }
  
  /**
   * Refresca una categoría específica desde la API para obtener fases actualizadas
   */
  private refreshCategoryFromAPI(categoryId: number): void {
    this.categoryService.getCategoriesByTournament(this.tournamentId).subscribe({
      next: (allCategories: Category[]) => {
        const updatedCategory = allCategories.find(cat => cat.categoryId === categoryId);
        if (updatedCategory) {
          // Actualizar solo las fases de la categoría específica
          const categoryIndex = this.categories.findIndex(cat => cat.categoryId === categoryId);
          if (categoryIndex !== -1) {
            this.categories[categoryIndex] = { ...updatedCategory };
            
            // Actualizar selectedCategory si es la misma
            if (this.selectedCategoryId === categoryId) {
              this.selectedCategory = { ...updatedCategory };
            }
            
            // Crear nueva referencia y forzar detección
            this.categories = [...this.categories];
            this.categoriesUpdated.emit(this.categories);
            this.forceChangeDetectionComplete();
            
            console.log('✅ Fases de categoría actualizadas:', updatedCategory.phases?.length || 0);
          }
        }
      },
      error: (error) => {
        console.error('❌ Error refrescando categoría:', error);
      }
    });
  }

  /**
   * Actualiza una categoría específica en el lugar sin llamadas API adicionales
   */
  private updateCategoryInPlace(updatedCategory: any): void {
    console.log('🔄 Actualizando categoría en el lugar:', updatedCategory.categoryId);
    
    // Encontrar y actualizar la categoría en el array
    const categoryIndex = this.categories.findIndex(cat => cat.categoryId === updatedCategory.categoryId);
    if (categoryIndex !== -1) {
      // Actualizar la categoría manteniendo las fases existentes
      this.categories[categoryIndex] = {
        ...this.categories[categoryIndex],
        name: updatedCategory.name,
        description: updatedCategory.description
      };
      
      // Actualizar selectedCategory si es la misma
      if (this.selectedCategoryId === updatedCategory.categoryId) {
        this.selectedCategory = { ...this.categories[categoryIndex] };
        console.log('🎯 Categoría seleccionada actualizada:', this.selectedCategory.name);
      }
      
      // Crear nueva referencia del array para forzar detección de cambios
      this.categories = [...this.categories];
      
      // Emitir evento de actualización
      this.categoriesUpdated.emit(this.categories);
      
      // Forzar detección de cambios completa
      this.forceChangeDetectionComplete();
      
      console.log('✅ Categoría actualizada exitosamente en la UI');
    } else {
      console.warn('⚠️ Categoría no encontrada, recargando lista completa');
      this.loadCategories();
    }
  }

  /**
   * Fuerza la detección de cambios de manera suave
   */
  private forceChangeDetectionSoft(): void {
    // Detección de cambios suave sin reinicializar la vista
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    // Un solo ciclo adicional para el componente hijo
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Valida la selección actual y actualiza si es necesario
   */
  private validateAndUpdateSelection(categories: Category[]): void {
    if (categories.length === 0) {
      // No hay categorías, limpiar selección
      this.clearSelection();
      console.log('📭 No hay categorías disponibles');
      return;
    }
    
    // Verificar si la categoría seleccionada aún existe
    if (this.selectedCategoryId) {
      const stillExists = categories.find(cat => cat.categoryId === this.selectedCategoryId);
      if (stillExists) {
        // La categoría aún existe, actualizar referencia
        this.selectedCategory = stillExists;
        console.log('✅ Categoría seleccionada aún existe:', stillExists.name);
        return;
      } else {
        console.log('⚠️ Categoría seleccionada ya no existe, seleccionando primera disponible');
      }
    }
    
    // Seleccionar la primera categoría disponible
    this.selectedCategoryId = categories[0].categoryId;
    this.selectedCategory = categories[0];
    console.log('🎯 Primera categoría seleccionada:', categories[0].name);
  }
  
  /**
   * Limpia la selección actual
   */
  private clearSelection(): void {
    this.selectedCategoryId = null;
    this.selectedCategory = null;
    console.log('🧹 Selección limpiada');
  }
  
  /**
   * Fuerza la detección de cambios completa y optimizada
   */
  private forceChangeDetectionComplete(): void {
    // Detección inmediata
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    // Usar NgZone para asegurar que Angular detecte todos los cambios
    this.ngZone.run(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      
      // Un ciclo adicional para componentes hijos
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 0);
    });
  }

  /**
   * Carga las categorías y restaura la selección
   */
  private loadCategoriesAndRestoreSelection(categoryIdToRestore: number | null): void {
    if (!this.tournamentId) return;
    
    console.log('🔄 Cargando categorías desde API, categoría a restaurar:', categoryIdToRestore);
    this.loading = true;
    this.cdr.detectChanges();

    this.categoryService.getCategoriesByTournament(this.tournamentId).subscribe({
      next: (categories) => {
        console.log('✅ Categorías cargadas desde API:', categories.length, 'categorías');
        
        // Forzar nueva referencia para que Angular detecte el cambio
        this.categories = [...categories];
        this.loading = false;
        
        // Restaurar la selección si existe
        if (categoryIdToRestore) {
          const categoryToSelect = categories.find(cat => cat.categoryId === categoryIdToRestore);
          if (categoryToSelect) {
            console.log('🎯 Restaurando selección de categoría:', categoryIdToRestore);
            this.selectedCategoryId = categoryIdToRestore;
            this.selectedCategory = categoryToSelect;
            
            // Forzar detección de cambios para la categoría seleccionada
            setTimeout(() => {
              this.cdr.markForCheck();
              this.cdr.detectChanges();
            }, 0);
          }
        } else if (categories.length > 0 && !this.selectedCategoryId) {
          // Seleccionar la primera categoría por defecto si no hay selección
          this.selectedCategoryId = categories[0].categoryId;
          this.selectedCategory = categories[0];
        }
        
        this.categoriesUpdated.emit(this.categories);
        
        // Forzar múltiples ciclos de detección de cambios
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // Usar NgZone para forzar detección de cambios
        this.ngZone.run(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          
          // Segundo ciclo para asegurar que el componente hijo se actualice
          setTimeout(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }, 10);
        });
      },
      error: (error) => {
        console.error('❌ Error loading categories:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * TrackBy function para optimizar el rendimiento
   */
  trackByCategoryId(index: number, category: Category): number {
    return category.categoryId;
  }

  /**
   * Delega la creación de fase al componente hijo
   */
  triggerCreatePhase(): void {
    if (this.phasesGroupsComponent) {
      console.log('🎯 Delegando creación de fase al componente hijo');
      this.phasesGroupsComponent.createPhase();
    } else {
      console.error('❌ No se pudo acceder al componente hijo phases-groups-management');
    }
  }
}
