import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PLAYER_UPLOAD_EXCEL_ENDPOINT } from '../config/endpoints';
import { ApiResponse } from '../models/api.interface';

export interface UploadPlayerExcelRequest {
  base64File: string;
}

export interface UploadPlayerExcelResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: any;
  records: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  constructor(private apiService: ApiService) { }

  /**
   * Sube un archivo Excel con jugadores
   * @param tournamentTeamId ID del equipo del torneo
   * @param request Request con el archivo en base64
   * @returns Observable con la respuesta
   */
  uploadPlayerExcel(tournamentTeamId: number, request: UploadPlayerExcelRequest): Observable<any> {
    return this.apiService.post<UploadPlayerExcelResponse>(
      `${PLAYER_UPLOAD_EXCEL_ENDPOINT}/${tournamentTeamId}`,
      request
    ).pipe(
      map(response => {
        if (response.succeed) {
          return response.result;
        }
        throw new Error(response.message || 'Error al subir el archivo Excel');
      })
    );
  }
}
