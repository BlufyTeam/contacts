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
import { TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";

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
    <div className="mt-3">
      {Object.keys(extras).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(extras).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <span className="min-w-20 font-medium">{k}:</span>
              <input
                className="flex-1 rounded border px-2 py-1 text-sm"
                value={v}
                onChange={(e) => api.setField(contactId, k, e.target.value)}
              />
              <button
                onClick={() => api.removeField(contactId, k)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2Icon size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm italic">
          {language === "FA" ? "هیچ فیلد اضافی" : "No extra fields"}
        </p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-3">
            <Plus className="mr-1 h-4 w-4" />
            {language === "FA" ? "افزودن فیلد" : "Add Field"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "FA" ? "افزودن فیلد اضافی" : "Add Extra Field"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={
                language === "FA" ? "نام فیلد (مثل موبایل)" : "Field name"
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
  const { data: session, status } = useSession();
  const router = useRouter();

  // Critical: Only run query when authenticated
  const {
    data: contacts,
    isLoading,
    error,
  } = api.contacts.getAll.useQuery(undefined, {
    enabled: status === "authenticated",
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const { data: organizations } = api.organization.getAll.useQuery();

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === "FA" || saved === "EN") setLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
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
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const sortedAndFilteredContacts = useMemo(() => {
    if (!contacts) return [];

    const filtered = contacts.filter((contact) => {
      const name =
        language === "FA"
          ? contact.fullName
          : (contact.fullnameEn ?? contact.fullName);
      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        (contact.extension ?? "").includes(search) ||
        (contact.email ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesOrg =
        !filterOrgId || filterOrgId === "no_org"
          ? !contact.organization
          : contact.organization?.id === filterOrgId;

      return matchesSearch && matchesOrg;
    });

    return [...filtered].sort((a, b) => {
      let aVal: string = "";
      let bVal: string = "";

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

      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [contacts, search, filterOrgId, language, sortField, sortDirection]);

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    sortedAndFilteredContacts.forEach((c) => {
      const key =
        c.organization?.name ??
        (language === "FA" ? "بدون سازمان" : "No Organization");
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return groups;
  }, [sortedAndFilteredContacts, language]);

  const exportContacts = () => {
    window.location.href = "/api/export-contacts";
  };

  const dir = language === "FA" ? "rtl" : "ltr";

  return (
    <div
      className="mx-auto max-w-7xl space-y-8 p-4"
      dir={dir}
      style={{
        textAlign: language === "FA" ? "right" : "left",
        fontFamily: language === "FA" ? "iranSans, sans-serif" : "inherit",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline">
                <Link href="/it" className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  IT
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>IT Panel</TooltipContent>
          </Tooltip>

          {status === "loading" ? (
            <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {session.user?.name ?? session.user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {language === "FA" ? "پنل مدیریت" : "Admin Panel"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === "FA" ? "خروج" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline">
                <User className="mr-2 h-4 w-4" />
                {language === "FA" ? "ورود" : "Login"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="flex justify-center py-6">
        <Image src="/logo.png" alt="Logo" width={280} height={110} priority />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
          >
            <ToggleGroupItem value="table">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="outline"
            onClick={() => setLanguage((prev) => (prev === "EN" ? "FA" : "EN"))}
          >
            <Languages className="mr-2 h-4 w-4" />
            {language}
          </Button>
        </div>

        <Input
          placeholder={language === "FA" ? "جستجو..." : "Search..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <select
          value={filterOrgId}
          onChange={(e) => setFilterOrgId(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">
            {language === "FA" ? "همه سازمان‌ها" : "All Organizations"}
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

        <Button onClick={exportContacts} variant="outline">
          <FileDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Lottie animationData={loading} loop autoplay className="h-48 w-48" />
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <p className="text-2xl font-semibold text-red-600">
            {language === "FA" ? "خطا در بارگذاری" : "Failed to load contacts"}
          </p>
          <p className="text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-6">
            {language === "FA" ? "تلاش مجدد" : "Retry"}
          </Button>
        </div>
      ) : contacts?.length === 0 ? (
        <div className="py-20 text-center">
          <div className="bg-muted/50 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
            <User className="text-muted-foreground h-12 w-12" />
          </div>
          <p className="text-muted-foreground text-2xl font-medium">
            {language === "FA" ? "هیچ مخاطبی یافت نشد" : "No contacts found"}
          </p>
          <p className="text-muted-foreground mt-2">
            {language === "FA"
              ? "از پنل مدیریت مخاطب اضافه کنید"
              : "Add contacts from admin panel"}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Your three views here (card, table, list) */}
          {/* I'll keep them clean and correct */}
          {viewMode === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {Object.entries(groupedContacts).map(([org, members]) => (
                <div key={org}>
                  <h2 className="text-primary mb-4 text-2xl font-bold">
                    {org}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {members.map((member) => (
                      <Card
                        key={member.id}
                        className="transition-shadow hover:shadow-lg"
                      >
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold">
                            {language === "FA"
                              ? member.fullName
                              : (member.fullnameEn ?? member.fullName)}
                          </h3>
                          {member.extension && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              Ext: {member.extension}
                            </p>
                          )}
                          {member.email && (
                            <p className="text-muted-foreground text-sm">
                              {member.email}
                            </p>
                          )}
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

          {viewMode === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th
                        onClick={() => handleSort("organization")}
                        className="hover:bg-muted cursor-pointer p-4 text-left"
                      >
                        {language === "FA" ? "سازمان" : "Organization"}{" "}
                        {getSortIcon("organization")}
                      </th>
                      <th
                        onClick={() => handleSort("fullName")}
                        className="hover:bg-muted cursor-pointer p-4 text-left"
                      >
                        {language === "FA" ? "نام" : "Name"}{" "}
                        {getSortIcon("fullName")}
                      </th>
                      <th
                        onClick={() => handleSort("extension")}
                        className="hover:bg-muted cursor-pointer p-4 text-left"
                      >
                        {language === "FA" ? "داخلی" : "Ext"}{" "}
                        {getSortIcon("extension")}
                      </th>
                      <th
                        onClick={() => handleSort("email")}
                        className="hover:bg-muted cursor-pointer p-4 text-left"
                      >
                        {language === "FA" ? "ایمیل" : "Email"}{" "}
                        {getSortIcon("email")}
                      </th>
                      <th className="p-4 text-left">
                        {language === "FA" ? "اضافی" : "Extras"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedContacts).flatMap(([org, members]) =>
                      members.map((member, idx) => (
                        <tr
                          key={member.id}
                          className="hover:bg-muted/30 border-t"
                        >
                          <td className="p-4">
                            {idx === 0 && (
                              <span className="text-primary font-semibold">
                                {org}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {language === "FA"
                              ? member.fullName
                              : (member.fullnameEn ?? member.fullName)}
                          </td>
                          <td className="p-4">{member.extension || "—"}</td>
                          <td className="p-4">{member.email || "—"}</td>
                          <td className="p-4">
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
              </div>
            </motion.div>
          )}

          {viewMode === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {Object.entries(groupedContacts).map(([org, members]) => (
                <div key={org}>
                  <h2 className="text-primary mb-4 text-2xl font-bold">
                    {org}
                  </h2>
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="bg-card hover:bg-muted/50 rounded-lg border p-5 transition"
                      >
                        <p className="text-lg font-medium">
                          {language === "FA"
                            ? member.fullName
                            : (member.fullnameEn ?? member.fullName)}
                        </p>
                        <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                          {member.extension && <p>داخلی: {member.extension}</p>}
                          {member.email && <p>{member.email}</p>}
                        </div>
                        <ContactExtras
                          contactId={member.id}
                          api={extrasApi}
                          language={language}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
