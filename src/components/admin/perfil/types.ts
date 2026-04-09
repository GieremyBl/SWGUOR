import type { Database } from '@/types/database';

export type UsuarioData = Database['public']['Tables']['usuarios']['Row'];

export interface ProfileState {
  // Form data
  nombreCompleto: string;
  email: string;
  telefono: string | number | null;
  avatarUrl: string;

  // Password change
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showPasswordSection: boolean;

  // Password visibility
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;

  // UI state
  isLoading: boolean;
  isSaving: boolean;
  uploadingImage: boolean;

  // Feedback
  success: string;
  error: string;
}

export type ProfileAction =
  | { type: 'SET_FIELD'; field: keyof ProfileState; value: any }
  | { type: 'SET_PROFILE_DATA'; data: Partial<UsuarioData> }
  | { type: 'RESET_PASSWORD_FIELDS' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_UPLOADING'; uploading: boolean }
  | { type: 'SET_SUCCESS'; message: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_FEEDBACK' };
