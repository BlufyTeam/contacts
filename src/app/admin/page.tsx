// src/app/admin/page.tsx
import { Suspense } from "react";
import AdminClient from "./AdminClient";

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="p-4">Loading admin panel...</div>}>
      {/* Pass the Promise directly — `use()` will resolve it inside */}
      <AdminClient searchParamsPromise={searchParams} />
    </Suspense>
  );
}
