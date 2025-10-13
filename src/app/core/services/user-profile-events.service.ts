import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserProfileEventsService {
  private profileUpdatedSource = new Subject<void>();
  
  // Observable que otros componentes pueden suscribirse
  profileUpdated$ = this.profileUpdatedSource.asObservable();

  /**
   * Notifica a todos los componentes que el perfil ha sido actualizado
   */
  notifyProfileUpdated(): void {
    console.log('🔔 UserProfileEventsService - Notifying profile update to all components');
    this.profileUpdatedSource.next();
  }
}
