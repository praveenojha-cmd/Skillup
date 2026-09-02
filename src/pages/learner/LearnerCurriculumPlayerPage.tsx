import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  fetchLearnerCourseCurriculum, 
  markLessonCompleted, 
  submitQuizAttempt 
} from '../../lib/supabase';
import {
  Course,
  CourseAssignment,
  Module,
  Lesson,
  LearnerQuiz,
  QuizAttempt,
  QuizSubmissionResult,
  QuizSubmissionPayload
} from '../../types/database';

interface LearnerCurriculumPlayerPageProps {
  courseId: string | number;
  onNavigate: (path: string) => void;
}

type ActiveItemType = 
  | { type: 'LESSON'; lesson: Lesson; module: Module }
  | { type: 'QUIZ'; quiz: LearnerQuiz; module?: Module };

export const LearnerCurriculumPlayerPage: React.FC<LearnerCurriculumPlayerPageProps> = ({
  courseId,
  onNavigate
}) => {
  const { employeeProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [assignment, setAssignment] = useState<CourseAssignment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [learnerQuizzes, setLearnerQuizzes] = useState<LearnerQuiz[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  
  const [activeItem, setActiveItem] = useState<ActiveItemType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz State
  const [isTakingQuiz, setIsTakingQuiz] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  // Learning-table employee_id FKs (course_assignments/lesson_progress/quiz_attempts/
  // course_completions) are employees.id UUIDs, NOT the employees.employee_id business
  // code — use employeeProfile.id here.
  const empId = employeeProfile?.id ? String(employeeProfile.id) : '';

  const loadCurriculum = async (preserveActiveItem: boolean = false) => {
    if (!empId || !courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLearnerCourseCurriculum(courseId, empId);
      setAssignment(data.assignment);
      setCourse(data.course);
      setLearnerQuizzes(data.learnerQuizzes);
      setCompletedLessonIds(data.completedLessonIds);
      setCompletedQuizIds(data.completedQuizIds);
      setQuizAttempts(data.quizAttempts);

      // If active item not selected or not preserving, pick the first incomplete item or first item
      if (!preserveActiveItem || !activeItem) {
        const modules = data.course.modules || [];
        let firstIncomplete: ActiveItemType | null = null;
        let firstItem: ActiveItemType | null = null;

        for (const mod of modules) {
          for (const les of mod.lessons || []) {
            if (!firstItem) firstItem = { type: 'LESSON', lesson: les, module: mod };
            if (!data.completedLessonIds.includes(String(les.id)) && !firstIncomplete) {
              firstIncomplete = { type: 'LESSON', lesson: les, module: mod };
            }
          }
        }

        for (const q of data.learnerQuizzes) {
          if (!firstItem) firstItem = { type: 'QUIZ', quiz: q };
          if (!data.completedQuizIds.includes(String(q.id)) && !q.hasPassed && !firstIncomplete) {
            firstIncomplete = { type: 'QUIZ', quiz: q };
          }
        }

        setActiveItem(firstIncomplete || firstItem);
      }
    } catch (err: any) {
      console.error('Error loading player curriculum:', err);
      setError(err?.message || 'Access Denied: You do not have an active assignment for this course.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [courseId, empId]);

  // Reset quiz state when switching active items
  useEffect(() => {
    setIsTakingQuiz(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
  }, [activeItem]);

  // Flattened items for Next / Previous navigation
  const allNavItems = useMemo(() => {
    if (!course) return [];
    const items: ActiveItemType[] = [];
    (course.modules || []).forEach(mod => {
      (mod.lessons || []).forEach(les => {
        items.push({ type: 'LESSON', lesson: les, module: mod });
      });
      // Quizzes in this module
      learnerQuizzes.filter(q => String(q.module_id) === String(mod.id)).forEach(q => {
        items.push({ type: 'QUIZ', quiz: q, module: mod });
      });
    });
    // Global quizzes
    learnerQuizzes.filter(q => !q.module_id).forEach(q => {
      items.push({ type: 'QUIZ', quiz: q });
    });
    return items;
  }, [course, learnerQuizzes]);

  const currentNavIndex = useMemo(() => {
    if (!activeItem) return -1;
    return allNavItems.findIndex(item => {
      if (item.type === 'LESSON' && activeItem.type === 'LESSON') {
        return String(item.lesson.id) === String(activeItem.lesson.id);
      }
      if (item.type === 'QUIZ' && activeItem.type === 'QUIZ') {
        return String(item.quiz.id) === String(activeItem.quiz.id);
      }
      return false;
    });
  }, [allNavItems, activeItem]);

  // Handle Mark Lesson Complete
  const handleMarkLessonComplete = async () => {
    if (!assignment || !activeItem || activeItem.type !== 'LESSON') return;
    setIsActionLoading(true);
    try {
      // markLessonCompleted(courseId, lessonId, employeeIdentifier)
      const res = await markLessonCompleted(assignment.course_id, activeItem.lesson.id, empId);
      showSuccess(`Lesson marked as completed!`, 'Progress Updated');

      // Update local state
      setCompletedLessonIds(prev => Array.from(new Set([...prev, String(activeItem.lesson.id)])));
      setAssignment(prev => prev ? {
        ...prev,
        status: res.status,
        progress_percentage: res.progressPercentage,
        completed_at: res.isCourseCompleted ? new Date().toISOString() : prev.completed_at
      } : null);

      if (res.isCourseCompleted) {
        setShowCompletionModal(true);
      } else {
        // Move to next item automatically
        if (currentNavIndex >= 0 && currentNavIndex < allNavItems.length - 1) {
          setActiveItem(allNavItems[currentNavIndex + 1]);
        }
      }
    } catch (err: any) {
      console.error('Error marking lesson complete:', err);
      showError(err?.message || 'Failed to update lesson progress.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Quiz Option Selection
  const handleOptionSelect = (questionId: string | number, optionId: string | number, isMultiple: boolean = false) => {
    const qKey = String(questionId);
    const optKey = String(optionId);

    setSelectedAnswers(prev => {
      const current = prev[qKey] || [];
      if (isMultiple) {
        if (current.includes(optKey)) {
          return { ...prev, [qKey]: current.filter(id => id !== optKey) };
        } else {
          return { ...prev, [qKey]: [...current, optKey] };
        }
      } else {
        return { ...prev, [qKey]: [optKey] };
      }
    });
  };

  // Submit Quiz Attempt
  const handleSubmitQuiz = async () => {
    if (!assignment || !activeItem || activeItem.type !== 'QUIZ') return;
    const quiz = activeItem.quiz;

    // Check if at least one answer selected
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount === 0 && quiz.questions.length > 0) {
      showInfo('Please select answers before submitting the quiz.');
      return;
    }

    setIsActionLoading(true);
    try {
      const payload: QuizSubmissionPayload = {
        quizId: quiz.id,
        courseId: assignment.course_id,
        assignmentId: assignment.id,
        answers: selectedAnswers
      };

      const result = await submitQuizAttempt(payload, empId);

      setQuizResult(result);
      setIsTakingQuiz(false);

      if (result.passed) {
        showSuccess(`Congratulations! You passed with ${result.percentage}% score!`, 'Quiz Passed');
        setCompletedQuizIds(prev => Array.from(new Set([...prev, String(quiz.id)])));
      } else {
        showError(`You scored ${result.percentage}%. Required passing score is ${quiz.passing_score}%.`, 'Quiz Not Passed');
      }

      // Refresh curriculum to get updated assignment progress
      await loadCurriculum(true);

      if (result.isCourseCompleted) {
        setShowCompletionModal(true);
      }
    } catch (err: any) {
      console.error('Error submitting quiz attempt:', err);
      showError(err?.message || 'Failed to submit quiz attempt.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading && !course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading course curriculum &amp; interactive media...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !assignment) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-700/60 text-rose-400 mx-auto flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white">Course Player Restricted</h2>
        <p className="text-sm text-slate-400">{error || 'Unable to load course player.'}</p>
        <button
          onClick={() => onNavigate('/learn/courses')}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const modules = course.modules || [];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Bar: Back button, Title, and Sidebar Toggle */}
      <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onNavigate(`/learn/courses/${course.id}`)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
            title="Back to Course Overview"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/60">
                {course.category || 'COURSE'}
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-white truncate">{course.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Progress Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Progress:</span>
            <span className="font-bold text-orange-400">{assignment.progress_percentage || 0}%</span>
            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${assignment.progress_percentage || 0}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isSidebarOpen 
                ? 'bg-slate-800 text-white border-slate-700' 
                : 'bg-orange-600/20 text-orange-400 border-orange-500/40'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="hidden md:inline">{isSidebarOpen ? 'Hide Menu' : 'Show Menu'}</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Player Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar Curriculum Navigation */}
        {isSidebarOpen && (
          <div className="lg:col-span-4 bg-[#0B192C] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-[calc(100vh-180px)] flex flex-col">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Curriculum Index</h3>
                <p className="text-[11px] text-slate-400">{modules.length} Modules &bull; {learnerQuizzes.length} Quizzes</p>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                {assignment.progress_percentage || 0}% Done
              </span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1 p-2 space-y-3">
              {modules.map((mod, mIdx) => {
                const lessons = mod.lessons || [];
                const moduleQuizzes = learnerQuizzes.filter(q => String(q.module_id) === String(mod.id));

                return (
                  <div key={mod.id} className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-slate-800 text-orange-400 flex items-center justify-center text-[10px]">
                        {mIdx + 1}
                      </span>
                      <span className="truncate">{mod.title}</span>
                    </div>

                    <div className="space-y-1 pl-2">
                      {lessons.map((les) => {
                        const isLessonDone = completedLessonIds.includes(String(les.id));
                        const isSelected = activeItem?.type === 'LESSON' && String(activeItem.lesson.id) === String(les.id);

                        return (
                          <button
                            key={les.id}
                            onClick={() => setActiveItem({ type: 'LESSON', lesson: les, module: mod })}
                            className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 text-xs ${
                              isSelected
                                ? 'bg-orange-600/20 text-orange-300 border border-orange-500/50 font-bold shadow-sm'
                                : isLessonDone
                                ? 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/60'
                                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                                isLessonDone ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isLessonDone ? '✓' : '•'}
                              </span>
                              <span className="truncate">{les.title}</span>
                            </div>
                            <span className="text-[10px] uppercase font-mono text-slate-400 shrink-0">
                              {les.content_type || 'TEXT'}
                            </span>
                          </button>
                        );
                      })}

                      {moduleQuizzes.map((q) => {
                        const isQuizDone = q.hasPassed || completedQuizIds.includes(String(q.id));
                        const isSelected = activeItem?.type === 'QUIZ' && String(activeItem.quiz.id) === String(q.id);

                        return (
                          <button
                            key={q.id}
                            onClick={() => setActiveItem({ type: 'QUIZ', quiz: q, module: mod })}
                            className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 text-xs ${
                              isSelected
                                ? 'bg-orange-600/20 text-orange-300 border border-orange-500/50 font-bold shadow-sm'
                                : isQuizDone
                                ? 'bg-slate-900/40 text-emerald-300 hover:bg-slate-800/60'
                                : 'text-orange-400/90 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                                isQuizDone ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-orange-950 text-orange-400'
                              }`}>
                                {isQuizDone ? '✓' : '⚡'}
                              </span>
                              <span className="truncate font-semibold">Quiz: {q.title}</span>
                            </div>
                            <span className="text-[10px] font-bold text-orange-400 shrink-0">
                              {q.passing_score}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Course-level Quizzes */}
              {learnerQuizzes.filter(q => !q.module_id).length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                    Final Assessment
                  </div>
                  {learnerQuizzes.filter(q => !q.module_id).map((q) => {
                    const isQuizDone = q.hasPassed || completedQuizIds.includes(String(q.id));
                    const isSelected = activeItem?.type === 'QUIZ' && String(activeItem.quiz.id) === String(q.id);

                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveItem({ type: 'QUIZ', quiz: q })}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? 'bg-orange-600/20 text-orange-300 border border-orange-500/50 font-bold shadow-sm'
                            : isQuizDone
                            ? 'bg-slate-900/40 text-emerald-300 hover:bg-slate-800/60'
                            : 'text-amber-400 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            isQuizDone ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-orange-950 text-orange-400'
                          }`}>
                            {isQuizDone ? '✓' : '🏆'}
                          </span>
                          <span className="truncate font-bold">{q.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-orange-400 shrink-0">
                          {q.passing_score}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Stage: Interactive Media / Quiz / Reader Viewer */}
        <div className={isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {activeItem?.type === 'LESSON' ? (
            /* LESSON VIEW */
            <div className="bg-[#0B192C] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-6">
              {/* Media Container depending on content_type */}
              {activeItem.lesson.content_type === 'VIDEO' ? (
                <div className="aspect-video bg-black relative flex items-center justify-center border-b border-slate-800 overflow-hidden">
                  {activeItem.lesson.content_url ? (
                    activeItem.lesson.content_url.includes('youtube.com') || activeItem.lesson.content_url.includes('youtu.be') ? (
                      <iframe
                        src={activeItem.lesson.content_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full border-0"
                        title={activeItem.lesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={activeItem.lesson.content_url}
                        controls
                        className="w-full h-full"
                      />
                    )
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/40 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-sm font-bold text-white">Video Lesson Player</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Stream media for {activeItem.lesson.title}. Review instructions below and proceed to mark lesson complete.
                      </p>
                    </div>
                  )}
                </div>
              ) : activeItem.lesson.content_type === 'PDF' ? (
                <div className="bg-slate-950 border-b border-slate-800 p-6 min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-700/50 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">PDF Learning Document</h4>
                    <p className="text-xs text-slate-400 max-w-md mt-1">
                      {activeItem.lesson.content_url ? 'Read document inline or download the official learning resource.' : 'Reference guide for this module.'}
                    </p>
                  </div>
                  {activeItem.lesson.content_url && (
                    <a
                      href={activeItem.lesson.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 transition"
                    >
                      <span>Open PDF in New Window</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              ) : null}

              {/* Lesson Metadata & Content */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/60">
                        {activeItem.module.title}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {activeItem.lesson.duration_minutes || 10} mins</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{activeItem.lesson.title}</h2>
                  </div>

                  {completedLessonIds.includes(String(activeItem.lesson.id)) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold shrink-0">
                      <span>✓ Completed</span>
                    </div>
                  )}
                </div>

                {/* Lesson Description & Rich Body */}
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                  {activeItem.lesson.description && (
                    <p className="text-slate-300 font-medium">{activeItem.lesson.description}</p>
                  )}
                  {activeItem.lesson.content_text ? (
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-200">
                      {activeItem.lesson.content_text}
                    </div>
                  ) : !activeItem.lesson.content_url && (
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 text-center">
                      Review all core concepts in this lesson and mark as complete when finished.
                    </div>
                  )}
                </div>

                {/* Bottom Navigation & Complete Action */}
                <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    disabled={currentNavIndex <= 0}
                    onClick={() => currentNavIndex > 0 && setActiveItem(allNavItems[currentNavIndex - 1])}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous Lesson</span>
                  </button>

                  <div className="w-full sm:w-auto flex items-center gap-3">
                    <button
                      onClick={handleMarkLessonComplete}
                      disabled={isActionLoading}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
                    >
                      {isActionLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>{completedLessonIds.includes(String(activeItem.lesson.id)) ? 'Update Completion & Next' : 'Mark Lesson Complete'}</span>
                    </button>

                    {currentNavIndex < allNavItems.length - 1 && (
                      <button
                        onClick={() => setActiveItem(allNavItems[currentNavIndex + 1])}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeItem?.type === 'QUIZ' ? (
            /* QUIZ VIEW */
            <div className="bg-[#0B192C] rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
              {!isTakingQuiz && !quizResult ? (
                /* PRE-QUIZ SCREEN */
                <div className="text-center space-y-6 max-w-2xl mx-auto py-6">
                  <div className="w-16 h-16 rounded-3xl bg-orange-600/20 text-orange-400 border border-orange-500/40 flex items-center justify-center mx-auto shadow-xl">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-950/60 border border-orange-800/60 text-orange-400 text-xs font-bold uppercase tracking-wider">
                      Evaluation Quiz &bull; SkillUp LMS
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">{activeItem.quiz.title}</h2>
                    {activeItem.quiz.description && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activeItem.quiz.description}</p>
                    )}
                  </div>

                  {/* Quiz Rules & Passing Score details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Questions</div>
                      <div className="text-lg font-black text-white mt-1">{activeItem.quiz.questions.length}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Passing Score</div>
                      <div className="text-lg font-black text-orange-400 mt-1">{activeItem.quiz.passing_score}%</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Time Limit</div>
                      <div className="text-lg font-black text-slate-200 mt-1">
                        {activeItem.quiz.time_limit_minutes ? `${activeItem.quiz.time_limit_minutes}m` : 'None'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Best Score</div>
                      <div className="text-lg font-black text-emerald-400 mt-1">
                        {activeItem.quiz.bestAttempt ? `${activeItem.quiz.bestAttempt.percentage}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {activeItem.quiz.hasPassed && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                      <span>✓ You have already passed this quiz with {activeItem.quiz.bestAttempt?.percentage}% score.</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setIsTakingQuiz(true)}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2"
                    >
                      <span>{activeItem.quiz.hasPassed ? 'Retake Quiz for Practice' : 'Start Assessment'}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : isTakingQuiz && !quizResult ? (
                /* ACTIVE QUIZ QUESTION FLOW */
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                        Question {currentQuestionIndex + 1} of {activeItem.quiz.questions.length}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{activeItem.quiz.title}</h3>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Points: {activeItem.quiz.questions[currentQuestionIndex]?.points || 1}
                    </div>
                  </div>

                  {/* Question Container */}
                  {activeItem.quiz.questions[currentQuestionIndex] && (
                    <div className="space-y-5">
                      <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {activeItem.quiz.questions[currentQuestionIndex].question_text}
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        {activeItem.quiz.questions[currentQuestionIndex].options.map((option, optIdx) => {
                          const qId = activeItem.quiz.questions[currentQuestionIndex].id;
                          const currentSelected = selectedAnswers[String(qId)] || [];
                          const isSelected = currentSelected.includes(String(option.id));
                          const isMultiple = activeItem.quiz.questions[currentQuestionIndex].question_type === 'MULTIPLE_CHOICE';

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleOptionSelect(qId, option.id, isMultiple)}
                              className={`w-full text-left p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                                isSelected
                                  ? 'bg-orange-600/20 border-orange-500 text-white shadow-md shadow-orange-950/40'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                isSelected 
                                  ? 'bg-orange-600 text-white' 
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <div className="text-xs sm:text-sm leading-relaxed">{option.option_text}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quiz Navigation & Submit */}
                  <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 font-bold text-xs transition"
                    >
                      &larr; Previous Question
                    </button>

                    <div className="flex items-center gap-3">
                      {currentQuestionIndex < activeItem.quiz.questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => Math.min(activeItem.quiz.questions.length - 1, prev + 1))}
                          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-orange-600 text-white font-bold text-xs transition"
                        >
                          Next Question &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={isActionLoading}
                          className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-950/50 flex items-center gap-2"
                        >
                          {isActionLoading ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span>Submit Assessment</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : quizResult ? (
                /* QUIZ RESULT FEEDBACK SCREEN */
                <div className="space-y-6">
                  <div className="text-center space-y-4 max-w-xl mx-auto py-4">
                    <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-2xl border ${
                      quizResult.passed 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60' 
                        : 'bg-rose-950 text-rose-400 border-rose-700/60'
                    }`}>
                      {quizResult.passed ? (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className={`text-xs font-bold uppercase tracking-widest ${
                        quizResult.passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {quizResult.passed ? 'Assessment Passed! 🎉' : 'Assessment Not Passed'}
                      </div>
                      <h2 className="text-2xl font-black text-white mt-1">
                        You scored {quizResult.percentage}%
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        {quizResult.score} out of {quizResult.maxScore} points earned &bull; Passing threshold: {activeItem.quiz.passing_score}%
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setQuizResult(null);
                          setIsTakingQuiz(true);
                          setCurrentQuestionIndex(0);
                          setSelectedAnswers({});
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition"
                      >
                        Retake Quiz
                      </button>

                      {currentNavIndex < allNavItems.length - 1 && (
                        <button
                          onClick={() => {
                            setQuizResult(null);
                            setActiveItem(allNavItems[currentNavIndex + 1]);
                          }}
                          className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-950/50"
                        >
                          Continue to Next Lesson &rarr;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Detailed Question Review */}
                  <div className="space-y-4 pt-6 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Assessment Question Breakdown
                    </h4>

                    <div className="space-y-4">
                      {quizResult.feedback.map((q, idx) => {
                        const sourceQuestion = activeItem.quiz.questions.find(
                          sq => String(sq.id) === String(q.questionId)
                        );
                        const maxPoints = sourceQuestion?.points ?? q.pointsAwarded;

                        return (
                        <div
                          key={q.questionId}
                          className={`p-4 rounded-2xl border ${
                            q.isCorrect ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-rose-950/20 border-rose-900/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-bold text-white leading-relaxed">
                              {idx + 1}. {q.questionText}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              q.isCorrect ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                            }`}>
                              {q.pointsAwarded}/{maxPoints} pts
                            </span>
                          </div>

                          {q.explanation && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-900/80 text-[11px] text-slate-300 border border-slate-800">
                              <span className="font-bold text-orange-400">Explanation:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-[#0B192C] rounded-3xl border border-slate-800 p-12 text-center text-slate-400">
              Select a lesson or quiz from the menu to begin.
            </div>
          )}
        </div>
      </div>

      {/* Course Completion Congratulations Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B192C] max-w-md w-full rounded-3xl border border-emerald-700/60 shadow-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-950/80 animate-bounce">
              🏆
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700/60 text-xs font-bold uppercase tracking-wider">
                100% Course Completed
              </span>
              <h2 className="text-2xl font-black text-white">Congratulations!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have successfully completed all modules, lessons, and required assessments for <span className="text-white font-bold">{course.title}</span>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  onNavigate('/learn/history');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/60"
              >
                View History
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
