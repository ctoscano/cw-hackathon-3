import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { DAPArchiveEntry } from "@/lib/redis/ops";
import { Activity, ArrowLeft, Calendar, Clock, FileText, Zap } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

async function getDAPData(sessionId: string): Promise<DAPArchiveEntry | null> {
  if (!isFeatureEnabled("ops_page")) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/ops/dap/${sessionId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch DAP data:", error);
    return null;
  }
}

export default async function DAPSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  if (!isFeatureEnabled("ops_page")) {
    redirect("/");
  }

  const data = await getDAPData(sessionId);

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">DAP Note Details</h1>
              <p className="text-gray-600">
                Session ID:{" "}
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
              </p>
            </div>
            <Badge variant="default" className="text-sm px-4 py-2">
              ✓ Complete
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
                  <p className="text-sm font-medium text-gray-900">{data.intakeType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Generated
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(data.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Generation Metadata Card */}
            {data.metadata && (
              <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Generation Stats
                </h2>
                <Separator className="my-4" />
                <div className="space-y-4">
                  {data.metadata.model && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Model</p>
                      <p className="text-sm font-medium text-gray-900">{data.metadata.model}</p>
                    </div>
                  )}
                  {data.metadata.tokensUsed && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Tokens Used
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {data.metadata.tokensUsed.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {data.metadata.generationTimeMs && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Generation Time
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {(data.metadata.generationTimeMs / 1000).toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - DAP Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Disclosure */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-blue-600" />
                Disclosure
              </h2>
              <div className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-400 rounded-r-lg p-5 text-sm leading-relaxed text-gray-800 shadow-sm whitespace-pre-wrap">
                {data.dap.disclosure}
              </div>
            </div>

            {/* Assessment */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-purple-600" />
                Assessment
              </h2>
              <div className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-400 rounded-r-lg p-5 text-sm leading-relaxed text-gray-800 shadow-sm whitespace-pre-wrap">
                {data.dap.assessment}
              </div>
            </div>

            {/* Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-green-600" />
                Plan
              </h2>
              <div className="bg-gradient-to-br from-green-50 to-white border-l-4 border-green-400 rounded-r-lg p-5 text-sm leading-relaxed text-gray-800 shadow-sm whitespace-pre-wrap">
                {data.dap.plan}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
