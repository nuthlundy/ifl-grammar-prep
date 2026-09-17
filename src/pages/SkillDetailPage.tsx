import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, ArrowLeft, BookOpen, Calendar, BarChart2, Hash } from 'lucide-react';
import type { Question, StudentProgress, TaxonomyData, BlueprintData } from '../types';
import { PageWrapper, Card, Button, MasteryBar, Badge } from '../components/ui';
import { getSkillMastery } from '../engine/progressStore';
import { cn, priorityBadgeClass, priorityLabel, masteryLabel, formatPercent } from '../utils';

interface SkillDetailPageProps {
  progress: StudentProgress;
  taxonomy: TaxonomyData;
  blueprint: BlueprintData;
  allQuestions: Question[];
}

export function SkillDetailPage({ progress, taxonomy, blueprint, allQuestions }: SkillDetailPageProps) {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();

  // Find skill metadata from taxonomy
  const skillEntry = useMemo(() => {
    for (const subcats of Object.values(taxonomy)) {
      for (const entries of Object.values(subcats)) {
        const found = entries.find((e) => e.id === skillId);
        if (found) return found;
      }
    }
    return null;
  }, [taxonomy, skillId]);

  // Blueprint stat
  const blueprintStat = useMemo(() => {
    if (!skillEntry) return null;
    return blueprint.primary_skill_statistics.find((s) => s.canonical_micro_skill === skillEntry.name) ?? null;
  }, [blueprint, skillEntry]);

  // Questions for this skill
  const skillQuestions = useMemo(
    () => allQuestions.filter((q) => q.primary_skill_id === skillId),
    [allQuestions, skillId],
  );

  if (!skillEntry || !skillId) {
    return (
      <PageWrapper title="Skill Not Found">
        <Card className="text-center py-10">
          <p className="text-slate-500">This skill could not be found in the taxonomy.</p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate('/grammar-map')}>
            Back to Grammar Map
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  const mastery = getSkillMastery(progress, skillId);
  const { label: mastLabel, color: mastColor } = masteryLabel(mastery);
  const priority = blueprintStat?.priority ?? 'low';

  // Group questions by year
  const byYear: Record<string, Question[]> = {};
  for (const q of skillQuestions) {
    const yr = String(q.source_year);
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(q);
  }

  return (
    <PageWrapper>
      {/* Back */}
      <button
        onClick={() => navigate('/grammar-map')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Grammar Map
      </button>

      {/* Skill header */}
      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', priorityBadgeClass(priority))}>
                {priorityLabel(priority)}
              </span>
              <Badge variant="blue">{skillEntry.category}</Badge>
              <Badge variant="slate">{skillEntry.subcategory}</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{skillEntry.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Grammar micro-skill from the IFL English Entrance Examination
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate(`/practice?skill=${skillId}`)}
            className="shrink-0 gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Start Practice
          </Button>
        </div>

        {/* Mastery */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Your Mastery</span>
            <span className={cn('text-sm font-semibold', mastColor)}>
              {mastery > 0 ? formatPercent(mastery) : mastLabel}
            </span>
          </div>
          <MasteryBar mastery={mastery} />
          {mastery === 0 && (
            <p className="text-xs text-slate-400 mt-1">Complete practice questions to build mastery.</p>
          )}
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <BarChart2 className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-slate-900">{skillEntry.question_count}</p>
          <p className="text-xs text-slate-500">IFL Questions</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-slate-900">{blueprintStat?.number_of_years_tested ?? 0}/5</p>
          <p className="text-xs text-slate-500">Years Tested</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <Hash className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{blueprintStat?.percentage ?? 0}%</p>
          <p className="text-xs text-slate-500">of Past Exams</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <BookOpen className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-slate-900">
            {progress.skillMastery[skillId]?.attempts ?? 0}
          </p>
          <p className="text-xs text-slate-500">Your Attempts</p>
        </div>
      </div>

      {/* Historical evidence */}
      {blueprintStat && (
        <Card className="mb-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Historical IFL Frequency
          </h3>
          <p className="text-xs text-slate-400 mb-3">Based on the 2021–2025 authentic IFL question dataset</p>
          <div className="grid grid-cols-5 gap-2">
            {[2021, 2022, 2023, 2024, 2025].map((yr) => {
              const count = blueprintStat.counts_by_year[String(yr)] ?? 0;
              return (
                <div key={yr} className="text-center">
                  <div className={cn(
                    'rounded-lg p-2 mb-1 text-lg font-bold',
                    count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400',
                  )}>
                    {count}
                  </div>
                  <p className="text-xs text-slate-500">{yr}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Available questions preview */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3">
          Authentic IFL Questions ({skillQuestions.length})
        </h3>
        {skillQuestions.length === 0 ? (
          <p className="text-sm text-slate-400">No questions available for this skill.</p>
        ) : (
          <div className="space-y-3">
            {skillQuestions.map((q) => {
              const attempted = (progress.questionHistory[q.id]?.length ?? 0) > 0;
              const lastAttempt = progress.questionHistory[q.id]?.slice(-1)[0];
              return (
                <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="shrink-0">
                    {attempted && lastAttempt ? (
                      <span className={cn(
                        'inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
                        lastAttempt.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                      )}>
                        {lastAttempt.isCorrect ? '✓' : '✗'}
                      </span>
                    ) : (
                      <span className="inline-block w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-xs font-bold flex items-center justify-center">
                        –
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 leading-snug line-clamp-2">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{q.source_year} · Q{q.original_question_number}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className={cn('text-xs font-medium', q.difficulty === 'easy' ? 'text-emerald-600' : q.difficulty === 'hard' ? 'text-red-500' : 'text-amber-600')}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {skillQuestions.length > 0 && (
          <Button
            className="w-full mt-4"
            onClick={() => navigate(`/practice?skill=${skillId}`)}
          >
            <PlayCircle className="w-4 h-4" />
            Practice This Skill
          </Button>
        )}
      </Card>
    </PageWrapper>
  );
}
