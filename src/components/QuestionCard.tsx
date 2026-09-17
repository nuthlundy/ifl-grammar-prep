import { useState } from 'react';
import type { Question, AnswerLetter } from '../types';
import { Card, Button, Badge } from './ui';
import { cn, difficultyColor } from '../utils';
import { CheckCircle, XCircle, BookOpen, AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------
// QuestionCard — displays the question and answer options
// ---------------------------------------------------------------
interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (letter: AnswerLetter) => void;
}

export function QuestionCard({ question, questionIndex, totalQuestions, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<AnswerLetter | null>(null);
  const optionLetters: AnswerLetter[] = ['A', 'B', 'C', 'D'];

  const handleSelect = (letter: AnswerLetter) => {
    if (selected) return; // already answered
    setSelected(letter);
    onAnswer(letter);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Question {questionIndex + 1} of {totalQuestions}</span>
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', difficultyColor(question.difficulty))}>
            {question.difficulty}
          </span>
          <span className="hidden sm:inline">{question.source_year} · Q{question.original_question_number}</span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card>
        <div className="flex items-start gap-2 mb-1">
          <Badge variant="blue" className="shrink-0">Authentic IFL Question</Badge>
        </div>
        <p className="mt-3 text-base sm:text-lg text-slate-900 leading-relaxed font-medium">
          {question.question_text}
        </p>
      </Card>

      {/* Options */}
      <div className="grid gap-3">
        {optionLetters.map((letter) => {
          const text = question.options[letter];
          const isSelected = selected === letter;
          const isAnswered = selected !== null;

          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={isAnswered}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                !isAnswered && 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer border-slate-200 bg-white',
                isAnswered && !isSelected && 'border-slate-200 bg-white opacity-60 cursor-not-allowed',
                isAnswered && isSelected && 'border-blue-500 bg-blue-50 cursor-not-allowed',
              )}
              aria-pressed={isSelected}
            >
              <span className={cn(
                'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                isAnswered && isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-600',
                !isAnswered && 'group-hover:border-blue-400',
              )}>
                {letter}
              </span>
              <span className="text-sm sm:text-base text-slate-800 pt-0.5">{text}</span>
            </button>
          );
        })}
      </div>

      {/* Provenance notice */}
      <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Answer verified by grammatical analysis · Not from an official answer key
      </p>
    </div>
  );
}

// ---------------------------------------------------------------
// FeedbackCard — displayed immediately after answering
// ---------------------------------------------------------------
interface FeedbackCardProps {
  question: Question;
  selectedAnswer: AnswerLetter;
  onNext: () => void;
  isLast: boolean;
}

export function FeedbackCard({ question, selectedAnswer, onNext, isLast }: FeedbackCardProps) {
  const isCorrect = selectedAnswer === question.answer;
  const exp = question.explanation;

  return (
    <div className="space-y-4">
      {/* Result Banner */}
      <div className={cn(
        'rounded-xl p-4 flex items-start gap-3',
        isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200',
      )}>
        {isCorrect
          ? <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          : <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
        }
        <div>
          <p className={cn('font-bold text-base', isCorrect ? 'text-emerald-800' : 'text-red-800')}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          {!isCorrect && (
            <p className="text-sm text-red-700 mt-0.5">
              You selected <strong>{selectedAnswer}</strong>: "{question.options[selectedAnswer]}". &nbsp;
              The correct answer is <strong>{question.answer}</strong>: "{question.options[question.answer]}".
            </p>
          )}
          {isCorrect && (
            <p className="text-sm text-emerald-700 mt-0.5">
              <strong>{question.answer}</strong>: "{question.options[question.answer]}"
            </p>
          )}
        </div>
      </div>

      {/* Skill tag */}
      <div className="flex flex-wrap gap-2 items-center">
        <BookOpen className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-medium text-slate-600">{question.canonical_category}</span>
        <span className="text-slate-300">›</span>
        <span className="text-xs text-slate-500">{question.canonical_subcategory}</span>
        <span className="text-slate-300">›</span>
        <span className="text-xs text-slate-500">{question.canonical_micro_skill}</span>
      </div>

      {/* Explanation */}
      <Card className="space-y-4 text-sm">
        {/* Grammar term + rule */}
        <div>
          <p className="font-semibold text-slate-800 mb-1">{exp.grammar_term}</p>
          <p className="text-slate-600">{exp.rule}</p>
        </div>

        {/* Formula */}
        {exp.formula && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 font-mono text-blue-800 text-xs">
            {exp.formula}
          </div>
        )}

        {/* Why correct */}
        <div>
          <p className="font-medium text-slate-700 mb-1">Why <strong>{question.answer}</strong> is correct:</p>
          <p className="text-slate-600">{exp.why_correct}</p>
        </div>

        {/* Why selected wrong option */}
        {!isCorrect && exp.why_wrong[selectedAnswer] && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="font-medium text-red-700 mb-1">
              Why <strong>{selectedAnswer}</strong> is incorrect:
            </p>
            <p className="text-red-600 text-xs sm:text-sm">{exp.why_wrong[selectedAnswer]}</p>
          </div>
        )}

        {/* All distractors */}
        <div>
          <p className="font-medium text-slate-700 mb-2">All options explained:</p>
          <div className="space-y-1.5">
            {(['A', 'B', 'C', 'D'] as AnswerLetter[]).map((letter) => {
              const isAns = letter === question.answer;
              return (
                <div key={letter} className={cn(
                  'flex gap-2 text-xs rounded-lg px-2 py-1.5',
                  isAns ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600',
                )}>
                  <span className={cn('font-bold shrink-0', isAns ? 'text-emerald-700' : 'text-slate-500')}>
                    {letter}.
                  </span>
                  <span>{exp.why_wrong[letter] ?? (isAns ? 'This is the correct answer.' : '')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common misconception */}
        {exp.common_misconception && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="font-medium text-amber-800 mb-1 text-xs">⚠ Common Misconception</p>
            <p className="text-amber-700 text-xs sm:text-sm">{exp.common_misconception}</p>
          </div>
        )}
      </Card>

      <Button onClick={onNext} size="lg" className="w-full">
        {isLast ? 'See Results' : 'Next Question'}
      </Button>
    </div>
  );
}
