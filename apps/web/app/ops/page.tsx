"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@cw-hackathon/ui";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import DAPList from "./components/DAPList";
import DashboardStats from "./components/DashboardStats";
import IntakeList from "./components/IntakeList";
import OpsHeader from "./components/OpsHeader";
import SessionDetail from "./components/SessionDetail";

// Force dynamic rendering (client-side only) since we use useQueryStates
export const dynamic = "force-dynamic";

interface StatsData {
  totalIntakeSessions: number;
  completedIntakeSessions: number;
  inProgressIntakeSessions: number;
  totalDAPSessions: number;
}

export default function OpsPage() {
  const [{ tab, page, search, session }, setQuery] = useQueryStates({
    tab: parseAsString.withDefault("intake"),
    page: parseAsInteger.withDefault(1),
    search: parseAsString,
    session: parseAsString, // Session ID for detail modal - SPA pattern
  });

  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch stats on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/ops/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleSelectSession = (sessionId: string) => {
    setQuery({ session: sessionId });
  };

  const handleCloseDetail = () => {
    setQuery({ session: null });
  };

  return (
    <div className="space-y-6">
      {/* Conditionally render: either list view OR detail view */}
      {session ? (
        // Detail View - Full page takeover
        <SessionDetail
          sessionId={session}
          sessionType={tab as "intake" | "dap"}
          onClose={handleCloseDetail}
        />
      ) : (
        // List View - Dashboard with tabs
        <>
          {/* Dashboard Stats */}
          <DashboardStats stats={stats} loading={statsLoading} />

          <OpsHeader
            search={search || ""}
            onSearchChange={(value) => setQuery({ search: value || null, page: 1 })}
          />

          <Tabs
            value={tab}
            onValueChange={(value) => setQuery({ tab: value, page: 1, search: null })}
          >
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
                onSelectSession={handleSelectSession}
              />
            </TabsContent>

            <TabsContent value="dap" className="space-y-4">
              <DAPList
                page={page}
                onPageChange={(newPage) => setQuery({ page: newPage })}
                onSelectSession={handleSelectSession}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
