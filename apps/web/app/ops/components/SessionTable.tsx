"use client";

import type { SessionSummary } from "@/lib/redis/ops";
import { Button } from "@heroui/react";

interface SessionTableProps {
  sessions: SessionSummary[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectSession: (sessionId: string) => void;
}

export default function SessionTable({
  sessions,
  page,
  totalPages,
  onPageChange,
  onSelectSession,
}: SessionTableProps) {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_2fr_1fr] gap-4 px-6 py-3 bg-anthropic-light-gray rounded-lg font-heading font-semibold text-sm text-anthropic-dark border border-anthropic-mid-gray/30">
        <div>Session ID</div>
        <div>Created</div>
        <div>Status</div>
        <div>Contact</div>
        <div>Type</div>
      </div>

      {/* Session Rows */}
      <div className="space-y-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            type="button"
            className="w-full text-left bg-white border border-anthropic-mid-gray/20 rounded-lg hover:border-anthropic-orange hover:shadow-lg transition-all"
          >
            <div className="grid grid-cols-[2fr_1.5fr_1fr_2fr_1fr] gap-4 px-6 py-4 items-center">
              {/* Session ID */}
              <div>
                <code className="text-sm font-mono bg-anthropic-light-gray px-3 py-1.5 rounded border border-anthropic-mid-gray/30 font-semibold text-anthropic-dark">
                  {session.id.slice(0, 12)}
                </code>
              </div>

              {/* Created */}
              <div className="text-sm font-body text-anthropic-dark">
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
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-semibold ${
                    session.status === "complete"
                      ? "bg-anthropic-green/20 text-anthropic-green border border-anthropic-green/30"
                      : "bg-anthropic-blue/20 text-anthropic-blue border border-anthropic-blue/30"
                  }`}
                >
                  {session.status === "complete" ? "Complete" : "In Progress"}
                </span>
              </div>

              {/* Contact */}
              <div>
                {session.email ? (
                  <span className="text-sm font-body text-anthropic-dark">{session.email}</span>
                ) : (
                  <span className="text-sm text-anthropic-mid-gray">—</span>
                )}
              </div>

              {/* Type */}
              <div>
                <span className="inline-flex items-center px-2 py-1 rounded border border-anthropic-mid-gray/30 text-xs font-heading font-bold text-anthropic-dark">
                  {session.type.toUpperCase()}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-anthropic-light-gray border border-anthropic-mid-gray/30 rounded-lg">
          <p className="text-sm font-heading font-semibold text-anthropic-dark">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => onPageChange(page - 1)}
              isDisabled={page === 1}
              className="font-heading"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => onPageChange(page + 1)}
              isDisabled={page === totalPages}
              className="font-heading"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
