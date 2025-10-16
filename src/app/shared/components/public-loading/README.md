# PublicLoadingComponent

Componente de loading compartido para las vistas públicas del torneo.

## Características

- **Standalone Component**: No requiere módulo adicional
- **Personalizable**: Texto, subtexto, tamaño del spinner configurable
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Animaciones**: Efectos suaves de entrada y backdrop blur
- **Glassmorphism**: Fondo translúcido con efecto blur

## Uso

### Importación

```typescript
import { PublicLoadingComponent } from '@shared/components';

@Component({
  // ...
  imports: [
    // otros imports...
    PublicLoadingComponent
  ]
})
```

### En el Template

```html
<app-public-loading 
  [isVisible]="isLoading"
  text="Cargando datos del torneo..."
  subtext="Por favor espere"
  [diameter]="60"
  [strokeWidth]="4">
</app-public-loading>
```

## Propiedades

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `isVisible` | `boolean` | `false` | Controla la visibilidad del loading |
| `text` | `string` | `'Cargando datos del torneo...'` | Texto principal |
| `subtext` | `string` | `'Por favor espere'` | Texto secundario (opcional) |
| `diameter` | `number` | `60` | Tamaño del spinner en píxeles |
| `strokeWidth` | `number` | `4` | Grosor del spinner |

## Ejemplos de Uso

### Loading básico
```html
<app-public-loading [isVisible]="loading"></app-public-loading>
```

### Loading con texto personalizado
```html
<app-public-loading 
  [isVisible]="loading"
  text="Cargando fixture..."
  subtext="Organizando los partidos del torneo">
</app-public-loading>
```

### Loading con spinner pequeño
```html
<app-public-loading 
  [isVisible]="loading"
  [diameter]="40"
  [strokeWidth]="3">
</app-public-loading>
```

## Casos de Uso

- Carga de datos del torneo
- Carga de fixture completo
- Carga de tabla de posiciones
- Carga de estadísticas
- Cualquier operación asíncrona en vistas públicas

## Estilos

El componente incluye:
- Overlay con backdrop-filter blur
- Animación fadeInUp para suavidad
- Responsive design para móvil
- Colores consistentes con el tema de la aplicación
