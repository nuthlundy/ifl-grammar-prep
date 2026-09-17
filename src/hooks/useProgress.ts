import { useCallback, useEffect, useState } from 'react';
import type { StudentProgress, QuestionAttempt, PracticeSession, AnswerLetter, Difficulty } from '../types';
import {
  loadProgress,
  saveProgress,
  clearProgress,
  createEmptyProgress,
  recordAttempt,
  startSession,
  completeSession,
  markDiagnosticCompleted,
} from '../engine/progressStore';

export function useProgress() {
  const [progress, setProgress] = useState<StudentProgress>(() => loadProgress());

  // Persist on every change
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const addAttempt = useCallback(
    (
      questionId: string,
      skillId: string,
      skillName: string,
      category: string,
      selectedAnswer: AnswerLetter,
      correctAnswer: AnswerLetter,
      sessionId: string,
      difficulty: Difficulty,
    ) => {
      const attempt: QuestionAttempt = {
        questionId,
        skillId,
        selectedAnswer,
        isCorrect: selectedAnswer === correctAnswer,
        timestamp: new Date().toISOString(),
        sessionId,
        difficulty,
      };
      setProgress((prev) => recordAttempt({ ...prev }, attempt, skillName, category));
      return attempt;
    },
    [],
  );

  const beginSession = useCallback((session: PracticeSession) => {
    setProgress((prev) => startSession({ ...prev }, session));
  }, []);

  const endSession = useCallback((sessionId: string) => {
    setProgress((prev) => completeSession({ ...prev }, sessionId));
  }, []);

  const finishDiagnostic = useCallback(() => {
    setProgress((prev) => markDiagnosticCompleted({ ...prev }));
  }, []);

  const resetProgress = useCallback(() => {
    clearProgress();
    setProgress(createEmptyProgress());
  }, []);

  return {
    progress,
    addAttempt,
    beginSession,
    endSession,
    finishDiagnostic,
    resetProgress,
  };
}
