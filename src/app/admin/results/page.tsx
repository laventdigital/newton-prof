"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ---------- types ---------- */
interface TestResult {
  id: string;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report_json: Record<string, any>;
  profiles: {
    full_name: string | null;
    grade: string | null;
    city: string | null;
    role?: string;
  } | null;
}

type SortKey = "date" | "name" | "grade" | "city" | "type" | "specialty" | "pct";
type SortDir = "asc" | "desc";

/* ---------- helpers ---------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getName(r: TestResult) {
  return r.profiles?.full_name || r.report_json?.hero?.name || "";
}

function getGrade(r: TestResult) {
  return r.profiles?.grade || "";
}

function getCity(r: TestResult) {
  return r.profiles?.city || "";
}

function getPersonalityCode(r: TestResult) {
  return r.report_json?.personality?.code || "";
}

function getTopSpecialtyName(r: TestResult) {
  const top = r.report_json?.topSpecialties?.[0];
  return top?.name || top?.specialty || "";
}

function getTopSpecialtyPct(r: TestResult): number {
  return r.report_json?.topSpecialties?.[0]?.finalPct ?? 0;
}

/* personality emoji map */
const PERSONALITY_EMOJI: Record<string, string> = {
  IE: "🔬",
  AS: "🎨",
  EC: "💼",
  SC: "🤝",
  CR: "📐",
  RE: "🔧",
  RI: "🧪",
  AI: "💡",
  SI: "👨‍🏫",
  SE: "📢",
  CE: "📊",
  RC: "⚙️",
};

const PERSONALITY_NAMES: Record<string, string> = {
  IE: "Исследователь-Предприниматель",
  AS: "Артист-Социальный",
  EC: "Предприниматель-Конвенциональный",
  SC: "Социальный-Конвенциональный",
  CR: "Конвенциональный-Реалистичный",
  RE: "Реалистичный-Предприниматель",
  RI: "Реалистичный-Исследователь",
  AI: "Артист-Исследователь",
  SI: "Социальный-Исследователь",
  SE: "Социальный-Предприниматель",
  CE: "Конвенциональный-Предприниматель",
  RC: "Реалистичный-Конвенциональный",
};

const RIASEC_LABELS = [
  { key: "R", label: "R - Реалистичный", color: "bg-red-400" },
  { key: "I", label: "I - Исследовательский", color: "bg-blue-400" },
  { key: "A", label: "A - Артистичный", color: "bg-yellow-400" },
  { key: "S", label: "S - Социальный", color: "bg-green-400" },
  { key: "E", label: "E - Предприимчивый", color: "bg-orange-400" },
  { key: "C", label: "C - Конвенциональный", color: "bg-purple-400" },
];

