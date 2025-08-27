import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs$: Observable<BreadcrumbItem[]>;

  private routeLabels: { [key: string]: { label: string; icon?: string } } = {
    'dashboard': { label: 'Dashboard', icon: 'dashboard' },
    'home': { label: 'Inicio', icon: 'home' },
    'matches': { label: 'Partidos', icon: 'sports_soccer' },
    'teams': { label: 'Equipos', icon: 'groups' },
    'players': { label: 'Jugadores', icon: 'person' },
    'tournaments': { label: 'Torneos', icon: 'emoji_events' },
    'stats': { label: 'Estadísticas', icon: 'analytics' },
    'settings': { label: 'Configuración', icon: 'settings' },
    'profile': { label: 'Perfil', icon: 'account_circle' },
    'auth': { label: 'Autenticación', icon: 'login' },
    'login': { label: 'Iniciar Sesión', icon: 'login' },
    'register': { label: 'Registro', icon: 'person_add' }
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.breadcrumbs$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url)),
      map(() => this.buildBreadcrumbs())
    );
  }

  ngOnInit(): void {}

  private buildBreadcrumbs(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    const urlSegments = this.router.url.split('/').filter(segment => segment);

    let currentUrl = '';
    
    urlSegments.forEach((segment, index) => {
      currentUrl += `/${segment}`;
      
      const routeInfo = this.routeLabels[segment];
      if (routeInfo) {
        breadcrumbs.push({
          label: routeInfo.label,
          url: currentUrl,
          icon: index === 0 ? routeInfo.icon : undefined
        });
      } else {
        // Fallback para segmentos no definidos
        breadcrumbs.push({
          label: this.capitalizeFirst(segment),
          url: currentUrl
        });
      }
    });

    return breadcrumbs;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  navigateTo(url: string): void {
    this.router.navigate([url]);
  }
}
