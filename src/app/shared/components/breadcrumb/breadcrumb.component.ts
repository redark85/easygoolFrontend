import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { filter, map, startWith, combineLatest, switchMap } from 'rxjs/operators';
import { Observable, merge } from 'rxjs';
import { TournamentStore } from '../../../core/store/tournament.store';

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
    'register': { label: 'Registro', icon: 'person_add' },
    'manage': { label: 'Administrar', icon: 'settings' }
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private tournamentStore: TournamentStore
  ) {
    // Combinar eventos de navegación con cambios en el store del torneo
    const navigationEvents$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url))
    );

    const storeChanges$ = this.tournamentStore.getState$();

    this.breadcrumbs$ = merge(navigationEvents$, storeChanges$).pipe(
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
        let label = routeInfo.label;
        
        // Si es el segmento "manage" y hay un título personalizado, usar el nombre del torneo
        if (segment === 'manage') {
          const pageTitle = this.titleService.getTitle();
          if (pageTitle && pageTitle.includes(' - EasyGool')) {
            label = pageTitle.replace(' - EasyGool', '');
          }
        }
        
        breadcrumbs.push({
          label: label,
          url: currentUrl,
          icon: index === 0 ? routeInfo.icon : undefined
        });
      } else {
        // Saltar segmentos numéricos (IDs) en el breadcrumb
        if (!/^\d+$/.test(segment)) {
          breadcrumbs.push({
            label: this.capitalizeFirst(segment),
            url: currentUrl
          });
        }
      }
    });

    // Verificar si estamos en una ruta de administración de torneo y actualizar el último breadcrumb
    if (urlSegments.includes('manage') && urlSegments.includes('tournaments')) {
      const currentTournamentName = this.tournamentStore.state.currentTournamentName;
      if (currentTournamentName && breadcrumbs.length > 0) {
        // Actualizar el último breadcrumb con el nombre del torneo desde el store
        breadcrumbs[breadcrumbs.length - 1].label = currentTournamentName;
      } else {
        // Fallback al título de la página si el store no tiene el nombre
        const pageTitle = this.titleService.getTitle();
        if (pageTitle && pageTitle.includes(' - EasyGool') && breadcrumbs.length > 0) {
          const tournamentName = pageTitle.replace(' - EasyGool', '');
          breadcrumbs[breadcrumbs.length - 1].label = tournamentName;
        }
      }
    }

    return breadcrumbs;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  navigateTo(url: string): void {
    this.router.navigate([url]);
  }
}
