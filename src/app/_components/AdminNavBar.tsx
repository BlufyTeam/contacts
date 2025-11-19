"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { TabName } from "../Utils/Types";

interface AdminNavBarProps {
  onTabChange?: (tab: TabName) => void;
  availableTabs: TabName[];
  activeTab: TabName;
}

export default function AdminNavBar({
  onTabChange,
  availableTabs,
  activeTab,
}: AdminNavBarProps) {
  const { data: session } = useSession();
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const userMgmtRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMgmtRef.current &&
        !userMgmtRef.current.contains(event.target as Node)
      ) {
        setUserMgmtOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tabs that belong to "User Management"
  const userManagementTabs: TabName[] = ["Users", "Organizations", "Roles"];

  // Other tabs that should stay as direct buttons
  const otherTabs = availableTabs.filter(
    (tab) => !userManagementTabs.includes(tab),
  );

  // Check if any user management tab is currently active
  const isUserManagementActive = userManagementTabs.includes(activeTab);

  return (
    <nav className="flex items-center justify-between bg-gray-800 p-4 text-white">
      {/* Left side: Home + Tabs + User Management Dropdown */}
      <div className="flex items-center space-x-6">
        <button className="cursor-pointer" onClick={() => router.push("/")}>
          Home
        </button>

        {/* Regular tabs (not in User Management) */}
        {otherTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange?.(tab)}
            className={`${
              activeTab === tab ? "font-bold underline" : "opacity-70"
            } transition hover:opacity-100`}
          >
            {tab}
          </button>
        ))}

        {/* User Management Dropdown */}
        {userManagementTabs.some((tab) => availableTabs.includes(tab)) && (
          <div className="relative" ref={userMgmtRef}>
            <button
              onClick={() => setUserMgmtOpen(!userMgmtOpen)}
              className={`flex items-center space-x-1 ${
                isUserManagementActive ? "font-bold underline" : "opacity-70"
              } transition hover:opacity-100`}
            >
              <span>User Management</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  userMgmtOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {userMgmtOpen && (
              <div className="absolute top-full z-50 mt-2 w-48 rounded bg-gray-700 shadow-lg">
                {userManagementTabs
                  .filter((tab) => availableTabs.includes(tab))
                  .map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        onTabChange?.(tab);
                        setUserMgmtOpen(false);
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-gray-600 ${
                        activeTab === tab ? "bg-gray-600 font-semibold" : ""
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: User profile dropdown */}
      <div className="relative" ref={profileRef}>
        {session?.user ? (
          <>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex flex-col items-end hover:cursor-pointer focus:outline-none"
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              <span className="font-semibold">
                {session.user.name ?? session.user.email}
              </span>
              <span className="text-xs text-gray-300">
                {session.user.role ?? "User"}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-32 rounded bg-gray-700 shadow-lg">
                <button
                  onClick={() => signOut()}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-600"
                >
                  Sign Out
                </button>
              </div>
            )}
          </>
        ) : (
          <span>Loading...</span>
        )}
      </div>
    </nav>
  );
}