/* ---------- CSV export ---------- */
function downloadCSV(data: TestResult[]) {
  const headers = [
    "Дата",
    "Имя",
    "Класс",
    "Город",
    "Тип личности",
    "Топ-1 специальность",
    "% совпадения",
  ];
  const rows = data.map((r) => [
    formatDate(r.created_at),
    getName(r),
    getGrade(r),
    getCity(r),
    getPersonalityCode(r),
    getTopSpecialtyName(r),
    String(getTopSpecialtyPct(r)),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `profitest_results_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

/* ========== COMPONENT ========== */
const PER_PAGE = 20;

export default function ResultsPage() {
  /* --- data --- */
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  /* --- filters --- */
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* --- sort & pagination --- */
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  /* --- expanded rows --- */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ---------- fetch ---------- */
  useEffect(() => {
    async function load() {
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

      const { data: rows } = await supabase
        .from("test_results")
        .select("id, created_at, report_json, profiles(full_name, grade, city)")
        .order("created_at", { ascending: false })
        .limit(2000);

      setResults((rows as unknown as TestResult[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  /* ---------- derived filter options ---------- */
  const cities = useMemo(
    () =>
      Array.from(new Set(results.map(getCity).filter(Boolean))).sort(),
    [results],
  );

  const types = useMemo(
    () =>
      Array.from(new Set(results.map(getPersonalityCode).filter(Boolean))).sort(),
    [results],
  );

  const specialties = useMemo(
    () =>
      Array.from(new Set(results.map(getTopSpecialtyName).filter(Boolean))).sort(),
    [results],
  );

  /* ---------- filtered + sorted ---------- */
  const filtered = useMemo(() => {
    let list = results;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => getName(r).toLowerCase().includes(q));
    }
    if (gradeFilter) list = list.filter((r) => getGrade(r) === gradeFilter);
    if (cityFilter) list = list.filter((r) => getCity(r) === cityFilter);
    if (typeFilter) list = list.filter((r) => getPersonalityCode(r) === typeFilter);
    if (specialtyFilter)
      list = list.filter((r) => getTopSpecialtyName(r) === specialtyFilter);
    if (dateFrom)
      list = list.filter((r) => r.created_at.slice(0, 10) >= dateFrom);
    if (dateTo)
      list = list.filter((r) => r.created_at.slice(0, 10) <= dateTo);

    /* sort */
    const sorted = [...list].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      switch (sortKey) {
        case "date":
          va = a.created_at;
          vb = b.created_at;
          break;
        case "name":
          va = getName(a).toLowerCase();
          vb = getName(b).toLowerCase();
          break;
        case "grade":
          va = getGrade(a);
          vb = getGrade(b);
          break;
        case "city":
          va = getCity(a).toLowerCase();
          vb = getCity(b).toLowerCase();
          break;
        case "type":
          va = getPersonalityCode(a);
          vb = getPersonalityCode(b);
          break;
        case "specialty":
          va = getTopSpecialtyName(a).toLowerCase();
          vb = getTopSpecialtyName(b).toLowerCase();
          break;
        case "pct":
          va = getTopSpecialtyPct(a);
          vb = getTopSpecialtyPct(b);
          break;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [results, search, gradeFilter, cityFilter, typeFilter, specialtyFilter, dateFrom, dateTo, sortKey, sortDir]);

  /* ---------- pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safeP = Math.min(page, totalPages);
  const paged = filtered.slice((safeP - 1) * PER_PAGE, safeP * PER_PAGE);

  // If current page exceeds total, reset
  if (page > totalPages && totalPages > 0) {
    setPage(totalPages);
  }

  /* ---------- sort handler ---------- */
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  }

  /* ---------- reset ---------- */
  function resetFilters() {
    setSearch("");
    setGradeFilter("");
    setCityFilter("");
    setTypeFilter("");
    setSpecialtyFilter("");
    setDateFrom("");
    setDateTo("");
  }

  /* ---------- render ---------- */
  if (loading)
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-4 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );

  if (!isAdmin)
    return (
      <div className="flex items-center justify-center py-32">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <p className="text-2xl mb-2">🔒</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Доступ запрещен
          </h2>
          <p className="text-sm text-gray-500">
            У вас нет прав для просмотра этой страницы.
          </p>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ====== Filter Bar ====== */}
      <div className="sticky top-14 z-40 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* search */}
          <input
            type="text"
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="col-span-2 sm:col-span-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />

          {/* grade */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          >
            <option value="">Класс: все</option>
            <option value="9">9 класс</option>
            <option value="10">10 класс</option>
            <option value="11">11 класс</option>
          </select>

          {/* city */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          >
            <option value="">Город: все</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* personality type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          >
            <option value="">Тип: все</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="От"
          />

          {/* date to */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="До"
          />

          {/* top-1 specialty */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          >
            <option value="">Специальность: все</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* reset */}
          <button
            onClick={resetFilters}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* ====== Count + CSV ====== */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Найдено: <span className="font-semibold text-gray-900">{filtered.length}</span> результатов
        </p>
        <button
          onClick={() => downloadCSV(filtered)}
          className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <span>📥</span> Скачать CSV
        </button>
      </div>

      {/* ====== Table ====== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {([
                  ["date", "Дата"],
                  ["name", "Имя"],
                  ["grade", "Класс"],
                  ["city", "Город"],
                  ["type", "Тип"],
                  ["specialty", "Топ-1 специальность"],
                  ["pct", "%"],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-purple-600 transition whitespace-nowrap"
                  >
                    {label}
                    <span className="text-purple-500">{sortArrow(key)}</span>
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => {
                const isExpanded = expandedId === r.id;
                return (
                  <ResultRow
                    key={r.id}
                    result={r}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedId(isExpanded ? null : r.id)
                    }
                  />
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-400"
                  >
                    Нет результатов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== Pagination ====== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safeP === 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            &larr; Назад
          </button>
          <span className="text-sm text-gray-600">
            Страница {safeP} из {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeP === totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Далее &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

/* ========== Row sub-component ========== */
function ResultRow({
  result: r,
  isExpanded,
  onToggle,
}: {
  result: TestResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const code = getPersonalityCode(r);
  const riasec = r.report_json?.personality?.scores || r.report_json?.riasec;
  const topSpecialties: { name?: string; specialty?: string; finalPct?: number }[] =
    r.report_json?.topSpecialties || [];

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-gray-50 hover:bg-purple-50/40 cursor-pointer transition"
      >
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
          {formatDate(r.created_at)}
        </td>
        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
          {getName(r) || <span className="text-gray-300">--</span>}
        </td>
        <td className="px-4 py-3 text-gray-600">{getGrade(r) || "--"}</td>
        <td className="px-4 py-3 text-gray-600">{getCity(r) || "--"}</td>
        <td className="px-4 py-3">
          {code ? (
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {PERSONALITY_EMOJI[code] || "🧩"} {code}
            </span>
          ) : (
            <span className="text-gray-300">--</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
          {getTopSpecialtyName(r) || "--"}
        </td>
        <td className="px-4 py-3 font-semibold text-purple-600">
          {getTopSpecialtyPct(r) ? `${getTopSpecialtyPct(r)}%` : "--"}
        </td>
        <td className="px-4 py-3">
          <Link
            href={`/admin/results/${r.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
          >
            Открыть
          </Link>
        </td>
      </tr>

      {/* expanded mini-report */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-purple-50/50 px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {/* personality */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Тип личности
                </h4>
                {code ? (
                  <p className="text-sm font-medium text-gray-900">
                    {PERSONALITY_EMOJI[code] || "🧩"} {code} &mdash;{" "}
                    {PERSONALITY_NAMES[code] || code}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Нет данных</p>
                )}

                {/* RIASEC bars */}
                {riasec && (
                  <div className="mt-3 space-y-1.5">
                    {RIASEC_LABELS.map(({ key, label, color }) => {
                      const val =
                        typeof riasec === "object" && !Array.isArray(riasec)
                          ? (riasec as Record<string, number>)[key] ?? 0
                          : 0;
                      const maxVal = 100;
                      const pct = Math.min(100, (val / maxVal) * 100);
                      return (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <span className="w-36 text-gray-600">{label}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${color} h-2 rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-gray-500 tabular-nums">
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* top-5 specialties */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Топ-5 специальностей
                </h4>
                {topSpecialties.length > 0 ? (
                  <ol className="space-y-1.5">
                    {topSpecialties.slice(0, 5).map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-800">
                          <span className="text-gray-400 mr-1.5">{i + 1}.</span>
                          {s.name || s.specialty || "—"}
                        </span>
                        <span className="font-medium text-purple-600 tabular-nums">
                          {s.finalPct != null ? `${s.finalPct}%` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-400">Нет данных</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
