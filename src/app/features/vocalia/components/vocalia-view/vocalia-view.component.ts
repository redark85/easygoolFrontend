import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

interface Player {
  id: number;
  number: number;
  name: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

interface MatchIncident {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'substitution';
  player: string;
  team: string;
  description: string;
}

@Component({
  selector: 'app-vocalia-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './vocalia-view.component.html',
  styleUrls: ['./vocalia-view.component.scss']
})
export class VocaliaViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  matchId: number | null = null;
  
  // Match Info
  tournamentName = 'Campeonato Nacional - Estadio X';
  homeTeam = 'Equipo A';
  awayTeam = 'Equipo B';
  homeScore = 1;
  awayScore = 2;
  matchTime = '23:15';
  isMatchActive = true;
  
  // Players
  homeTeamPlayers: Player[] = [
    { id: 1, number: 9, name: 'Juan Pérez', goals: 0, yellowCards: 0, redCards: 0 },
    { id: 2, number: 8, name: 'Carlos Ruiz', goals: 0, yellowCards: 0, redCards: 0 }
  ];
  
  awayTeamPlayers: Player[] = [
    { id: 3, number: 10, name: 'Luis Gómez', goals: 1, yellowCards: 0, redCards: 0 },
    { id: 4, number: 7, name: 'Pedro Díaz', goals: 0, yellowCards: 0, redCards: 0 }
  ];
  
  // Incidents
  incidents: MatchIncident[] = [
    { minute: 15, type: 'goal', player: '#10 Luis Gómez', team: 'Equipo B', description: 'Gol de #10 Luis Gómez (Equipo B)' },
    { minute: 23, type: 'yellow', player: '#8 Carlos Ruiz', team: 'Equipo A', description: 'Falta de #8 Carlos Ruiz (Equipo A)' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el ID del partido de la ruta
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.matchId = params['id'] ? +params['id'] : null;
      if (this.matchId) {
        this.loadMatchData(this.matchId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos del partido
   */
  private loadMatchData(matchId: number): void {
    // TODO: Implementar llamada al API para obtener datos del partido
    console.log('Loading match data for ID:', matchId);
  }

  /**
   * Registra un gol
   */
  addGoal(player: Player, team: 'home' | 'away'): void {
    player.goals++;
    if (team === 'home') {
      this.homeScore++;
    } else {
      this.awayScore++;
    }
    
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    this.incidents.unshift({
      minute: this.getCurrentMinute(),
      type: 'goal',
      player: `#${player.number} ${player.name}`,
      team: teamName,
      description: `Gol de #${player.number} ${player.name} (${teamName})`
    });
  }

  /**
   * Registra una tarjeta amarilla
   */
  addYellowCard(player: Player, team: 'home' | 'away'): void {
    player.yellowCards++;
    
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    this.incidents.unshift({
      minute: this.getCurrentMinute(),
      type: 'yellow',
      player: `#${player.number} ${player.name}`,
      team: teamName,
      description: `Tarjeta amarilla para #${player.number} ${player.name} (${teamName})`
    });
  }

  /**
   * Registra una tarjeta roja
   */
  addRedCard(player: Player, team: 'home' | 'away'): void {
    player.redCards++;
    
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    this.incidents.unshift({
      minute: this.getCurrentMinute(),
      type: 'red',
      player: `#${player.number} ${player.name}`,
      team: teamName,
      description: `Tarjeta roja para #${player.number} ${player.name} (${teamName})`
    });
  }

  /**
   * Elimina un jugador
   */
  removePlayer(player: Player, team: 'home' | 'away'): void {
    Swal.fire({
      title: '¿Eliminar jugador?',
      text: `¿Deseas eliminar a ${player.name} de la lista?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (team === 'home') {
          this.homeTeamPlayers = this.homeTeamPlayers.filter(p => p.id !== player.id);
        } else {
          this.awayTeamPlayers = this.awayTeamPlayers.filter(p => p.id !== player.id);
        }
      }
    });
  }

  /**
   * Deshace la última acción
   */
  undoLastAction(): void {
    Swal.fire({
      title: '¿Deshacer última acción?',
      text: 'Esta acción no se puede revertir',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, deshacer',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar lógica de deshacer
        if (this.incidents.length > 0) {
          this.incidents.shift();
        }
      }
    });
  }

  /**
   * Finaliza el partido
   */
  finishMatch(): void {
    Swal.fire({
      title: '¿Finalizar partido?',
      text: 'Se guardará el resultado final y no podrás hacer más cambios',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar llamada al API para finalizar partido
        Swal.fire({
          title: '¡Partido finalizado!',
          text: 'El resultado ha sido guardado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/matches']);
        });
      }
    });
  }

  /**
   * Obtiene el minuto actual del partido
   */
  private getCurrentMinute(): number {
    // TODO: Implementar lógica real del cronómetro
    return Math.floor(Math.random() * 90) + 1;
  }

  /**
   * TrackBy para jugadores
   */
  trackByPlayerId(index: number, player: Player): number {
    return player.id;
  }

  /**
   * TrackBy para incidencias
   */
  trackByIncidentIndex(index: number): number {
    return index;
  }
}
