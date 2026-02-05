"use client";

import { Badge } from "@/components/ui/badge";
import { AnswerMessage, QuestionMessage, ReflectionMessage } from "@/components/ui/message-bubble";
import type { SessionData } from "@/lib/redis/intake";
import type { DAPArchiveEntry } from "@/lib/redis/ops";
import { Modal } from "@heroui/react";
import { CheckCircle, Info, MessageSquare, User } from "lucide-react";
import { useEffect, useState } from "react";

interface SessionDetailProps {
  sessionId: string;
  type: "intake" | "dap";
  onClose: () => void;
}

export default function SessionDetail({ sessionId, type, onClose }: SessionDetailProps) {
  const [data, setData] = useState<SessionData | DAPArchiveEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const url =
          type === "intake" ? `/api/ops/intake/${sessionId}` : `/api/ops/dap/${sessionId}`;
        const response = await fetch(url);

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
  }, [sessionId, type]);

  if (!sessionId) return null;

  return (
    <Modal>
      <Modal.Backdrop isOpen={!!sessionId} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="text-2xl font-bold">Session Details</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {loading && (
                <div className="space-y-4">
                  <div className="h-8 w-full bg-muted rounded animate-pulse" />
                  <div className="h-64 w-full bg-muted rounded animate-pulse" />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <p className="font-bold text-red-900">Error loading session</p>
                  <p className="text-sm mt-1 text-red-700">{error}</p>
                </div>
              )}

              {!loading && !error && data && (
                <div className="space-y-6">
                  {type === "intake" ? (
                    <IntakeSessionDetail data={data as SessionData} />
                  ) : (
                    <DAPSessionDetail data={data as DAPArchiveEntry} />
                  )}
                </div>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function IntakeSessionDetail({ data }: { data: SessionData }) {
  return (
    <>
      {/* Session Information */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-green-600 flex-shrink-0" />
          Session Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Session ID</p>
            <p className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded border border-gray-300">
              {data.sessionId}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Intake Type</p>
            <p className="text-sm font-medium">{data.metadata.intakeType}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created</p>
            <p className="text-sm">{new Date(data.metadata.createdAt).toLocaleString()}</p>
          </div>
          {data.metadata.completedAt && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Completed</p>
              <p className="text-sm">{new Date(data.metadata.completedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      {data.contact && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-green-600 flex-shrink-0" />
            Contact Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {data.contact.email && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                <p className="text-sm font-medium">{data.contact.email}</p>
              </div>
            )}
            {data.contact.phone && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                <p className="text-sm font-medium">{data.contact.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversational Q&A */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
          Intake Conversation ({data.progress.length} Questions)
        </h3>
        <div className="space-y-1 bg-white rounded-lg p-4 border border-gray-200">
          {data.progress.map((entry, index) => (
            <div key={index}>
              <QuestionMessage
                questionNumber={index + 1}
                questionText={entry.questionPrompt || entry.questionId}
              />
              <AnswerMessage answer={entry.answer} />
              {entry.reflection && <ReflectionMessage reflection={entry.reflection} />}
            </div>
          ))}
        </div>
      </div>

      {/* Completion Outputs */}
      {data.completion && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            Final Report
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full" />
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Personalized Brief
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-400 rounded-r-lg p-4 text-sm leading-relaxed text-gray-800 shadow-sm">
                {data.completion.outputs.personalizedBrief}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" />
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  First Session Guide
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-400 rounded-r-lg p-4 text-sm leading-relaxed text-gray-800 shadow-sm whitespace-pre-wrap">
                {data.completion.outputs.firstSessionGuide}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-green-300 rounded-full" />
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Suggested Experiments
                </p>
              </div>
              <ul className="space-y-3">
                {data.completion.outputs.experiments.map((exp, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm bg-gradient-to-r from-green-50 to-white border-l-4 border-green-400 rounded-r-lg p-4 shadow-sm"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center min-w-[28px] h-7 rounded-full bg-gradient-to-br from-green-600 to-green-500 text-white text-sm font-bold shadow-sm">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed text-gray-800">{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Interactions */}
      {data.interactions.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Interactions ({data.interactions.length})
          </h3>
          <div className="space-y-2">
            {data.interactions.map((interaction, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Badge variant="outline">{interaction.type}</Badge>
                <span className="text-gray-600">
                  {new Date(interaction.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function DAPSessionDetail({ data }: { data: DAPArchiveEntry }) {
  return (
    <>
      {/* Session Information */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-green-600 flex-shrink-0" />
          Session Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Session ID</p>
            <p className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded border border-gray-300">
              {data.sessionId}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Intake Type</p>
            <p className="text-sm font-medium">{data.intakeType}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Generated</p>
            <p className="text-sm">{new Date(data.timestamp).toLocaleString()}</p>
          </div>
          {data.metadata.model && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Model</p>
              <p className="text-sm font-medium">{data.metadata.model}</p>
            </div>
          )}
          {data.metadata.tokensUsed && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tokens Used</p>
              <p className="text-sm font-medium">{data.metadata.tokensUsed.toLocaleString()}</p>
            </div>
          )}
          {data.metadata.generationTimeMs && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Generation Time</p>
              <p className="text-sm font-medium">{data.metadata.generationTimeMs}ms</p>
            </div>
          )}
        </div>
      </div>

      {/* Data (Disclosure) */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold text-gray-900">Data (Disclosure)</h3>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-400 rounded-r-lg p-5 text-sm whitespace-pre-wrap leading-relaxed text-gray-800 shadow-sm">
          {data.dap.disclosure}
        </div>
      </div>

      {/* Assessment */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-bold text-gray-900">Assessment</h3>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-400 rounded-r-lg p-5 text-sm whitespace-pre-wrap leading-relaxed text-gray-800 shadow-sm">
          {data.dap.assessment}
        </div>
      </div>

      {/* Plan */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📋</span>
          <h3 className="text-lg font-bold text-gray-900">Plan</h3>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-400 rounded-r-lg p-5 text-sm whitespace-pre-wrap leading-relaxed text-gray-800 shadow-sm">
          {data.dap.plan}
        </div>
      </div>
    </>
  );
}
