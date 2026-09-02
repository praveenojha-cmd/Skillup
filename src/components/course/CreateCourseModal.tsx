import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CreateCourseInput } from '../../types/database';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCourseInput) => Promise<void>;
  existingCategories: string[];
}

const DEFAULT_CATEGORIES = [
  'Gold Loan Product Knowledge',
  'Sales & Business Development',
  'Appraisal & Valuation Standards',
  'Customer Experience & Etiquette',
  'Collections & Retention',
  'Compliance, AML & KYC',
  'Branch & Vault Operations',
  'Information Security'
];

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingCategories
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gold Loan Product Knowledge');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Course title is required.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Please select or enter a valid category.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: cleanTitle,
        category: finalCategory,
        difficulty,
        estimated_duration_minutes: durationMinutes > 0 ? durationMinutes : 30,
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        status: 'DRAFT'
      });
      // Reset form
      setTitle('');
      setDescription('');
      setThumbnailUrl('');
      setDurationMinutes(30);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Course"
      subtitle="Define curriculum master details. Modules, lessons, and quizzes can be added next."
      maxWidth="lg"
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

        <div>
          <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
            Course Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Gold Loan Purity & Valuation Mastery"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Target Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium outline-none transition bg-white"
            >
              <option value="Beginner">Beginner (Foundational)</option>
              <option value="Intermediate">Intermediate (Practitioner)</option>
              <option value="Advanced">Advanced (Specialist / Leadership)</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Curriculum Category <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCustomCategory(!isCustomCategory)}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold"
            >
              {isCustomCategory ? '← Choose from list' : '+ Enter new category'}
            </button>
          </div>
          {isCustomCategory ? (
            <input
              type="text"
              required
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g., Regional Compliance & Audit"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition"
            />
          ) : (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium outline-none transition bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Estimated Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={600}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium outline-none transition"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Thumbnail Image URL (Optional)
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
            Curriculum Description & Learning Objectives
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline what employees will learn, skills acquired, and prerequisite knowledge..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition resize-none"
          />
        </div>

        {/* State hint */}
        <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-amber-800 text-[11px] flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            New courses are created in <strong>DRAFT</strong> status. You can construct modules, lessons, and assessment quizzes in the Curriculum Studio prior to publishing.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                <span>Creating Course...</span>
              </>
            ) : (
              <span>Create Course</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
