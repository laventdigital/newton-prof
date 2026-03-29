/**
 * ProfiTest KZ v4 — Scoring Engine (TypeScript port)
 *
 * Formula:
 *   final_score = match * 0.7 + ai_resilience * 0.3
 *   match = cosine(student, specialty) weighted:
 *     - Layer 1 (RIASEC interests): 50%
 *     - Layer 2 (cognitive abilities): 25%
 *     - Layer 3 (work values): 25%
 */

import { Specialty } from '@/data/specialties';

// ── Constants ────────────────────────────────────────────

export const RIASEC_MAX = 8;
export const ABILITY_MAXES = [3, 4, 3, 2, 1, 1]; // Verb, Num, Spat, Logic, Crit, Creat
export const VALUE_MAXES = [9, 3, 9, 13, 9, 3];   // Inc, Stab, Creat, Auto, Soc, Pres

export const WEIGHT_RIASEC = 0.50;
export const WEIGHT_ABILITIES = 0.25;
export const WEIGHT_VALUES = 0.25;

export const WEIGHT_MATCH = 0.70;
export const WEIGHT_AI = 0.30;

export const RIASEC_LABELS = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export const ABILITY_LABELS = ['Verb', 'Num', 'Spat', 'Logic', 'Crit', 'Creat'] as const;
export const VALUE_LABELS = ['Inc', 'Stab', 'Creat', 'Auto', 'Soc', 'Pres'] as const;

// ── Personality Types (15 + 1 FLAT) ─────────────────────

