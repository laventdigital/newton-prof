/**
 * POST /api/test/submit
 *
 * Receives all 53 answers, scores them into RIASEC / abilities / values,
 * generates the full report, optionally saves to Supabase, and returns JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { QUESTIONS, type Question } from '@/data/questions';
import {
  scoreAbilitiesFromRaw,
  scoreValuesFromRaw,
  RIASEC_LABELS,
  VALUE_LABELS,
} from '@/lib/scoring';
import { generateReport } from '@/lib/reportGenerator';

// ── Request / Response types ────────────────────────────

interface AnswerItem {
  questionId: string;
  choice?: 'a' | 'b';   // for forced_choice (layers 1 & 3)
  value?: number;        // for scale_3 (layer 2)
}

interface SubmitBody {
  answers: AnswerItem[];
  name?: string;
  location?: string;
  grantPref?: string;
}

// ── Helpers ─────────────────────────────────────────────

/** Build a lookup map from question id to Question */
function buildQuestionMap(): Map<string, Question> {
  const map = new Map<string, Question>();
  for (const q of QUESTIONS) {
    map.set(q.id, q);
  }
  return map;
}

const QUESTION_MAP = buildQuestionMap();

// RIASEC letter → index
const RIASEC_INDEX: Record<string, number> = {};
for (let i = 0; i < RIASEC_LABELS.length; i++) {
  RIASEC_INDEX[RIASEC_LABELS[i]] = i;
}

// Value code → index
const VALUE_INDEX: Record<string, number> = {};
for (let i = 0; i < VALUE_LABELS.length; i++) {
  VALUE_INDEX[VALUE_LABELS[i]] = i;
}

// ── Score Layer 1: RIASEC ───────────────────────────────

function scoreLayer1(answers: AnswerItem[]): number[] {
  const riasec = [0, 0, 0, 0, 0, 0]; // R, I, A, S, E, C

  for (const ans of answers) {
    const q = QUESTION_MAP.get(ans.questionId);
    if (!q || q.layer !== 1 || q.type !== 'forced_choice') continue;

    if (ans.choice === 'a' && q.type_a) {
      const idx = RIASEC_INDEX[q.type_a];
      if (idx !== undefined) riasec[idx]++;
    } else if (ans.choice === 'b' && q.type_b) {
      const idx = RIASEC_INDEX[q.type_b];
      if (idx !== undefined) riasec[idx]++;
    }
  }

  return riasec;
}

// ── Score Layer 2: Abilities ────────────────────────────

function scoreLayer2(answers: AnswerItem[]): number[] {
  // Collect the 14 raw values in question order (A01..A14)
  const layer2Questions = QUESTIONS.filter((q) => q.layer === 2).sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const answerMap = new Map<string, number>();
  for (const ans of answers) {
    if (ans.value !== undefined) {
      answerMap.set(ans.questionId, ans.value);
    }
  }

  const rawAnswers: number[] = layer2Questions.map((q) => {
    const val = answerMap.get(q.id);
    return val !== undefined ? val : 0;
  });

  return scoreAbilitiesFromRaw(rawAnswers);
}

// ── Score Layer 3: Values ───────────────────────────────

function scoreLayer3(answers: AnswerItem[]): number[] {
  // Count how many times each value code is chosen
  const counts = [0, 0, 0, 0, 0, 0]; // Inc, Stab, Creat, Auto, Soc, Pres

  for (const ans of answers) {
    const q = QUESTION_MAP.get(ans.questionId);
    if (!q || q.layer !== 3 || q.type !== 'forced_choice') continue;

    if (ans.choice === 'a' && q.code_a) {
      const idx = VALUE_INDEX[q.code_a];
      if (idx !== undefined) counts[idx]++;
    } else if (ans.choice === 'b' && q.code_b) {
      const idx = VALUE_INDEX[q.code_b];
      if (idx !== undefined) counts[idx]++;
    }
  }

  return scoreValuesFromRaw(counts);
}

// ── POST handler ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitBody;

    // Validate
    if (!body.answers || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: 'Missing or invalid "answers" array' },
        { status: 400 },
      );
    }

    const name = body.name ?? 'Ученик';
    const location = body.location ?? '';
    const grantPref = body.grantPref ?? '';

    // Score each layer
    const riasec = scoreLayer1(body.answers);
    const abilities = scoreLayer2(body.answers);
    const values = scoreLayer3(body.answers);

    // Generate full report
    const report = generateReport(name, riasec, abilities, values, location, grantPref);

    // Optionally save to Supabase
    let savedId: string | null = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { data, error } = await supabase
          .from('test_results')
          .insert({
            name,
            location,
            grant_pref: grantPref,
            riasec,
            abilities,
            values,
            personality_code: report.personality.code,
            top_specialties: report.topSpecialties.map((s) => s.name),
            report_json: report,
          })
          .select('id')
          .single();

        if (!error && data) {
          savedId = data.id;
        }
      } catch {
        // Supabase save failed silently — report still returned
        console.warn('Supabase save skipped or failed');
      }
    }

    return NextResponse.json({
      success: true,
      resultId: savedId,
      report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Submit error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
