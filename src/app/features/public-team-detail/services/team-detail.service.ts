import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { FIXTURE_GET_TEAM_DETAILS_ENDPOINT } from '../../../core/config/endpoints';
import { 
  TeamDetailResponse, 
  TeamDetailForComponent, 
  PlayerForComponent, 
  MatchForComponent,
  TeamDetailData 
} from '../models/team-detail.interface';

@Injectable({
  providedIn: 'root'
})
export class TeamDetailService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene los detalles del equipo desde el API
   * @param tournamentTeamId ID del equipo en el torneo
   * @returns Observable con los detalles del equipo
   */
  getTeamDetails(tournamentTeamId: number): Observable<TeamDetailForComponent | null> {
    console.log('🔍 TeamDetailService - Fetching team details for tournamentTeamId:', tournamentTeamId);
    
    return this.apiService.get<TeamDetailResponse>(
      `${FIXTURE_GET_TEAM_DETAILS_ENDPOINT}?tournamentTeamId=${tournamentTeamId}`
    ).pipe(
      map(response => {
        console.log('📊 TeamDetailService - API Response received:', response);
        
        if (response.succeed && response.result) {
          const adaptedTeam = this.adaptTeamDataForComponent(response.result, tournamentTeamId);
          console.log('✅ TeamDetailService - Team data adapted successfully:', adaptedTeam.name);
          return adaptedTeam;
        } else {
          console.warn('⚠️ TeamDetailService - API response not successful:', response.message);
          return null;
        }
      }),
      catchError(error => {
        console.error('❌ TeamDetailService - Error fetching team details:', error);
        return of(null);
      })
    );
  }

  /**
   * Adapta los datos del API a la estructura requerida por el componente
   */
  private adaptTeamDataForComponent(apiData: TeamDetailData, teamId: number): TeamDetailForComponent {
    console.log('🔄 TeamDetailService - Adapting API data for component...');

    return {
      id: teamId,
      name: apiData.teamName,
      shortName: apiData.shortName,
      logoUrl: apiData.logo || 'assets/team-placeholder.png',
      groupName: apiData.groupName,
      motto: `Grupo ${apiData.groupName}`, // Usar grupo como motto por defecto
      position: apiData.position,
      points: apiData.points,
      matchesPlayed: apiData.played,
      wins: apiData.wins,
      draws: apiData.draws,
      losses: apiData.losses,
      goalsFor: apiData.goalsFor,
      goalsAgainst: apiData.goalsAgainst,
      goalDifference: apiData.goalDifference,
      totalPlayers: apiData.totalPlayers,
      pointsPerMatch: apiData.pointsPerMatch,
      effectiveness: apiData.effectiveness,
      lastFiveResults: this.parseLastFiveResults(apiData.lastFiveResults),
      players: this.adaptPlayersForComponent(apiData.players),
      upcomingMatches: this.adaptUpcomingMatches(apiData.upcomingMatches),
      pastMatches: this.adaptRecentMatches(apiData.recentMatches),
      topScorer: apiData.topScorer,
      // Valores por defecto para campos opcionales
      coach: 'Por definir',
      stadium: 'Por definir',
      founded: new Date().getFullYear()
    };
  }

  /**
   * Convierte el array de strings a array de resultados tipados
   */
  private parseLastFiveResults(results: string[]): ('W' | 'D' | 'L')[] {
    return results.map(result => {
      switch (result.toUpperCase()) {
        case 'W':
        case 'WIN':
        case 'VICTORIA':
          return 'W';
        case 'D':
        case 'DRAW':
        case 'EMPATE':
          return 'D';
        case 'L':
        case 'LOSS':
        case 'DERROTA':
          return 'L';
        default:
          return 'D'; // Por defecto empate si no se reconoce
      }
    }) as ('W' | 'D' | 'L')[];
  }

  /**
   * Adapta los jugadores del API al formato del componente
   */
  private adaptPlayersForComponent(playersData: any[]): PlayerForComponent[] {
    const adaptedPlayers: PlayerForComponent[] = [];
    let playerId = 1;

    playersData.forEach(positionGroup => {
      positionGroup.players.forEach((player: any) => {
        adaptedPlayers.push({
          id: playerId++,
          name: player.name,
          jerseyNumber: player.jerseyNumber,
          position: this.mapPositionToCode(positionGroup.position),
          photoUrl: 'assets/person.jpg', // Placeholder por defecto
          goals: player.goals || 0,
          assists: 0, // No viene en el API, usar 0 por defecto
          yellowCards: player.yellowCards || 0,
          redCards: player.redCards || 0,
          matchesPlayed: player.matchesPlayed || 0,
          penalties: player.penalties || 0
        });
      });
    });

    return adaptedPlayers;
  }

  /**
   * Mapea las posiciones del API a códigos del componente
   */
  private mapPositionToCode(position: string): string {
    const positionMap: { [key: string]: string } = {
      'Portero': 'GK',
      'Porteros': 'GK',
      'Goalkeeper': 'GK',
      'Defensa': 'DEF',
      'Defensas': 'DEF',
      'Defender': 'DEF',
      'Mediocampo': 'MID',
      'Mediocampista': 'MID',
      'Midfielder': 'MID',
      'Delantero': 'FWD',
      'Delanteros': 'FWD',
      'Forward': 'FWD',
      'Atacante': 'FWD'
    };

    return positionMap[position] || 'MID'; // Por defecto mediocampista
  }

  /**
   * Adapta los partidos próximos
   */
  private adaptUpcomingMatches(upcomingMatches: any[]): MatchForComponent[] {
    return upcomingMatches.map((match, index) => ({
      id: match.matchId || index + 1000,
      opponent: match.opponent,
      opponentLogo: 'assets/team-placeholder.png',
      date: new Date(match.matchDate),
      isHome: match.isHome,
      status: 'upcoming' as const,
      phaseName: match.phaseName
    }));
  }

  /**
   * Adapta los partidos recientes
   */
  private adaptRecentMatches(recentMatches: any[]): MatchForComponent[] {
    return recentMatches.map((match, index) => ({
      id: match.matchId || index + 2000,
      opponent: match.opponent,
      opponentLogo: 'assets/team-placeholder.png',
      date: new Date(match.matchDate),
      isHome: match.isHome,
      score: `${match.homeScore}-${match.awayScore}`,
      result: this.calculateMatchResult(match.isHome, match.homeScore, match.awayScore),
      status: 'finished' as const,
      phaseName: match.phaseName
    }));
  }

  /**
   * Calcula el resultado del partido desde la perspectiva del equipo
   */
  private calculateMatchResult(isHome: boolean, homeScore: number, awayScore: number): 'W' | 'D' | 'L' {
    const teamScore = isHome ? homeScore : awayScore;
    const opponentScore = isHome ? awayScore : homeScore;

    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'D';
  }
}
