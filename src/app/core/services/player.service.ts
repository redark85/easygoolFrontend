import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PLAYER_UPLOAD_EXCEL_ENDPOINT, PLAYER_GET_BY_IDENTIFICATION_ENDPOINT } from '../config/endpoints';
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

export interface PlayerByIdentificationResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: PlayerData | null;
  records: number;
}

export interface PlayerData {
  id: number;
  name: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  identification: string;
  position: string;
  jerseyNumber: number;
  photoUrl: string;
  isCapitan: boolean;
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

  /**
   * Obtiene un jugador por su número de identificación
   * @param identificationNumber Número de identificación del jugador
   * @returns Observable con los datos del jugador
   */
  getPlayerByIdentification(identificationNumber: string): Observable<PlayerData | null> {
    return this.apiService.get<PlayerByIdentificationResponse>(
      `${PLAYER_GET_BY_IDENTIFICATION_ENDPOINT}?identificationNumber=${identificationNumber}`
    ).pipe(
      map(response => {
        if (response.succeed) {
          return response.result;
        }
        return null;
      })
    );
  }
}
