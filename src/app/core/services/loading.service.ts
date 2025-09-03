import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  public loading$ = this.loadingSubject.asObservable();

  /**
   * Inicia el estado de carga
   */
  startLoading(): void {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Finaliza el estado de carga
   */
  stopLoading(): void {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Fuerza el fin del estado de carga
   */
  forceStopLoading(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Obtiene el estado actual de carga
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
