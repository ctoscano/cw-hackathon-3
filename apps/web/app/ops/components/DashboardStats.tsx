"use client";

import { Card } from "@heroui/react";
import { CheckCircle, Clock, FileText, TrendingUp } from "lucide-react";

interface StatsData {
  totalIntakeSessions: number;
  completedIntakeSessions: number;
  inProgressIntakeSessions: number;
  totalDAPSessions: number;
}

interface DashboardStatsProps {
  stats: StatsData | null;
  loading?: boolean;
}

export default function DashboardStats({ stats, loading }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Sessions",
      value: stats?.totalIntakeSessions || 0,
      icon: FileText,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      label: "Completed",
      value: stats?.completedIntakeSessions || 0,
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      label: "In Progress",
      value: stats?.inProgressIntakeSessions || 0,
      icon: Clock,
      color: "amber",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
    },
    {
      label: "DAP Notes Generated",
      value: stats?.totalDAPSessions || 0,
      icon: TrendingUp,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className={`${stat.bgColor} border-2 ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow p-6`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor} border-2 ${stat.borderColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
