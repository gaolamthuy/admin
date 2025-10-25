/**
 * Authentication-related types and interfaces
 * Centralized auth type definitions
 */

/**
 * User role enum
 * @enum UserRole
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

/**
 * User interface
 * @interface User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - User name
 * @property {string} avatar - User avatar URL
 * @property {UserRole} role - User role
 * @property {boolean} is_active - Active status
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Auth state interface
 * @interface AuthState
 * @property {User | null} user - Current user
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login form interface
 * @interface LoginForm
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {boolean} remember - Remember me option
 */
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Register form interface
 * @interface RegisterForm
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {string} confirmPassword - Password confirmation
 */
export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