export interface PersonalityType {
  emoji: string;
  name: string;
  headline: string;
  description: string;
  tags: string[];
}

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  FLAT: {
    emoji: '\u{1F31F}',
    name: 'Универсал',
    headline: 'Ты \u2014 универсал с широким кругозором',
    description:
      'У тебя нет одного явного направления \u2014 и это не слабость, а сила. ' +
      'Ты интересуешься всем понемногу и можешь адаптироваться к любой среде. ' +
      'Такие люди становятся лучшими менеджерами, предпринимателями и координаторами \u2014 ' +
      'потому что понимают всех в команде. Тебе подойдёт любая сфера, где нужен широкий взгляд.',
    tags: ['\u{1F31F} Адаптивность', '\u{1F504} Гибкость', '\u{1F91D} Понимание разных людей', '\u{1F3AF} Широкий кругозор'],
  },
  RI: {
    emoji: '\u{1F52C}\u{1F527}', name: 'Инженер-исследователь',
    headline: 'Ты \u2014 инженер-исследователь',
    description: 'Ты сочетаешь любовь к технике с глубоким любопытством. Тебе мало просто починить \u2014 ты хочешь понять, ПОЧЕМУ это работает.',
    tags: ['\u{1F527} Техническое мышление', '\u{1F9EA} Исследовательский подход', '\u{1F3AF} Точность', '\u{1F4A1} Изобретательность'],
  },
  RA: {
    emoji: '\u{1F527}\u{1F3A8}', name: 'Мастер-творец',
    headline: 'Ты \u2014 мастер, который творит руками',
    description: 'У тебя золотые руки И живое воображение. Ты не просто делаешь \u2014 ты создаёшь.',
    tags: ['\u{1F527} Мастерство', '\u{1F3A8} Визуальное мышление', '\u270B Ручная работа', '\u{1F3D7}\uFE0F Создание'],
  },
  RS: {
    emoji: '\u{1F527}\u2764\uFE0F', name: 'Практик-наставник',
    headline: 'Ты \u2014 практик с душой наставника',
    description: 'Ты умеешь делать руками \u2014 и умеешь объяснять другим.',
    tags: ['\u{1F527} Практические навыки', '\u{1F91D} Наставничество', '\u{1F4AA} Надёжность', '\u{1F393} Обучение'],
  },
  RE: {
    emoji: '\u{1F527}\u{1F680}', name: 'Технический лидер',
    headline: 'Ты \u2014 лидер, который строит',
    description: 'Ты не просто умеешь делать \u2014 ты умеешь организовать других.',
    tags: ['\u{1F527} Практичность', '\u{1F680} Лидерство', '\u{1F4CB} Управление проектами', '\u{1F4AA} Решительность'],
  },
  RC: {
    emoji: '\u{1F527}\u{1F4CA}', name: 'Системный инженер',
    headline: 'Ты \u2014 человек-система',
    description: 'Ты любишь, когда всё работает чётко и по правилам.',
    tags: ['\u{1F527} Техничность', '\u{1F4CA} Системность', '\u2705 Контроль качества', '\u{1F504} Процессы'],
  },
  IA: {
    emoji: '\u{1F9EA}\u{1F3A8}', name: 'Учёный-визионер',
    headline: 'Ты \u2014 учёный с художественным взглядом',
    description: 'У тебя редкое сочетание: аналитический ум + творческое восприятие.',
    tags: ['\u{1F9EA} Глубокий анализ', '\u{1F3A8} Креативность', '\u{1F4A1} Нестандартное мышление', '\u{1F52E} Визионерство'],
  },
  IS: {
    emoji: '\u{1F9EA}\u2764\uFE0F', name: 'Исследователь-наставник',
    headline: 'Ты \u2014 тот, кто понимает людей через науку',
    description: 'Ты любишь разбираться в сложном \u2014 и любишь помогать людям.',
    tags: ['\u{1F9EA} Аналитика', '\u2764\uFE0F Эмпатия', '\u{1F9E0} Понимание людей', '\u{1F3AF} Доказательный подход'],
  },
  IE: {
    emoji: '\u{1F9EA}\u{1F680}', name: 'Стратег-инноватор',
    headline: 'Ты \u2014 стратег, который меняет правила игры',
    description: 'Ты думаешь глубоко И мыслишь масштабно.',
    tags: ['\u{1F9EA} Аналитика', '\u{1F680} Амбиции', '\u{1F4BC} Стратегическое мышление', '\u{1F4A1} Инновации'],
  },
  IC: {
    emoji: '\u{1F9EA}\u{1F4CA}', name: 'Аналитик-архитектор',
    headline: 'Ты \u2014 архитектор систем и данных',
    description: 'Ты обожаешь сложные системы \u2014 разбирать их, понимать и оптимизировать.',
    tags: ['\u{1F9EA} Исследование', '\u{1F4CA} Структурность', '\u{1F9EE} Работа с данными', '\u{1F3AF} Точность'],
  },
  AS: {
    emoji: '\u{1F3A8}\u2764\uFE0F', name: 'Творец-гуманист',
    headline: 'Ты \u2014 творец, который заботится о людях',
    description: 'Тебе важно самовыражение и быть рядом с людьми.',
    tags: ['\u{1F3A8} Креативность', '\u{1F4AC} Коммуникация', '\u2764\uFE0F Эмпатия', '\u2728 Оригинальность'],
  },
  AE: {
    emoji: '\u{1F3A8}\u{1F680}', name: 'Креативный лидер',
    headline: 'Ты \u2014 лидер с творческим огнём',
    description: 'Ты не просто придумываешь \u2014 ты продвигаешь свои идеи и увлекаешь за собой.',
    tags: ['\u{1F3A8} Творческое мышление', '\u{1F680} Лидерство', '\u{1F4A1} Предприимчивость', '\u{1F525} Энергия'],
  },
  AC: {
    emoji: '\u{1F3A8}\u{1F4CA}', name: 'Дизайнер-систематик',
    headline: 'Ты \u2014 дизайнер, который думает системами',
    description: 'У тебя есть чувство прекрасного И любовь к порядку.',
    tags: ['\u{1F3A8} Эстетика', '\u{1F4CA} Структурность', '\u{1F5A5}\uFE0F Дизайн-системы', '\u{1F3AF} Внимание к деталям'],
  },
  SE: {
    emoji: '\u2764\uFE0F\u{1F680}', name: 'Лидер-наставник',
    headline: 'Ты \u2014 лидер с душой наставника',
    description: 'Ты умеешь вести за собой \u2014 не авторитарно, а вдохновляя.',
    tags: ['\u2764\uFE0F Эмпатия', '\u{1F680} Лидерство', '\u{1F91D} Командная работа', '\u{1F3AF} Целеустремлённость'],
  },
  SC: {
    emoji: '\u2764\uFE0F\u{1F4CA}', name: 'Организатор-помощник',
    headline: 'Ты \u2014 тот, на кого можно положиться',
    description: 'Ты заботишься о людях И умеешь организовать процесс.',
    tags: ['\u2764\uFE0F Забота', '\u{1F4CA} Организованность', '\u2705 Ответственность', '\u{1F91D} Командный игрок'],
  },
  EC: {
    emoji: '\u{1F680}\u{1F4CA}', name: 'Бизнес-архитектор',
    headline: 'Ты \u2014 бизнес-архитектор',
    description: 'Ты мыслишь как предприниматель и работаешь как аналитик.',
    tags: ['\u{1F680} Амбиции', '\u{1F4CA} Аналитика', '\u{1F4BC} Бизнес-мышление', '\u{1F3AF} Результативность'],
  },
};

