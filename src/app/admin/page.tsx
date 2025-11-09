"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ContactsPage from "./ContactsPage";
import AdminNavBar from "../_components/AdminNavBar";
import UsersPage from "./UserPage";
import OrganizationsPage from "./OrganizationPage";
import RolesPage from "./RolesPage"; // import the new Roles tab
import type { TabName } from "../Utils/Types";
// Include "Roles" in TabName

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabName>("Contacts");
  const [availableTabs, setAvailableTabs] = useState<TabName[]>([]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Determine accessible tabs based on role/permissions
  useEffect(() => {
    if (!session?.user) return;

    let tabs: TabName[] = [];

    if (session.user.role === "ADMIN") {
      // Admin gets all tabs including Roles
      tabs = ["Contacts", "Users", "Organizations", "Roles"];
    } else {
      const permissions = session.user.permissions || [];
      if (permissions.includes("contacts")) tabs.push("Contacts");
      if (permissions.includes("users")) tabs.push("Users");
      if (permissions.includes("organizations")) tabs.push("Organizations");
    }

    setAvailableTabs(tabs);

    if (tabs.length > 0) setActiveTab(tabs[0]!); // safe non-null
  }, [session]);

  // Render content based on active tab
  function renderContent() {
    switch (activeTab) {
      case "Contacts":
        return <ContactsPage />;
      case "Users":
        return <UsersPage />;
      case "Organizations":
        return <OrganizationsPage />;
      case "Roles":
        return <RolesPage />; // render RolesPage only for Admin
      default:
        return null;
    }
  }

  if (status === "loading") return <div>Loading...</div>;

  if (!availableTabs.length) {
    return <div className="p-4 text-gray-500">You don’t have access here.</div>;
  }

  return (
    <div>
      <AdminNavBar
        activeTab={activeTab}
        availableTabs={availableTabs}
        onTabChange={setActiveTab}
      />
      <main className="p-4">{renderContent()}</main>
    </div>
  );
}
