"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ────────────────────────────── types ────────────────────────────── */

interface Personality {
  code: string;
  emoji: string;
  name: string;
  headline: string;
  description: string;
  tags: string[];
  isFlat: boolean;
}

interface Percentile {
  emoji: string;
  name: string;
  score: number;
  maxScore: number;
  pct: number;
  level: string;
  badge: string;
  colorClass: string;
  sub: string;
}

interface GrowthZone {
  icon: string;
  title: string;
  text: string;
  tip: string;
}

interface Specialty {
  name: string;
  specialty?: string;
  finalPct: number;
  aiTier: string;
  why: string;
  grantCount: number | null;
  grantMinScore: number | null;
  grantTag: string;
  entBundle: string;
  topUnis: string;
  salaryStart: string;
  salaryExperienced: string;
  region: string;
}

interface StepPlan {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  grantContext: string;
}

interface ReportData {
  hero: { name: string };
  personality: Personality;
  percentiles: Percentile[];
  growthZones: GrowthZone[];
  topSpecialties: Specialty[];
  stepPlan: StepPlan;
}

interface ProfileData {
  full_name: string;
  grade: number;
  city: string;
  school?: string;
}

interface TestResult {
  id: string;
  created_at: string;
  user_id: string;
  report_json: ReportData;
  profiles: ProfileData | null;
}

/* ───────────────────── ai-tier color helpers ─────────────────────── */

function tierColor(tier: string): string {
  switch (tier) {
    case "Устойчивая":
      return "#16a34a";
    case "AI-усиленная":
      return "#2563eb";
    case "Средняя":
      return "#d97706";
    case "Под угрозой":
      return "#dc2626";
    default:
      return "#7c3aed";
  }
}

function tierBg(tier: string): string {
  switch (tier) {
    case "Устойчивая":
      return "#f0fdf4";
    case "AI-усиленная":
      return "#eff6ff";
    case "Средняя":
      return "#fffbeb";
    case "Под угрозой":
      return "#fef2f2";
    default:
      return "#f5f3ff";
  }
}

/* ───────────────────── RIASEC bar colors ────────────────────────── */

