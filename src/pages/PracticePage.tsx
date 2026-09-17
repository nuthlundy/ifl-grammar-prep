import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Question, AnswerLetter, PracticeSession, StudentProgress } from '../types';
import { QuestionCard, FeedbackCard } from '../components/QuestionCard';
import { PageWrapper, Card, Button, EmptyState } from '../components/ui';
import { selectNextQuestion, getRecommendedSkill } from '../engine/adaptiveEngine';
import { generateId } from '../utils';
import { CheckCircle, RotateCcw } from 'lucide-react';

interface PracticePageProps {
  progress: StudentProgress;
  allQuestions: Question[];
  onAttempt: (
    questionId: string, skillId: string, skillName: string, category: string,
    selected: AnswerLetter, correct: AnswerLetter, sessionId: string, difficulty: 'easy' | 'medium' | 'hard',
  ) => void;
  onBeginSession: (session: PracticeSession) => void;
  onEndSession: (id: string) => void;
}

type PracticePhase = 'question' | 'feedback' | 'finished';

const SESSION_MAX = 10;

export function PracticePage({ progress, allQuestions, onAttempt, onBeginSession, onEndSession }: PracticePageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetSkillId = searchParams.get('skill') ?? null;

  const sessionId = useMemo(() => generateId(), []);
  const sessionStarted = useMemo(() => {
    const session: PracticeSession = {
      id: sessionId,
      type: targetSkillId ? 'skill_practice' : 'practice',
      startedAt: new Date().toISOString(),
      completedAt: null,
      attempts: [],
      targetSkillId,
    };
    return session;
  }, [sessionId, targetSkillId]);

  const [phase, setPhase] = useState<PracticePhase>('question');
  const [sessionInitialised, setSessionInitialised] = useState(false);
  const [sessionQuestionIds, setSessionQuestionIds] = useState<Set<string>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(() => {
    return selectNextQuestion(allQuestions, progress, {
      targetSkillId,
      sessionQuestionIds: new Set(),
    });
  });
  const [lastAnswer, setLastAnswer] = useState<AnswerLetter | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionResults, setSessionResults] = useState({ correct: 0, total: 0 });

  const ensureSessionStarted = useCallback(() => {
    if (!sessionInitialised) {
      onBeginSession(sessionStarted);
      setSessionInitialised(true);
    }
  }, [sessionInitialised, onBeginSession, sessionStarted]);

  const handleAnswer = useCallback((letter: AnswerLetter) => {
    if (!currentQuestion) return;
    ensureSessionStarted();
    setLastAnswer(letter);
    const isCorrect = letter === currentQuestion.answer;
    onAttempt(
      currentQuestion.id,
      currentQuestion.primary_skill_id,
      currentQuestion.canonical_micro_skill,
      currentQuestion.canonical_category,
      letter,
      currentQuestion.answer,
      sessionId,
      currentQuestion.difficulty,
    );
    setSessionResults((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setPhase('feedback');
  }, [currentQuestion, ensureSessionStarted, onAttempt, sessionId]);

  const handleNext = useCallback(() => {
    if (!currentQuestion) return;
    const newIds = new Set(sessionQuestionIds);
    newIds.add(currentQuestion.id);
    setSessionQuestionIds(newIds);

    const newCount = sessionCount + 1;
    setSessionCount(newCount);

    if (newCount >= SESSION_MAX) {
      onEndSession(sessionId);
      setPhase('finished');
      return;
    }

    const next = selectNextQuestion(allQuestions, progress, {
      targetSkillId,
      sessionQuestionIds: newIds,
    });

    if (!next) {
      onEndSession(sessionId);
      setPhase('finished');
      return;
    }

    setCurrentQuestion(next);
    setLastAnswer(null);
    setPhase('question');
  }, [currentQuestion, sessionQuestionIds, sessionCount, onEndSession, sessionId, allQuestions, progress, targetSkillId]);

  const handleRestart = useCallback(() => {
    navigate(0); // Refresh page to restart
  }, [navigate]);

  if (!currentQuestion && phase !== 'finished') {
    return (
      <PageWrapper title="Adaptive Practice">
        <EmptyState
          title="No questions available"
          description="All questions for this skill have been practised. Try a different skill."
          action={<Button onClick={() => navigate('/grammar-map')}>Browse Grammar Map</Button>}
        />
      </PageWrapper>
    );
  }

  if (phase === 'question' && currentQuestion) {
    return (
      <PageWrapper>
        <div className="mb-2 text-xs text-slate-400 text-right">
          Session: {sessionCount + 1} / {SESSION_MAX}
        </div>
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          questionIndex={sessionCount}
          totalQuestions={SESSION_MAX}
          onAnswer={handleAnswer}
        />
      </PageWrapper>
    );
  }

  if (phase === 'feedback' && currentQuestion && lastAnswer) {
    return (
      <PageWrapper>
        <div className="mb-2 text-xs text-slate-400 text-right">
          Session: {sessionCount + 1} / {SESSION_MAX}
        </div>
        <FeedbackCard
          question={currentQuestion}
          selectedAnswer={lastAnswer}
          onNext={handleNext}
          isLast={sessionCount + 1 >= SESSION_MAX}
        />
      </PageWrapper>
    );
  }

  // Finished
  const accuracy = sessionResults.total > 0
    ? Math.round((sessionResults.correct / sessionResults.total) * 100)
    : 0;
  const recommended = getRecommendedSkill(progress, allQuestions);

  return (
    <PageWrapper title="Session Complete">
      <Card className="text-center py-8 space-y-3 mb-5">
        <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-3xl font-bold text-slate-900">{accuracy}%</p>
        <p className="text-slate-500 text-sm">
          {sessionResults.correct} correct out of {sessionResults.total} questions
        </p>
        {recommended && (
          <p className="text-xs text-blue-600 font-medium">
            Recommended next: {recommended.skillName}
          </p>
        )}
      </Card>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 gap-1" onClick={handleRestart}>
          <RotateCcw className="w-4 h-4" /> Practice Again
        </Button>
        <Button className="flex-1" onClick={() => navigate('/grammar-map')}>
          Grammar Map
        </Button>
      </div>
    </PageWrapper>
  );
}
