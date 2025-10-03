import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

interface Tournament {
  name: string;
  playersCount: number;
}

interface Team {
  id: number;
  logo: string;
  name: string;
  shortName: string;
  tournaments: Tournament[];
}

@Component({
  selector: 'app-my-teams',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './my-teams.component.html',
  styleUrls: ['./my-teams.component.scss']
})
export class MyTeamsComponent implements OnInit {
  teams: Team[] = [];

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    // Data dummy
    this.teams = [
      {
        id: 1,
        logo: 'assets/logo.png',
        name: 'Club Deportivo Barcelona',
        shortName: 'Barcelona SC',
        tournaments: [
          { name: 'Liga Pro 2025', playersCount: 25 },
          { name: 'Copa Ecuador', playersCount: 22 },
          { name: 'Torneo Apertura', playersCount: 23 }
        ]
      },
      {
        id: 2,
        logo: 'assets/logo.png',
        name: 'Club Sport Emelec',
        shortName: 'Emelec',
        tournaments: [
          { name: 'Liga Pro 2025', playersCount: 24 },
          { name: 'Copa Ecuador', playersCount: 20 }
        ]
      },
      {
        id: 3,
        logo: 'assets/logo.png',
        name: 'Independiente del Valle',
        shortName: 'IDV',
        tournaments: [
          { name: 'Liga Pro 2025', playersCount: 26 },
          { name: 'Copa Libertadores', playersCount: 25 },
          { name: 'Copa Ecuador', playersCount: 23 }
        ]
      },
      {
        id: 4,
        logo: 'assets/logo.png',
        name: 'Liga Deportiva Universitaria',
        shortName: 'LDU',
        tournaments: [
          { name: 'Liga Pro 2025', playersCount: 27 }
        ]
      }
    ];
  }

  viewTeamDetails(teamId: number): void {
    console.log('Ver detalles del equipo:', teamId);
    // TODO: Navegar a detalles del equipo
  }
}
