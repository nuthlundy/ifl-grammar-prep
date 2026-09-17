import { useMemo } from 'react';
import type { Question, TaxonomyData, BlueprintData } from '../types';
import questionsRaw from '../data/questions.json';
import taxonomyRaw from '../data/taxonomy.json';
import blueprintRaw from '../data/blueprint.json';

// Cast the raw JSON imports to our types
export const allQuestions: Question[] = questionsRaw as Question[];
export const taxonomy: TaxonomyData = taxonomyRaw as TaxonomyData;
export const blueprint: BlueprintData = blueprintRaw as BlueprintData;

export function useQuestions() {
  return useMemo(() => allQuestions, []);
}

export function useQuestionById(id: string): Question | undefined {
  return useMemo(() => allQuestions.find((q) => q.id === id), [id]);
}

export function useQuestionsBySkill(skillId: string): Question[] {
  return useMemo(() => allQuestions.filter((q) => q.primary_skill_id === skillId), [skillId]);
}

export function useTaxonomy() {
  return useMemo(() => taxonomy, []);
}

export function useBlueprint() {
  return useMemo(() => blueprint, []);
}

/** All unique canonical categories */
export function useCategories(): string[] {
  return useMemo(() => Object.keys(taxonomy), []);
}

/** Returns blueprint stat for a given micro-skill name */
export function useBlueprintSkill(microSkillName: string) {
  return useMemo(
    () => blueprint.primary_skill_statistics.find((s) => s.canonical_micro_skill === microSkillName),
    [microSkillName],
  );
}
