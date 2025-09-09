export interface Team {
  id: number;
  name: string;
  shortName: string;
  description?: string;
  logoBase64?: string;
  logoContentType?: string;
  foundationDate?: string;
  city?: string;
  stadium?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: number; // 1: Activo, 2: Inactivo, 3: Suspendido
  tournamentId: number;
  createdAt: string;
  updatedAt?: string;
}