// ── Match result interface ───────────────────────────────

export interface MatchResult {
  specialty: string;
  simRiasec: number;
  simAbilities: number;
  simValues: number;
  match: number;
  aiResilience: number;
  finalScore: number;
  finalPct: number;
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
}

// ── Normal Rounding ──────────────────────────────────────

/**
 * Normal rounding (0.5 rounds up), not banker's rounding.
 * Python: round(2.5) = 2 (WRONG for scoring)
 * This:   normalRound(2.5) = 3 (CORRECT)
 */
export function normalRound(x: number): number {
  return Math.floor(x + 0.5);
}

// ── Input Validation ─────────────────────────────────────

export function validateInput(
  riasec: number[],
  abilities: number[],
  values: number[],
): void {
  const errors: string[] = [];

  if (riasec.length !== 6) {
    errors.push(`RIASEC must have 6 elements, got ${riasec.length}`);
  }
  for (let i = 0; i < riasec.length; i++) {
    if (riasec[i] < 0 || riasec[i] > RIASEC_MAX) {
      errors.push(`RIASEC[${RIASEC_LABELS[i]}] = ${riasec[i]}, must be 0-${RIASEC_MAX}`);
    }
  }

  if (abilities.length !== 6) {
    errors.push(`Abilities must have 6 elements, got ${abilities.length}`);
  }
  for (let i = 0; i < abilities.length; i++) {
    if (abilities[i] < 0 || abilities[i] > ABILITY_MAXES[i]) {
      errors.push(`Ability[${ABILITY_LABELS[i]}] = ${abilities[i]}, must be 0-${ABILITY_MAXES[i]}`);
    }
  }

  if (values.length !== 6) {
    errors.push(`Values must have 6 elements, got ${values.length}`);
  }
  for (let i = 0; i < values.length; i++) {
    if (values[i] < 0 || values[i] > VALUE_MAXES[i]) {
      errors.push(`Value[${VALUE_LABELS[i]}] = ${values[i]}, must be 0-${VALUE_MAXES[i]}`);
    }
  }

  if (errors.length > 0) {
    throw new Error('Input validation failed:\n' + errors.join('\n'));
  }
}

// ── Cosine Similarity ────────────────────────────────────

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return Math.max(0, dot / (magA * magB));
}

// ── Normalization ────────────────────────────────────────

/** Normalize RIASEC scores (0-8) to 0-1 range */
export function normalizeRiasec(raw: number[]): number[] {
  return raw.map((v) => v / 8.0);
}

/** Normalize abilities to 0-1 using per-dimension max */
export function normalizeAbilities(raw: number[]): number[] {
  return raw.map((v, i) => (ABILITY_MAXES[i] > 0 ? v / ABILITY_MAXES[i] : 0));
}

/** Normalize values to 0-1 using per-dimension max, capped at 1.0 */
export function normalizeValues(raw: number[]): number[] {
  return raw.map((v, i) => (VALUE_MAXES[i] > 0 ? Math.min(1.0, v / VALUE_MAXES[i]) : 0));
}

/** Normalize specialty reference vector (1-5 scale) to 0-1 */
export function normalizeSpecVector(vec: number[]): number[] {
  return vec.map((v) => (v - 1) / 4.0);
}

// ── Compute Match ────────────────────────────────────────

export function computeMatch(
  studentRiasec: number[],
  studentAbilities: number[],
  studentValues: number[],
  spec: Specialty,
): MatchResult {
  // Normalize student vectors
  const sRiasec = normalizeRiasec(studentRiasec);
  const sAbilities = normalizeAbilities(studentAbilities);
  const sValues = normalizeValues(studentValues);

  // Normalize specialty vectors
  const spRiasec = normalizeSpecVector(spec.riasec);
  const spAbilities = normalizeSpecVector(spec.abilities);
  const spValues = normalizeSpecVector(spec.values);

  // Cosine similarity per layer
  const simRiasec = cosineSim(sRiasec, spRiasec);
  const simAbilities = cosineSim(sAbilities, spAbilities);
  const simValues = cosineSim(sValues, spValues);

  // Weighted match
  const match =
    WEIGHT_RIASEC * simRiasec +
    WEIGHT_ABILITIES * simAbilities +
    WEIGHT_VALUES * simValues;

  // AI resilience (0-1)
  const aiNorm = spec.ai_score / 100.0;

  // Final score
  const finalScore = WEIGHT_MATCH * match + WEIGHT_AI * aiNorm;

  return {
    specialty: spec.name,
    simRiasec: Math.round(simRiasec * 10000) / 10000,
    simAbilities: Math.round(simAbilities * 10000) / 10000,
    simValues: Math.round(simValues * 10000) / 10000,
    match: Math.round(match * 10000) / 10000,
    aiResilience: Math.round(aiNorm * 10000) / 10000,
    finalScore: Math.round(finalScore * 10000) / 10000,
    finalPct: Math.round(finalScore * 1000) / 10,
    entBundle: spec.ent_bundle,
    topUnis: spec.top_unis,
    region: spec.region,
    aiTier: spec.ai_tier,
    aiScore: spec.ai_score,
    monCode: spec.mon_code,
    salaryStart: spec.salary_start,
    salaryExperienced: spec.salary_experienced,
    salaryNote: spec.salary_note,
    grantCount: spec.grant_count,
    grantMinScore: spec.grant_min_score,
  };
}

