"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ResultSummary {
  id: string;
  created_at: string;
  report_json: {
    personality?: { code: string; name: string; emoji: string };
    topSpecialties?: Array<{ specialty: string; finalPct: number }>;
  };
}

export default function DashboardPage() {
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserName(user.user_metadata?.full_name || "");

        const { data } = await supabase
          .from("test_results")
          .select("id, created_at, report_json")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data) setResults(data as ResultSummary[]);
      }

      // Also check localStorage for unsaved results
      const localResults: ResultSummary[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("result_")) {
          try {
            const report = JSON.parse(localStorage.getItem(key)!);
            localResults.push({
              id: key.replace("result_", ""),
              created_at: new Date().toISOString(),
              report_json: report,
            });
          } catch { /* skip */ }
        }
      }
      if (localResults.length > 0) {
        setResults((prev) => [...prev, ...localResults]);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span style={{ fontFamily: "var(--font-heading)" }} className="font-bold text-white">
              Profi<span className="text-[#C084FC]">Test</span> KZ
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#E8E4F0]/50">{userName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-white">
            Мои результаты
          </h1>
          <Link href="/test" className="btn-primary !py-3 !px-6 text-sm">
            Пройти тест
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#E8E4F0]/50">Загрузка...</div>
        ) : results.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h2 style={{ fontFamily: "var(--font-heading)" }} className="text-xl font-bold text-white mb-3">
              Пока пусто
            </h2>
            <p className="text-[#E8E4F0]/60 mb-6">
              Пройди тест, чтобы узнать свой тип личности и подходящие специальности
            </p>
            <Link href="/test" className="btn-primary inline-block">
              Пройти тест
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => {
              const personality = result.report_json?.personality;
              const top1 = result.report_json?.topSpecialties?.[0];

              return (
                <Link
                  key={result.id}
                  href={`/results/${result.id}`}
                  className="card p-6 flex items-center justify-between hover:border-[#A855F7]/30 transition-all block"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{personality?.emoji || "📊"}</span>
                    <div>
                      <p className="text-white font-medium">
                        {personality?.name || "Результат"}
                        {personality?.code ? ` (${personality.code})` : ""}
                      </p>
                      <p className="text-sm text-[#E8E4F0]/50">
                        {formatDate(result.created_at)}
                        {top1 && ` · Топ-1: ${top1.specialty}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#C084FC] text-sm">Открыть →</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
