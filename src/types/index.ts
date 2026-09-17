// ============================================================
// Core data types mirroring the JSON schema in questions.json
// ============================================================

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface QuestionExplanation {
  correct_answer: string;
  grammar_term: string;
  rule: string;
  formula: string;
  why_correct: string;
  why_wrong: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    [key: string]: string | undefined;
  };
  common_misconception: string;
}

export type AnswerLetter = 'A' | 'B' | 'C' | 'D';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AnswerProvenance = 'independently_solved_by_agent' | 'verified_from_official_key';

export interface Question {
  id: string;
  source_year: number;
  source_exam: string;
  source_file: string;
  source_page: number;
  original_question_number: number;
  original_section: string;
  content_type: string;
  provenance: string;
  question_text: string;
  options: QuestionOptions;
  answer: AnswerLetter;
  answer_confidence: string;
  primary_skill: string;
  secondary_skills: string[];
  grammar_category: string;
  grammar_subcategory: string;
  micro_skill: string;
  difficulty: Difficulty;
  difficulty_score: number;
  difficulty_basis: string;
  explanation: QuestionExplanation;
  answer_provenance: AnswerProvenance;
  canonical_category: string;
  canonical_subcategory: string;
  canonical_micro_skill: string;
  primary_skill_id: string;
  secondary_skill_ids?: string[];
  original_micro_skill?: string;
  answer_verification_status?: string;
}

// ============================================================
// Taxonomy types
// ============================================================

export interface TaxonomySkillEntry {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  question_count: number;
  years_tested: (number | string)[];
}

export type TaxonomySubcategory = Record<string, TaxonomySkillEntry[]>;
export type TaxonomyData = Record<string, TaxonomySubcategory>;

// ============================================================
// Blueprint types
// ============================================================

export interface BlueprintStatistic {
  canonical_micro_skill: string;
  counts_by_year: Record<string, number>;
  total_primary_frequency: number;
  percentage: number;
  number_of_years_tested: number;
  first_year_observed: string;
  most_recent_year_observed: string;
  priority: 'very_high' | 'high' | 'medium' | 'low' | 'emerging';
}

export interface BlueprintData {
  exam_years: number[];
  total_authentic_questions: number;
  questions_per_year: number;
  primary_skill_statistics: BlueprintStatistic[];
  methodology: string;
}

// ============================================================
// Student progress types
// ============================================================

export interface SkillMastery {
  skillId: string;
  skillName: string;
  category: string;
  attempts: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  /** 0–100 mastery score */
  mastery: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  last_attempted: string | null;
  difficulty_exposure: Record<Difficulty, number>;
}

export interface QuestionAttempt {
  questionId: string;
  skillId: string;
  selectedAnswer: AnswerLetter;
  isCorrect: boolean;
  timestamp: string;
  sessionId: string;
  difficulty: Difficulty;
}

export type SessionType = 'diagnostic' | 'practice' | 'skill_practice';

export interface PracticeSession {
  id: string;
  type: SessionType;
  startedAt: string;
  completedAt: string | null;
  attempts: QuestionAttempt[];
  targetSkillId: string | null;
}

export interface StudentProgress {
  version: number;
  createdAt: string;
  updatedAt: string;
  skillMastery: Record<string, SkillMastery>;
  questionHistory: Record<string, QuestionAttempt[]>;
  sessions: PracticeSession[];
  diagnosticCompleted: boolean;
  totalAttempts: number;
  totalCorrect: number;
}
