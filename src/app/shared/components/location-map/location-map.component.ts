import { Component, OnInit, OnDestroy, Inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

declare let L: any;

export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  primaryStreet?: string;
  secondaryStreet?: string;
}

export interface LocationMapData {
  initialLocation?: LocationData;
}

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  template: `
    <div class="location-map-container">
      <h2 mat-dialog-title>
        <mat-icon>location_on</mat-icon>
        Seleccionar Ubicación
      </h2>

      <mat-dialog-content>
        <!-- Search Bar -->
        <div class="search-container">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar dirección</mat-label>
            <input matInput [(ngModel)]="searchQuery" (keyup.enter)="searchAddress()" 
                   placeholder="Ej: Av. Amazonas y Naciones Unidas, Quito">
            <button mat-icon-button matSuffix (click)="searchAddress()" [disabled]="isSearching">
              <mat-icon *ngIf="!isSearching">search</mat-icon>
              <mat-progress-spinner *ngIf="isSearching" diameter="20" mode="indeterminate"></mat-progress-spinner>
            </button>
          </mat-form-field>
        </div>

        <!-- Map Container -->
        <div id="map" class="map-container"></div>


        <!-- Location Info -->
        <div class="location-info" *ngIf="selectedLocation">
          <h3>Ubicación Seleccionada:</h3>
          <p><strong>Dirección:</strong> {{ selectedLocation.address }}</p>
          <p *ngIf="selectedLocation.primaryStreet"><strong>Calle Principal:</strong> {{ selectedLocation.primaryStreet }}</p>
          <p *ngIf="selectedLocation.secondaryStreet"><strong>Calle Secundaria:</strong> {{ selectedLocation.secondaryStreet }}</p>
          <p><strong>Coordenadas:</strong> {{ selectedLocation.latitude }}, {{ selectedLocation.longitude }}</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()">
          Cancelar
        </button>
        <button mat-flat-button color="primary" (click)="onConfirm()" 
                [disabled]="!selectedLocation">
          Confirmar Ubicación
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .location-map-container {
      width: 100%;
      max-width: 800px;
    }

    .search-container {
      margin-bottom: 16px;
    }

    .search-field {
      width: 100%;
    }

    .map-container {
      height: 500px;
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 16px;
      position: relative;
    }


    .location-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;

      h3 {
        margin: 0 0 12px 0;
        color: var(--primary-color);
        font-size: 1.1rem;
      }

      p {
        margin: 4px 0;
        font-size: 0.9rem;
      }
    }

    .dialog-actions {
      padding: 16px 24px;
      gap: 12px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 20px 0;
      color: var(--primary-color);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
  `]
})
export class LocationMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: any;
  private marker: any;
  searchQuery = '';
  isSearching = false;
  isGettingLocation = false;
  selectedLocation: LocationData | null = null;

  constructor(
    private dialogRef: MatDialogRef<LocationMapComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LocationMapData
  ) {}

  ngOnInit(): void {
    if (this.data?.initialLocation) {
      this.selectedLocation = this.data.initialLocation;
      this.searchQuery = this.data.initialLocation.address;
    }
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    try {
      // Configurar iconos por defecto de Leaflet
      if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      }

      // Coordenadas por defecto (Quito, Ecuador)
      let initialLat = -0.1807;
      let initialLng = -78.4678;
      
      // Si hay ubicación inicial, usarla
      if (this.selectedLocation) {
        initialLat = this.selectedLocation.latitude;
        initialLng = this.selectedLocation.longitude;
      } else {
        // Intentar obtener ubicación actual del usuario
        this.getInitialLocation();
      }

      // Inicializar mapa
      this.map = L.map('map').setView([initialLat, initialLng], 13);

      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Crear control personalizado para ubicación actual
      const LocationControl = L.Control.extend({
        onAdd: (map: any) => {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
          container.style.backgroundColor = 'white';
          container.style.width = '30px';
          container.style.height = '30px';
          container.style.cursor = 'pointer';
          container.innerHTML = '<div style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">📍</div>';
          container.title = 'Obtener mi ubicación actual';
          
          container.onclick = () => {
            this.getCurrentLocation();
          };
          
          return container;
        }
      });

      // Agregar el control al mapa
      this.map.addControl(new LocationControl({ position: 'topright' }));

      // Agregar marcador inicial
      this.marker = L.marker([initialLat, initialLng], { draggable: true })
        .addTo(this.map);

      // Event listener para cuando se mueve el marcador
      this.marker.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        this.reverseGeocode(position.lat, position.lng);
      });

      // Event listener para clicks en el mapa
      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.marker.setLatLng([lat, lng]);
        this.reverseGeocode(lat, lng);
      });

      // Si no hay ubicación inicial, hacer geocoding inverso
      if (!this.selectedLocation) {
        this.reverseGeocode(initialLat, initialLng);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private async getInitialLocation(): Promise<void> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Actualizar mapa si ya está inicializado
            if (this.map && this.marker) {
              this.map.setView([lat, lng], 15);
              this.marker.setLatLng([lat, lng]);
              this.reverseGeocode(lat, lng);
            }
            resolve();
          },
          (error) => {
            console.error('Error getting location:', error);
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  }

  async searchAddress(): Promise<void> {
    if (!this.searchQuery.trim()) return;

    this.isSearching = true;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}&limit=1&addressdetails=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Mover mapa y marcador
        if (this.map && this.marker) {
          this.map.setView([lat, lng], 15);
          this.marker.setLatLng([lat, lng]);
        }

        // Actualizar ubicación seleccionada
        this.updateSelectedLocation(lat, lng, result.display_name, result.address);
      } else {
        console.warn('No se encontraron resultados para la búsqueda');
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      this.isSearching = false;
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const result = await response.json();

      if (result && result.display_name) {
        this.updateSelectedLocation(lat, lng, result.display_name, result.address);
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  }

  private updateSelectedLocation(lat: number, lng: number, displayName: string, addressDetails?: any): void {
    this.selectedLocation = {
      address: displayName,
      latitude: lat,
      longitude: lng,
      primaryStreet: addressDetails?.road || addressDetails?.pedestrian || '',
      secondaryStreet: addressDetails?.neighbourhood || addressDetails?.suburb || ''
    };
  }

  onConfirm(): void {
    if (this.selectedLocation) {
      this.dialogRef.close(this.selectedLocation);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    this.isGettingLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Mover mapa y marcador a la ubicación actual
        if (this.map && this.marker) {
          this.map.setView([lat, lng], 16);
          this.marker.setLatLng([lat, lng]);
        }

        // Obtener dirección mediante geocoding inverso
        this.reverseGeocode(lat, lng);
        this.isGettingLocation = false;
      },
      (error) => {
        console.error('Error getting current location:', error);
        this.isGettingLocation = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }
}
