"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";

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

interface RoleModel {
  emoji: string;
  name: string;
  title: string;
  why: string;
  tag: string;
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

interface AiGroup {
  tier: string;
  icon: string;
  title: string;
  cssClass: string;
  specialties: string[];
  text: string;
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
  roleModels: RoleModel[];
  topSpecialties: Specialty[];
  aiGroups: AiGroup[];
  stepPlan: StepPlan;
  context: { location: string; grantPref: string; salaryCaveat: string };
}

/* ───────────────────── ai-tier color helpers ─────────────────────── */

function tierColor(tier: string): string {
  switch (tier) {
    case "Устойчивая":
      return "#34D399";
    case "AI-усиленная":
      return "#60A5FA";
    case "Средняя":
      return "#FBBF24";
    case "Под угрозой":
      return "#F87171";
    default:
      return "#A855F7";
  }
}

function tierBg(tier: string): string {
  switch (tier) {
    case "Устойчивая":
      return "rgba(52,211,153,0.15)";
    case "AI-усиленная":
      return "rgba(96,165,250,0.15)";
    case "Средняя":
      return "rgba(251,191,36,0.15)";
    case "Под угрозой":
      return "rgba(248,113,113,0.15)";
    default:
      return "rgba(168,85,247,0.15)";
  }
}

/* ─────────────── RIASEC bar color by level ───────────────────────── */

function barGradient(colorClass: string): string {
  switch (colorClass) {
    case "high":
      return "linear-gradient(90deg, #A855F7, #C084FC)";
    case "mid":
      return "linear-gradient(90deg, #7C3AED80, #A855F780)";
    case "low":
      return "linear-gradient(90deg, #3B2667, #4C3575)";
    default:
      return "linear-gradient(90deg, #A855F7, #C084FC)";
  }
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpec, setExpandedSpec] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  /* ── load data ── */
  useEffect(() => {
    async function load() {
      // 1. try localStorage
      try {
        const cached = localStorage.getItem(`result_${id}`);
        if (cached) {
          setReport(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {
        /* ignore */
      }

      // 2. try API
      try {
        const res = await fetch(`/api/results/${id}`);
        if (!res.ok) throw new Error("not found");
        const data: ReportData = await res.json();
        setReport(data);
        localStorage.setItem(`result_${id}`, JSON.stringify(data));
      } catch {
        setError("Результаты не найдены. Возможно, ссылка устарела.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  /* ── helpers ── */
  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── loading / error states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-foreground/50 font-[family-name:var(--font-body)]">
            Загружаем результаты...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card p-8 max-w-md text-center space-y-6">
          <p className="text-4xl">😕</p>
          <p className="text-foreground/70 font-[family-name:var(--font-body)]">
            {error ?? "Что-то пошло не так"}
          </p>
          <button onClick={() => router.push("/test")} className="btn-primary">
            Пройти тест заново
          </button>
        </div>
      </div>
    );
  }

  const { personality, percentiles, growthZones, roleModels, topSpecialties, aiGroups, stepPlan } = report;

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <main className="min-h-screen pb-20 px-4 md:px-6 lg:px-8 max-w-3xl mx-auto space-y-10 pt-10 font-[family-name:var(--font-body)]">
      {/* ═══════ Section A: Hero — Personality Type ═══════ */}
      <section className="card p-6 md:p-10 text-center space-y-5 fade-in">
        <p className="text-6xl md:text-7xl">{personality.emoji}</p>
        <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)] gradient-text">
          Ты — {personality.name}
        </h1>
        <p className="text-foreground/70 leading-relaxed max-w-xl mx-auto">
          {personality.description}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {personality.tags.map((tag, i) => (
            <span
              key={i}
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "#C084FC",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════ Section B: RIASEC Profile ═══════ */}
      <section className="space-y-4 fade-in" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)]">
          📊 Твой RIASEC-профиль
        </h2>
        <div className="space-y-3">
          {percentiles.map((p, i) => (
            <div key={i} className="card p-4 md:p-5 space-y-2">
              {/* top row */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-lg">{p.emoji}</span>
                  {p.name}
                </span>
                <span className="text-sm font-medium text-foreground/60">
                  {p.score}/{p.maxScore}
                </span>
              </div>
              {/* bar */}
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${p.pct}%`,
                    background: barGradient(p.colorClass),
                  }}
                />
              </div>
              {/* subtitle + badge */}
              <div className="flex items-center justify-between text-xs text-foreground/40">
                <span>{p.sub}</span>
                <span
                  className="px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background:
                      p.colorClass === "high"
                        ? "rgba(168,85,247,0.15)"
                        : p.colorClass === "mid"
                          ? "rgba(124,58,237,0.10)"
                          : "rgba(59,38,103,0.2)",
                    color:
                      p.colorClass === "high"
                        ? "#C084FC"
                        : p.colorClass === "mid"
                          ? "#A855F780"
                          : "#6B5B8D",
                  }}
                >
                  {p.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ Section C: Growth Zones ═══════ */}
      {growthZones.length > 0 && (
        <section className="space-y-4 fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)]">
            🌱 Зоны роста
          </h2>
          <div className="space-y-3">
            {growthZones.slice(0, 3).map((gz, i) => (
              <div key={i} className="card p-5 md:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{gz.icon}</span>
                  <h3 className="font-semibold font-[family-name:var(--font-heading)] text-sm md:text-base">
                    {gz.title}
                  </h3>
                </div>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {gz.text}
                </p>
                <div
                  className="rounded-2xl px-4 py-3 text-sm text-foreground/80"
                  style={{ background: "rgba(168,85,247,0.08)" }}
                >
                  💡 {gz.tip}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ Section D: Role Models ═══════ */}
      {roleModels.length > 0 && (
        <section className="space-y-4 fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)]">
            🌟 Ролевые модели
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roleModels.map((rm, i) => (
              <div key={i} className="card card-hover p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{rm.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                      {rm.name}
                    </p>
                    <p className="text-xs text-foreground/50">{rm.title}</p>
                  </div>
                </div>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {rm.why}
                </p>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(168,85,247,0.12)",
                    color: "#C084FC",
                  }}
                >
                  {rm.tag}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ Section E: Top-5 Specialties ═══════ */}
      <section className="space-y-4 fade-in" style={{ animationDelay: "0.4s" }}>
        <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)]">
          🎯 Топ-5 специальностей
        </h2>
        <div className="space-y-3">
          {topSpecialties.map((spec, i) => {
            const isOpen = expandedSpec === i;
            return (
              <div key={i} className="card overflow-hidden">
                {/* collapsed header — always visible */}
                <button
                  onClick={() => setExpandedSpec(isOpen ? null : i)}
                  className="w-full text-left p-5 flex items-center gap-4 cursor-pointer"
                >
                  {/* rank */}
                  <span
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-[family-name:var(--font-heading)]"
                    style={{
                      background: "linear-gradient(135deg, #A855F7, #7C3AED)",
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* name + bar */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold truncate">{spec.name || spec.specialty}</p>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${spec.finalPct}%`,
                          background: "linear-gradient(90deg, #A855F7, #C084FC)",
                        }}
                      />
                    </div>
                  </div>

                  {/* pct + tier */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground/60">
                      {spec.finalPct}%
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                      style={{
                        background: tierBg(spec.aiTier),
                        color: tierColor(spec.aiTier),
                      }}
                    >
                      {spec.aiTier}
                    </span>
                  </div>

                  {/* chevron */}
                  <svg
                    className="shrink-0 w-5 h-5 text-foreground/30 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* expanded details */}
                {isOpen && (
                  <div
                    className="px-5 pb-5 space-y-4 text-sm border-t"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    {/* why */}
                    <div className="pt-4">
                      <p className="font-semibold text-foreground/50 text-xs uppercase tracking-wider mb-1">
                        Почему тебе
                      </p>
                      <p className="text-foreground/70 leading-relaxed">{spec.why}</p>
                    </div>

                    {/* details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* salary */}
                      <div
                        className="rounded-2xl p-3 space-y-1"
                        style={{ background: "rgba(168,85,247,0.06)" }}
                      >
                        <p className="text-xs text-foreground/40">Зарплата (начало)</p>
                        <p className="font-medium">{spec.salaryStart}</p>
                      </div>
                      <div
                        className="rounded-2xl p-3 space-y-1"
                        style={{ background: "rgba(168,85,247,0.06)" }}
                      >
                        <p className="text-xs text-foreground/40">Зарплата (опыт)</p>
                        <p className="font-medium">{spec.salaryExperienced}</p>
                      </div>

                      {/* ent bundle */}
                      <div
                        className="rounded-2xl p-3 space-y-1"
                        style={{ background: "rgba(168,85,247,0.06)" }}
                      >
                        <p className="text-xs text-foreground/40">ЕНТ-связка</p>
                        <p className="font-medium">{spec.entBundle}</p>
                      </div>

                      {/* grant */}
                      <div
                        className="rounded-2xl p-3 space-y-1"
                        style={{ background: "rgba(168,85,247,0.06)" }}
                      >
                        <p className="text-xs text-foreground/40">Грант</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {spec.grantCount !== null
                              ? `${spec.grantCount} мест`
                              : "нет данных"}
                          </p>
                          {spec.grantTag && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background: tierBg(spec.grantTag),
                                color: tierColor(spec.grantTag),
                              }}
                            >
                              {spec.grantTag}
                            </span>
                          )}
                        </div>
                        {spec.grantMinScore !== null && (
                          <p className="text-xs text-foreground/40">
                            Мин. балл: {spec.grantMinScore}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* top unis */}
                    {spec.topUnis && (
                      <div>
                        <p className="font-semibold text-foreground/50 text-xs uppercase tracking-wider mb-1">
                          Вузы
                        </p>
                        <p className="text-foreground/70 leading-relaxed">{spec.topUnis}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ Section F: AI Resilience ═══════ */}
      {aiGroups.length > 0 && (
        <section className="space-y-4 fade-in" style={{ animationDelay: "0.5s" }}>
          <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)]">
            🤖 AI-устойчивость профессий
          </h2>
          <div className="space-y-3">
            {aiGroups.map((g, i) => (
              <div
                key={i}
                className="card p-5 md:p-6 space-y-3"
                style={{
                  borderLeft: `3px solid ${tierColor(g.tier)}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{g.icon}</span>
                  <h3
                    className="font-semibold font-[family-name:var(--font-heading)] text-sm md:text-base"
                    style={{ color: tierColor(g.tier) }}
                  >
                    {g.title}
                  </h3>
                </div>
                <p className="text-foreground/50 text-xs">{g.specialties?.join(', ')}</p>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {g.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ Section G: Action Plan ═══════ */}
      <section className="space-y-4 fade-in" style={{ animationDelay: "0.6s" }}>
        <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)]">
          🗺️ План действий
        </h2>

        <div className="relative pl-8 space-y-6">
          {/* vertical timeline line */}
          <div
            className="absolute left-3 top-2 bottom-2 w-0.5"
            style={{ background: "linear-gradient(180deg, #A855F7, #7C3AED)" }}
          />

          {/* Steps 1-4 rendered from flat strings */}
          {[
            { label: "Шаг 1 — ЕНТ-связка", content: stepPlan.step1 },
            { label: "Шаг 2 — Университеты", content: stepPlan.step2 },
            { label: "Шаг 3 — Гранты", content: stepPlan.step3 },
            { label: "Шаг 4 — Навыки", content: stepPlan.step4 },
          ].map((step, i) => (
            <div key={i} className="relative">
              <div
                className="absolute -left-5 top-1 w-4 h-4 rounded-full border-2"
                style={{ borderColor: "#A855F7", background: "#0C0A1A" }}
              />
              <div className="card p-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {step.label}
                </p>
                <div className="text-foreground/70 text-sm leading-relaxed whitespace-pre-line">
                  {step.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ Bottom Buttons ═══════ */}
      <section className="flex flex-col sm:flex-row gap-3 pt-4 pb-10 fade-in" style={{ animationDelay: "0.7s" }}>
        <button
          onClick={() => alert("PDF-скачивание скоро будет доступно!")}
          className="btn-primary flex-1 text-center"
        >
          📄 Скачать PDF
        </button>
        <button
          onClick={handleCopy}
          className="btn-secondary flex-1 text-center"
        >
          {copied ? "✅ Скопировано!" : "🔗 Поделиться"}
        </button>
        <button
          onClick={() => router.push("/test")}
          className="btn-secondary flex-1 text-center"
        >
          🔄 Пройти тест заново
        </button>
      </section>
    </main>
  );
}
