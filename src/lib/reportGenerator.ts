/**
 * ProfiTest KZ v4 — Report Generator (TypeScript port)
 *
 * Transforms raw test scores into a structured report object
 * ready for the frontend to render.
 */

import {
  validateInput,
  isFlatProfile,
  getTop2Riasec,
  rankWithDiversity,
  detectStrengths,
  grantCompetitionTag,
  RIASEC_MAX,
  ABILITY_MAXES,
} from '@/lib/scoring';

import { SPECIALTIES } from '@/data/specialties';

import {
  PERSONALITY_TYPES,
  RIASEC_DIRECTIONS,
  LEVEL_SUBS,
  GROWTH_ZONES,
  ROLE_MODELS,
  SPEC_WHY,
  STRENGTH_DISPLAY,
  AI_TIER_TEMPLATES,
  ENT_BUNDLE_DETAILS,
  STEP4_BY_OBLAST,
  type LevelKey,
} from '@/data/reportTemplates';

// ── Types ───────────────────────────────────────────────

export interface PercentileItem {
  emoji: string;
  name: string;
  score: number;
  maxScore: number;
  pct: number;
  level: 'high' | 'mid' | 'low';
  badge: string;
  colorClass: string;
  sub: string;
}

export interface GrowthZoneItem {
  icon: string;
  title: string;
  text: string;
  tip: string;
}

export interface RoleModelItem {
  emoji: string;
  name: string;
  title: string;
  why: string;
  tag: string;
}

export interface TopSpecialty {
  rank: number;
  name: string;
  finalPct: number;
  match: number;
  aiResilience: number;
  entBundle: string;
  topUnis: string;
  region: string;
  aiTier: string;
  aiScore: number;
  monCode: string;
  salaryStart: string;
  salaryExperienced: string;
  salaryNote: string;
  grantCount: number | null;
  grantMinScore: number | null;
  grantTag: string;
  why: string;
}

export interface AiGroupItem {
  tier: string;
  icon: string;
  title: string;
  cssClass: string;
  text: string;
  specialties: string[];
}

export interface StepPlan {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  grantContext: string;
}

export interface ReportData {
  hero: { name: string };
  personality: {
    code: string;
    emoji: string;
    name: string;
    headline: string;
    description: string;
    tags: string[];
    isFlat: boolean;
  };
  percentiles: PercentileItem[];
  growthZones: GrowthZoneItem[];
  roleModels: RoleModelItem[];
  topSpecialties: TopSpecialty[];
  aiGroups: AiGroupItem[];
  stepPlan: StepPlan;
  context: {
    location: string;
    grantPref: string;
    salaryCaveat: string;
  };
}

// ── Helpers ─────────────────────────────────────────────

function scoreToLevel(score: number, maxScore: number): 'high' | 'mid' | 'low' {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.75) return 'high';
  if (ratio <= 0.25) return 'low';
  return 'mid';
}

// ── Build Percentiles ───────────────────────────────────

function buildPercentiles(riasec: number[]): PercentileItem[] {
  const items: PercentileItem[] = [];

  for (let i = 0; i < 6; i++) {
    const dir = RIASEC_DIRECTIONS[i];
    const score = riasec[i];
    const maxScore = RIASEC_MAX; // 8
    const pct = Math.round((score / maxScore) * 100);
    const level = scoreToLevel(score, maxScore);

    const badge =
      level === 'high' ? 'Высокий' : level === 'mid' ? 'Средний' : 'Низкий';

    const colorClass =
      level === 'high'
        ? 'text-green-600'
        : level === 'mid'
          ? 'text-yellow-600'
          : 'text-gray-400';

    const levelKey: LevelKey = `${i}_${level}`;
    const sub = LEVEL_SUBS[levelKey] ?? '';

    items.push({
      emoji: dir.emoji,
      name: dir.name,
      score,
      maxScore,
      pct,
      level,
      badge,
      colorClass,
      sub,
    });
  }

  // Sort by score descending (stable)
  items.sort((a, b) => b.score - a.score);

  return items;
}

// ── Build Growth Zones ──────────────────────────────────

function buildGrowthZones(
  riasec: number[],
  abilities: number[],
): GrowthZoneItem[] {
  const zones: GrowthZoneItem[] = [];

  // RIASEC low zones: score <= 2
  const riasecKeys = ['R', 'I', 'A', 'S', 'E', 'C'];
  for (let i = 0; i < 6; i++) {
    if (riasec[i] <= 2) {
      const key = `${riasecKeys[i]}_low`;
      const zone = GROWTH_ZONES[key];
      if (zone) {
        zones.push({ icon: zone.icon, title: zone.title, text: zone.text, tip: zone.tip });
      }
    }
    if (zones.length >= 3) break;
  }

  if (zones.length >= 3) return zones.slice(0, 3);

  // Ability low zones
  const abilityKeys = ['Verb', 'Num', 'Spat', 'Logic', 'Crit', 'Creat'];
  for (let i = 0; i < abilities.length; i++) {
    const mx = ABILITY_MAXES[i];
    let isLow = false;

    if (abilities[i] === 0) {
      isLow = true;
    } else if (mx > 1 && abilities[i] / mx <= 0.25) {
      isLow = true;
    }

    if (isLow) {
      const key = `${abilityKeys[i]}_low`;
      const zone = GROWTH_ZONES[key];
      if (zone) {
        zones.push({ icon: zone.icon, title: zone.title, text: zone.text, tip: zone.tip });
      }
    }
    if (zones.length >= 3) break;
  }

  return zones.slice(0, 3);
}

