import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  constructor(private router: Router) {}

  navigateToLeagueOwnerRegister(): void {
    this.router.navigate(['/auth/register'], { queryParams: { role: 'league' } });
  }

  navigateToTeamOwnerRegister(): void {
    this.router.navigate(['/auth/register'], { queryParams: { role: 'team' } });
  }

  navigateToFixtureViewer(): void {
    this.router.navigate(['/fixture-viewer']);
  }
}
