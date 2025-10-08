import { RoleType } from './auth.interface';

// User interface siguiendo principios SOLID - SRP
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: RoleType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  phone?: string;
  dateOfBirth?: Date;
  favoriteTeam?: string;
  position?: string;
}

// DTOs para API integration
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: RoleType;
}

export interface UpdateUserRequest extends Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> {}