// ── Build Role Models ───────────────────────────────────

function buildRoleModels(top2Code: string): RoleModelItem[] {
  const results: RoleModelItem[] = [];

  // 1. Exact pair match
  for (const rm of ROLE_MODELS) {
    if (rm.pairs.includes(top2Code)) {
      results.push({
        emoji: rm.emoji,
        name: rm.name,
        title: rm.title,
        why: rm.why,
        tag: rm.tag,
      });
    }
    if (results.length >= 4) return results;
  }

  // 2. Models containing both letters
  if (results.length < 4 && top2Code.length === 2) {
    const [l1, l2] = [top2Code[0], top2Code[1]];
    for (const rm of ROLE_MODELS) {
      const already = results.some((r) => r.name === rm.name);
      if (already) continue;

      const hasBoth = rm.pairs.some(
        (p) => p.includes(l1) && p.includes(l2),
      );
      if (hasBoth) {
        results.push({
          emoji: rm.emoji,
          name: rm.name,
          title: rm.title,
          why: rm.why,
          tag: rm.tag,
        });
      }
      if (results.length >= 4) return results;
    }
  }

  // 3. Fallback: models with at least one letter
  if (results.length < 4 && top2Code.length >= 1) {
    for (const rm of ROLE_MODELS) {
      const already = results.some((r) => r.name === rm.name);
      if (already) continue;

      const hasAny = rm.pairs.some(
        (p) => p.includes(top2Code[0]) || (top2Code.length > 1 && p.includes(top2Code[1])),
      );
      if (hasAny) {
        results.push({
          emoji: rm.emoji,
          name: rm.name,
          title: rm.title,
          why: rm.why,
          tag: rm.tag,
        });
      }
      if (results.length >= 4) return results;
    }
  }

  return results.slice(0, 4);
}

// ── Resolve Why ─────────────────────────────────────────

function resolveWhy(
  specName: string,
  studentStrengths: Set<string>,
): string {
  const entry = SPEC_WHY[specName];
  if (!entry) return '';

  const [s1Key, s2Key, template] = entry;

  const display1 = STRENGTH_DISPLAY[s1Key] ?? s1Key;
  const display2 = STRENGTH_DISPLAY[s2Key] ?? s2Key;

  const tag1 = studentStrengths.has(s1Key) ? ` (топ)` : '';
  const tag2 = studentStrengths.has(s2Key) ? ` (топ)` : '';

  return template
    .replace('{s1}', display1 + tag1)
    .replace('{s2}', display2 + tag2);
}

// ── Build AI Groups ─────────────────────────────────────

function buildAiGroups(topSpecs: TopSpecialty[]): AiGroupItem[] {
  const tierOrder = ['Устойчивая', 'AI-усиленная', 'Средняя', 'Под угрозой'];
  const grouped: Record<string, string[]> = {};

  for (const spec of topSpecs) {
    const tier = spec.aiTier;
    if (!grouped[tier]) grouped[tier] = [];
    grouped[tier].push(spec.name);
  }

  const groups: AiGroupItem[] = [];
  for (const tier of tierOrder) {
    if (!grouped[tier] || grouped[tier].length === 0) continue;
    const tmpl = AI_TIER_TEMPLATES[tier];
    if (!tmpl) continue;

    groups.push({
      tier,
      icon: tmpl.icon,
      title: tmpl.title,
      cssClass: tmpl.cssClass,
      text: tmpl.text,
      specialties: grouped[tier],
    });
  }

  return groups;
}

// ── Build Step Plan ─────────────────────────────────────

