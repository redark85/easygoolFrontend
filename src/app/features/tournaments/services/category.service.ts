import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { CATEGORY_GET_ALL_ENDPOINT, CATEGORY_CREATE_ENDPOINT } from '@core/config/endpoints';
import { 
  Category, 
  CreateCategoryRequest, 
  CategoryApiResponse, 
  CreateCategoryResponse 
} from '../models/category.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Obtiene todas las categorías de un torneo
   * @param tournamentId ID del torneo
   * @returns Observable con las categorías
   */
  getCategoriesByTournament(tournamentId: number): Observable<Category[]> {
    const url = `${CATEGORY_GET_ALL_ENDPOINT}/${tournamentId}`;
    
    return this.apiService.get<CategoryApiResponse>(url).pipe(
      map(response => {
        if (response.succeed && response.result) {
          return response.result;
        }
        return [];
      })
    );
  }

  /**
   * Crea una nueva categoría
   * @param categoryData Datos de la categoría a crear
   * @returns Observable con la respuesta
   */
  createCategory(categoryData: CreateCategoryRequest): Observable<CreateCategoryResponse> {
    console.log('Creating category with data:', categoryData);
    
    return this.apiService.post<CreateCategoryResponse>(CATEGORY_CREATE_ENDPOINT, categoryData).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess('Categoría creada exitosamente');
        } else {
          this.toastService.showError(response.message || 'Error al crear la categoría');
        }
        return response;
      })
    );
  }

  /**
   * Actualiza una categoría existente
   * @param categoryId ID de la categoría
   * @param categoryData Datos actualizados
   * @returns Observable con la respuesta
   */
  updateCategory(categoryId: number, categoryData: CreateCategoryRequest): Observable<CreateCategoryResponse> {
    const url = `${CATEGORY_CREATE_ENDPOINT}/${categoryId}`;
    
    return this.apiService.put<CreateCategoryResponse>(url, categoryData).pipe(
      map(response => {
        if (response.succeed) {
          this.toastService.showSuccess('Categoría actualizada exitosamente');
        } else {
          this.toastService.showError(response.message || 'Error al actualizar la categoría');
        }
        return response;
      })
    );
  }

  /**
   * Elimina una categoría
   * @param categoryId ID de la categoría a eliminar
   * @returns Observable con la respuesta
   */
  deleteCategory(categoryId: number): Observable<boolean> {
    const url = `${CATEGORY_CREATE_ENDPOINT}/${categoryId}`;
    
    return this.apiService.delete<any>(url).pipe(
      map(response => {
        if (response.succeed || response === true) {
          this.toastService.showSuccess('Categoría eliminada exitosamente');
          return true;
        } else {
          this.toastService.showError('Error al eliminar la categoría');
          return false;
        }
      })
    );
  }

  /**
   * Obtiene el número total de fases de una categoría
   * @param category Categoría
   * @returns Número de fases
   */
  getPhasesCount(category: Category): number {
    return category.phases ? category.phases.length : 0;
  }

  /**
   * Obtiene el número total de equipos en una categoría
   * @param category Categoría
   * @returns Número total de equipos
   */
  getTotalTeamsCount(category: Category): number {
    if (!category.phases) return 0;
    
    return category.phases.reduce((total, phase) => {
      const groupTeams = phase.groups ? phase.groups.reduce((groupTotal, group) => 
        groupTotal + (group.teams ? group.teams.length : 0), 0) : 0;
      const knockoutTeams = phase.knockoutTeams ? phase.knockoutTeams.length : 0;
      return total + groupTeams + knockoutTeams;
    }, 0);
  }
}
