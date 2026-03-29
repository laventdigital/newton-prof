"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface AdminResult {
  id: string;
  created_at: string;
  user_id: string;
  report_json: {
    hero?: { name: string };
    personality?: { code: string; name: string; emoji: string };
    topSpecialties?: Array<{
      name?: string;
      specialty?: string;
      finalPct: number;
      aiTier?: string;
    }>;
  };
  profiles?: {
    full_name: string;
    grade: number;
    city: string;
  };
}

const PERSONALITY_COLORS = [
  "#7c3aed", "#6366f1", "#8b5cf6", "#a78bfa",
  "#3b82f6", "#60a5fa", "#ec4899", "#f472b6",
  "#10b981", "#34d399", "#f59e0b", "#ef4444",
];

const AI_TIER_COLORS: Record<string, string> = {
  "Устойчивая": "#10b981",
  "AI-усиленная": "#3b82f6",
  "Средняя": "#f59e0b",
  "Под угрозой": "#ef4444",
};

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminPage() {
  const [results, setResults] = useState<AdminResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data } = await supabase
        .from("test_results")
        .select(
          "id, created_at, user_id, report_json, profiles(full_name, grade, city)"
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (data) setResults(data as unknown as AdminResult[]);
      setLoading(false);
    }
    loadData();
  }, []);

  // --- Computed data ---

  const totalCompletions = results.length;
  const todayCompletions = results.filter((r) => isToday(r.created_at)).length;
  const weekCompletions = results.filter((r) => isThisWeek(r.created_at)).length;

  const avgMatch = (() => {
    const pcts = results
      .map((r) => r.report_json?.topSpecialties?.[0]?.finalPct)
      .filter((p): p is number => typeof p === "number");
    if (pcts.length === 0) return 0;
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  })();

  // Personality types distribution
  const personalityData = (() => {
    const map: Record<string, number> = {};
    results.forEach((r) => {
      const code = r.report_json?.personality?.code;
      if (code) map[code] = (map[code] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Top-10 specialties
  const top10Specialties = (() => {
    const map: Record<string, number> = {};
    results.forEach((r) => {
      const spec = r.report_json?.topSpecialties?.[0];
      const name = spec?.name || spec?.specialty;
      if (name) map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  })();

  // Tests per day (last 30 days)
  const testsPerDay = (() => {
    const now = new Date();
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
    }
    results.forEach((r) => {
      const key = r.created_at.slice(0, 10);
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: formatShortDate(date),
      count,
    }));
  })();

  // AI Tier distribution
  const aiTierData = (() => {
    const map: Record<string, number> = {};
    results.forEach((r) => {
      const tier = r.report_json?.topSpecialties?.[0]?.aiTier;
      if (tier) map[tier] = (map[tier] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  // Grade counts
  const gradeCounts = (() => {
    const map: Record<number, number> = { 9: 0, 10: 0, 11: 0 };
    results.forEach((r) => {
      const g = r.profiles?.grade;
      if (g && g in map) map[g]++;
    });
    return map;
  })();

  // Top cities
  const topCities = (() => {
    const map: Record<string, number> = {};
    results.forEach((r) => {
      const city = r.profiles?.city;
      if (city) map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  })();

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-4xl mb-3">&#128274;</p>
          <p className="text-gray-600 font-medium">Доступ запрещён</p>
          <Link href="/" className="text-purple-600 text-sm mt-2 block hover:underline">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Всего прошли тест" value={totalCompletions} icon="&#128202;" />
        <KpiCard label="Сегодня" value={todayCompletions} icon="&#128197;" />
        <KpiCard label="На этой неделе" value={weekCompletions} icon="&#128198;" />
        <KpiCard label="Средний % совпадения" value={`${avgMatch}%`} icon="&#127919;" />
      </div>

      {/* Charts 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Personality Types */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Распределение типов личности
          </h3>
          {personalityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={personalityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={true}
                >
                  {personalityData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PERSONALITY_COLORS[i % PERSONALITY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-16 text-center">Нет данных</p>
          )}
        </div>

        {/* Top-10 Specialties */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Топ-10 специальностей
          </h3>
          {top10Specialties.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={top10Specialties}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-16 text-center">Нет данных</p>
          )}
        </div>

        {/* Tests per Day */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Тесты за день (последние 30 дней)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={testsPerDay}>
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={4}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#purpleGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Tier Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            AI-устойчивость специальностей
          </h3>
          {aiTierData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={aiTierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={true}
                >
                  {aiTierData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={AI_TIER_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-16 text-center">Нет данных</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Grade */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">По классам</h3>
          <div className="grid grid-cols-3 gap-4">
            {[9, 10, 11].map((grade) => (
              <div
                key={grade}
                className="bg-gray-50 rounded-lg p-4 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">
                  {gradeCounts[grade]}
                </p>
                <p className="text-xs text-gray-500 mt-1">{grade} класс</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Топ-5 городов
          </h3>
          {topCities.length > 0 ? (
            <ul className="space-y-3">
              {topCities.map((city, i) => (
                <li key={city.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-5 text-right">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-900">{city.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.round((city.value / topCities[0].value) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">
                      {city.value}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Нет данных</p>
          )}
        </div>
      </div>
    </main>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <span
          className="text-lg"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
