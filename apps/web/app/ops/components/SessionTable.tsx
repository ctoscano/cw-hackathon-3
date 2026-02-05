"use client";

import type { SessionSummary } from "@/lib/redis/ops";
import { Button } from "@heroui/react";
import Link from "next/link";

interface SessionTableProps {
  sessions: SessionSummary[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sessionType: "intake" | "dap";
}

export default function SessionTable({
  sessions,
  page,
  totalPages,
  onPageChange,
  sessionType,
}: SessionTableProps) {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_2fr_1fr] gap-4 px-6 py-3 bg-gray-100 rounded-lg font-bold text-sm text-gray-900 border-2 border-gray-200">
        <div>Session ID</div>
        <div>Created</div>
        <div>Status</div>
        <div>Contact</div>
        <div>Type</div>
      </div>

      {/* Session Rows */}
      <div className="space-y-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/ops/${sessionType}/${session.id}`}
            className="block bg-white border-2 border-gray-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all"
          >
            <div className="grid grid-cols-[2fr_1.5fr_1fr_2fr_1fr] gap-4 px-6 py-4 items-center">
              {/* Session ID */}
              <div>
                <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded border border-border font-semibold">
                  {session.id.slice(0, 12)}
                </code>
              </div>

              {/* Created */}
              <div className="text-sm font-medium">
                {new Date(session.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              {/* Status */}
              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    session.status === "complete"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {session.status === "complete" ? "Complete" : "In Progress"}
                </span>
              </div>

              {/* Contact */}
              <div>
                {session.email ? (
                  <span className="text-sm font-medium">{session.email}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Type */}
              <div>
                <span className="inline-flex items-center px-2 py-1 rounded border-2 border-border text-xs font-bold">
                  {session.type.toUpperCase()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
          <p className="text-sm font-bold text-gray-900">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => onPageChange(page - 1)}
              isDisabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => onPageChange(page + 1)}
              isDisabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
