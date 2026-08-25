import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Module } from '../../types/database';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module | null;
  courseTitle: string;
  nextOrder: number;
  onSubmit: (input: { title: string; description?: string; sequence_order?: number }) => Promise<void>;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  module,
  courseTitle,
  nextOrder,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(nextOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (module) {
      setTitle(module.title || '');
      setDescription(module.description || '');
      setOrder(module.sequence_order || 1);
    } else {
      setTitle('');
      setDescription('');
      setOrder(nextOrder);
    }
    setError(null);
  }, [module, nextOrder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Module title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: cleanTitle,
        description: description.trim() || undefined,
        sequence_order: order
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={module ? 'Edit Module' : 'Add Curriculum Module'}
      subtitle={`Course: ${courseTitle}`}
      maxWidth="md"
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
            Module Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Module 1: Product Basics & Loan Mechanics"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
            Sequence Order
          </label>
          <input
            type="number"
            min={1}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium outline-none transition"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
            Module Summary / Objectives (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key concepts covered in this module..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition resize-none"
          />
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
                <span>Saving Module...</span>
              </>
            ) : (
              <span>{module ? 'Save Changes' : 'Create Module'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
