import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoadingComponent } from '@shared/components/global-loading/global-loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalLoadingComponent],
  template: `
    <router-outlet></router-outlet>
    <app-global-loading></app-global-loading>
  `,
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'easygoolFrontend';
}
