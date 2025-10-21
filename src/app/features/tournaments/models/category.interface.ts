import { ApiResponse } from '@core/models/api.interface';
import { Phase } from './phase.interface';

/**
 * Interface para Category con el response completo del API
 */
export interface Category {
  categoryId: number;
  name: string;
  description: string;
  phases: Phase[];
}

/**
 * Request para crear una categoría
 */
export interface CreateCategoryRequest {
  tournamentId: number;
  name: string;
  description: string;
}

/**
 * Request para actualizar una categoría
 */
export interface UpdateCategoryRequest {
  name: string;
  description: string;
}

/**
 * Response del API para categorías
 */
export interface CategoryApiResponse extends ApiResponse<Category[]> {}

/**
 * Response del API para crear categoría
 */
export interface CreateCategoryResponse extends ApiResponse<Category> {}

/**
 * Data para el formulario de categoría
 */
export interface CategoryFormData {
  mode: 'create' | 'edit';
  tournamentId: number;
  category?: Category;
}

/**
 * Resultado del modal de categoría
 */
export interface CategoryModalResult {
  success: boolean;
  category?: Category;
}