function buildStepPlan(
  topSpecs: TopSpecialty[],
  location: string,
  grantPref: string,
): StepPlan {
  // Step 1: ENT bundle info
  const bundles = [...new Set(topSpecs.map((s) => s.entBundle))];
  const step1Parts: string[] = [];
  for (const bundle of bundles) {
    // Handle compound bundles like "Мат+Информ; Мат+Геогр"
    const subBundles = bundle.split(';').map((b) => b.trim());
    for (const sub of subBundles) {
      const detail = ENT_BUNDLE_DETAILS[sub];
      if (detail) {
        step1Parts.push(
          `📋 ${detail.full}: ${detail.passing_score} (${detail.grants_2024.toLocaleString('ru-RU')} грантов в 2024)`,
        );
      }
    }
  }
  const step1 = step1Parts.length > 0
    ? step1Parts.join('\n')
    : '📋 Информация по ЕНТ уточняется';

  // Step 2: Top universities from specs
  const uniSet = new Set<string>();
  for (const spec of topSpecs) {
    const unis = spec.topUnis.split(',').map((u) => u.trim());
    for (const u of unis) {
      uniSet.add(u);
    }
  }
  const topUniList = [...uniSet].slice(0, 8);
  const step2 = `🏫 Подходящие вузы: ${topUniList.join(', ')}`;

  // Step 3: Grant context
  const grantLines: string[] = [];
  for (const spec of topSpecs) {
    if (spec.grantCount != null && spec.grantMinScore != null) {
      grantLines.push(
        `🎓 ${spec.name}: ${spec.grantCount.toLocaleString('ru-RU')} грантов, от ${spec.grantMinScore} б.`,
      );
    }
  }
  const step3 = grantLines.length > 0
    ? grantLines.join('\n')
    : '🎓 Данные по грантам уточняются';

  // Step 4: Region-specific advice
  const regions = [...new Set(topSpecs.map((s) => s.region))];
  const step4Parts: string[] = [];
  for (const region of regions) {
    const advice = STEP4_BY_OBLAST[region];
    if (advice) {
      step4Parts.push(`📍 ${region}:\n${advice}`);
    }
  }
  const step4 = step4Parts.length > 0
    ? step4Parts.join('\n\n')
    : '📍 Советы по подготовке уточняются';

  // Grant context summary
  const grantContext =
    grantPref === 'grant_only'
      ? '🎯 Ты указал, что ориентируешься на грант. Обрати внимание на проходные баллы!'
      : grantPref === 'paid_ok'
        ? '💰 Ты готов рассматривать платное обучение — это расширяет выбор вузов.'
        : '📋 Выбор формы обучения остаётся за тобой.';

  return { step1, step2, step3, step4, grantContext };
}

// ── Main Report Generator ───────────────────────────────

export function generateReport(
  name: string,
  riasec: number[],
  abilities: number[],
  values: number[],
  location: string,
  grantPref: string,
): ReportData {
  // 1. Validate inputs
  validateInput(riasec, abilities, values);

  // 2. Personality type
  const code = getTop2Riasec(riasec);
  const flat = isFlatProfile(riasec);
  const pType = PERSONALITY_TYPES[code] ?? PERSONALITY_TYPES['FLAT'];

  // 3. Percentiles
  const percentiles = buildPercentiles(riasec);

  // 4. Growth zones
  const growthZones = buildGrowthZones(riasec, abilities);

  // 5. Role models
  const roleModels = buildRoleModels(code);

  // 6. Rank specialties
  const ranked = rankWithDiversity(riasec, abilities, values, SPECIALTIES, 5, 2);

  // 7. Detect student strengths
  const studentStrengths = detectStrengths(riasec, abilities, values);

  // 8. Build top specialties
  const topSpecialties: TopSpecialty[] = ranked.map((r, idx) => {
    const grantTag =
      r.grantCount != null && r.grantMinScore != null
        ? grantCompetitionTag(r.grantCount, r.grantMinScore)
        : '📊 Данные по грантам уточняются';

    return {
      rank: idx + 1,
      name: r.specialty,
      finalPct: r.finalPct,
      match: Math.round(r.match * 1000) / 10,
      aiResilience: Math.round(r.aiResilience * 1000) / 10,
      entBundle: r.entBundle,
      topUnis: r.topUnis,
      region: r.region,
      aiTier: r.aiTier,
      aiScore: r.aiScore,
      monCode: r.monCode,
      salaryStart: r.salaryStart,
      salaryExperienced: r.salaryExperienced,
      salaryNote: r.salaryNote,
      grantCount: r.grantCount,
      grantMinScore: r.grantMinScore,
      grantTag,
      why: resolveWhy(r.specialty, studentStrengths),
    };
  });

  // 9. AI groups
  const aiGroups = buildAiGroups(topSpecialties);

  // 10. Step plan
  const stepPlan = buildStepPlan(topSpecialties, location, grantPref);

  return {
    hero: { name },
    personality: {
      code,
      emoji: pType.emoji,
      name: pType.name,
      headline: pType.headline,
      description: pType.description,
      tags: [...pType.tags],
      isFlat: flat,
    },
    percentiles,
    growthZones,
    roleModels,
    topSpecialties,
    aiGroups,
    stepPlan,
    context: {
      location,
      grantPref,
      salaryCaveat:
        'Зарплаты указаны на основе данных рынка КЗ 2024 и могут отличаться в зависимости от региона, компании и опыта.',
    },
  };
}
