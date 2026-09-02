import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Course, Module, Lesson, Quiz } from '../../types/database';

interface CoursePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
  isOpen,
  onClose,
  course
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | number | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'LESSON' | 'QUIZ' | 'OVERVIEW'>('OVERVIEW');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Practice Quiz State (local memory only, does not write to DB)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  if (!course) return null;

  const modules = course.modules || [];

  const handleSelectLesson = (mod: Module, lesson: Lesson) => {
    setSelectedModuleId(mod.id);
    setSelectedLesson(lesson);
    setSelectedQuiz(null);
    setSelectedItemType('LESSON');
  };

  const handleSelectQuiz = (mod: Module, quiz: Quiz) => {
    setSelectedModuleId(mod.id);
    setSelectedQuiz(quiz);
    setSelectedLesson(null);
    setSelectedItemType('QUIZ');
    setUserAnswers({});
    setIsQuizSubmitted(false);
  };

  const handleSelectOverview = () => {
    setSelectedItemType('OVERVIEW');
    setSelectedLesson(null);
    setSelectedQuiz(null);
  };

  const handleQuizAnswer = (qIndex: number, optIndex: number) => {
    if (isQuizSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qIndex]: optIndex
    }));
  };

  const calculateQuizScore = () => {
    if (!selectedQuiz?.questions) return 0;
    let correctCount = 0;
    selectedQuiz.questions.forEach((q, qIdx) => {
      const chosenOptIdx = userAnswers[qIdx];
      if (chosenOptIdx !== undefined && q.options?.[chosenOptIdx]?.is_correct) {
        correctCount++;
      }
    });
    if (selectedQuiz.questions.length === 0) return 0;
    return Math.round((correctCount / selectedQuiz.questions.length) * 100);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Learner Preview Mode"
      subtitle={`Previewing: ${course.title}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Preview Mode Alert Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold">ADMIN PREVIEW MODE:</span>
            <span>Interactive simulator. No progress, completions, or quiz attempts will be saved.</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-200/60 font-mono text-[10px] font-bold">
            SANDBOX
          </span>
        </div>

        {/* Main Preview Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-slate-200 rounded-2xl overflow-hidden min-h-[500px] bg-slate-50">
          
          {/* Left Navigation Bar: Modules & Lessons */}
          <div className="md:col-span-4 bg-white border-r border-slate-200 p-3 overflow-y-auto max-h-[560px]">
            <button
              type="button"
              onClick={handleSelectOverview}
              className={`w-full text-left p-2.5 rounded-xl font-bold text-xs mb-2 transition flex items-center gap-2 ${
                selectedItemType === 'OVERVIEW'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'text-slate-700 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>Course Overview</span>
            </button>

            <div className="space-y-3">
              {modules.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs italic">
                  No modules created in this course yet.
                </div>
              ) : (
                modules.map((mod, modIdx) => (
                  <div key={mod.id} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    <div className="p-2 bg-slate-100/80 font-bold text-[11px] text-slate-700 flex items-center justify-between">
                      <span className="truncate">
                        M{modIdx + 1}: {mod.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {(mod.lessons?.length || 0) + (mod.quizzes?.length || 0)} items
                      </span>
                    </div>

                    <div className="p-1 space-y-1">
                      {/* Lessons */}
                      {(mod.lessons || []).map((l, lIdx) => {
                        const isSelected = selectedItemType === 'LESSON' && selectedLesson?.id === l.id;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleSelectLesson(mod, l)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-2 ${
                              isSelected
                                ? 'bg-orange-600 text-white font-bold'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                          >
                            {l.content_type === 'VIDEO' ? (
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : l.content_type === 'PDF' ? (
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            )}
                            <span className="truncate flex-1">
                              {lIdx + 1}. {l.title}
                            </span>
                            <span className="text-[10px] opacity-70 shrink-0">
                              {l.duration_minutes || 5}m
                            </span>
                          </button>
                        );
                      })}

                      {/* Quizzes */}
                      {(mod.quizzes || []).map((q, qIdx) => {
                        const isSelected = selectedItemType === 'QUIZ' && selectedQuiz?.id === q.id;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleSelectQuiz(mod, q)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-2 ${
                              isSelected
                                ? 'bg-amber-600 text-white font-bold'
                                : 'text-amber-700 bg-amber-50/50 hover:bg-amber-100/70'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span className="truncate flex-1">
                              Assessment {qIdx + 1}: {q.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/60 font-bold shrink-0">
                              Quiz
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Content Viewer Pane */}
          <div className="md:col-span-8 p-5 overflow-y-auto max-h-[560px] bg-white">
            
            {/* 1. Course Overview Screen */}
            {selectedItemType === 'OVERVIEW' && (
              <div className="space-y-4">
                {course.thumbnail_url && (
                  <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 font-bold text-[10px]">
                      {course.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {course.difficulty || 'Intermediate'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {course.status || 'DRAFT'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{course.title}</h2>
                  {course.code && <span className="font-mono text-slate-400 text-xs">Code: {course.code}</span>}
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{course.modules?.length || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Modules</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{course.lessons_count || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Lessons</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{course.estimated_duration_minutes || 30} Min</div>
                    <div className="text-[10px] text-slate-400 uppercase">Est. Duration</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">
                    Course Description & Learning Outcomes
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">
                    {course.description || 'No detailed syllabus description provided yet.'}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Lesson Viewer Screen */}
            {selectedItemType === 'LESSON' && selectedLesson && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                      {selectedLesson.content_type} LESSON
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      ⏱ {selectedLesson.duration_minutes || 5} minutes
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedLesson.title}</h2>
                </div>

                {/* Video Lesson */}
                {selectedLesson.content_type === 'VIDEO' && (
                  <div className="space-y-3">
                    <div className="aspect-video w-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white p-6 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                        <div className="text-xs font-mono truncate text-slate-300">
                          Resource: {selectedLesson.video_url || 'sample_video.mp4'}
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-orange-600/90 text-white flex items-center justify-center shadow-lg transform transition hover:scale-110 cursor-pointer">
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                      <span>Streaming URL: <code className="text-orange-600">{selectedLesson.video_url || 'Internal Asset'}</code></span>
                      <span className="text-[10px] text-slate-400">Resolution: 1080p HD</span>
                    </div>
                  </div>
                )}

                {/* PDF Document Lesson */}
                {selectedLesson.content_type === 'PDF' && (
                  <div className="space-y-3">
                    <div className="p-8 border-2 border-dashed border-red-200 bg-red-50/40 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{selectedLesson.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono truncate max-w-sm">
                          {selectedLesson.pdf_url || 'Policy_Document_v2026.pdf'}
                        </p>
                      </div>
                      <a
                        href={selectedLesson.pdf_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20 transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Open Document Reader</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Text / Article Lesson */}
                {(selectedLesson.content_type === 'TEXT' || selectedLesson.content_type === 'ARTICLE') && (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none p-5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-800 text-xs leading-relaxed whitespace-pre-line font-sans">
                      {selectedLesson.content_text || 'No article content provided.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Quiz Practice Assessment Screen */}
            {selectedItemType === 'QUIZ' && selectedQuiz && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        ASSESSMENT QUIZ
                      </span>
                      <span className="text-slate-400 text-xs font-medium">
                        Passing: {selectedQuiz.passing_score}%
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedQuiz.title}</h2>
                  </div>

                  {isQuizSubmitted && (
                    <div className={`px-4 py-2 rounded-xl text-center font-bold text-xs ${
                      calculateQuizScore() >= selectedQuiz.passing_score
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      <div>Score: {calculateQuizScore()}%</div>
                      <div className="text-[10px]">
                        {calculateQuizScore() >= selectedQuiz.passing_score ? 'PASSED ✓' : 'FAILED ✗'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions */}
                <div className="space-y-5">
                  {(selectedQuiz.questions || []).map((q, qIdx) => {
                    const chosenOptIdx = userAnswers[qIdx];
                    return (
                      <div key={q.id || qIdx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-bold text-slate-900 text-xs">
                            {qIdx + 1}. {q.question_text}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-bold shrink-0">
                            {q.points || 1} Pt
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {(q.options || []).map((opt, optIdx) => {
                            const isChosen = chosenOptIdx === optIdx;
                            let style = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';
                            
                            if (isQuizSubmitted) {
                              if (opt.is_correct) {
                                style = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold';
                              } else if (isChosen && !opt.is_correct) {
                                style = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                              }
                            } else if (isChosen) {
                              style = 'border-orange-500 bg-orange-50/70 text-orange-900 font-bold ring-2 ring-orange-500/20';
                            }

                            return (
                              <button
                                key={opt.id || optIdx}
                                type="button"
                                onClick={() => handleQuizAnswer(qIdx, optIdx)}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center gap-2.5 ${style}`}
                              >
                                <span className="font-mono font-bold text-[11px] opacity-60 w-4">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span className="flex-1">{opt.option_text}</span>
                                {isQuizSubmitted && opt.is_correct && (
                                  <span className="text-emerald-700 font-bold text-[10px]">✓ Correct</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation on submission */}
                        {isQuizSubmitted && q.explanation && (
                          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-start gap-2">
                            <span className="font-bold">Rationale:</span>
                            <span>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit / Retry Quiz Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  {isQuizSubmitted ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUserAnswers({});
                        setIsQuizSubmitted(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      Retry Assessment
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsQuizSubmitted(true)}
                      className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition"
                    >
                      Submit Test Answers
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            Navigation controls active. Previewing course as standard learner.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
};
