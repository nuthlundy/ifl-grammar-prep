import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question, AnswerLetter, PracticeSession, StudentProgress } from '../types';
import { QuestionCard, FeedbackCard } from '../components/QuestionCard';
import { PageWrapper, Button, Card } from '../components/ui';
import { selectDiagnosticQuestions } from '../engine/adaptiveEngine';
import { generateId } from '../utils';
import { CheckCircle, ClipboardList } from 'lucide-react';

interface DiagnosticProps {
  progress: StudentProgress;
  onAttempt: (
    questionId: string, skillId: string, skillName: string, category: string,
    selected: AnswerLetter, correct: AnswerLetter, sessionId: string, difficulty: 'easy' | 'medium' | 'hard',
  ) => void;
  onBeginSession: (session: PracticeSession) => void;
  onEndSession: (id: string) => void;
  onFinishDiagnostic: () => void;
  allQuestions: Question[];
}

type DiagnosticPhase = 'intro' | 'question' | 'feedback' | 'results';

type DiagnosticResults = {
  correct: number;
  total: number;
  skills: Record<string, { name: string; attempts: number; correct: number }>;
};

/**
 * Reconstruct diagnostic results from persisted progress data.
 *
 * PracticeSession.attempts is always [] — the store never populates it.
 * Instead, every attempt is stored in progress.questionHistory[questionId][]
 * and each QuestionAttempt carries the sessionId it belongs to.
 * We find the diagnostic session id then filter questionHistory by that id.
 */
function buildResultsFromProgress(progress: StudentProgress): DiagnosticResults {
  const diagSession =
    progress.sessions.find((s) => s.type === 'diagnostic' && s.completedAt !== null) ??
    progress.sessions.find((s) => s.type === 'diagnostic');

  if (!diagSession) return { correct: 0, total: 0, skills: {} };

  const diagAttempts = Object.values(progress.questionHistory)
    .flat()
    .filter((a) => a.sessionId === diagSession.id);

  if (diagAttempts.length === 0) return { correct: 0, total: 0, skills: {} };

  const skills: Record<string, { name: string; attempts: number; correct: number }> = {};
  let correct = 0;
  let total = 0;

  for (const attempt of diagAttempts) {
    total++;
    if (attempt.isCorrect) correct++;

    const skillName = progress.skillMastery[attempt.skillId]?.skillName ?? attempt.skillId;
    const existing = skills[attempt.skillId];
    if (existing) {
      existing.attempts++;
      if (attempt.isCorrect) existing.correct++;
    } else {
      skills[attempt.skillId] = {
        name: skillName,
        attempts: 1,
        correct: attempt.isCorrect ? 1 : 0,
      };
    }
  }

  return { correct, total, skills };
}

