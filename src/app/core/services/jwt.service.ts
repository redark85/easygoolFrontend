import { Injectable } from '@angular/core';
import { JwtPayload, jwtDecode } from 'jwt-decode';

export interface JwtToken extends JwtPayload {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  'tegool.user.permissions': string;
  'tegool.official.matchId': string;
  exp: number;
  iss: string;
  aud: string;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() {}

  decodeToken(token: string): JwtToken | null {
    try {
      return jwtDecode<JwtToken>(token);
    } catch (error) {
      console.error('Error decodificando el token:', error);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const timeToExpire = this.getTokenTimeToExpire(token);
    if (timeToExpire === null) return true;
    return timeToExpire <= 0;
  }

  getTokenTimeToExpire(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    const expirationDate = decoded.exp * 1000;
    const currentTime = Date.now();
    return expirationDate - currentTime;
  }

  isTokenAboutToExpire(token: string, minutesBefore = 5): boolean {
    const timeToExpire = this.getTokenTimeToExpire(token);
    if (timeToExpire === null) return true;

    const minutesInMs = minutesBefore * 60 * 1000;
    return timeToExpire < minutesInMs;
  }

  getUserInfo(token: string): { id: string; email: string; role: string; fullName: string; matchId: string } | null {
    const decoded = this.decodeToken(token);
    console.log('decoded', decoded);
    if (!decoded) return null;

    return {
      id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
      email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
      role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
      fullName: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
      matchId: decoded['tegool.official.matchId'] || ''
    };
  }
}
