"use client";
import { useState, useMemo, useEffect } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  List,
  Table as TableIcon,
  FileDown,
  Plus,
  Trash2Icon,
  Languages,
  User,
  LogOut,
  Settings,
  ArrowUp,
  ArrowDown,
  Network,
} from "lucide-react";
import Image from "next/image";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import useContactExtras from "./Utils/useContactExtras";
import type { ContactExtrasApi } from "./Utils/useContactExtras";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

type Contact = {
  id: string;
  fullName: string;
  fullnameEn?: string | null;
  extension: string | null;
  email: string | null;
  organization: {
    id: string;
    name: string;
  } | null;
};

type ViewMode = "card" | "table" | "list";

function ContactExtras({
  contactId,
  api,
  language,
}: {
  contactId: string;
  api: ContactExtrasApi;
  language: "EN" | "FA";
}) {
  const extras = api.get(contactId);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddExtra = () => {
    const key = newKey.trim();
    if (!key) return;
    api.setField(contactId, key, newValue);
    setNewKey("");
    setNewValue("");
    setIsDialogOpen(false);
  };

  return (
    <div className="mt-2">
      {Object.keys(extras).length > 0 ? (
        <div className="space-y-1">
          {Object.entries(extras).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-sm font-medium">{k}:</span>
              <input
                className="rounded border px-2 py-1 text-sm"
                value={v}
                onChange={(e) => api.setField(contactId, k, e.target.value)}
                placeholder="value"
              />
              <button
                onClick={() => api.removeField(contactId, k)}
                className="text-sm text-red-500"
                aria-label={`Delete ${k}`}
              >
                <Trash2Icon size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {language === "FA" ? "هیچ فیلدی وجود ندارد" : "No extra fields"}
        </p>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="mt-2">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "FA" ? "افزودن فیلد اضافی" : "Add Extra Field"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={
                language === "FA"
                  ? "نام فیلد (مثل تلفن)"
                  : "Field name (e.g. Phone)"
              }
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <Input
              placeholder={language === "FA" ? "مقدار" : "Value"}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <Button onClick={handleAddExtra} disabled={!newKey.trim()}>
              {language === "FA" ? "افزودن" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ContactsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const LANGUAGE_KEY = "contacts_language_v1";
  const [language, setLanguage] = useState<"EN" | "FA">("EN");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Contact | "organization">(
    "organization",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterOrgId, setFilterOrgId] = useState<string>("");
  const extrasApi = useContactExtras();
  const { data: contacts, isLoading, error } = api.contacts.getAll.useQuery();
  const { data: organizations } = api.organization.getAll.useQuery();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved === "FA" || saved === "EN") {
        setLanguage(saved);
      }
    } catch (e) {
      console.error("Failed to load language from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }
  }, [language]);

  const handleSort = (field: keyof Contact | "organization") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Contact | "organization") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  const sortedAndFilteredContacts = useMemo(() => {
    if (!contacts) return [];
    const filtered = contacts.filter((contact) => {
      const nameToSearch =
        language === "FA"
          ? contact.fullName?.toLowerCase()
          : contact.fullnameEn?.toLowerCase();
      const matchesSearch =
        (nameToSearch ?? "").includes(search.toLowerCase()) ||
        (contact.extension ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (contact.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesOrg =
        filterOrgId === "" ||
        (filterOrgId === "no_org" && !contact.organization) ||
        contact.organization?.id === filterOrgId;
      return matchesSearch && matchesOrg;
    });

    return [...filtered].sort((a, b) => {
      let aVal: string | null = "";
      let bVal: string | null = "";
      switch (sortField) {
        case "fullName":
          aVal = language === "FA" ? a.fullName : (a.fullnameEn ?? a.fullName);
          bVal = language === "FA" ? b.fullName : (b.fullnameEn ?? b.fullName);
          break;
        case "extension":
          aVal = a.extension ?? "";
          bVal = b.extension ?? "";
          break;
        case "email":
          aVal = a.email ?? "";
          bVal = b.email ?? "";
          break;
        case "organization":
          aVal =
            a.organization?.name ??
            (language === "FA" ? "بدون سازمان" : "No Organization");
          bVal =
            b.organization?.name ??
            (language === "FA" ? "بدون سازمان" : "No Organization");
          break;
      }
      if (!aVal || !bVal) return 0;
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [contacts, search, filterOrgId, language, sortField, sortDirection]);

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};

    if (sortedAndFilteredContacts.length === 0) {
      // Always show one empty section instead of breaking UI
      groups[language === "FA" ? "بدون نتیجه" : "No Results"] = [];
      return groups;
    }

    sortedAndFilteredContacts.forEach((contact) => {
      const orgName =
        contact.organization?.name ??
        (language === "FA" ? "بدون سازمان" : "No Organization");

      if (!groups[orgName]) groups[orgName] = [];
      groups[orgName].push(contact);
    });

    return groups;
  }, [sortedAndFilteredContacts, language]);

  function exportContacts() {
    window.location.href = "/api/export-contacts";
  }

  if (error) return <p className="text-red-500">Failed to load contacts.</p>;

  const dir = language === "FA" ? "rtl" : "ltr";

  return (
    <div
      className="mx-auto max-w-6xl space-y-6"
      dir={dir}
      style={{
        textAlign: language === "FA" ? "right" : "left",
        fontFamily: language === "FA" ? "iranSans, sans-serif" : "inherit",
      }}
    >
      {/* === AUTH SECTION === */}
      <div className="flex justify-end pt-2">
        <div className="w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="cursor-pointer">
                <Link href={"/it"}>
                  <div className="flex">
                    <Network className="mr-2"></Network> IT
                  </div>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>IT</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {status === "loading" ? (
          <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        ) : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {session.user?.name || session.user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                {language === "FA" ? "پنل مدیریت" : "Admin Panel"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {language === "FA" ? "خروج" : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              {language === "FA" ? "ورود" : "Login"}
            </Button>
          </Link>
        )}
      </div>

      {/* Logo */}
      <div className="flex justify-center">
        <Image
          src="/logo.png"
          alt="Company Logo"
          width={250}
          height={100}
          priority
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(val) => val && setViewMode(val as ViewMode)}
            className="max-w-[150px] flex-grow"
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            onClick={() => setLanguage((prev) => (prev === "EN" ? "FA" : "EN"))}
            title="Switch Language"
          >
            <Languages className="mr-2 h-4 w-4" />
            {language === "EN" ? "FA" : "EN"}
          </Button>
        </div>
        <input
          type="text"
          placeholder={
            language === "FA"
              ? "جستجو بر اساس نام، ایمیل یا داخلی..."
              : "Search by name, extension, or email..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs flex-grow rounded border px-3 py-1"
        />
        <select
          value={filterOrgId}
          onChange={(e) => setFilterOrgId(e.target.value)}
          className="rounded border px-3 py-1"
        >
          <option value="">
            {language === "FA"
              ? "فیلتر بر اساس سازمان (همه)"
              : "Filter by Organization (All)"}
          </option>
          {organizations?.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
          <option value="no_org">
            {language === "FA" ? "بدون سازمان" : "No Organization"}
          </option>
        </select>
        <Button onClick={exportContacts}>
          <FileDown />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Lottie animationData={loading} loop autoplay className="h-40 w-40" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Card Mode */}
          {viewMode === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {Object.entries(groupedContacts).map(([org, members]) => (
                <div key={org}>
                  <h2 className="text-primary mb-3 text-xl font-semibold">
                    {org}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {members.map((member) => (
                      <Card
                        key={member.id}
                        className="border shadow transition hover:shadow-md"
                      >
                        <CardContent className="p-4">
                          <h3 className="text-primary text-lg font-semibold">
                            {language === "FA"
                              ? member.fullName
                              : (member.fullnameEn ?? member.fullName)}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Ext: {member.extension ?? "—"}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {member.email ?? "—"}
                          </p>
                          <ContactExtras
                            contactId={member.id}
                            api={extrasApi}
                            language={language}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Table Mode - Sortable */}
          {viewMode === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                      onClick={() => handleSort("organization")}
                    >
                      <div className="flex items-center">
                        {language === "FA" ? "سازمان" : "Organization"}
                        {getSortIcon("organization")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                      onClick={() => handleSort("fullName")}
                    >
                      <div className="flex items-center">
                        {language === "FA" ? "نام کامل" : "Full Name"}
                        {getSortIcon("fullName")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                      onClick={() => handleSort("extension")}
                    >
                      <div className="flex items-center">
                        {language === "FA" ? "داخلی" : "Extension"}
                        {getSortIcon("extension")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer border p-2 text-left hover:bg-gray-100"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        {language === "FA" ? "ایمیل" : "Email"}
                        {getSortIcon("email")}
                      </div>
                    </th>
                    <th className="border p-2 text-left">
                      {language === "FA" ? "اضافی" : "Extras"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedContacts).flatMap(([org, members]) =>
                    members.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-gray-100">
                        <td className="border p-2">
                          {idx === 0 ? (
                            <span className="text-primary font-semibold">
                              {org}
                            </span>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="border p-2">
                          {language === "FA"
                            ? member.fullName
                            : (member.fullnameEn ?? member.fullName)}
                        </td>
                        <td className="border p-2">
                          {member.extension ?? "—"}
                        </td>
                        <td className="border p-2">{member.email ?? "—"}</td>
                        <td className="border p-2">
                          <ContactExtras
                            contactId={member.id}
                            api={extrasApi}
                            language={language}
                          />
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* List Mode */}
          {viewMode === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {Object.entries(groupedContacts).map(([org, members]) => (
                <div key={org}>
                  <h2 className="text-primary mb-3 text-xl font-semibold">
                    {org}
                  </h2>
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="hover:bg-muted/50 rounded border p-3 transition"
                      >
                        <p className="text-primary font-medium">
                          {language === "FA"
                            ? member.fullName
                            : (member.fullnameEn ?? member.fullName)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Ext. {member.extension ?? "—"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {member.email ?? "—"}
                        </p>
                        <ContactExtras
                          contactId={member.id}
                          api={extrasApi}
                          language={language}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
