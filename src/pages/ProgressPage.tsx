import { useNavigate } from 'react-router-dom';
import { Award, Target, RotateCcw, Calendar, BarChart2 } from 'lucide-react';
import type { StudentProgress } from '../types';
import { PageWrapper, Card, Button, StatCard, MasteryBar } from '../components/ui';
import { getOverallAccuracy, getWeakestSkills, getStrongestSkills } from '../engine/progressStore';
import { formatPercent, masteryLabel, cn } from '../utils';

interface ProgressPageProps {
  progress: StudentProgress;
  onReset: () => void;
}

export function ProgressPage({ progress, onReset }: ProgressPageProps) {
  const navigate = useNavigate();
  const accuracy = getOverallAccuracy(progress);
  const allSkills = Object.values(progress.skillMastery).filter((s) => s.attempts > 0);
  const strongSkills = getStrongestSkills(progress, 5);
  const weakSkills = getWeakestSkills(progress, 5);

  const categoryStats: Record<string, { mastery: number; attempts: number; correct: number; count: number }> = {};
  for (const skill of allSkills) {
    if (!categoryStats[skill.category]) {
      categoryStats[skill.category] = { mastery: 0, attempts: 0, correct: 0, count: 0 };
    }
    categoryStats[skill.category].mastery += skill.mastery;
    categoryStats[skill.category].attempts += skill.attempts;
    categoryStats[skill.category].correct += skill.correct;
    categoryStats[skill.category].count++;
  }

  const categoryList = Object.entries(categoryStats)
    .map(([cat, stats]) => ({ cat, avgMastery: Math.round(stats.mastery / stats.count), ...stats }))
    .sort((a, b) => b.avgMastery - a.avgMastery);

  const recentSessions = progress.sessions.filter((s) => s.completedAt).slice(-5).reverse();

  return (
    <PageWrapper title="My Progress" subtitle="Track your grammar learning journey">
      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Accuracy" value={formatPercent(accuracy)} sub="Overall" />
        <StatCard label="Questions" value={progress.totalAttempts} sub="Attempted" />
        <StatCard label="Correct" value={progress.totalCorrect} sub="Answers" />
        <StatCard label="Skills" value={allSkills.length} sub="Practised" />
      </div>

      {/* Category overview */}
      {categoryList.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-slate-800">Grammar Category Overview</h3>
          </div>
          <div className="space-y-3">
            {categoryList.map(({ cat, avgMastery, attempts, correct }) => {
              const { label: _label, color } = masteryLabel(avgMastery);
              const catColor =
                avgMastery >= 70 ? 'bg-emerald-500' :
                avgMastery >= 40 ? 'bg-amber-500' : 'bg-red-400';

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 font-medium truncate max-w-[60%]">{cat}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">{correct}/{attempts}</span>
                      <span className={cn('text-xs font-medium', color)}>{formatPercent(avgMastery)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${catColor} transition-all`} style={{ width: `${avgMastery}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        {/* Strong */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-slate-800">Strongest Skills</h3>
          </div>
          {strongSkills.length === 0 ? (
            <p className="text-sm text-slate-400">Complete questions to see your strengths.</p>
          ) : (
            <div className="space-y-3">
              {strongSkills.map((s) => (
                <div key={s.skillId}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-700 truncate max-w-[70%]">{s.skillName}</span>
                    <span className="text-xs font-medium text-emerald-600">{formatPercent(s.mastery)}</span>
                  </div>
                  <MasteryBar mastery={s.mastery} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Weak */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-slate-800">Needs Practice</h3>
          </div>
          {weakSkills.length === 0 ? (
            <p className="text-sm text-slate-400">Complete questions to see areas to improve.</p>
          ) : (
            <div className="space-y-3">
              {weakSkills.map((s) => (
                <div key={s.skillId} className="cursor-pointer" onClick={() => navigate(`/practice?skill=${s.skillId}`)}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-700 truncate max-w-[70%] hover:text-blue-600 transition-colors">{s.skillName}</span>
                    <span className="text-xs text-red-500 font-medium">{formatPercent(s.mastery)}</span>
                  </div>
                  <MasteryBar mastery={s.mastery} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-slate-800">Recent Sessions</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentSessions.map((s) => {
              const duration = s.completedAt && s.startedAt
                ? Math.round((new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)
                : null;
              return (
                <div key={s.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-700 capitalize">{s.type.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-400">{new Date(s.startedAt).toLocaleDateString()}</p>
                  </div>
                  {duration !== null && (
                    <span className="text-xs text-slate-400">{duration} min</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Reset */}
      <div className="border-t border-slate-200 pt-5 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-slate-700">Reset Progress</p>
          <p className="text-xs text-slate-400">Clear all mastery data and history</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm('Reset all progress? This cannot be undone.')) {
              onReset();
            }
          }}
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>
    </PageWrapper>
  );
}
