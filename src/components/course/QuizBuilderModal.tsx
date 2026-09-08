import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Quiz } from '../../types/database';

interface QuizOptionDraft {
  id?: string | number;
  option_text: string;
  is_correct: boolean;
  sequence_order: number;
}

interface QuizQuestionDraft {
  id?: string | number;
  question_text: string;
  question_type: string;
  points: number;
  explanation: string;
  sequence_order: number;
  options: QuizOptionDraft[];
}

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  /** Real FK — public.quizzes has no course_id/module_id column; a quiz attaches directly to a lesson. */
  lessonId: string | number;
  parentTitle: string;
  onSubmit: (input: {
    id?: string | number;
    lesson_id: string | number;
    title: string;
    description?: string;
    passing_score: number;
    time_limit_minutes?: number;
    questions: Array<{
      id?: string | number;
      question_text: string;
      question_type?: string;
      points?: number;
      explanation?: string;
      sequence_order: number;
      options: Array<{
        id?: string | number;
        option_text: string;
        is_correct: boolean;
        sequence_order: number;
      }>;
    }>;
  }) => Promise<void>;
}

export const QuizBuilderModal: React.FC<QuizBuilderModalProps> = ({
  isOpen,
  onClose,
  quiz,
  lessonId,
  parentTitle,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState<number>(70);
  const [timeLimit, setTimeLimit] = useState<number | ''>(10);
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title || '');
      setDescription(quiz.description || '');
      setPassingScore(quiz.passing_score ?? 70);
      setTimeLimit(quiz.time_limit_minutes || '');
      if (quiz.questions && quiz.questions.length > 0) {
        setQuestions(
          quiz.questions.map((q, idx) => ({
            id: q.id,
            question_text: q.question_text || '',
            question_type: q.question_type || 'SINGLE_CHOICE',
            points: q.points || 1,
            explanation: q.explanation || '',
            sequence_order: q.sequence_order || idx + 1,
            options: (q.options || []).map((opt, optIdx) => ({
              id: opt.id,
              option_text: opt.option_text || '',
              is_correct: Boolean(opt.is_correct),
              sequence_order: opt.sequence_order || optIdx + 1
            }))
          }))
        );
      } else {
        setQuestions([createDefaultQuestion(1)]);
      }
    } else {
      setTitle('');
      setDescription('');
      setPassingScore(70);
      setTimeLimit(10);
      setQuestions([createDefaultQuestion(1)]);
    }
    setActiveQuestionIndex(0);
    setError(null);
  }, [quiz, isOpen]);

  function createDefaultQuestion(order: number): QuizQuestionDraft {
    return {
      question_text: '',
      question_type: 'SINGLE_CHOICE',
      points: 1,
      explanation: '',
      sequence_order: order,
      options: [
        { option_text: '', is_correct: true, sequence_order: 1 },
        { option_text: '', is_correct: false, sequence_order: 2 },
        { option_text: '', is_correct: false, sequence_order: 3 },
        { option_text: '', is_correct: false, sequence_order: 4 }
      ]
    };
  }

  const handleAddQuestion = () => {
    const nextOrder = questions.length + 1;
    setQuestions([...questions, createDefaultQuestion(nextOrder)]);
    setActiveQuestionIndex(questions.length);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError('A quiz must have at least one question.');
      return;
    }
    const updated = questions.filter((_, idx) => idx !== index).map((q, idx) => ({
      ...q,
      sequence_order: idx + 1
    }));
    setQuestions(updated);
    setActiveQuestionIndex(Math.max(0, index - 1));
  };

  const handleUpdateCurrentQuestion = (field: keyof QuizQuestionDraft, value: any) => {
    const updated = [...questions];
    updated[activeQuestionIndex] = {
      ...updated[activeQuestionIndex],
      [field]: value
    };
    setQuestions(updated);
  };

  const handleUpdateOption = (optIdx: number, text: string) => {
    const updated = [...questions];
    const currentQ = updated[activeQuestionIndex];
    const newOptions = [...currentQ.options];
    newOptions[optIdx] = { ...newOptions[optIdx], option_text: text };
    updated[activeQuestionIndex] = { ...currentQ, options: newOptions };
    setQuestions(updated);
  };

  const handleSetCorrectOption = (correctIdx: number) => {
    const updated = [...questions];
    const currentQ = updated[activeQuestionIndex];
    const newOptions = currentQ.options.map((opt, idx) => ({
      ...opt,
      is_correct: idx === correctIdx
    }));
    updated[activeQuestionIndex] = { ...currentQ, options: newOptions };
    setQuestions(updated);
  };

  const handleAddOption = () => {
    const updated = [...questions];
    const currentQ = updated[activeQuestionIndex];
    if (currentQ.options.length >= 6) return;
    const newOptions = [
      ...currentQ.options,
      { option_text: '', is_correct: false, sequence_order: currentQ.options.length + 1 }
    ];
    updated[activeQuestionIndex] = { ...currentQ, options: newOptions };
    setQuestions(updated);
  };

  const handleRemoveOption = (optIdx: number) => {
    const updated = [...questions];
    const currentQ = updated[activeQuestionIndex];
    if (currentQ.options.length <= 2) {
      setError('Questions must have at least 2 options.');
      return;
    }
    const newOptions = currentQ.options.filter((_, idx) => idx !== optIdx);
    // If the removed option was the correct one, make the first one correct
    if (!newOptions.some(o => o.is_correct)) {
      newOptions[0].is_correct = true;
    }
    updated[activeQuestionIndex] = { ...currentQ, options: newOptions };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Quiz title is required.');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question #${i + 1} text cannot be empty.`);
        setActiveQuestionIndex(i);
        return;
      }
      if (q.options.length < 2) {
        setError(`Question #${i + 1} must have at least 2 options.`);
        setActiveQuestionIndex(i);
        return;
      }
      const emptyOpt = q.options.some(o => !o.option_text.trim());
      if (emptyOpt) {
        setError(`Question #${i + 1} contains empty answer choices.`);
        setActiveQuestionIndex(i);
        return;
      }
      const hasCorrect = q.options.some(o => o.is_correct);
      if (!hasCorrect) {
        setError(`Question #${i + 1} must have a correct answer selected.`);
        setActiveQuestionIndex(i);
        return;
      }
      const texts = q.options.map(o => o.option_text.trim().toLowerCase());
      if (new Set(texts).size < texts.length) {
        setError(`Question #${i + 1} has duplicate answer options.`);
        setActiveQuestionIndex(i);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: quiz?.id,
        lesson_id: lessonId,
        title: cleanTitle,
        description: description.trim() || undefined,
        passing_score: passingScore,
        time_limit_minutes: typeof timeLimit === 'number' ? timeLimit : undefined,
        questions: questions.map((q, idx) => ({
          id: q.id,
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          points: q.points || 1,
          explanation: q.explanation.trim() || undefined,
          sequence_order: idx + 1,
          options: q.options.map((opt, optIdx) => ({
            id: opt.id,
            option_text: opt.option_text.trim(),
            is_correct: opt.is_correct,
            sequence_order: optIdx + 1
          }))
        }))
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[activeQuestionIndex] || questions[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quiz ? 'Edit Assessment Quiz' : 'Create Assessment Quiz'}
      subtitle={`Attached to: ${parentTitle}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Quiz Master Properties */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="sm:col-span-3">
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Quiz Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Gold Loan Valuation Competency Assessment"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 bg-white font-medium text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Passing Threshold (%)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={10}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 bg-white font-medium text-slate-800 outline-none"
              />
              <span className="text-slate-500 font-bold">%</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Time Limit (Min)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              placeholder="No limit"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 bg-white font-medium text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Total Questions
            </label>
            <div className="px-3 py-2 rounded-xl bg-orange-100/60 border border-orange-200 text-orange-800 font-bold text-center">
              {questions.length} Questions
            </div>
          </div>
        </div>

        {/* Questions Manager Split View */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/80 border-b border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {questions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    activeQuestionIndex === idx
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Q{idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs transition flex items-center gap-1"
              >
                <span>+ Add Q</span>
              </button>
            </div>

            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveQuestion(activeQuestionIndex)}
                className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1 shrink-0 ml-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Q{activeQuestionIndex + 1}</span>
              </button>
            )}
          </div>

          {/* Active Question Editor */}
          {currentQ && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Question #{activeQuestionIndex + 1} Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={currentQ.question_text}
                  onChange={(e) => handleUpdateCurrentQuestion('question_text', e.target.value)}
                  placeholder="Enter the assessment question..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 font-medium text-slate-800 outline-none resize-none"
                />
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Answer Options (Select radio to designate correct answer) <span className="text-rose-500">*</span>
                  </label>
                  {currentQ.options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-orange-600 hover:text-orange-700 font-semibold text-[11px]"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {currentQ.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                        opt.is_correct
                          ? 'border-emerald-400 bg-emerald-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct_opt_${activeQuestionIndex}`}
                        checked={opt.is_correct}
                        onChange={() => handleSetCorrectOption(optIdx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <span className="font-mono font-bold text-slate-400 text-xs w-4">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <input
                        type="text"
                        value={opt.option_text}
                        onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)} text`}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-orange-500 bg-white text-slate-800 font-medium text-xs outline-none"
                      />
                      {opt.is_correct && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                          ✓ Correct
                        </span>
                      )}
                      {currentQ.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(optIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                          title="Remove option"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Answer Explanation / Regulatory Rationale (Shown upon review)
                </label>
                <input
                  type="text"
                  value={currentQ.explanation}
                  onChange={(e) => handleUpdateCurrentQuestion('explanation', e.target.value)}
                  placeholder="Explain why this answer is correct according to policy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 bg-white font-medium text-slate-800 text-xs outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-slate-400 text-[11px]">
            {questions.length} questions • Passing score: {passingScore}%
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Saving Quiz...</span>
                </>
              ) : (
                <span>{quiz ? 'Save Quiz Changes' : 'Create Quiz'}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
