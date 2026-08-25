import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchLearnerCourseCurriculum } from '../../lib/supabase';
import { Course, CourseAssignment, LearnerQuiz, QuizAttempt } from '../../types/database';

interface LearnerCourseViewPageProps {
  courseId: string | number;
  onNavigate: (path: string) => void;
}

export const LearnerCourseViewPage: React.FC<LearnerCourseViewPageProps> = ({
  courseId,
  onNavigate
}) => {
  const { employeeProfile } = useAuth();
  const [assignment, setAssignment] = useState<CourseAssignment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [learnerQuizzes, setLearnerQuizzes] = useState<LearnerQuiz[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const empId = employeeProfile?.employee_id || employeeProfile?.id || '';

  const loadCurriculum = async () => {
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
    } catch (err: any) {
      console.error('Error fetching course curriculum:', err);
      setError(err?.message || 'Access Denied: You do not have an active assignment for this course.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [courseId, empId]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <div className="bg-[#0B192C] p-8 rounded-3xl border border-slate-800 animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/4" />
          <div className="h-10 bg-slate-800 rounded w-3/4" />
          <div className="h-20 bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !course || !assignment) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-700/60 text-rose-400 mx-auto flex items-center justify-center shadow-xl">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Course Access Restricted</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {error || 'You do not have an active assignment for this course in the Rupeek SkillUp database.'}
          </p>
        </div>
        <button
          onClick={() => onNavigate('/learn/courses')}
          className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition"
        >
          Return to My Courses
        </button>
      </div>
    );
  }

  const modules = course.modules || [];
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalQuizzes = learnerQuizzes.length;
  const isCompleted = assignment.status === 'COMPLETED';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button 
          onClick={() => onNavigate('/learn/courses')}
          className="hover:text-orange-400 transition"
        >
          Courses
        </button>
        <span>/</span>
        <span className="text-slate-200 truncate">{course.title}</span>
      </div>

      {/* Course Hero Card */}
      <div className="bg-[#0B192C] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                {course.category || 'TRAINING'}
              </span>
              {assignment.is_mandatory ? (
                <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                  Mandatory
                </span>
              ) : (
                <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                  Optional
                </span>
              )}
              {course.code && (
                <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {course.code}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {course.description || 'Comprehensive learning modules, rich media resources, and interactive evaluation quizzes.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{course.estimated_duration_minutes || 30} mins estimated</span>
              </span>
              <span>&bull;</span>
              <span>{modules.length} {modules.length === 1 ? 'Module' : 'Modules'}</span>
              <span>&bull;</span>
              <span>{totalLessons} Lessons</span>
              <span>&bull;</span>
              <span>{totalQuizzes} Quizzes</span>
              <span>&bull;</span>
              <span className="capitalize">{course.difficulty || 'Intermediate'} level</span>
            </div>
          </div>

          {/* Action / Progress Box */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 lg:w-80 shrink-0 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Progress</span>
              <span className="text-base font-black text-white">{assignment.progress_percentage || 0}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${assignment.progress_percentage || 0}%` }}
              />
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-white uppercase text-[11px]">{assignment.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="font-medium text-slate-200">
                  {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Self-paced'}
                </span>
              </div>
              {assignment.completed_at && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Completed on:</span>
                  <span>{new Date(assignment.completed_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate(`/learn/courses/${course.id}/curriculum`)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2"
            >
              <span>{isCompleted ? 'Review Curriculum' : assignment.status === 'IN_PROGRESS' ? 'Resume Learning' : 'Start Course'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Curriculum Syllabus Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Course Curriculum</h2>
            <p className="text-xs text-slate-400">Complete all lessons and pass quizzes to finish the course</p>
          </div>
          <button
            onClick={() => onNavigate(`/learn/courses/${course.id}/curriculum`)}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <span>Launch Player</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {modules.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0B192C] border border-slate-800 text-center text-xs text-slate-400">
            No modules have been published for this course yet.
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module, mIdx) => {
              const lessons = module.lessons || [];
              const moduleQuizzes = learnerQuizzes.filter(q => String(q.module_id) === String(module.id));

              return (
                <div 
                  key={module.id}
                  className="bg-[#0B192C] rounded-2xl border border-slate-800 overflow-hidden shadow-lg"
                >
                  <div className="p-4 sm:p-5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs">
                        {mIdx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base">{module.title}</h3>
                        {module.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{module.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {/* Lessons */}
                    {lessons.map((lesson, lIdx) => {
                      const isLessonDone = completedLessonIds.includes(String(lesson.id));

                      return (
                        <div 
                          key={lesson.id}
                          onClick={() => onNavigate(`/learn/courses/${course.id}/curriculum`)}
                          className="p-4 hover:bg-slate-800/40 cursor-pointer transition flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              isLessonDone 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {isLessonDone ? '✓' : `${lIdx + 1}`}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-orange-400 transition">
                                {lesson.title}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="uppercase font-mono bg-slate-800/90 px-1.5 py-0.2 rounded text-slate-300">
                                  {lesson.content_type || 'TEXT'}
                                </span>
                                <span>&bull;</span>
                                <span>{lesson.duration_minutes || 5} mins</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isLessonDone ? (
                              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                                Completed
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 group-hover:text-slate-200">
                                Pending &rarr;
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Module Quizzes */}
                    {moduleQuizzes.map((quiz) => {
                      const isQuizDone = quiz.hasPassed || completedQuizIds.includes(String(quiz.id));

                      return (
                        <div 
                          key={quiz.id}
                          onClick={() => onNavigate(`/learn/courses/${course.id}/curriculum`)}
                          className="p-4 bg-orange-950/10 hover:bg-orange-950/20 cursor-pointer transition flex items-center justify-between gap-4 group border-t border-orange-900/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              isQuizDone 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' 
                                : 'bg-orange-950 text-orange-400 border border-orange-700/60'
                            }`}>
                              {isQuizDone ? '✓' : '⚡'}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-400 transition">
                                Quiz: {quiz.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Passing Score: {quiz.passing_score}% &bull; {quiz.questions.length} Questions
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isQuizDone ? (
                              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/50">
                                Passed ({quiz.bestAttempt?.percentage || quiz.passing_score}%)
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-800/50">
                                Take Quiz &rarr;
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Course-level Quizzes (not tied to a specific module) */}
            {learnerQuizzes.filter(q => !q.module_id).map((quiz) => {
              const isQuizDone = quiz.hasPassed || completedQuizIds.includes(String(quiz.id));

              return (
                <div 
                  key={quiz.id}
                  onClick={() => onNavigate(`/learn/courses/${course.id}/curriculum`)}
                  className="p-5 rounded-2xl bg-[#0B192C] border border-orange-900/40 hover:border-orange-700/60 cursor-pointer transition flex items-center justify-between gap-4 shadow-xl group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                      isQuizDone 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' 
                        : 'bg-orange-600/20 text-orange-400 border border-orange-500/40'
                    }`}>
                      {isQuizDone ? '✓' : '⚡'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-orange-400 transition">
                        Final Assessment: {quiz.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        Required Passing Score: {quiz.passing_score}% &bull; {quiz.questions.length} Questions
                      </div>
                    </div>
                  </div>

                  <div>
                    {isQuizDone ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800/50">
                        Passed ({quiz.bestAttempt?.percentage || quiz.passing_score}%)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-orange-400 bg-orange-950/80 px-3 py-1 rounded-xl border border-orange-800/50 group-hover:bg-orange-600 group-hover:text-white transition">
                        Take Assessment &rarr;
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