// ── Score Abilities from Raw Answers ─────────────────────

/**
 * Convert 14 raw ability answers (0-2 each) to 6 ability dimensions.
 *
 * Groups:
 *   [0:3]  -> Verb  (max 3)   : A01, A02, A03
 *   [3:7]  -> Num   (max 4)   : A04, A05, A06, A07
 *   [7:10] -> Spat  (max 3)   : A08, A09, A10
 *   [10:12]-> Logic (max 2)   : A11, A12
 *   [12:13]-> Crit  (max 1)   : A13
 *   [13:14]-> Creat (max 1)   : A14
 *
 * Formula per group: min(normalRound(sum / 2), targetMax)
 */
export function scoreAbilitiesFromRaw(rawAnswers: number[]): number[] {
  if (rawAnswers.length !== 14) {
    throw new Error(`Expected 14 raw ability answers, got ${rawAnswers.length}`);
  }

  const groups: { start: number; end: number; targetMax: number }[] = [
    { start: 0, end: 3, targetMax: 3 },   // Verb
    { start: 3, end: 7, targetMax: 4 },   // Num
    { start: 7, end: 10, targetMax: 3 },  // Spat
    { start: 10, end: 12, targetMax: 2 }, // Logic
    { start: 12, end: 13, targetMax: 1 }, // Crit
    { start: 13, end: 14, targetMax: 1 }, // Creat
  ];

  return groups.map(({ start, end, targetMax }) => {
    const sum = rawAnswers.slice(start, end).reduce((a, b) => a + b, 0);
    return Math.min(normalRound(sum / 2), targetMax);
  });
}

// ── Score Values from Raw Counts ─────────────────────────

/**
 * Convert 6 raw value counts (0-5 each, from forced-choice tallying)
 * to scaled value dimensions.
 *
 * Formula: normalRound(raw / 5 * targetMax)
 * where targetMax = VALUE_MAXES[i]
 */
export function scoreValuesFromRaw(rawCounts: number[]): number[] {
  if (rawCounts.length !== 6) {
    throw new Error(`Expected 6 raw value counts, got ${rawCounts.length}`);
  }
  return rawCounts.map((raw, i) => normalRound((raw / 5) * VALUE_MAXES[i]));
}

// ── AI Score to Tier ─────────────────────────────────────

export function aiScoreToTier(score: number): string {
  if (score <= 39) return 'Под угрозой';
  if (score <= 49) return 'Средняя';
  if (score <= 63) return 'AI-усиленная';
  return 'Устойчивая';
}

// ── Flat Profile Detection ───────────────────────────────

export function isFlatProfile(riasec: number[], threshold = 0.25): boolean {
  const maxVal = Math.max(...riasec);
  if (maxVal === 0) return true;
  const spread = maxVal - Math.min(...riasec);
  return spread / RIASEC_MAX < threshold;
}

// ── Top-2 RIASEC Code ────────────────────────────────────

/**
 * Extract the top-2 RIASEC code (e.g. "RI", "AS") or "FLAT" if profile is flat.
 * Looks up in PERSONALITY_TYPES, tries reversed code if not found.
 */
export function getTop2Riasec(riasec: number[]): string {
  if (isFlatProfile(riasec)) return 'FLAT';

  const indexed = riasec.map((score, i) => ({ score, i }));
  // stable sort: by score desc, then by index asc
  indexed.sort((a, b) => b.score - a.score || a.i - b.i);

  let code = RIASEC_LABELS[indexed[0].i] + RIASEC_LABELS[indexed[1].i];

  if (!(code in PERSONALITY_TYPES)) {
    const reversed = code[1] + code[0];
    if (reversed in PERSONALITY_TYPES) {
      code = reversed;
    }
    // If neither exists, keep original code
  }

  return code;
}

