// src/app/admin/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ContactsPage from "./ContactsPage";
import AdminNavBar from "../_components/AdminNavBar";
import UsersPage from "./UserPage";
import OrganizationsPage from "./OrganizationPage";
import RolesPage from "./RolesPage";
import ITDocumentsAdminPage from "./ITPage";
import type { TabName } from "../Utils/Types";

// Storage key
const ACTIVE_TAB_KEY = "admin-active-tab";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabName>("Contacts");
  const [availableTabs, setAvailableTabs] = useState<TabName[]>([]);

  // Redirect unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Determine available tabs
  useEffect(() => {
    if (!session?.user) return;

    let tabs: TabName[] = [];
    if (session.user.role === "ADMIN") {
      tabs = ["Contacts", "IT", "Users", "Organizations", "Roles"];
    } else {
      const permissions = session.user.permissions || [];
      if (permissions.includes("contacts")) tabs.push("Contacts");
      if (permissions.includes("users")) tabs.push("Users");
      if (permissions.includes("organizations")) tabs.push("Organizations");
      if (permissions.includes("IT")) tabs.push("IT");
    }

    setAvailableTabs(tabs);
  }, [session]);

  // Restore activeTab from: URL → localStorage → default
  useEffect(() => {
    if (availableTabs.length === 0) return;

    const urlTab = searchParams.get("tab") as TabName | null;
    const storedTab = localStorage.getItem(ACTIVE_TAB_KEY) as TabName | null;

    let initialTab: TabName | null = null;

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

    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set("tab", activeTab);
    router.replace(`/admin?${params.toString()}`, { scroll: false });

    // Update localStorage
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab, availableTabs, router, searchParams]);

  // Tab change handler
  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
  };

  // Render content
  function renderContent() {
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
  }

  if (status === "loading") return <div className="p-4">Loading...</div>;
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
