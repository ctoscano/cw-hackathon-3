import { isFeatureEnabled } from "@/lib/feature-flags";
import type { SessionData } from "@/lib/redis/intake";
import {
  AnswerMessage,
  Badge,
  QuestionMessage,
  ReflectionMessage,
  Separator,
} from "@cw-hackathon/ui";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Circle,
  FileCheck,
  MessageSquare,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

async function getSessionData(sessionId: string): Promise<SessionData | null> {
  if (!isFeatureEnabled("ops_page")) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/ops/intake/${sessionId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch session data:", error);
    return null;
  }
}

export default async function IntakeSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  if (!isFeatureEnabled("ops_page")) {
    redirect("/");
  }

  const data = await getSessionData(sessionId);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/ops"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Intake Session Details</h1>
              <p className="text-gray-600">
                Session ID:{" "}
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
              </p>
            </div>
            <Badge
              variant={data.completion ? "default" : "secondary"}
              className="text-sm px-4 py-2 flex items-center gap-1.5"
            >
              {data.completion ? (
                <>
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  Complete
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" aria-hidden="true" />
                  In Progress
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Meta Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Session Metadata Card */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-blue-600" />
                Session Information
              </h2>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Intake Type</p>
                  <p className="text-sm font-medium text-gray-900">{data.metadata.intakeType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(data.metadata.createdAt).toLocaleString()}
                  </p>
                </div>
                {data.metadata.completedAt && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Completed
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(data.metadata.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information Card */}
            {data.contact && (
              <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-green-600" />
                  Contact Information
                </h2>
                <Separator className="my-4" />
                <div className="space-y-4">
                  {data.contact.email && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">{data.contact.email}</p>
                    </div>
                  )}
                  {data.contact.phone && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{data.contact.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactions Card */}
            {data.interactions.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Activity Log ({data.interactions.length})
                </h2>
                <Separator className="my-4" />
                <div className="space-y-2">
                  {data.interactions.map((interaction, i) => (
                    <div
                      key={`${interaction.type}-${i}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <Badge variant="outline">{interaction.type}</Badge>
                      <span className="text-gray-600 text-xs">
                        {new Date(interaction.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversational Q&A */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Intake Conversation ({data.progress.length} Questions)
              </h2>
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-lg p-6 border border-gray-200">
                {data.progress.map((entry, index) => (
                  <div key={`${entry.questionId}-${index}`}>
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

            {/* Final Report */}
            {data.completion && (
              <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <FileCheck className="h-5 w-5 text-green-600" />
                  Final Report
                </h2>
                <div className="space-y-6">
                  {/* Personalized Brief */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full" />
                      <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        Personalized Brief
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-400 rounded-r-lg p-5 text-sm leading-relaxed text-gray-800 shadow-sm">
                      {data.completion.outputs.personalizedBrief}
                    </div>
                  </div>

                  {/* First Session Guide */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" />
                      <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        First Session Guide
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-400 rounded-r-lg p-5 text-sm leading-relaxed text-gray-800 shadow-sm whitespace-pre-wrap">
                      {data.completion.outputs.firstSessionGuide}
                    </div>
                  </div>

                  {/* Experiments */}
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
                          key={exp.slice(0, 50)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
