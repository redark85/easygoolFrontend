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
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { Category, CategoryFormData, CategoryModalResult } from '../../models/category.interface';
import { Phase, Group } from '../../models/phase.interface';
import { Team } from '../../models/team.interface';
import { CategoryService } from '../../services/category.service';
import { CategoryFormComponent } from '../category-form/category-form.component';

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
    MatBadgeModule
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
   * TrackBy function para optimizar el rendimiento
   */
  trackByCategoryId(index: number, category: Category): number {
    return category.categoryId;
  }

  /**
   * TrackBy functions para phases, groups y teams
   */
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id;
  }

  trackByGroupId(index: number, group: Group): number {
    return group.id;
  }

  trackByTeamId(index: number, team: Team): number {
    return team.id;
  }

  /**
   * Métodos para phases management
   */
  createPhase(categoryId: number): void {
    // TODO: Implementar creación de fase
    console.log('Creating phase for category:', categoryId);
  }

  editPhase(phase: Phase): void {
    // TODO: Implementar edición de fase
    console.log('Editing phase:', phase);
  }

  deletePhase(phase: Phase): void {
    // TODO: Implementar eliminación de fase
    console.log('Deleting phase:', phase);
  }

  getPhaseTypeIcon(phaseType: number): string {
    return phaseType === 0 ? 'group_work' : 'timeline';
  }

  getPhaseTypeText(phaseType: number): string {
    return phaseType === 0 ? 'Grupos' : 'Eliminatoria';
  }

  /**
   * Métodos para groups management
   */
  createGroup(phase: Phase): void {
    // TODO: Implementar creación de grupo
    console.log('Creating group for phase:', phase);
  }

  editGroup(group: Group): void {
    // TODO: Implementar edición de grupo
    console.log('Editing group:', group);
  }

  deleteGroup(group: Group): void {
    // TODO: Implementar eliminación de grupo
    console.log('Deleting group:', group);
  }

  /**
   * Métodos para teams management
   */
  addTeamToGroup(groupId: number, groupName: string): void {
    // TODO: Implementar agregar equipo a grupo
    console.log('Adding team to group:', groupId, groupName);
  }

  addTeamToPhase(phaseId: number, phaseName: string): void {
    // TODO: Implementar agregar equipo a fase
    console.log('Adding team to phase:', phaseId, phaseName);
  }

  removeTeamFromGroup(teamId: number, groupId: number): void {
    // TODO: Implementar remover equipo de grupo
    console.log('Removing team from group:', teamId, groupId);
  }

  removeTeamFromPhase(teamId: number, phaseId: number): void {
    // TODO: Implementar remover equipo de fase
    console.log('Removing team from phase:', teamId, phaseId);
  }

  assignTeamsRandomly(phase: Phase): void {
    // TODO: Implementar asignación aleatoria de equipos
    console.log('Assigning teams randomly for phase:', phase);
  }

  /**
   * Manejo de errores de imágenes
   */
  onImageError(event: any): void {
    event.target.src = '/assets/images/default-team-logo.png';
  }
}
