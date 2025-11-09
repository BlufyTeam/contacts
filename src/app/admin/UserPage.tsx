"use client";

import React, { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Pencil, Trash2 } from "lucide-react";

type RoleWithPermissions = {
  id: string;
  name: string;
  description: string | null;
  permissions: { id: string; name: string; description: string | null }[];
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
  organizationId: string | null;
  organization?: { id: string; name: string } | null;
  role?: RoleWithPermissions | null;
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email">("name");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: organizations } = api.organization.getAll.useQuery();
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = api.user.getAll.useQuery();
  const { data: roles, isLoading: rolesLoading } = api.role.getAll.useQuery();

  const utils = api.useContext();

  const createMutation = api.user.create.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      setShowDialog(false);
    },
  });

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      setEditingUser(null);
      setShowDialog(false);
    },
  });

  const deleteMutation = api.user.delete.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
    },
  });

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter(
        (u) =>
          (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (u.email ?? "").toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => (a[sortBy] ?? "").localeCompare(b[sortBy] ?? ""));
  }, [users, search, sortBy]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = (formData.get("password") as string) || "";
    const organizationIdRaw = formData.get("organizationId") as string;
    const organizationId = organizationIdRaw || null;
    const roleId = formData.get("roleId") as string;

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        name,
        email,
        organizationId,
        roleId,
        ...(password ? { password } : {}), // only update password if entered
      });
    } else {
      createMutation.mutate({
        name,
        email,
        organizationId,
        roleId,
        password, // required when creating
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Top Controls */}
      <div className="mb-4 flex justify-between">
        <button
          onClick={() => {
            setEditingUser(null);
            setShowDialog(true);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add User
        </button>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search..."
            className="rounded border px-2 py-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "email")}
            className="rounded border px-2 py-1"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {usersLoading ? (
        <p>Loading users...</p>
      ) : usersError ? (
        <p className="text-red-500">Failed to load users.</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left">Full Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Role</th>
              <th className="border p-2 text-left">Organization</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-100">
                <td className="border p-2">{user.name ?? "—"}</td>
                <td className="border p-2">{user.email ?? "—"}</td>
                <td className="border p-2">{user.role?.name ?? "USER"}</td>
                <td className="border p-2">{user.organization?.name ?? "—"}</td>
                <td className="space-x-2 border p-2 text-center">
                  <button
                    onClick={() => {
                      setEditingUser(user);
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
                        confirm("Are you sure you want to delete this user?")
                      ) {
                        deleteMutation.mutate({ id: user.id });
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
              {editingUser ? "Edit User" : "Add User"}
            </h2>
            <form onSubmit={handleSubmit}>
              <label className="mb-2 block">
                Full Name
                <input
                  name="name"
                  type="text"
                  defaultValue={editingUser?.name ?? ""}
                  className="mt-1 w-full rounded border px-2 py-1"
                  required
                />
              </label>

              <label className="mb-2 block">
                Email
                <input
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email ?? ""}
                  className="mt-1 w-full rounded border px-2 py-1"
                  required
                />
              </label>

              <label className="mb-2 block">
                Password
                <input
                  name="password"
                  type="password"
                  placeholder={
                    editingUser ? "Leave blank to keep current password" : ""
                  }
                  className="mt-1 w-full rounded border px-2 py-1"
                  {...(!editingUser && { required: true })}
                />
              </label>

              <label className="mb-2 block">
                Role
                <select
                  name="roleId"
                  defaultValue={editingUser?.role?.id ?? ""}
                  className="mt-1 w-full rounded border px-2 py-1"
                  required
                >
                  <option value="">Select Role</option>
                  {roles?.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mb-4 block">
                Organization
                <select
                  name="organizationId"
                  defaultValue={editingUser?.organizationId ?? ""}
                  className="mt-1 w-full rounded border px-2 py-1"
                >
                  <option value="">Select organization</option>
                  {organizations?.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
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
                  {editingUser ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
