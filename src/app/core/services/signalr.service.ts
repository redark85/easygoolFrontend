import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatchInProgressStatusType } from './vocalia.service';

export interface MatchUpdateData {
  matchId: number;
  homeScore: number;
  awayScore: number;
  events: any[];
  statistics: any;
  matchInfo: any;
  homeTeamLineUp: any;
  awayTeamLineUp: any;
  progressStatus: MatchInProgressStatusType;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private matchUpdateSubject = new Subject<MatchUpdateData>();
  
  // Observable para que los componentes se suscriban
  public matchUpdate$: Observable<MatchUpdateData> = this.matchUpdateSubject.asObservable();

  constructor() {}

  /**
   * Inicia la conexión con el hub de SignalR
   */
  public startConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR ya está conectado');
      return Promise.resolve();
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiBaseUrl}/matchHub`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Reintentos automáticos
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Configurar eventos de reconexión
    this.hubConnection.onreconnecting((error: Error | undefined) => {
      console.warn('SignalR reconectando...', error);
    });

    this.hubConnection.onreconnected((connectionId: string | undefined) => {
      console.log('SignalR reconectado:', connectionId);
    });

    this.hubConnection.onclose((error: Error | undefined) => {
      console.error('SignalR conexión cerrada:', error);
    });

    // Registrar el listener para actualizaciones de partido
    this.hubConnection.on('ReceiveMatchUpdate', (data: MatchUpdateData) => {
      console.log('Actualización de partido recibida:', data);
      this.matchUpdateSubject.next(data);
    });

    return this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR conectado exitosamente');
      })
      .catch((err: Error) => {
        console.error('Error al conectar SignalR:', err);
        throw err;
      });
  }

  /**
   * Se une a un grupo de partido específico para recibir actualizaciones
   * @param matchId ID del partido
   */
  public joinMatchGroup(matchId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('SignalR no está conectado');
      return Promise.reject('SignalR no está conectado');
    }

    return this.hubConnection
      .invoke('JoinMatchGroup', matchId)
      .then(() => {
        console.log(`Unido al grupo del partido ${matchId}`);
      })
      .catch((err: Error) => {
        console.error('Error al unirse al grupo del partido:', err);
        throw err;
      });
  }

  /**
   * Sale de un grupo de partido específico
   * @param matchId ID del partido
   */
  public leaveMatchGroup(matchId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('SignalR no está conectado');
      return Promise.resolve();
    }

    return this.hubConnection
      .invoke('LeaveMatchGroup', matchId)
      .then(() => {
        console.log(`Salió del grupo del partido ${matchId}`);
      })
      .catch((err: Error) => {
        console.error('Error al salir del grupo del partido:', err);
        throw err;
      });
  }

  /**
   * Detiene la conexión con SignalR
   */
  public stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }

    return this.hubConnection
      .stop()
      .then(() => {
        console.log('SignalR desconectado');
        this.hubConnection = null;
      })
      .catch((err: Error) => {
        console.error('Error al desconectar SignalR:', err);
        throw err;
      });
  }

  /**
   * Verifica si está conectado
   */
  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Obtiene el estado de la conexión
   */
  public getConnectionState(): signalR.HubConnectionState | null {
    return this.hubConnection?.state || null;
  }
}
