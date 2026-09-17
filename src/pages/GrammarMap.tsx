import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, PlayCircle, BookOpen, Calendar, BarChart2 } from 'lucide-react';
import type { StudentProgress, TaxonomyData, BlueprintData } from '../types';
import { Card, Button, MasteryBar, PageWrapper } from '../components/ui';
import { getSkillMastery } from '../engine/progressStore';
import { cn, priorityBadgeClass, priorityLabel, masteryLabel, formatPercent } from '../utils';

interface GrammarMapProps {
  progress: StudentProgress;
  taxonomy: TaxonomyData;
  blueprint: BlueprintData;
}

export function GrammarMap({ progress, taxonomy, blueprint }: GrammarMapProps) {
  const navigate = useNavigate();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  const blueprintMap: Record<string, (typeof blueprint.primary_skill_statistics)[0]> = {};
  for (const stat of blueprint.primary_skill_statistics) {
    blueprintMap[stat.canonical_micro_skill] = stat;
  }

  const toggleCat = (cat: string) =>
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const toggleSub = (sub: string) =>
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      next.has(sub) ? next.delete(sub) : next.add(sub);
      return next;
    });

  const categories = Object.keys(taxonomy).sort();

  return (
    <PageWrapper
      title="Grammar Map"
      subtitle="Explore all grammar skills tested in the IFL examination (2021–2025)"
    >
      <div className="mb-4 text-xs text-slate-500 flex items-center gap-4">
        <span>📚 {categories.length} categories</span>
        <span>🎯 {blueprint.total_authentic_questions} authentic IFL questions</span>
        <span>📅 {blueprint.exam_years.join(', ')}</span>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const subcats = taxonomy[cat];
          const subNames = Object.keys(subcats);
          const totalQuestions = subNames.reduce(
            (sum, sub) => sum + subcats[sub].reduce((s, sk) => s + sk.question_count, 0),
            0,
          );
          const isCatOpen = expandedCats.has(cat);

          return (
            <Card key={cat} padding={false} className="overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{cat}</p>
                    <p className="text-xs text-slate-400">{subNames.length} subcategories · {totalQuestions} questions</p>
                  </div>
                </div>
                {isCatOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Subcategories */}
              {isCatOpen && (
                <div className="border-t border-slate-100">
                  {subNames.map((sub) => {
                    const skills = subcats[sub];
                    const isSubOpen = expandedSubs.has(`${cat}/${sub}`);
                    const subTotal = skills.reduce((s, sk) => s + sk.question_count, 0);

                    return (
                      <div key={sub} className="border-b border-slate-50 last:border-0">
                        {/* Subcategory header */}
                        <button
                          onClick={() => toggleSub(`${cat}/${sub}`)}
                          className="w-full flex items-center justify-between px-5 py-3 pl-10 hover:bg-slate-50 transition-colors"
                        >
                          <div className="text-left">
                            <span className="text-sm text-slate-700 font-medium">{sub}</span>
                            <span className="ml-2 text-xs text-slate-400">{subTotal} questions</span>
                          </div>
                          {isSubOpen
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        </button>

                        {/* Skills */}
                        {isSubOpen && (
                          <div className="bg-slate-50/50 divide-y divide-slate-100">
                            {skills.map((skill) => {
                              const mastery = getSkillMastery(progress, skill.id);
                              const { label: mastLabel, color: mastColor } = masteryLabel(mastery);
                              const stat = blueprintMap[skill.name];
                              const priority = stat?.priority ?? 'low';

                              return (
                                <div key={skill.id} className="px-5 py-3 pl-14">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-800 leading-tight">{skill.name}</p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', priorityBadgeClass(priority))}>
                                          {priorityLabel(priority)}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                          <BarChart2 className="w-3 h-3" />
                                          {skill.question_count} IFL questions
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                          <Calendar className="w-3 h-3" />
                                          {skill.years_tested.join(', ')}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => navigate(`/skills/${skill.id}`)}
                                      className="shrink-0 gap-1 text-xs"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5" />
                                      View &amp; Practice
                                    </Button>
                                  </div>

                                  {/* Mastery bar */}
                                  <div className="flex items-center gap-2">
                                    <MasteryBar mastery={mastery} className="flex-1" />
                                    <span className={cn('text-xs font-medium shrink-0', mastColor)}>
                                      {mastery > 0 ? formatPercent(mastery) : mastLabel}
                                    </span>
                                  </div>

                                  {/* Historical evidence note */}
                                  {stat && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      Based on 2021–2025 dataset · tested {stat.number_of_years_tested}/5 years
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageWrapper>
  );
}
