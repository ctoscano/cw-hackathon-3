"use client";

import type { SessionData } from "@/lib/redis/intake";
import type { DAPArchiveEntry } from "@/lib/redis/ops";
import { AnswerMessage, Badge, QuestionMessage, ReflectionMessage } from "@cw-hackathon/ui";
import { Button } from "@heroui/react";
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  Database,
  Info,
  MessageSquare,
  Search,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SessionDetailProps {
  sessionId: string;
  sessionType: "intake" | "dap";
  onClose: () => void;
}

export default function SessionDetail({ sessionId, sessionType, onClose }: SessionDetailProps) {
  const [data, setData] = useState<SessionData | DAPArchiveEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const url =
          sessionType === "intake" ? `/api/ops/intake/${sessionId}` : `/api/ops/dap/${sessionId}`;
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
  }, [sessionId, sessionType]);

  if (!sessionId) return null;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 bg-anthropic-light border-b border-anthropic-mid-gray/20 px-6 py-4 sticky top-0 z-10">
        <Button
          variant="outline"
          onPress={onClose}
          className="flex items-center gap-2 font-heading"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Button>
        <h2 className="text-2xl font-heading font-semibold text-anthropic-dark">Session Details</h2>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {loading && (
          <div className="space-y-4">
            <div className="h-8 w-full bg-anthropic-light-gray rounded animate-pulse" />
            <div className="h-64 w-full bg-anthropic-light-gray rounded animate-pulse" />
          </div>
        )}

        {error && (
          <div className="bg-anthropic-orange/10 border border-anthropic-orange rounded-lg p-4">
            <p className="font-heading font-semibold text-anthropic-dark">Error loading session</p>
            <p className="text-sm mt-1 font-body text-anthropic-dark/80">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            {sessionType === "intake" ? (
              <IntakeSessionDetail data={data as SessionData} />
            ) : (
              <DAPSessionDetail data={data as DAPArchiveEntry} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IntakeSessionDetail({ data }: { data: SessionData }) {
  return (
    <>
      {/* Session Information */}
      <div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-anthropic-blue flex-shrink-0" />
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
        <div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-anthropic-green flex-shrink-0" />
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
      <div className="bg-gradient-to-b from-anthropic-light to-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-anthropic-orange flex-shrink-0" />
          Intake Conversation ({data.progress.length} Questions)
        </h3>
        <div className="space-y-1 bg-white rounded-lg p-4 border border-gray-200">
          {data.progress.map((entry, index) => (
            <div key={entry.questionId || `question-${index}`}>
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
        <div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-anthropic-green flex-shrink-0" />
            Final Report
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-12 bg-anthropic-orange rounded-full" />
                <p className="text-sm font-heading font-semibold text-anthropic-dark uppercase tracking-wide">
                  Personalized Brief
                </p>
              </div>
              <div className="bg-gradient-to-br from-anthropic-light to-white border-l-4 border-anthropic-orange rounded-r-lg p-4 text-sm font-body leading-relaxed text-anthropic-dark shadow-sm prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {data.completion.outputs.personalizedBrief}
                </ReactMarkdown>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-12 bg-anthropic-blue rounded-full" />
                <p className="text-sm font-heading font-semibold text-anthropic-dark uppercase tracking-wide">
                  First Session Guide
                </p>
              </div>
              <div className="bg-gradient-to-br from-anthropic-light to-white border-l-4 border-anthropic-blue rounded-r-lg p-4 text-sm font-body leading-relaxed text-anthropic-dark shadow-sm prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {data.completion.outputs.firstSessionGuide}
                </ReactMarkdown>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-12 bg-anthropic-green rounded-full" />
                <p className="text-sm font-heading font-semibold text-anthropic-dark uppercase tracking-wide">
                  Suggested Experiments
                </p>
              </div>
              <ul className="space-y-3">
                {data.completion.outputs.experiments.map((exp, i) => (
                  <li
                    key={exp.slice(0, 50)}
                    className="flex gap-3 text-sm bg-gradient-to-r from-anthropic-light to-white border-l-4 border-anthropic-green rounded-r-lg p-4 shadow-sm"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center min-w-[28px] h-7 rounded-full bg-anthropic-green text-white text-sm font-heading font-semibold shadow-sm">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed font-body text-anthropic-dark">
                      {exp}
                    </span>
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
              <div
                key={`${interaction.type}-${interaction.timestamp}`}
                className="flex items-center gap-3 text-sm"
              >
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
      <div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-anthropic-blue flex-shrink-0" />
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
      <div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-anthropic-orange flex-shrink-0" />
          Data (Disclosure)
        </h3>
        <div className="bg-gradient-to-br from-anthropic-light to-white border-l-4 border-anthropic-orange rounded-r-lg p-5 text-sm font-body leading-relaxed text-anthropic-dark shadow-sm prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.dap.disclosure}</ReactMarkdown>
        </div>
      </div>

      {/* Assessment */}
      <div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-anthropic-blue flex-shrink-0" />
          Assessment
        </h3>
        <div className="bg-gradient-to-br from-anthropic-light to-white border-l-4 border-anthropic-blue rounded-r-lg p-5 text-sm font-body leading-relaxed text-anthropic-dark shadow-sm prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.dap.assessment}</ReactMarkdown>
        </div>
      </div>

      {/* Plan */}
      <div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-anthropic-green flex-shrink-0" />
          Plan
        </h3>
        <div className="bg-gradient-to-br from-anthropic-light to-white border-l-4 border-anthropic-green rounded-r-lg p-5 text-sm font-body leading-relaxed text-anthropic-dark shadow-sm prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.dap.plan}</ReactMarkdown>
        </div>
      </div>
    </>
  );
}
