import type {
  SkillMastery,
  QuestionAttempt,
  PracticeSession,
  StudentProgress,
} from '../types';

const STORAGE_KEY = 'ifl_grammar_progress_v1';
const PROGRESS_VERSION = 1;

// ---------------------------------------------------------------
// Default / factory helpers
// ---------------------------------------------------------------

export function createEmptyProgress(): StudentProgress {
  return {
    version: PROGRESS_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    skillMastery: {},
    questionHistory: {},
    sessions: [],
    diagnosticCompleted: false,
    totalAttempts: 0,
    totalCorrect: 0,
  };
}

export function createEmptySkillMastery(
  skillId: string,
  skillName: string,
  category: string,
): SkillMastery {
  return {
    skillId,
    skillName,
    category,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0,
    mastery: 0,
    consecutive_correct: 0,
    consecutive_incorrect: 0,
    last_attempted: null,
    difficulty_exposure: { easy: 0, medium: 0, hard: 0 },
  };
}

// ---------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------

export function loadProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as StudentProgress;
    // Version migration hook (future-proof)
    if (parsed.version !== PROGRESS_VERSION) return createEmptyProgress();
    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress: StudentProgress): void {
  try {
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded) — fail silently
    console.warn('[IFL] Failed to save progress to localStorage');
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

// ---------------------------------------------------------------
// Mastery calculation
// ---------------------------------------------------------------
/**
 * Mastery formula (transparent, explainable):
 *
 *   base_score = correct / attempts × 100
 *
 * We apply a recency-weighted moving average so that recent
 * performance has more impact than very old attempts:
 *
 *   mastery = base_score × (0.6 + 0.4 × recency_factor)
 *
 * recency_factor = min(attempts, 5) / 5   (saturates after 5 attempts)
 *
 * Additionally:
 *   - 3+ consecutive correct  → bonus +5 (capped at 100)
 *   - 3+ consecutive incorrect → penalty −5 (floor at 0)
 */
export function calculateMastery(skill: SkillMastery): number {
  if (skill.attempts === 0) return 0;

  const base = (skill.correct / skill.attempts) * 100;
  const recency = Math.min(skill.attempts, 5) / 5;
  let mastery = base * (0.6 + 0.4 * recency);

  if (skill.consecutive_correct >= 3) mastery = Math.min(100, mastery + 5);
  if (skill.consecutive_incorrect >= 3) mastery = Math.max(0, mastery - 5);

  return Math.round(mastery);
}

// ---------------------------------------------------------------
// Progress mutation helpers
// ---------------------------------------------------------------

export function recordAttempt(
  progress: StudentProgress,
  attempt: QuestionAttempt,
  skillName: string,
  category: string,
): StudentProgress {
  const { skillId, questionId, isCorrect, difficulty } = attempt;

  // Ensure skill entry
  if (!progress.skillMastery[skillId]) {
    progress.skillMastery[skillId] = createEmptySkillMastery(skillId, skillName, category);
  }

  const skill = progress.skillMastery[skillId];
  skill.attempts++;
  if (isCorrect) {
    skill.correct++;
    skill.consecutive_correct++;
    skill.consecutive_incorrect = 0;
  } else {
    skill.incorrect++;
    skill.consecutive_incorrect++;
    skill.consecutive_correct = 0;
  }
  skill.accuracy = Math.round((skill.correct / skill.attempts) * 100);
  skill.difficulty_exposure[difficulty]++;
  skill.last_attempted = attempt.timestamp;
  skill.mastery = calculateMastery(skill);

  // Question history
  if (!progress.questionHistory[questionId]) {
    progress.questionHistory[questionId] = [];
  }
  progress.questionHistory[questionId].push(attempt);

  progress.totalAttempts++;
  if (isCorrect) progress.totalCorrect++;

  return { ...progress };
}

export function startSession(
  progress: StudentProgress,
  session: PracticeSession,
): StudentProgress {
  return {
    ...progress,
    sessions: [...progress.sessions, session],
  };
}

export function completeSession(
  progress: StudentProgress,
  sessionId: string,
): StudentProgress {
  return {
    ...progress,
    sessions: progress.sessions.map((s) =>
      s.id === sessionId ? { ...s, completedAt: new Date().toISOString() } : s,
    ),
  };
}

export function markDiagnosticCompleted(progress: StudentProgress): StudentProgress {
  return { ...progress, diagnosticCompleted: true };
}

// ---------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------

export function getSkillMastery(
  progress: StudentProgress,
  skillId: string,
): number {
  return progress.skillMastery[skillId]?.mastery ?? 0;
}

export function getQuestionAttemptCount(
  progress: StudentProgress,
  questionId: string,
): number {
  return progress.questionHistory[questionId]?.length ?? 0;
}

export function getLastAttemptedQuestion(
  progress: StudentProgress,
  questionId: string,
): QuestionAttempt | undefined {
  const hist = progress.questionHistory[questionId];
  return hist ? hist[hist.length - 1] : undefined;
}

export function getWeakestSkills(
  progress: StudentProgress,
  n: number = 3,
): SkillMastery[] {
  return Object.values(progress.skillMastery)
    .filter((s) => s.attempts > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, n);
}

export function getStrongestSkills(
  progress: StudentProgress,
  n: number = 3,
): SkillMastery[] {
  return Object.values(progress.skillMastery)
    .filter((s) => s.attempts > 0)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, n);
}

export function getOverallAccuracy(progress: StudentProgress): number {
  if (progress.totalAttempts === 0) return 0;
  return Math.round((progress.totalCorrect / progress.totalAttempts) * 100);
}
