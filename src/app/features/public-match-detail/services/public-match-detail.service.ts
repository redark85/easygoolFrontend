import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { FIXTURE_GET_PUBLIC_MATCH_DETAIL_ENDPOINT } from '../../../core/config/endpoints';
import { PublicMatchDetailResponse } from '../models/match-detail.interface';

@Injectable({
  providedIn: 'root'
})
export class PublicMatchDetailService {

  constructor(private apiService: ApiService) { }

  /**
   * Obtiene el detalle público de un partido
   * @param matchId ID del partido
   * @returns Observable con el detalle del partido
   */
  getPublicMatchDetail(matchId: number): Observable<PublicMatchDetailResponse> {
    const url = `${FIXTURE_GET_PUBLIC_MATCH_DETAIL_ENDPOINT}/${matchId}`;
    return this.apiService.get<PublicMatchDetailResponse>(url);
  }
}
