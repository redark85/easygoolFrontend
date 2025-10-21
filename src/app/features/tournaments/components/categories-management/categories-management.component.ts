import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
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
  @ViewChild('phasesGroupsComponent') phasesGroupsComponent!: PhasesGroupsManagementComponent;

  loading = false;
  selectedCategoryId: number | null = null;
  selectedCategory: Category | null = null;

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
  onPhasesUpdated(event: any): void {
    console.log('📥 Evento de actualización de fases recibido:', event);
    
    // Si es un evento de refresh con categoryId específico
    if (event && event.categoryId && event.action === 'refresh') {
      console.log('🎯 Actualizando categoría específica:', event.categoryId);
      this.updateSpecificCategoryFromAPI(event.categoryId);
    } else {
      // Fallback para compatibilidad con eventos antiguos
      console.log('🔄 Fallback: actualizando categoría seleccionada');
      if (!this.selectedCategoryId) {
        console.warn('⚠️ No hay categoría seleccionada para actualizar');
        return;
      }
      this.updateSpecificCategoryFromAPI(this.selectedCategoryId);
    }
  }

  /**
   * Actualiza una categoría específica desde la API sin recargar toda la vista
   */
  private updateSpecificCategoryFromAPI(categoryId: number): void {
    console.log('🔄 Actualizando SOLO categoría:', categoryId, '- Manteniendo estado actual');
    
    // Obtener todas las categorías pero solo actualizar la específica
    this.categoryService.getCategoriesByTournament(this.tournamentId).subscribe({
      next: (allCategories: Category[]) => {
        console.log('📊 Categorías obtenidas del API:', allCategories.length);
        
        // Encontrar la categoría actualizada
        const updatedCategory = allCategories.find(cat => cat.categoryId === categoryId);
        if (updatedCategory) {
          console.log('✅ Categoría encontrada con', updatedCategory.phases?.length || 0, 'fases');
          
          // Encontrar y actualizar solo esta categoría en el array existente
          const categoryIndex = this.categories.findIndex(cat => cat.categoryId === categoryId);
          if (categoryIndex !== -1) {
            console.log('🔄 Actualizando categoría en posición:', categoryIndex);
            
            // Actualizar la categoría en el array SIN cambiar referencias principales
            this.categories[categoryIndex] = { ...updatedCategory };
            
            // SOLO actualizar selectedCategory si es la misma que se actualizó
            if (this.selectedCategoryId === categoryId) {
              this.selectedCategory = { ...updatedCategory };
              console.log('🎯 Categoría seleccionada también actualizada');
            }
            
            // Crear nueva referencia para forzar detección de cambios
            this.categories = [...this.categories];
            
            // Emitir evento de actualización
            this.categoriesUpdated.emit(this.categories);
            
            // Forzar detección de cambios múltiple para asegurar renderizado
            this.forceChangeDetectionAggressive();
            
            console.log('🔒 Estado preservado - Vista actualizada sin reinicializar');
          } else {
            console.warn('⚠️ Categoría no encontrada en array local, agregándola');
            this.categories.push(updatedCategory);
            this.categories = [...this.categories];
            this.categoriesUpdated.emit(this.categories);
            this.forceChangeDetectionAggressive();
          }
        } else {
          console.error('❌ Categoría no encontrada en respuesta del API');
        }
      },
      error: (error: any) => {
        console.error('❌ Error actualizando categoría específica:', error);
        // Fallback: recargar todas las categorías si falla la actualización específica
        this.loadCategoriesAndRestoreSelection(categoryId);
      }
    });
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
   * Fuerza la detección de cambios de manera agresiva para asegurar renderizado
   */
  private forceChangeDetectionAggressive(): void {
    // Detección inmediata
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    // Usar NgZone para forzar detección
    this.ngZone.run(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      
      // Múltiples ciclos para asegurar que el componente hijo se actualice
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 0);
      
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 10);
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
