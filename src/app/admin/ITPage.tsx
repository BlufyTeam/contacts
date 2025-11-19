"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import ITDocumentsTab from "../_components/it/ITDocumentsTab";
import FinanceTab from "../_components/it/ExpenseTab";

export default function ITAdminTabsPage() {
  const [activeTab, setActiveTab] = useState("it");

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-3xl font-bold">Admin Panel</h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="it">IT Documents</TabsTrigger>
          <TabsTrigger value="finance">Expense</TabsTrigger>
        </TabsList>

        <TabsContent value="it">
          <ITDocumentsTab />
        </TabsContent>

        <TabsContent value="finance">
          <FinanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
