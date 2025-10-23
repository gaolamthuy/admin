/**
 * Role Management Component
 * Component để quản lý roles và permissions
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type {
  Role,
  Permission,
  CreateRoleForm,
  UpdateRoleForm,
} from "../../types/permissions";

// ===== ROLE MANAGEMENT PROPS =====

interface RoleManagementProps {
  onRoleCreated?: (role: Role) => void;
  onRoleUpdated?: (role: Role) => void;
  onRoleDeleted?: (roleId: string) => void;
}

// ===== ROLE MANAGEMENT COMPONENT =====

/**
 * Component quản lý roles và permissions
 * Chỉ admin mới có thể sử dụng component này
 */
export const RoleManagement: React.FC<RoleManagementProps> = ({
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Fetch roles và permissions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("glt_roles")
        .select("*")
        .order("name");

      if (rolesError) throw rolesError;

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("glt_permissions")
        .select("*")
        .order("resource", { ascending: true });

      if (permissionsError) throw permissionsError;

      setRoles(rolesData || []);
      setPermissions(permissionsData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create role
  const handleCreateRole = async (formData: CreateRoleForm) => {
    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from("glt_roles")
        .insert({
          name: formData.name,
          description: formData.description,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Assign permissions to role
      if (formData.permissions.length > 0) {
        const rolePermissions = formData.permissions.map((permissionId) => ({
          role_id: data.id,
          permission_id: permissionId,
        }));

        const { error: permissionsError } = await supabase
          .from("glt_role_permissions")
          .insert(rolePermissions);

        if (permissionsError) throw permissionsError;
      }

      setRoles((prev) => [...prev, data]);
      setShowCreateForm(false);
      onRoleCreated?.(data);
    } catch (err) {
      console.error("Error creating role:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Update role
  const handleUpdateRole = async (roleId: string, formData: UpdateRoleForm) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from("glt_roles")
        .update({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", roleId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update role permissions if provided
      if (formData.permissions) {
        // Delete existing permissions
        await supabase
          .from("glt_role_permissions")
          .delete()
          .eq("role_id", roleId);

        // Insert new permissions
        if (formData.permissions.length > 0) {
          const rolePermissions = formData.permissions.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          }));

          const { error: permissionsError } = await supabase
            .from("glt_role_permissions")
            .insert(rolePermissions);

          if (permissionsError) throw permissionsError;
        }
      }

      setRoles((prev) =>
        prev.map((role) => (role.id === roleId ? data : role))
      );
      setEditingRole(null);
      onRoleUpdated?.(data);
    } catch (err) {
      console.error("Error updating role:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Delete role
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa role này?")) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("glt_roles")
        .delete()
        .eq("id", roleId);

      if (deleteError) throw deleteError;

      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      onRoleDeleted?.(roleId);
    } catch (err) {
      console.error("Error deleting role:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={fetchData}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Roles</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Tạo Role Mới
        </button>
      </div>

      {/* Create Role Form */}
      {showCreateForm && (
        <CreateRoleForm
          permissions={permissions}
          onSubmit={handleCreateRole}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Role Form */}
      {editingRole && (
        <EditRoleForm
          role={editingRole}
          permissions={permissions}
          onSubmit={(formData) => handleUpdateRole(editingRole.id, formData)}
          onCancel={() => setEditingRole(null)}
        />
      )}

      {/* Roles List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {roles.map((role) => (
            <li key={role.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {role.name}
                    </h3>
                    {!role.is_active && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {role.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingRole(role)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ===== CREATE ROLE FORM =====

interface CreateRoleFormProps {
  permissions: Permission[];
  onSubmit: (data: CreateRoleForm) => void;
  onCancel: () => void;
}

const CreateRoleForm: React.FC<CreateRoleFormProps> = ({
  permissions,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateRoleForm>({
    name: "",
    description: "",
    permissions: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permissionId]
        : (prev.permissions || []).filter((id) => id !== permissionId),
    }));
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce(
    (acc: Record<string, Permission[]>, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {}
  );

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Tạo Role Mới
        </h3>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Tên Role
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions
            </label>
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(
                ([resource, resourcePermissions]) => (
                  <div key={resource} className="border rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                      {resource}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {resourcePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.permissions || []).includes(
                              permission.id
                            )}
                            onChange={(e) =>
                              handlePermissionChange(
                                permission.id,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {permission.action}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            >
              Tạo Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== EDIT ROLE FORM =====

interface EditRoleFormProps {
  role: Role;
  permissions: Permission[];
  onSubmit: (data: UpdateRoleForm) => void;
  onCancel: () => void;
}

const EditRoleForm: React.FC<EditRoleFormProps> = ({
  role,
  permissions,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<UpdateRoleForm>({
    name: role.name,
    description: role.description,
    is_active: role.is_active,
    permissions: [],
  });

  // Load existing permissions for this role
  useEffect(() => {
    const loadRolePermissions = async () => {
      const { data } = await supabase
        .from("glt_role_permissions")
        .select("permission_id")
        .eq("role_id", role.id);

      if (data) {
        setFormData((prev) => ({
          ...prev,
          permissions: data.map(
            (rp: { permission_id: string }) => rp.permission_id
          ),
        }));
      }
    };

    loadRolePermissions();
  }, [role.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permissionId]
        : (prev.permissions || []).filter((id) => id !== permissionId),
    }));
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce(
    (acc: Record<string, Permission[]>, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {}
  );

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Chỉnh sửa Role: {role.name}
        </h3>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Tên Role
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions
            </label>
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(
                ([resource, resourcePermissions]) => (
                  <div key={resource} className="border rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                      {resource}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {resourcePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.permissions || []).includes(
                              permission.id
                            )}
                            onChange={(e) =>
                              handlePermissionChange(
                                permission.id,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {permission.action}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            >
              Cập nhật Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleManagement;
