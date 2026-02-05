"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import DAPList from "./components/DAPList";
import IntakeList from "./components/IntakeList";
import OpsHeader from "./components/OpsHeader";
import SessionDetail from "./components/SessionDetail";

// Force dynamic rendering (client-side only) since we use useQueryStates
export const dynamic = "force-dynamic";

export default function OpsPage() {
  const [{ tab, page, search, session }, setQuery] = useQueryStates({
    tab: parseAsString.withDefault("intake"),
    page: parseAsInteger.withDefault(1),
    search: parseAsString,
    session: parseAsString,
  });

  return (
    <div className="space-y-6">
      <OpsHeader
        search={search || ""}
        onSearchChange={(value) => setQuery({ search: value || null, page: 1 })}
      />

      <Tabs value={tab} onValueChange={(value) => setQuery({ tab: value, page: 1, search: null })}>
        <TabsList className="bg-muted p-1 mb-6 h-12">
          <TabsTrigger
            value="intake"
            className="px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary"
          >
            Intake Sessions
          </TabsTrigger>
          <TabsTrigger
            value="dap"
            className="px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary"
          >
            DAP Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="space-y-4">
          <IntakeList
            page={page}
            search={search || undefined}
            onPageChange={(newPage) => setQuery({ page: newPage })}
            onSelectSession={(sessionId) => setQuery({ session: sessionId })}
          />
        </TabsContent>

        <TabsContent value="dap" className="space-y-4">
          <DAPList
            page={page}
            onPageChange={(newPage) => setQuery({ page: newPage })}
            onSelectSession={(sessionId) => setQuery({ session: sessionId })}
          />
        </TabsContent>
      </Tabs>

      {session && (
        <SessionDetail
          sessionId={session}
          type={tab as "intake" | "dap"}
          onClose={() => setQuery({ session: null })}
        />
      )}
    </div>
  );
}
