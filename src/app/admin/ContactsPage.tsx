"use client";

import React, { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";

type Contact = {
  id: string;
  fullName: string;
  fullnameEn?: string | null;
  email: string;
  extension: string;
  organizationId: string;
  organization?: { id: string; name: string };
  gender?: string | null;
  title?: string | null;
  titleEn?: string | null;
  personalCode?: string | null;
  BC?: string | null;
  BCEn?: string | null;
  edu?: string | null;
  major?: string | null;
  phone?: string | null;
  mobile?: string | null;
  hiredDate?: string | null;
  father?: string | null;
  birthShamsi?: string | null;
  birthMiladi?: string | null;
  birthLoc?: string | null;
  marriage?: string | null;
  childrenNum?: string | null;
  codeMeli?: string | null;
  shenasname?: string | null;
  shenasnameSerial?: string | null;
  insuranceNum?: string | null;
  insuranceCode?: string | null;
  insuranceTitle?: string | null;
  passport?: string | null;
  passportExpire?: string | null;
  SOS?: string | null;
  personalMail?: string | null;
};

// Mapping of database field names to user-friendly labels
const fieldLabels: Record<string, string> = {
  fullName: "Full Name",
  fullnameEn: "Full Name (English)",
  email: "Email",
  extension: "Extension",
  organizationId: "Organization",
  gender: "Gender",
  title: "Title",
  titleEn: "Title (English)",
  personalCode: "Personal Code",
  BC: "Business Card",
  BCEn: "Business Card (English)",
  edu: "Education",
  major: "Major",
  phone: "Phone",
  mobile: "Mobile",
  hiredDate: "Hired Date",
  father: "Father's Name",
  birthShamsi: "Birth Date (Shamsi)",
  birthMiladi: "Birth Date (Miladi)",
  birthLoc: "Birth Location",
  marriage: "Marital Status",
  childrenNum: "Number of Children",
  codeMeli: "National Code",
  shenasname: "birth certificate",
  shenasnameSerial: "birth certificate Serial",
  insuranceNum: "Insurance Number",
  insuranceCode: "Insurance Code",
  insuranceTitle: "Insurance Title",
  passport: "Passport Number",
  passportExpire: "Passport Expiry",
  SOS: "SOS",
  personalMail: "Personal Email",
};

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<{
    field:
      | "fullName"
      | "email"
      | "extension"
      | "organization"
      | "phone"
      | "mobile";
    direction: "asc" | "desc";
  }>({ field: "fullName", direction: "asc" });
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: organizations } = api.organization.getAll.useQuery();
  const { data: contacts, isLoading, error } = api.contacts.getAll.useQuery();

  const utils = api.useContext();
  const createMutation = api.contacts.create.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
      setShowDialog(false);
    },
  });
  const updateMutation = api.contacts.update.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
      setEditingContact(null);
      setShowDialog(false);
    },
  });
  const deleteMutation = api.contacts.delete.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
    },
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    const lowerSearch = search.toLowerCase();
    return contacts
      .filter((c) =>
        Object.entries(c).some(([key, val]) => {
          if (val === null || val === undefined) return false;
          if (key === "organization" && val) {
            return (val as { name: string }).name
              .toLowerCase()
              .includes(lowerSearch);
          }
          if (typeof val === "object") return false;
          return String(val).toLowerCase().includes(lowerSearch);
        }),
      )
      .sort((a, b) => {
        let aValue: string, bValue: string;
        if (sortBy.field === "organization") {
          aValue = a.organization?.name ?? "";
          bValue = b.organization?.name ?? "";
        } else {
          aValue = (a[sortBy.field] ?? "") as string;
          bValue = (b[sortBy.field] ?? "") as string;
        }
        return sortBy.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
  }, [contacts, search, sortBy]);

  function handleSort(
    field:
      | "fullName"
      | "email"
      | "extension"
      | "organization"
      | "phone"
      | "mobile",
  ) {
    setSortBy((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const base = {
      fullName: formData.get("fullName") as string,
      fullnameEn: formData.get("fullnameEn") as string,
      email: formData.get("email") as string,
      extension: formData.get("extension") as string,
      organizationId: formData.get("organizationId") as string,
    };

    const extras: Record<string, string | null> = {};
    [
      "gender",
      "title",
      "titleEn",
      "personalCode",
      "BC",
      "BCEn",
      "edu",
      "major",
      "phone",
      "mobile",
      "hiredDate",
      "father",
      "birthShamsi",
      "birthMiladi",
      "birthLoc",
      "marriage",
      "childrenNum",
      "codeMeli",
      "shenasname",
      "shenasnameSerial",
      "insuranceNum",
      "insuranceCode",
      "insuranceTitle",
      "passport",
      "passportExpire",
      "SOS",
      "personalMail",
    ].forEach((field) => {
      extras[field] = (formData.get(field) as string) || "";
    });

    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, ...base, ...extras });
    } else {
      createMutation.mutate({ ...base, ...extras });
    }
  }

  function exportContacts() {
    window.location.href = "/api/export-contacts";
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex justify-between">
        <div className="space-x-2">
          <button
            onClick={() => {
              setEditingContact(null);
              setShowDialog(true);
            }}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Contact
          </button>
          <button
            onClick={exportContacts}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Export to Excel
          </button>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search all fields..."
            className="rounded border px-2 py-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <p>Loading contacts...</p>
      ) : error ? (
        <p className="text-red-500">Failed to load contacts.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                onClick={() => handleSort("fullName")}
              >
                Full Name{" "}
                {sortBy.field === "fullName" &&
                  (sortBy.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                onClick={() => handleSort("email")}
              >
                Email{" "}
                {sortBy.field === "email" &&
                  (sortBy.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                onClick={() => handleSort("extension")}
              >
                Extension{" "}
                {sortBy.field === "extension" &&
                  (sortBy.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                onClick={() => handleSort("organization")}
              >
                Organization{" "}
                {sortBy.field === "organization" &&
                  (sortBy.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                onClick={() => handleSort("phone")}
              >
                Phone{" "}
                {sortBy.field === "phone" &&
                  (sortBy.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                onClick={() => handleSort("mobile")}
              >
                Mobile{" "}
                {sortBy.field === "mobile" &&
                  (sortBy.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <React.Fragment key={contact.id}>
                <tr className="hover:bg-gray-100">
                  <td className="border p-2">{contact.fullName}</td>
                  <td className="border p-2">{contact.email}</td>
                  <td className="border p-2">{contact.extension}</td>
                  <td className="border p-2">
                    {contact.organization?.name ?? "—"}
                  </td>
                  <td className="border p-2">{contact.phone ?? "—"}</td>
                  <td className="border p-2">{contact.mobile ?? "—"}</td>
                  <td className="space-x-2 border p-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingContact(contact);
                        setShowDialog(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this contact?")) {
                          deleteMutation.mutate({ id: contact.id });
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(
                          expanded === contact.id ? null : contact.id,
                        );
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {expanded === contact.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </td>
                </tr>

                {expanded === contact.id && (
                  <tr>
                    <td colSpan={7} className="border bg-gray-50 p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(contact).map(([key, val]) => {
                          if (
                            ["id", "organization", "organizationId"].includes(
                              key,
                            )
                          )
                            return null;
                          return (
                            <div key={key}>
                              <strong>{fieldLabels[key] || key}:</strong>{" "}
                              {val instanceof Date
                                ? val.toLocaleDateString()
                                : typeof val === "object" && val !== null
                                  ? ((val as any).name ?? JSON.stringify(val))
                                  : (val ?? "—")}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      {showDialog && (
        <div
          className="bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="max-h-[90vh] w-[600px] overflow-y-auto rounded bg-white p-6 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold">
              {editingContact ? "Edit Contact" : "Add Contact"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 pb-20">
              {[
                "fullName",
                "fullnameEn",
                "email",
                "extension",
                "organizationId",
                "gender",
                "title",
                "titleEn",
                "personalCode",
                "BC",
                "BCEn",
                "edu",
                "major",
                "phone",
                "mobile",
                "hiredDate",
                "father",
                "birthShamsi",
                "birthMiladi",
                "birthLoc",
                "marriage",
                "childrenNum",
                "codeMeli",
                "shenasname",
                "shenasnameSerial",
                "insuranceNum",
                "insuranceCode",
                "insuranceTitle",
                "passport",
                "passportExpire",
                "SOS",
                "personalMail",
              ].map((field) => (
                <label key={field} className="block">
                  {fieldLabels[field] || field}
                  {field === "organizationId" ? (
                    <select
                      name="organizationId"
                      defaultValue={editingContact?.organizationId ?? ""}
                      className="mt-1 w-full rounded border px-2 py-1"
                      required
                    >
                      <option value="">Select organization</option>
                      {organizations?.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field}
                      type="text"
                      defaultValue={(editingContact as any)?.[field] ?? ""}
                      className="mt-1 w-full rounded border px-2 py-1"
                    />
                  )}
                </label>
              ))}

              <div className="fixed right-6 bottom-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-white"
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
                  {editingContact ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
