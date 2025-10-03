import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-fixture-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fixture-viewer.component.html',
  styleUrls: ['./fixture-viewer.component.scss']
})
export class FixtureViewerComponent implements OnInit {
  loading = false;
  tournaments: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: Cargar torneos en curso desde el servicio
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.loading = true;
    // Simulación de carga de torneos
    setTimeout(() => {
      this.tournaments = [
        { id: 1, name: 'Campeonato Regional 2025', status: 'En curso' },
        { id: 2, name: 'Liga Provincial', status: 'En curso' },
        { id: 3, name: 'Torneo Apertura', status: 'En curso' }
      ];
      this.loading = false;
    }, 1000);
  }

  viewFixture(tournamentId: number): void {
    // TODO: Navegar a la vista del fixture del torneo
    console.log('Ver fixture del torneo:', tournamentId);
    // this.router.navigate(['/fixture', tournamentId]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
