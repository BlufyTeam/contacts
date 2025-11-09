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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center justify-between bg-gray-800 p-4 text-white">
      {/* Tabs on left */}
      <div className="flex space-x-6">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange?.(tab)}
            className={`${
              activeTab === tab ? "font-bold underline" : "opacity-70"
            } hover:opacity-100`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* User info on right with dropdown */}
      <div className="relative" ref={dropdownRef}>
        {session?.user ? (
          <>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex flex-col items-end hover:cursor-pointer focus:outline-none"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <span className="font-semibold">
                {session.user.name ?? session.user.email}
              </span>
              <span className="text-xs text-gray-300">
                {session.user.role ?? "User"}
              </span>
            </button>

            {dropdownOpen && (
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
