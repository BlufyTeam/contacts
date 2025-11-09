"use client";

import React, { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Pencil, Trash2 } from "lucide-react";

type Organization = {
  id: string;
  name: string;
};

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name">("name");
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const {
    data: organizations,
    isLoading,
    error,
  } = api.organization.getAll.useQuery();

  const utils = api.useContext();
  const createMutation = api.organization.create.useMutation({
    onSuccess: () => {
      utils.organization.getAll.invalidate();
      setShowDialog(false);
    },
  });
  const updateMutation = api.organization.update.useMutation({
    onSuccess: () => {
      utils.organization.getAll.invalidate();
      setEditingOrg(null);
      setShowDialog(false);
    },
  });
  const deleteMutation = api.organization.delete.useMutation({
    onSuccess: () => {
      utils.organization.getAll.invalidate();
    },
  });

  const filteredOrgs = useMemo(() => {
    if (!organizations) return [];
    return organizations
      .filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [organizations, search]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, name });
    } else {
      createMutation.mutate({ name });
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex justify-between">
        <button
          onClick={() => {
            setEditingOrg(null);
            setShowDialog(true);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Organization
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
            onChange={(e) => setSortBy(e.target.value as "name")}
            className="rounded border px-2 py-1"
          >
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Loading organizations...</p>
      ) : error ? (
        <p className="text-red-500">Failed to load organizations.</p>
      ) : filteredOrgs.length === 0 ? (
        <p className="text-gray-500">No organizations found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left">Organization Name</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrgs.map((org) => (
              <tr key={org.id} className="hover:bg-gray-100">
                <td className="border p-2">{org.name}</td>
                <td className="space-x-2 border p-2 text-center">
                  <button
                    onClick={() => {
                      setEditingOrg({
                        id: org.id,
                        name: org.name,
                      });
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
                        confirm(
                          "Are you sure you want to delete this organization?",
                        )
                      ) {
                        deleteMutation.mutate({ id: org.id });
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

      {showDialog && (
        <div className="bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-96 rounded bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold">
              {editingOrg ? "Edit Organization" : "Add Organization"}
            </h2>
            <form onSubmit={handleSubmit}>
              <label className="mb-4 block">
                Name
                <input
                  name="name"
                  type="text"
                  defaultValue={editingOrg?.name ?? ""}
                  className="mt-1 w-full rounded border px-2 py-1"
                  required
                />
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
                  {editingOrg ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
