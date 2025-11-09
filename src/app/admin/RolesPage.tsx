"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { Pencil, Trash2 } from "lucide-react";

type Permission = {
  id: string;
  name: string;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
};

export default function RolesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch all roles and permissions
  const { data: roles, isLoading: rolesLoading } = api.role.getAll.useQuery();
  const { data: permissions } = api.permission.getAll.useQuery();

  const utils = api.useContext();

  const createMutation = api.role.create.useMutation({
    onSuccess: () => {
      utils.role.getAll.invalidate();
      setShowDialog(false);
      setSelectedPermissions([]);
      setEditingRole(null);
    },
  });

  const updateMutation = api.role.update.useMutation({
    onSuccess: () => {
      utils.role.getAll.invalidate();
      setShowDialog(false);
      setSelectedPermissions([]);
      setEditingRole(null);
    },
  });

  const deleteMutation = api.role.delete.useMutation({
    onSuccess: () => {
      utils.role.getAll.invalidate();
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;

    if (editingRole) {
      updateMutation.mutate({
        id: editingRole.id,
        name,
        description,
        permissionIds: selectedPermissions,
      });
    } else {
      createMutation.mutate({
        name,
        description,
        permissionIds: selectedPermissions,
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex justify-between">
        <button
          onClick={() => {
            setEditingRole(null);
            setSelectedPermissions([]);
            setShowDialog(true);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Role
        </button>
      </div>

      {rolesLoading ? (
        <p>Loading roles...</p>
      ) : !roles || roles.length === 0 ? (
        <p className="text-gray-500">No roles found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left">Role Name</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Permissions</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-100">
                <td className="border p-2">{role.name}</td>
                <td className="border p-2">{role.description ?? "—"}</td>
                <td className="border p-2">
                  {role.permissions.map((p) => p.name).join(", ")}
                </td>
                <td className="space-x-2 border p-2 text-center">
                  <button
                    onClick={() => {
                      setEditingRole(role);
                      setSelectedPermissions(role.permissions.map((p) => p.id));
                      setShowDialog(true);
                    }}
                    title="Edit"
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Pencil />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this role?")
                      ) {
                        deleteMutation.mutate({ id: role.id });
                      }
                    }}
                    title="Delete"
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add/Edit Dialog */}
      {showDialog && (
        <div className="bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-96 rounded bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">
              {editingRole ? "Edit Role" : "Add Role"}
            </h2>
            <form onSubmit={handleSubmit}>
              <label className="mb-2 block">
                Name
                <input
                  name="name"
                  type="text"
                  defaultValue={editingRole?.name ?? ""}
                  className="mt-1 w-full rounded border px-2 py-1"
                  required
                />
              </label>

              <label className="mb-2 block">
                Description
                <input
                  name="description"
                  type="text"
                  defaultValue={editingRole?.description ?? ""}
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>

              <label className="mb-4 block">
                Permissions
                <div className="mt-1 max-h-48 overflow-y-auto rounded border p-2">
                  {permissions?.map((p) => (
                    <label key={p.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={p.id}
                        checked={selectedPermissions.includes(p.id)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedPermissions((prev) =>
                            prev.includes(value)
                              ? prev.filter((id) => id !== value)
                              : [...prev, value],
                          );
                        }}
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                </div>
              </label>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="rounded border border-gray-300 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingRole ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
