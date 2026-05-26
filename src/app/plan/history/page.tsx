"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PlanSummary {
  id: string;
  week_start: string;
  created_at: string;
  plan_slots: {
    day: number;
    meal: string;
    cooked_by: string;
    recipes: { name: string };
  }[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanHistoryPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plan/history")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      });
  }, []);

  function formatWeek(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="pb-28">
        <h2 className="text-xl font-bold mb-4">Plan History</h2>
        <p className="text-gray-500 text-center py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Plan History</h2>
        <Link
          href="/"
          className="text-sm text-green-600"
        >
          ← Current week
        </Link>
      </div>

      {plans.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No saved plans yet.
        </p>
      )}

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border border-gray-300 rounded-lg p-3">
            <h3 className="font-semibold text-sm mb-2">
              Week of {formatWeek(plan.week_start)}
            </h3>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {DAYS.map((dayName, dayIdx) => {
                const daySlots = plan.plan_slots.filter((s) => s.day === dayIdx);
                return (
                  <div key={dayIdx} className="text-center">
                    <div className="font-medium text-gray-500 mb-1">{dayName}</div>
                    {daySlots.length > 0 ? (
                      daySlots.map((s, i) => (
                        <div key={i} className="truncate text-[10px]" title={s.recipes?.name}>
                          {s.recipes?.name?.slice(0, 8)}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-300">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
