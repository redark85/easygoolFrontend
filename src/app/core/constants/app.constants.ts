// Constantes de la aplicación siguiendo principios SOLID - SRP
export class AppConstants {
  
  // Storage Keys
  static readonly STORAGE_KEYS = {
    TOKEN: 'easygool_token',
    REFRESH_TOKEN: 'easygool_refresh_token',
    USER: 'easygool_user'
  } as const;

  // Mensajes de error
  static readonly ERROR_MESSAGES = {
    UNKNOWN_ERROR: 'Error desconocido en el servicio',
    LOGIN_ERROR: 'Usuario o contraseña incorrectos',
    NETWORK_ERROR: 'Error de conexión',
    UNAUTHORIZED: 'Usuario o contraseña incorrectos'
  } as const;
}
