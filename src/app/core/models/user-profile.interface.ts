// Interfaces para el perfil de usuario

export interface UserProfileApiResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: UserProfileData;
}

export interface UserProfileData {
  name: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  email: string;
  phoneNUmber: string; // Mantenemos el typo del backend
  profileImagePath: string;
  status: UserStatus;
  role: UserRole;
}

export interface UpdateUserProfileRequest {
  name: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  email: string;
  phoneNUmber: string; // Mantenemos el typo del backend
  profileImageBase64?: string;
  profileImageContentType?: string;
}

export enum UserStatus {
  Inactive = 0,
  Active = 1,
  Suspended = 2,
  Pending = 3
}

export enum UserRole {
  User = 0,
  Admin = 1,
  Manager = 2,
  Referee = 3
}

export interface UserProfileModalData {
  userProfile: UserProfileData;
  isEditing?: boolean;
}

export interface UserProfileModalResult {
  success: boolean;
  updatedProfile?: UserProfileData;
  action: 'close' | 'update';
}
