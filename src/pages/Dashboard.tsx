import { useNavigate } from 'react-router-dom';
import { Activity, BookOpen, Target, TrendingUp, ChevronRight, Star } from 'lucide-react';
import type { StudentProgress } from '../types';
import { Card, Button, StatCard, MasteryBar, PageWrapper } from '../components/ui';
import { getOverallAccuracy, getWeakestSkills, getStrongestSkills } from '../engine/progressStore';
import { useQuestions } from '../hooks/useData';
import { getRecommendedSkill } from '../engine/adaptiveEngine';
import { formatPercent, masteryLabel } from '../utils';

interface DashboardProps {
  progress: StudentProgress;
}

export function Dashboard({ progress }: DashboardProps) {
  const navigate = useNavigate();
  const questions = useQuestions();
  const accuracy = getOverallAccuracy(progress);
  const weakSkills = getWeakestSkills(progress, 3);
  const strongSkills = getStrongestSkills(progress, 3);
  const recommended = getRecommendedSkill(progress, questions);
  const hasStarted = progress.totalAttempts > 0;

  return (
    <PageWrapper
      title="Dashboard"
      subtitle="IFL English Entrance Examination — Grammar Preparation"
    >
      {/* Call-to-action banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {!progress.diagnosticCompleted
                ? 'Start your Diagnostic Test'
                : hasStarted
                ? 'Continue Practice'
                : 'Start Practising'}
            </h2>
            <p className="mt-1 text-blue-200 text-sm">
              {!progress.diagnosticCompleted
                ? '20 authentic IFL questions · Find your strengths and weaknesses'
                : recommended
                ? `Recommended: ${recommended.skillName}`
                : 'Keep practising to improve your mastery'}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {!progress.diagnosticCompleted && (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/diagnostic')}
                className="bg-white text-blue-700 hover:bg-blue-50 border-0"
              >
                Start Diagnostic
              </Button>
            )}
            {progress.diagnosticCompleted && (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/practice')}
                className="bg-white text-blue-700 hover:bg-blue-50 border-0"
              >
                Continue Practice
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Overall Mastery"
          value={formatPercent(accuracy)}
          sub={accuracy === 0 ? 'Not started' : accuracy < 50 ? 'Keep going!' : 'Great work!'}
        />
        <StatCard
          label="Questions Attempted"
          value={progress.totalAttempts}
          sub="Authentic IFL questions"
        />
        <StatCard
          label="Correct Answers"
          value={progress.totalCorrect}
          sub={`${formatPercent(accuracy)} accuracy`}
        />
        <StatCard
          label="Skills Practised"
          value={Object.values(progress.skillMastery).filter((s) => s.attempts > 0).length}
          sub="Grammar micro-skills"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        {/* Strengths */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-slate-800">Strongest Areas</h3>
          </div>
          {strongSkills.length === 0 ? (
            <p className="text-sm text-slate-400">Complete questions to see your strengths.</p>
          ) : (
            <div className="space-y-3">
              {strongSkills.map((s) => {
                const { label: _label, color } = masteryLabel(s.mastery);
                return (
                  <div key={s.skillId}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700 truncate max-w-[70%]">{s.skillName}</span>
                      <span className={`text-xs font-medium ${color}`}>{formatPercent(s.mastery)}</span>
                    </div>
                    <MasteryBar mastery={s.mastery} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Weaknesses */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-slate-800">Needs Practice</h3>
          </div>
          {weakSkills.length === 0 ? (
            <p className="text-sm text-slate-400">Complete questions to find areas to improve.</p>
          ) : (
            <div className="space-y-3">
              {weakSkills.map((s) => {
                const { label: mastLabel, color } = masteryLabel(s.mastery);
                return (
                  <div key={s.skillId}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700 truncate max-w-[70%]">{s.skillName}</span>
                      <span className={`text-xs font-medium ${color}`}>{mastLabel}</span>
                    </div>
                    <MasteryBar mastery={s.mastery} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recommended next */}
      {recommended && (
        <Card className="flex items-center justify-between gap-4 cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => navigate(`/practice?skill=${recommended.skillId}`)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Recommended Next</p>
              <p className="text-sm font-semibold text-slate-800">{recommended.skillName}</p>
              <p className="text-xs text-slate-400">{recommended.reason}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </Card>
      )}

      {/* Quick links */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: BookOpen, label: 'Grammar Map', to: '/grammar-map', color: 'text-purple-600 bg-purple-50' },
          { icon: Activity, label: 'Adaptive Practice', to: '/practice', color: 'text-blue-600 bg-blue-50' },
          { icon: TrendingUp, label: 'My Progress', to: '/progress', color: 'text-emerald-600 bg-emerald-50' },
        ].map(({ icon: Icon, label, to, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700">{label}</span>
          </button>
        ))}
      </div>
    </PageWrapper>
  );
}
