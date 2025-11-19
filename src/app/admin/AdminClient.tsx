// src/app/admin/AdminClient.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ContactsPage from "./ContactsPage";
import AdminNavBar from "../_components/AdminNavBar";
import UsersPage from "./UserPage";
import OrganizationsPage from "./OrganizationPage";
import RolesPage from "./RolesPage";
import ITDocumentsAdminPage from "./ITPage";
import type { TabName } from "../Utils/Types";

const ACTIVE_TAB_KEY = "admin-active-tab";

export default function AdminClient({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = use(searchParamsPromise); // This is the correct, safe way
  const { data: session, status } = useSession();
  const router = useRouter();

  const [availableTabs, setAvailableTabs] = useState<TabName[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>("Contacts");

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Determine available tabs based on role/permissions
  useEffect(() => {
    if (!session?.user) return;

    const tabs: TabName[] = [];

    if (session.user.role === "ADMIN") {
      tabs.push("Contacts", "IT", "Users", "Organizations", "Roles");
    } else {
      const permissions = session.user.permissions || [];
      if (permissions.includes("contacts")) tabs.push("Contacts");
      if (permissions.includes("users")) tabs.push("Users");
      if (permissions.includes("organizations")) tabs.push("Organizations");
      if (permissions.includes("IT")) tabs.push("IT");
    }

    setAvailableTabs(tabs);
  }, [session]);

  // Restore activeTab from URL → localStorage → default
  useEffect(() => {
    if (availableTabs.length === 0) return;

    const urlTab =
      typeof searchParams.tab === "string"
        ? (searchParams.tab as TabName)
        : null;
    const storedTab = localStorage.getItem(ACTIVE_TAB_KEY) as TabName | null;

    let initialTab: TabName;

    if (urlTab && availableTabs.includes(urlTab)) {
      initialTab = urlTab;
    } else if (storedTab && availableTabs.includes(storedTab)) {
      initialTab = storedTab;
    } else {
      initialTab = availableTabs[0]!;
    }

    setActiveTab(initialTab);
  }, [availableTabs, searchParams]);

  // Sync activeTab → URL + localStorage
  useEffect(() => {
    if (!activeTab || availableTabs.length === 0) return;

    const params = new URLSearchParams();
    params.set("tab", activeTab);

    router.replace(`/admin?${params.toString()}`, { scroll: false });
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab, availableTabs, router]);

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Contacts":
        return <ContactsPage />;
      case "Users":
        return <UsersPage />;
      case "Organizations":
        return <OrganizationsPage />;
      case "Roles":
        return <RolesPage />;
      case "IT":
        return <ITDocumentsAdminPage />;
      default:
        return null;
    }
  };

  if (status === "loading") {
    return <div className="p-4">Loading session...</div>;
  }

  if (!availableTabs.length) {
    return <div className="p-4 text-gray-500">You don’t have access here.</div>;
  }

  return (
    <div>
      <AdminNavBar
        activeTab={activeTab}
        availableTabs={availableTabs}
        onTabChange={handleTabChange}
      />
      <main className="p-4">{renderContent()}</main>
    </div>
  );
}
