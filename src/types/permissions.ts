/**
 * Types cho hệ thống role-based permissions
 * Định nghĩa các interface và types cho permission system
 */

// ===== CORE TYPES =====

/**
 * Resource types - các tài nguyên trong hệ thống
 */
export type Resource =
  | "users"
  | "products"
  | "customers"
  | "invoices"
  | "payments"
  | "system"
  | "reports";

/**
 * Action types - các hành động có thể thực hiện
 */
export type Action = "read" | "write" | "delete" | "export" | "manage";

/**
 * Role interface - định nghĩa role
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Permission interface - định nghĩa permission
 */
export interface Permission {
  id: string;
  resource: Resource;
  action: Action;
  description?: string;
  created_at: string;
}

/**
 * User Role interface - mapping user với role
 */
export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
  role?: Role; // Populated role data
}

/**
 * Role Permission interface - mapping role với permission
 */
export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
  role?: Role; // Populated role data
  permission?: Permission; // Populated permission data
}

// ===== API RESPONSE TYPES =====

/**
 * Response khi lấy user roles
 */
export interface UserRolesResponse {
  role_name: string;
  role_description?: string;
  assigned_at: string;
}

/**
 * Response khi lấy user permissions
 */
export interface UserPermissionsResponse {
  resource: string;
  action: string;
  permission_description?: string;
}

// ===== PERMISSION CHECKING TYPES =====

/**
 * Permission check result
 */
export interface PermissionCheck {
  hasPermission: boolean;
  resource: Resource;
  action: Action;
}

/**
 * Role check result
 */
export interface RoleCheck {
  hasRole: boolean;
  roleName: string;
}

// ===== FORM TYPES =====

/**
 * Create role form data
 */
export interface CreateRoleForm {
  name: string;
  description?: string;
  permissions: string[]; // Permission IDs
}

/**
 * Update role form data
 */
export interface UpdateRoleForm {
  name?: string;
  description?: string;
  is_active?: boolean;
  permissions?: string[]; // Permission IDs
}

/**
 * Assign role form data
 */
export interface AssignRoleForm {
  user_id: string;
  role_id: string;
  expires_at?: string;
}

// ===== CONSTANTS =====

/**
 * Default roles trong hệ thống
 */
export const DEFAULT_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  VIEWER: "viewer",
  CASHIER: "cashier",
} as const;

/**
 * Default permissions mapping
 */
export const DEFAULT_PERMISSIONS = {
  // User permissions
  USERS_READ: { resource: "users" as Resource, action: "read" as Action },
  USERS_WRITE: { resource: "users" as Resource, action: "write" as Action },
  USERS_DELETE: { resource: "users" as Resource, action: "delete" as Action },
  USERS_MANAGE: { resource: "users" as Resource, action: "manage" as Action },

  // Product permissions
  PRODUCTS_READ: { resource: "products" as Resource, action: "read" as Action },
  PRODUCTS_WRITE: {
    resource: "products" as Resource,
    action: "write" as Action,
  },
  PRODUCTS_DELETE: {
    resource: "products" as Resource,
    action: "delete" as Action,
  },
  PRODUCTS_EXPORT: {
    resource: "products" as Resource,
    action: "export" as Action,
  },
  PRODUCTS_MANAGE: {
    resource: "products" as Resource,
    action: "manage" as Action,
  },

  // Customer permissions
  CUSTOMERS_READ: {
    resource: "customers" as Resource,
    action: "read" as Action,
  },
  CUSTOMERS_WRITE: {
    resource: "customers" as Resource,
    action: "write" as Action,
  },
  CUSTOMERS_DELETE: {
    resource: "customers" as Resource,
    action: "delete" as Action,
  },
  CUSTOMERS_EXPORT: {
    resource: "customers" as Resource,
    action: "export" as Action,
  },
  CUSTOMERS_MANAGE: {
    resource: "customers" as Resource,
    action: "manage" as Action,
  },

  // Invoice permissions
  INVOICES_READ: { resource: "invoices" as Resource, action: "read" as Action },
  INVOICES_WRITE: {
    resource: "invoices" as Resource,
    action: "write" as Action,
  },
  INVOICES_DELETE: {
    resource: "invoices" as Resource,
    action: "delete" as Action,
  },
  INVOICES_EXPORT: {
    resource: "invoices" as Resource,
    action: "export" as Action,
  },
  INVOICES_MANAGE: {
    resource: "invoices" as Resource,
    action: "manage" as Action,
  },

  // Payment permissions
  PAYMENTS_READ: { resource: "payments" as Resource, action: "read" as Action },
  PAYMENTS_WRITE: {
    resource: "payments" as Resource,
    action: "write" as Action,
  },
  PAYMENTS_EXPORT: {
    resource: "payments" as Resource,
    action: "export" as Action,
  },
  PAYMENTS_MANAGE: {
    resource: "payments" as Resource,
    action: "manage" as Action,
  },

  // System permissions
  SYSTEM_READ: { resource: "system" as Resource, action: "read" as Action },
  SYSTEM_WRITE: { resource: "system" as Resource, action: "write" as Action },
  SYSTEM_MANAGE: { resource: "system" as Resource, action: "manage" as Action },

  // Report permissions
  REPORTS_READ: { resource: "reports" as Resource, action: "read" as Action },
  REPORTS_EXPORT: {
    resource: "reports" as Resource,
    action: "export" as Action,
  },
  REPORTS_MANAGE: {
    resource: "reports" as Resource,
    action: "manage" as Action,
  },
} as const;

// ===== UTILITY TYPES =====

/**
 * Type guard để kiểm tra resource hợp lệ
 */
export function isValidResource(value: string): value is Resource {
  return [
    "users",
    "products",
    "customers",
    "invoices",
    "payments",
    "system",
    "reports",
  ].includes(value);
}

/**
 * Type guard để kiểm tra action hợp lệ
 */
export function isValidAction(value: string): value is Action {
  return ["read", "write", "delete", "export", "manage"].includes(value);
}

/**
 * Utility type để tạo permission key
 */
export type PermissionKey = `${Resource}_${Action}`;

/**
 * Helper function để tạo permission key
 */
export function createPermissionKey(
  resource: Resource,
  action: Action
): PermissionKey {
  return `${resource}_${action}` as PermissionKey;
}
