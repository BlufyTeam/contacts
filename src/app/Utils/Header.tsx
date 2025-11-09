"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DynamicTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      const title =
        pathname === "/" ? "Contacts" : pathname.replace(/\//g, " ").trim();
      document.title = title.charAt(0).toUpperCase() + title.slice(1);
    }
  }, [pathname]);

  return null;
}
