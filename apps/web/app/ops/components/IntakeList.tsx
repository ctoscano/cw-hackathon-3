"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { PaginatedResponse, SessionSummary } from "@/lib/redis/ops";
import { useEffect, useState } from "react";
import SessionTable from "./SessionTable";

interface IntakeListProps {
  page: number;
  search?: string;
  onPageChange: (page: number) => void;
}

export default function IntakeList({ page, search, onPageChange }: IntakeListProps) {
  const [data, setData] = useState<PaginatedResponse<SessionSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
        });

        if (search) {
          params.append("search", search);
        }

        const response = await fetch(`/api/ops/intake?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page, search]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive border border-destructive rounded-lg p-4">
        <p className="font-semibold">Error loading sessions</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-muted-foreground border rounded-lg p-8 text-center">
        <p>No intake sessions found</p>
        {search && <p className="text-sm mt-2">Try adjusting your search</p>}
      </div>
    );
  }

  return (
    <SessionTable
      sessions={data.items}
      page={data.page}
      totalPages={data.totalPages}
      onPageChange={onPageChange}
      sessionType="intake"
    />
  );
}