function barColor(colorClass: string): string {
  switch (colorClass) {
    case "high":
      return "#7c3aed";
    case "mid":
      return "#a78bfa";
    case "low":
      return "#c4b5fd";
    default:
      return "#7c3aed";
  }
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function AdminResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [result, setResult] = useState<TestResult | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Check admin access
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Необходимо войти в систему");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        setError("Доступ запрещён");
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch the test result with profile data
      const { data, error: fetchError } = await supabase
        .from("test_results")
        .select("*, profiles(full_name, grade, city, school)")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("Результат не найден");
        setLoading(false);
        return;
      }

      setResult(data as unknown as TestResult);

      // Try to get the user's email
      // Admin can fetch email from auth.users via a lookup if needed;
      // for now we store it from the current auth context if it matches
      if (data.user_id === user.id) {
        setUserEmail(user.email ?? null);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  /* ── loading / error states ── */
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f9fafb",
        }}
      >
        <p style={{ color: "#6b7280", fontSize: 16 }}>Загрузка...</p>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🚫</p>
          <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 24 }}>
            {error ?? "Доступ запрещён"}
          </p>
          <Link
            href="/admin"
            style={{
              color: "#7c3aed",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            Вернуться в панель
          </Link>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const report = result.report_json;
  const prof = result.profiles;
  const {
    personality,
    percentiles,
    growthZones,
    topSpecialties,
    stepPlan,
  } = report;

  const studentName =
    prof?.full_name || report.hero?.name || "Без имени";
  const completedAt = new Date(result.created_at).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        color: "#1f2937",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* ═══════ Actions Bar ═══════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Link
            href="/admin/results"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#7c3aed",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ← Назад к списку
          </Link>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => alert("PDF-генерация будет реализована позже")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              📄 Скачать PDF
            </button>
            <a
              href={`/results/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              👁 Открыть как ученик ↗
            </a>
          </div>
        </div>

        {/* ═══════ Admin Info Banner ═══════ */}
        <div
          style={{
            background: "linear-gradient(135deg, #ede9fe, #e0e7ff)",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 32,
            border: "1px solid #c7d2fe",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 12px 0",
              color: "#1e1b4b",
            }}
          >
            {studentName}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 24px",
              fontSize: 14,
              color: "#4338ca",
            }}
          >
            {prof?.grade && (
              <span>
                🎓 <strong>{prof.grade} класс</strong>
              </span>
            )}
            {prof?.city && (
              <span>
                📍 <strong>{prof.city}</strong>
              </span>
            )}
            {prof?.school && (
              <span>
                🏫 <strong>{prof.school}</strong>
              </span>
            )}
            <span>
              🕐 <strong>{completedAt}</strong>
            </span>
            {userEmail && (
              <span>
                ✉️ <strong>{userEmail}</strong>
              </span>
            )}
          </div>
        </div>

        {/* ═══════ Section A: Personality Hero ═══════ */}
        <section
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "32px 24px",
            textAlign: "center",
            marginBottom: 24,
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ fontSize: 56, margin: "0 0 8px" }}>
            {personality.emoji}
          </p>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#7c3aed",
              margin: "0 0 12px",
            }}
          >
            {personality.name}
          </h2>
          <p
            style={{
              color: "#6b7280",
              lineHeight: 1.7,
              maxWidth: 600,
              margin: "0 auto",
              fontSize: 15,
            }}
          >
            {personality.description}
          </p>
          {personality.tags && personality.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 8,
                marginTop: 16,
              }}
            >
              {personality.tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    padding: "4px 14px",
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 500,
                    background: "#f3f0ff",
                    color: "#7c3aed",
                    border: "1px solid #ddd6fe",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ═══════ Section B: RIASEC Profile ═══════ */}
        {percentiles && percentiles.length > 0 && (
          <section
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              marginBottom: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 20,
                color: "#1f2937",
              }}
            >
              📊 RIASEC-профиль
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {percentiles.map((p, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {p.emoji} {p.name}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {p.score}/{p.maxScore} ({p.pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      background: "#f3f4f6",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${p.pct}%`,
                        background: barColor(p.colorClass),
                        borderRadius: 999,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ Section C: Top-5 Specialties Table ═══════ */}
        {topSpecialties && topSpecialties.length > 0 && (
          <section
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              marginBottom: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
                color: "#1f2937",
              }}
            >
              🎯 Топ-5 специальностей
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e5e7eb",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>#</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>
                      Специальность
                    </th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>
                      Совпадение
                    </th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>
                      AI-устойчивость
                    </th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>
                      Зарплата
                    </th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>
                      Гранты
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topSpecialties.map((s, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 12px",
                          fontWeight: 700,
                          color: "#7c3aed",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          fontWeight: 600,
                        }}
                      >
                        {s.specialty || s.name}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#7c3aed",
                          }}
                        >
                          {s.finalPct}%
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: tierBg(s.aiTier),
                            color: tierColor(s.aiTier),
                          }}
                        >
                          {s.aiTier}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {s.salaryStart} — {s.salaryExperienced}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {s.grantCount
                          ? `${s.grantCount} грантов (от ${s.grantMinScore} б.)`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══════ Section D: Growth Zones ═══════ */}
        {growthZones && growthZones.length > 0 && (
          <section
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              marginBottom: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
                color: "#1f2937",
              }}
            >
              🌱 Зоны роста
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {growthZones.map((g, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    background: "#f9fafb",
                    borderRadius: 10,
                    border: "1px solid #f3f4f6",
                  }}
                >
                  <p style={{ fontWeight: 600, margin: "0 0 4px" }}>
                    {g.icon} {g.title}
                  </p>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: 14,
                      margin: "0 0 6px",
                      lineHeight: 1.6,
                    }}
                  >
                    {g.text}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#7c3aed",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    💡 {g.tip}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ Section E: Action Plan ═══════ */}
        {stepPlan && (
          <section
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              marginBottom: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
                color: "#1f2937",
              }}
            >
              🗺 План действий
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { num: 1, text: stepPlan.step1 },
                { num: 2, text: stepPlan.step2 },
                { num: 3, text: stepPlan.step3 },
                { num: 4, text: stepPlan.step4 },
              ].map((step) => (
                <div
                  key={step.num}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#ede9fe",
                      color: "#7c3aed",
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {step.num}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "#374151",
                    }}
                  >
                    {step.text}
                  </p>
                </div>
              ))}
              {stepPlan.grantContext && (
                <p
                  style={{
                    marginTop: 8,
                    padding: "12px 16px",
                    background: "#f0fdf4",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#166534",
                    lineHeight: 1.6,
                    border: "1px solid #bbf7d0",
                  }}
                >
                  🎓 {stepPlan.grantContext}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ═══════ Bottom nav ═══════ */}
        <div
          style={{
            textAlign: "center",
            paddingTop: 16,
            paddingBottom: 40,
          }}
        >
          <Link
            href="/admin/results"
            style={{
              color: "#7c3aed",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ← Вернуться к списку результатов
          </Link>
        </div>
      </div>
    </div>
  );
}