export function DiagnosticPage({
  progress, onAttempt, onBeginSession, onEndSession, onFinishDiagnostic, allQuestions,
}: DiagnosticProps) {
  const navigate = useNavigate();
  const sessionId = useMemo(() => generateId(), []);

  const questions = useMemo(() => selectDiagnosticQuestions(allQuestions, 20), [allQuestions]);

  const [phase, setPhase] = useState<DiagnosticPhase>(progress.diagnosticCompleted ? 'results' : 'intro');
  const [index, setIndex] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<AnswerLetter | null>(null);

  // When diagnosticCompleted is already true on mount (re-visit or refresh), derive results
  // from the persisted questionHistory so we never show 0/0 correct.
  // During an active session the live setResults calls update this normally.
  const [results, setResults] = useState<DiagnosticResults>(() =>
    progress.diagnosticCompleted
      ? buildResultsFromProgress(progress)
      : { correct: 0, total: 0, skills: {} },
  );

  const currentQuestion = questions[index];

  const handleStart = useCallback(() => {
    const session: PracticeSession = {
      id: sessionId,
      type: 'diagnostic',
      startedAt: new Date().toISOString(),
      completedAt: null,
      attempts: [],
      targetSkillId: null,
    };
    onBeginSession(session);
    setPhase('question');
  }, [onBeginSession, sessionId]);

  const handleAnswer = useCallback((letter: AnswerLetter) => {
    if (!currentQuestion) return;
    setLastAnswer(letter);
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

    const isCorrect = letter === currentQuestion.answer;
    setResults((prev) => {
      const skill = prev.skills[currentQuestion.primary_skill_id] ?? {
        name: currentQuestion.canonical_micro_skill,
        attempts: 0,
        correct: 0,
      };
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        skills: {
          ...prev.skills,
          [currentQuestion.primary_skill_id]: {
            ...skill,
            attempts: skill.attempts + 1,
            correct: skill.correct + (isCorrect ? 1 : 0),
          },
        },
      };
    });

    setPhase('feedback');
  }, [currentQuestion, onAttempt, sessionId]);

  const handleNext = useCallback(() => {
    if (index + 1 >= questions.length) {
      // Diagnostic complete
      onEndSession(sessionId);
      onFinishDiagnostic();
      setPhase('results');
    } else {
      setIndex((i) => i + 1);
      setLastAnswer(null);
      setPhase('question');
    }
  }, [index, questions.length, onEndSession, onFinishDiagnostic, sessionId]);

  // ------ INTRO ------
  if (phase === 'intro') {
    return (
      <PageWrapper title="Diagnostic Test" subtitle="Find your grammar strengths and weaknesses">
        <Card className="text-center py-8 space-y-4 max-w-lg mx-auto">
          <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Grammar Diagnostic</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            20 authentic IFL questions covering all grammar categories.
            After completing, you will receive your personalised grammar profile.
          </p>
          <div className="flex flex-col gap-2 text-xs text-slate-400 items-center">
            <span>• 200 authentic IFL questions (2021-2025)</span>
            <span>• Immediate explanation after each answer</span>
            <span>• No timer — focus on understanding</span>
          </div>
          <Button size="lg" onClick={handleStart}>Start Diagnostic</Button>
        </Card>
      </PageWrapper>
    );
  }

  // ------ QUESTION ------
  if (phase === 'question' && currentQuestion) {
    return (
      <PageWrapper>
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          questionIndex={index}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      </PageWrapper>
    );
  }

  // ------ FEEDBACK ------
  if (phase === 'feedback' && currentQuestion && lastAnswer) {
    return (
      <PageWrapper>
        <FeedbackCard
          question={currentQuestion}
          selectedAnswer={lastAnswer}
          onNext={handleNext}
          isLast={index + 1 >= questions.length}
        />
      </PageWrapper>
    );
  }

  // ------ RESULTS ------
  const accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
  const skillsList = Object.entries(results.skills).sort(
    (a, b) => (b[1].correct / b[1].attempts) - (a[1].correct / a[1].attempts),
  );

  return (
    <PageWrapper title="Diagnostic Complete" subtitle="Your Grammar Profile">
      <Card className="mb-5 text-center py-6">
        <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-3xl font-bold text-slate-900">{accuracy}%</p>
        <p className="text-slate-500 text-sm mt-1">{results.correct} / {results.total} correct</p>
      </Card>

      <Card className="mb-5">
        <h3 className="font-semibold text-slate-800 mb-3">Your Grammar Profile</h3>
        <div className="space-y-3">
          {skillsList.map(([id, s]) => {
            const pct = Math.round((s.correct / s.attempts) * 100);
            const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400';
            return (
              <div key={id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 truncate max-w-[70%]">{s.name}</span>
                  <span className="text-slate-500 text-xs">{pct}% ({s.correct}/{s.attempts})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/grammar-map')} className="flex-1">
          View Grammar Map
        </Button>
        <Button onClick={() => navigate('/practice')} className="flex-1">
          Start Practice
        </Button>
      </div>
    </PageWrapper>
  );
}