// ── Rank with Diversity ──────────────────────────────────

/**
 * Rank specialties with diversity constraint (max N per region/oblast).
 * Returns top-N results after diversity filtering.
 */
export function rankWithDiversity(
  studentRiasec: number[],
  studentAbilities: number[],
  studentValues: number[],
  specialties: Specialty[],
  topN = 5,
  maxPerOblast = 2,
): MatchResult[] {
  const results = specialties.map((spec) =>
    computeMatch(studentRiasec, studentAbilities, studentValues, spec),
  );

  results.sort((a, b) => b.finalScore - a.finalScore);

  // Apply diversity filter
  const filtered: MatchResult[] = [];
  const oblastCount: Record<string, number> = {};

  for (const r of results) {
    const oblast = r.region;
    if ((oblastCount[oblast] ?? 0) < maxPerOblast) {
      filtered.push(r);
      oblastCount[oblast] = (oblastCount[oblast] ?? 0) + 1;
    }
    if (filtered.length >= topN) break;
  }

  return filtered;
}

// ── Detect Strengths ─────────────────────────────────────

/**
 * Determine which strength keys are active for this student.
 * For 1-question ability dims (max=1), score=1 triggers 'high'.
 */
export function detectStrengths(
  riasec: number[],
  abilities: number[],
  values: number[],
): Set<string> {
  const strengths = new Set<string>();

  // RIASEC-based (high if score >= 6 out of 8)
  const riasecMap: Record<number, string> = {
    0: 'technical_high',
    1: 'analytical_high',
    2: 'creativity_high',
    3: 'communication_high',
    4: 'enterprise_high',
    5: 'systematic_high',
  };
  for (let i = 0; i < riasec.length; i++) {
    if (riasec[i] >= 6) {
      strengths.add(riasecMap[i]);
    }
  }

  // Also check for "empathy_high" (S >= 5) and "leadership_high" (E >= 5)
  if (riasec[3] >= 5) strengths.add('empathy_high');
  if (riasec[4] >= 5) strengths.add('leadership_high');

  // Ability-based
  const abilityMap: Record<number, string> = {
    0: 'verbal_high',
    1: 'numerical_high',
    2: 'spatial_high',
    3: 'logic_high',
    4: 'critical_high',
    5: 'creative_ability',
  };
  for (let i = 0; i < abilities.length; i++) {
    const mx = ABILITY_MAXES[i];
    if (mx <= 1) {
      // Single-question: score=1 (only possible positive) -> high
      if (abilities[i] >= 1) strengths.add(abilityMap[i]);
    } else {
      // Multi-question: original threshold (score >= max)
      if (abilities[i] >= mx) strengths.add(abilityMap[i]);
    }
  }

  // Value-based (high if in top 2 by normalized score)
  const valueMap: Record<number, string> = {
    0: 'income_val',
    1: 'stability_val',
    2: 'creativity_high',
    3: 'autonomy_val',
    4: 'social_val',
    5: 'prestige_val',
  };
  const normed = values.map((v, i) => ({
    i,
    norm: VALUE_MAXES[i] > 0 ? v / VALUE_MAXES[i] : 0,
  }));
  normed.sort((a, b) => b.norm - a.norm);
  for (let k = 0; k < 2 && k < normed.length; k++) {
    strengths.add(valueMap[normed[k].i]);
  }

  return strengths;
}

// ── Grant Competition Tag ────────────────────────────────

export function grantCompetitionTag(grants: number, minScore: number): string {
  if (grants >= 1000 && minScore <= 75) {
    return `\u{1F7E2} Много грантов (${grants.toLocaleString('ru-RU')}), проходной невысокий (${minScore} б.)`;
  } else if (grants >= 500 && minScore <= 90) {
    return `\u{1F7E1} Средняя конкуренция (${grants.toLocaleString('ru-RU')} грантов, от ${minScore} б.)`;
  } else if (grants >= 200 && minScore <= 110) {
    return `\u{1F7E0} Конкурентно (${grants.toLocaleString('ru-RU')} грантов, от ${minScore} б.)`;
  } else if (minScore >= 115) {
    return `\u{1F534} Высокая конкуренция (от ${minScore} б., всего ${grants.toLocaleString('ru-RU')} грантов)`;
  } else {
    return `\u{1F4CA} ${grants.toLocaleString('ru-RU')} грантов, проходной от ${minScore} б.`;
  }
}
