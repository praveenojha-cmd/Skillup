import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Lesson, LessonType } from '../../types/database';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  moduleTitle: string;
  nextOrder: number;
  onSubmit: (input: {
    title: string;
    content_type: LessonType;
    content_text?: string;
    video_url?: string;
    pdf_url?: string;
    duration_minutes?: number;
    sequence_order?: number;
  }) => Promise<void>;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  lesson,
  moduleTitle,
  nextOrder,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<LessonType>('VIDEO');
  const [contentText, setContentText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [order, setOrder] = useState(nextOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || '');
      setContentType(lesson.content_type || 'VIDEO');
      setContentText(lesson.content_text || '');
      setVideoUrl(lesson.video_url || '');
      setPdfUrl(lesson.pdf_url || '');
      setDurationMinutes(lesson.duration_minutes || 5);
      setOrder(lesson.sequence_order || 1);
    } else {
      setTitle('');
      setContentType('VIDEO');
      setContentText('');
      setVideoUrl('');
      setPdfUrl('');
      setDurationMinutes(5);
      setOrder(nextOrder);
    }
    setError(null);
  }, [lesson, nextOrder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Lesson title is required.');
      return;
    }

    if (contentType === 'VIDEO' && !videoUrl.trim()) {
      setError('Please provide a valid video URL or asset path.');
      return;
    }

    if (contentType === 'PDF' && !pdfUrl.trim()) {
      setError('Please provide a PDF document link or resource URL.');
      return;
    }

    if ((contentType === 'TEXT' || contentType === 'ARTICLE') && !contentText.trim()) {
      setError('Please enter article content for text lessons.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: cleanTitle,
        content_type: contentType,
        content_text: (contentType === 'TEXT' || contentType === 'ARTICLE') ? contentText.trim() : undefined,
        video_url: contentType === 'VIDEO' ? videoUrl.trim() : undefined,
        pdf_url: contentType === 'PDF' ? pdfUrl.trim() : undefined,
        duration_minutes: durationMinutes > 0 ? durationMinutes : 5,
        sequence_order: order
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lesson ? 'Edit Lesson' : 'Add Lesson to Module'}
      subtitle={`Module: ${moduleTitle}`}
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
            Lesson Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Understanding Nitric Acid Touchstone Testing"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
            Content Format / Delivery Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setContentType('VIDEO')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                contentType === 'VIDEO'
                  ? 'border-orange-500 bg-orange-50/70 text-orange-800 ring-2 ring-orange-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="font-bold text-[11px]">Video Lesson</span>
              <span className="text-[10px] text-slate-400">MP4 / YouTube / Embed</span>
            </button>

            <button
              type="button"
              onClick={() => setContentType('PDF')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                contentType === 'PDF'
                  ? 'border-orange-500 bg-orange-50/70 text-orange-800 ring-2 ring-orange-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="font-bold text-[11px]">PDF Document</span>
              <span className="text-[10px] text-slate-400">Standard SOP / Circular</span>
            </button>

            <button
              type="button"
              onClick={() => setContentType('TEXT')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                contentType === 'TEXT' || contentType === 'ARTICLE'
                  ? 'border-orange-500 bg-orange-50/70 text-orange-800 ring-2 ring-orange-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-bold text-[11px]">Text / Article</span>
              <span className="text-[10px] text-slate-400">In-app Reader & Guide</span>
            </button>
          </div>
        </div>

        {/* Content specific input */}
        {contentType === 'VIDEO' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Video URL / Streaming Resource Link <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://commondatastorage.googleapis.com/... or https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition"
            />
          </div>
        )}

        {contentType === 'PDF' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              PDF Document URL / Storage Link <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://storage.googleapis.com/.../handbook.pdf"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition"
            />
          </div>
        )}

        {(contentType === 'TEXT' || contentType === 'ARTICLE') && (
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Article / Reading Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Write the full training material, formulas, checklists, and key takeaways..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium placeholder:text-slate-400 outline-none transition resize-y font-sans"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 font-medium outline-none transition"
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
                <span>Saving Lesson...</span>
              </>
            ) : (
              <span>{lesson ? 'Save Changes' : 'Create Lesson'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
