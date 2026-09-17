/**
 * Adaptive Practice Engine
 * ========================
 * A deterministic, rule-based engine that selects the next question
 * based on the student's current mastery level and question history.
 *
 * MASTERY TIERS & RULES:
 *   < 40%  → easy questions from the same micro-skill (remedial)
 *  40–70%  → mix of same-skill and related-skill questions, medium difficulty
 *   > 70%  → harder questions, related or mixed skills
 *
 * QUESTION SELECTION RULES:
 *  1. Prefer questions the student has NOT recently attempted.
 *  2. Never repeat a question in the same session.
 *  3. Within the same pool, prefer lower attempt counts (less seen).
 *  4. Tie-break by question ID for determinism.
 */

import type { Question, StudentProgress, Difficulty } from '../types';
import { getSkillMastery, getQuestionAttemptCount } from './progressStore';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export interface SelectionContext {
  targetSkillId: string | null;
  sessionQuestionIds: Set<string>;
  relatedSkillIds?: string[];
}

export interface RecommendedSkill {
  skillId: string;
  skillName: string;
  reason: string;
}

// ---------------------------------------------------------------
// Difficulty resolution
// ---------------------------------------------------------------

function masteryToDifficulty(mastery: number): Difficulty {
  if (mastery < 40) return 'easy';
  if (mastery < 70) return 'medium';
  return 'hard';
}

// ---------------------------------------------------------------
// Score a candidate question for selection
// Lower score = better candidate
// ---------------------------------------------------------------

function scoreQuestion(
  question: Question,
  progress: StudentProgress,
  preferredDifficulty: Difficulty,
  sessionIds: Set<string>,
): number {
  let score = 0;

  // Already used in this session → exclude
  if (sessionIds.has(question.id)) return Infinity;

  // Prefer fewer total attempts
  const attempts = getQuestionAttemptCount(progress, question.id);
  score += attempts * 10;

  // Difficulty match
  const diffMap: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
  const preferred = diffMap[preferredDifficulty];
  const actual = diffMap[question.difficulty] ?? 2;
  score += Math.abs(preferred - actual) * 5;

  // Small deterministic tie-break via question id string comparison
  score += question.id.charCodeAt(question.id.length - 1) / 1000;

  return score;
}

// ---------------------------------------------------------------
// Select the next question
// ---------------------------------------------------------------

export function selectNextQuestion(
  allQuestions: Question[],
  progress: StudentProgress,
  context: SelectionContext,
): Question | null {
  const { targetSkillId, sessionQuestionIds, relatedSkillIds } = context;

  const mastery = targetSkillId ? getSkillMastery(progress, targetSkillId) : 50;
  const preferredDifficulty = masteryToDifficulty(mastery);

  // Build candidate pool
  let pool: Question[] = [];

  if (targetSkillId) {
    // Primary pool: same skill
    pool = allQuestions.filter((q) => q.primary_skill_id === targetSkillId);

    // If mastery >= 40 and we have related skills, blend in related questions
    if (mastery >= 40 && relatedSkillIds && relatedSkillIds.length > 0) {
      const related = allQuestions.filter(
        (q) => relatedSkillIds.includes(q.primary_skill_id) && !sessionQuestionIds.has(q.id),
      );
      // Add related questions with a probability proportional to mastery
      const blendRatio = mastery >= 70 ? 0.5 : 0.3;
      const blendCount = Math.floor(related.length * blendRatio);
      pool = [...pool, ...related.slice(0, blendCount)];
    }
  } else {
    // No target — use all available questions (adaptive/diagnostic mode)
    pool = allQuestions;
  }

  // Filter out session questions and score remainder
  const candidates = pool
    .filter((q) => !sessionQuestionIds.has(q.id))
    .map((q) => ({ q, score: scoreQuestion(q, progress, preferredDifficulty, sessionQuestionIds) }))
    .filter((c) => c.score !== Infinity)
    .sort((a, b) => a.score - b.score);

  return candidates.length > 0 ? candidates[0].q : null;
}

// ---------------------------------------------------------------
// Diagnostic question selection
// ---------------------------------------------------------------
/**
 * Selects ~20 questions for the diagnostic test.
 * Strategy: sample broadly across canonical categories so the
 * diagnostic surfaces the student's weaknesses across the taxonomy.
 */
export function selectDiagnosticQuestions(
  allQuestions: Question[],
  count: number = 20,
): Question[] {
  // Group by canonical_category
  const byCategory: Record<string, Question[]> = {};
  for (const q of allQuestions) {
    const cat = q.canonical_category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(q);
  }

  const categories = Object.keys(byCategory);
  const result: Question[] = [];
  const usedIds = new Set<string>();

  // Round-robin across categories to maximise coverage
  let round = 0;
  while (result.length < count) {
    let added = 0;
    for (const cat of categories) {
      if (result.length >= count) break;
      const candidates = byCategory[cat].filter((q) => !usedIds.has(q.id));
      if (candidates.length === 0) continue;
      // Pick a question from this category (prefer medium difficulty for diagnostic)
      const mediums = candidates.filter((q) => q.difficulty === 'medium');
      const pool = mediums.length > 0 ? mediums : candidates;
      // Rotate through to avoid always picking first
      const idx = round % pool.length;
      const chosen = pool[idx];
      result.push(chosen);
      usedIds.add(chosen.id);
      added++;
    }
    round++;
    if (added === 0) break; // pool exhausted
  }

  return result.slice(0, count);
}

// ---------------------------------------------------------------
// Recommend next skill
// ---------------------------------------------------------------

export function getRecommendedSkill(
  progress: StudentProgress,
  allQuestions: Question[],
): RecommendedSkill | null {
  // Gather all known skills from questions
  const skillMeta: Record<string, { name: string; count: number }> = {};
  for (const q of allQuestions) {
    if (!skillMeta[q.primary_skill_id]) {
      skillMeta[q.primary_skill_id] = {
        name: q.canonical_micro_skill,
        count: 0,
      };
    }
    skillMeta[q.primary_skill_id].count++;
  }

  const allSkillIds = Object.keys(skillMeta);

  // Score each skill: low mastery + high question availability = high priority
  const scored = allSkillIds
    .map((id) => {
      const mastery = getSkillMastery(progress, id);
      const questionCount = skillMeta[id].count;
      // Skills never attempted score highest
      const attempted = progress.skillMastery[id]?.attempts ?? 0;
      const priority = (100 - mastery) * 0.7 + questionCount * 0.3 + (attempted === 0 ? 20 : 0);
      return { id, name: skillMeta[id].name, mastery, priority, attempted };
    })
    .sort((a, b) => b.priority - a.priority);

  const top = scored[0];
  if (!top) return null;

  let reason: string;
  if (top.attempted === 0) {
    reason = 'You have not practised this skill yet';
  } else if (top.mastery < 40) {
    reason = `Your mastery is ${top.mastery}% — targeted practice will help`;
  } else {
    reason = `Keep building on your ${top.mastery}% mastery`;
  }

  return { skillId: top.id, skillName: top.name, reason };
}
