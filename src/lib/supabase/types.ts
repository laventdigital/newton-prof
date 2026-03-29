export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  grade: number;
  city: string | null;
  school: string | null;
  role: 'student' | 'admin' | 'manager';
  created_at: string;
}

export interface TestResult {
  id: string;
  user_id: string;
  riasec: number[];
  abilities: number[];
  values: number[];
  location: string;
  grant_pref: string;
  report_json: Record<string, unknown>;
  created_at: string;
}

export interface TestAnswer {
  id: string;
  result_id: string;
  question_id: string;
  answer: string;
  created_at: string;
}
