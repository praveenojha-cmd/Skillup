import React, { useState } from 'react';
import { Course, Module, Lesson, Quiz, LessonType } from '../../types/database';
import { ModuleModal } from './ModuleModal';
import { LessonModal } from './LessonModal';
import { QuizBuilderModal } from './QuizBuilderModal';
import { EditCourseModal } from './EditCourseModal';
import { CoursePreviewModal } from './CoursePreviewModal';
import {
  fetchCourseDetail,
  updateCourse,
  toggleCoursePublish,
  createModule,
  updateModule,
  reorderModules,
  createLesson,
  updateLesson,
  reorderLessons,
  saveQuizWithQuestions
} from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CourseStudioProps {
  courseId: string | number;
  onBack: () => void;
  existingCategories: string[];
}

export const CourseStudio: React.FC<CourseStudioProps> = ({
  courseId,
  onBack,
  existingCategories
}) => {
  const { adminProfile } = useAuth();
  const role = adminProfile?.role;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inspector selection state
  const [selectedType, setSelectedType] = useState<'COURSE' | 'MODULE' | 'LESSON' | 'QUIZ'>('COURSE');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Modals state
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [targetModuleForLesson, setTargetModuleForLesson] = useState<Module | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [targetModuleForQuiz, setTargetModuleForQuiz] = useState<Module | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Permission check: Reporting admins have read-only access
  const isReadOnly = role === 'REPORTING_ADMIN';

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCourseDetail(courseId);
      if (!data) {
        setError('Course not found in database.');
      } else {
        setCourse(data);
        // Refresh selected item if applicable
        if (selectedType === 'MODULE' && selectedModule) {
          const updated = data.modules?.find(m => m.id === selectedModule.id) || null;
          setSelectedModule(updated);
        } else if (selectedType === 'LESSON' && selectedLesson) {
          const allLessons = data.modules?.flatMap(m => m.lessons || []) || [];
          const updated = allLessons.find(l => l.id === selectedLesson.id) || null;
          setSelectedLesson(updated);
        } else if (selectedType === 'QUIZ' && selectedQuiz) {
          const allQuizzes = data.modules?.flatMap(m => m.quizzes || []) || [];
          const updated = allQuizzes.find(q => q.id === selectedQuiz.id) || null;
          setSelectedQuiz(updated);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading course curriculum.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCourse();
  }, [courseId]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Module Actions
  const handleOpenAddModule = () => {
    setEditingModule(null);
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: Module) => {
    setEditingModule(mod);
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (input: { title: string; description?: string; sequence_order?: number }) => {
    if (editingModule) {
      await updateModule(editingModule.id, input);
      showNotification('Module updated successfully.');
    } else {
      await createModule(courseId, input);
      showNotification('Module created successfully.');
    }
    await loadCourse();
  };

  const handleMoveModule = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!course?.modules) return;
    const modules = [...course.modules];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    // Swap sequence orders
    const temp = modules[index];
    modules[index] = modules[targetIndex];
    modules[targetIndex] = temp;

    const payload = modules.map((m, idx) => ({ id: m.id, sequence_order: idx + 1 }));
    await reorderModules(payload);
    await loadCourse();
  };

  // Lesson Actions
  const handleOpenAddLesson = (mod: Module) => {
    setTargetModuleForLesson(mod);
    setEditingLesson(null);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson, mod: Module) => {
    setTargetModuleForLesson(mod);
    setEditingLesson(lesson);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (input: {
    title: string;
    content_type: LessonType;
    content_text?: string;
    video_url?: string;
    pdf_url?: string;
    duration_minutes?: number;
    sequence_order?: number;
  }) => {
    if (editingLesson) {
      await updateLesson(editingLesson.id, input);
      showNotification('Lesson updated successfully.');
    } else if (targetModuleForLesson) {
      await createLesson(targetModuleForLesson.id, input);
      showNotification('Lesson added to module.');
    }
    await loadCourse();
  };

  const handleMoveLesson = async (mod: Module, lessonIndex: number, direction: 'UP' | 'DOWN') => {
    if (!mod.lessons) return;
    const lessons = [...mod.lessons];
    const targetIndex = direction === 'UP' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const temp = lessons[lessonIndex];
    lessons[lessonIndex] = lessons[targetIndex];
    lessons[targetIndex] = temp;

    const payload = lessons.map((l, idx) => ({ id: l.id, sequence_order: idx + 1 }));
    await reorderLessons(payload);
    await loadCourse();
  };

  // Quiz Actions
  const handleOpenAddQuiz = (mod: Module) => {
    setTargetModuleForQuiz(mod);
    setEditingQuiz(null);
    setIsQuizModalOpen(true);
  };

  const handleOpenEditQuiz = (quiz: Quiz, mod: Module) => {
    setTargetModuleForQuiz(mod);
    setEditingQuiz(quiz);
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = async (input: any) => {
    await saveQuizWithQuestions(input);
    showNotification('Assessment quiz saved successfully.');
    await loadCourse();
  };

  // Publish / Unpublish Toggle
  const handleTogglePublish = async () => {
    if (!course) return;
    try {
      const willPublish = course.status !== 'PUBLISHED';
      const updated = await toggleCoursePublish(course.id, willPublish, course);
      setCourse(updated);
      showNotification(willPublish ? 'Course published successfully and ready for assignments.' : 'Course changed to DRAFT status.');
    } catch (err: any) {
      setError(err?.message || 'Publish status update failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <svg className="w-8 h-8 animate-spin text-orange-600 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="font-semibold text-xs">Loading Course Curriculum Studio...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-2">Course Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'The requested course record does not exist.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          ← Return to Courses Catalog
        </button>
      </div>
    );
  }

  const modules = course.modules || [];
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalQuizzes = modules.reduce((sum, m) => sum + (m.quizzes?.length || 0), 0);
  const canPublish = modules.length > 0 && (totalLessons > 0 || totalQuizzes > 0);

  return (
    <div className="space-y-4">
      {/* Top Banner / Studio Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition shrink-0"
              title="Return to Course Catalog"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold text-[10px] uppercase">
                  {course.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                  {course.difficulty || 'Intermediate'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                  course.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${course.status === 'PUBLISHED' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  <span>{course.status || 'DRAFT'}</span>
                </span>
                {course.code && (
                  <span className="font-mono text-slate-400 text-xs">
                    Code: {course.code}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {course.title}
              </h1>

              <div className="flex items-center gap-4 text-slate-500 text-xs mt-1">
                <span>⏱ {course.estimated_duration_minutes || 30} Min Est.</span>
                <span>•</span>
                <span>{modules.length} Modules</span>
                <span>•</span>
                <span>{totalLessons} Lessons</span>
                <span>•</span>
                <span>{totalQuizzes} Assessment Quizzes</span>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview Course</span>
            </button>

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditCourseOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Metadata</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePublish}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
                    course.status === 'PUBLISHED'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                  title={!canPublish && course.status !== 'PUBLISHED' ? 'Add at least 1 module and 1 lesson/quiz before publishing' : ''}
                >
                  {course.status === 'PUBLISHED' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span>Unpublish to Draft</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Publish Course</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications & Error Alerts */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold text-xs">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-xs">✕</button>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Curriculum Hierarchy Tree (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Curriculum Structure
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                  {modules.length} Modules
                </span>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleOpenAddModule}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Module</span>
                </button>
              )}
            </div>

            {/* Course Root Level Item */}
            <button
              type="button"
              onClick={() => {
                setSelectedType('COURSE');
                setSelectedModule(null);
                setSelectedLesson(null);
                setSelectedQuiz(null);
              }}
              className={`w-full text-left p-3 rounded-xl border text-xs transition mb-3 flex items-center justify-between ${
                selectedType === 'COURSE'
                  ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-bold">Course Master & Syllabus Summary</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Overview</span>
            </button>

            {/* Modules Tree */}
            <div className="space-y-3">
              {modules.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="font-bold text-slate-700 text-xs mb-1">No Modules Yet</div>
                  <div className="text-[11px] text-slate-500 mb-3">Begin structuring this course by creating the first module.</div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleOpenAddModule}
                      className="px-3.5 py-1.5 bg-orange-600 text-white rounded-xl font-bold text-xs"
                    >
                      + Create First Module
                    </button>
                  )}
                </div>
              ) : (
                modules.map((mod, modIdx) => {
                  const isModSelected = selectedType === 'MODULE' && selectedModule?.id === mod.id;
                  return (
                    <div
                      key={mod.id}
                      className={`border rounded-2xl overflow-hidden transition ${
                        isModSelected
                          ? 'border-orange-500 shadow-sm ring-1 ring-orange-500/30 bg-white'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Module Header Strip */}
                      <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          onClick={() => {
                            setSelectedType('MODULE');
                            setSelectedModule(mod);
                            setSelectedLesson(null);
                            setSelectedQuiz(null);
                          }}
                        >
                          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold text-[10px] shrink-0 font-mono">
                            M{modIdx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {mod.title}
                          </span>
                        </div>

                        {!isReadOnly && (
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              disabled={modIdx === 0}
                              onClick={() => handleMoveModule(modIdx, 'UP')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Module Up"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={modIdx === modules.length - 1}
                              onClick={() => handleMoveModule(modIdx, 'DOWN')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Module Down"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModule(mod)}
                              className="p-1 text-slate-400 hover:text-slate-700"
                              title="Edit Module Title"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Module Sub-items: Lessons & Quizzes */}
                      <div className="p-2 space-y-1.5">
                        {/* Lessons List */}
                        {(mod.lessons || []).map((les, lesIdx) => {
                          const isLesSelected = selectedType === 'LESSON' && selectedLesson?.id === les.id;
                          return (
                            <div
                              key={les.id}
                              className={`p-2 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                                isLesSelected
                                  ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold'
                                  : 'border-slate-100 bg-slate-50/40 hover:bg-slate-100/60 text-slate-700'
                              }`}
                            >
                              <div
                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                onClick={() => {
                                  setSelectedType('LESSON');
                                  setSelectedLesson(les);
                                  setSelectedModule(mod);
                                  setSelectedQuiz(null);
                                }}
                              >
                                {les.content_type === 'VIDEO' ? (
                                  <svg className="w-3.5 h-3.5 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : les.content_type === 'PDF' ? (
                                  <svg className="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                                <span className="truncate text-[11px]">
                                  {lesIdx + 1}. {les.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {les.duration_minutes || 5}m
                                </span>
                                {!isReadOnly && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={lesIdx === 0}
                                      onClick={() => handleMoveLesson(mod, lesIdx, 'UP')}
                                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={lesIdx === (mod.lessons?.length || 1) - 1}
                                      onClick={() => handleMoveLesson(mod, lesIdx, 'DOWN')}
                                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLesson(les, mod)}
                                      className="p-0.5 text-slate-400 hover:text-slate-700"
                                      title="Edit Lesson"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Quizzes List */}
                        {(mod.quizzes || []).map((qz, qzIdx) => {
                          const isQzSelected = selectedType === 'QUIZ' && selectedQuiz?.id === qz.id;
                          return (
                            <div
                              key={qz.id}
                              className={`p-2 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                                isQzSelected
                                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold'
                                  : 'border-amber-100 bg-amber-50/30 hover:bg-amber-100/50 text-amber-900'
                              }`}
                            >
                              <div
                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                onClick={() => {
                                  setSelectedType('QUIZ');
                                  setSelectedQuiz(qz);
                                  setSelectedModule(mod);
                                  setSelectedLesson(null);
                                }}
                              >
                                <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span className="truncate text-[11px]">
                                  Assessment: {qz.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 font-bold">
                                  {qz.questions?.length || 0} Qs
                                </span>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditQuiz(qz, mod)}
                                    className="p-0.5 text-amber-700 hover:text-amber-900"
                                    title="Edit Quiz"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Item Actions for this Module */}
                        {!isReadOnly && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAddLesson(mod)}
                              className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition text-center"
                            >
                              + Add Lesson
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAddQuiz(mod)}
                              className="flex-1 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[10px] transition text-center"
                            >
                              + Add Assessment Quiz
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Studio Inspector / Detail Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* 1. Course Master Inspector */}
          {selectedType === 'COURSE' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Curriculum Master Overview</h3>
                  <p className="text-xs text-slate-500">Master configuration, syllabus overview, and publication readiness checklist.</p>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsEditCourseOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {course.thumbnail_url && (
                <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-100">
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Modules</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{modules.length}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Lessons</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{totalLessons}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Assessment Quizzes</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{totalQuizzes}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{course.estimated_duration_minutes || 30}m</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                  Curriculum Description
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                  {course.description || 'No detailed course description provided yet.'}
                </p>
              </div>

              {/* Publication Readiness Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Publication Readiness Checklist</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    canPublish ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {canPublish ? 'READY TO PUBLISH' : 'PENDING CONTENT'}
                  </span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      modules.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {modules.length > 0 ? '✓' : '•'}
                    </span>
                    <span className={modules.length > 0 ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      At least 1 Curriculum Module defined ({modules.length} created)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      totalLessons > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {totalLessons > 0 ? '✓' : '•'}
                    </span>
                    <span className={totalLessons > 0 ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      Lesson content populated ({totalLessons} lessons created)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      totalQuizzes > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {totalQuizzes > 0 ? '✓' : '•'}
                    </span>
                    <span className={totalQuizzes > 0 ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      Assessment quiz added ({totalQuizzes} quizzes configured)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Module Inspector */}
          {selectedType === 'MODULE' && selectedModule && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold text-[10px]">
                    MODULE #{selectedModule.sequence_order}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedModule.title}</h3>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModule(selectedModule)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Edit Module
                  </button>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">
                  Module Summary / Key Outcomes
                </h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedModule.description || 'No module description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Lessons in Module</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedModule.lessons?.length || 0} Lessons
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Quizzes in Module</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedModule.quizzes?.length || 0} Quizzes
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddLesson(selectedModule)}
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    + Add Lesson to Module
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddQuiz(selectedModule)}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    + Add Assessment Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Lesson Content Inspector */}
          {selectedType === 'LESSON' && selectedLesson && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {selectedLesson.content_type}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      ⏱ {selectedLesson.duration_minutes || 5} min
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedLesson.title}</h3>
                </div>

                {!isReadOnly && selectedModule && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditLesson(selectedLesson, selectedModule)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Edit Content
                  </button>
                )}
              </div>

              {/* Lesson Format Presentation */}
              {selectedLesson.content_type === 'VIDEO' && (
                <div className="space-y-3">
                  <div className="aspect-video w-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white p-6 shadow-inner relative overflow-hidden">
                    <div className="w-14 h-14 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-3 truncate max-w-sm">
                      {selectedLesson.video_url || 'Internal Asset URL'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-bold">Video Stream URL:</span>
                    <code className="text-orange-600 text-xs">{selectedLesson.video_url || 'No URL specified'}</code>
                  </div>
                </div>
              )}

              {selectedLesson.content_type === 'PDF' && (
                <div className="p-6 border border-red-200 bg-red-50/40 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">PDF Document Asset</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{selectedLesson.pdf_url || 'sample.pdf'}</div>
                    </div>
                  </div>
                  {selectedLesson.pdf_url && (
                    <a
                      href={selectedLesson.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition"
                    >
                      Open PDF
                    </a>
                  )}
                </div>
              )}

              {(selectedLesson.content_type === 'TEXT' || selectedLesson.content_type === 'ARTICLE') && (
                <div>
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1.5">
                    Article Reader Content
                  </h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                    {selectedLesson.content_text || 'No article content provided.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Quiz Inspector */}
          {selectedType === 'QUIZ' && selectedQuiz && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      ASSESSMENT QUIZ
                    </span>
                    <span className="text-slate-400 text-xs">
                      Passing: {selectedQuiz.passing_score}%
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedQuiz.title}</h3>
                </div>

                {!isReadOnly && selectedModule && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditQuiz(selectedQuiz, selectedModule)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    Open Quiz Builder
                  </button>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Configured Questions ({(selectedQuiz.questions || []).length})
                </div>

                {(selectedQuiz.questions || []).map((q, qIdx) => (
                  <div key={q.id || qIdx} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {qIdx + 1}. {q.question_text}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 font-bold text-slate-600 text-[10px] shrink-0">
                        {q.points || 1} Pt
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {(q.options || []).map((opt, optIdx) => (
                        <div
                          key={opt.id || optIdx}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                            opt.is_correct
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span className="truncate">
                            <span className="font-mono opacity-50 mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt.option_text}
                          </span>
                          {opt.is_correct && (
                            <span className="text-emerald-700 text-[10px] font-bold shrink-0 ml-1">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 italic pt-1">
                        Rationale: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {isEditCourseOpen && (
        <EditCourseModal
          isOpen={isEditCourseOpen}
          onClose={() => setIsEditCourseOpen(false)}
          course={course}
          onSubmit={async (input) => {
            await updateCourse(course.id, input, course);
            showNotification('Course metadata updated.');
            await loadCourse();
          }}
          existingCategories={existingCategories}
        />
      )}

      {isModuleModalOpen && (
        <ModuleModal
          isOpen={isModuleModalOpen}
          onClose={() => setIsModuleModalOpen(false)}
          module={editingModule}
          courseTitle={course.title}
          nextOrder={modules.length + 1}
          onSubmit={handleSaveModule}
        />
      )}

      {isLessonModalOpen && (
        <LessonModal
          isOpen={isLessonModalOpen}
          onClose={() => setIsLessonModalOpen(false)}
          lesson={editingLesson}
          moduleTitle={targetModuleForLesson?.title || ''}
          nextOrder={(targetModuleForLesson?.lessons?.length || 0) + 1}
          onSubmit={handleSaveLesson}
        />
      )}

      {isQuizModalOpen && (
        <QuizBuilderModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          quiz={editingQuiz}
          courseId={course.id}
          moduleId={targetModuleForQuiz?.id}
          parentTitle={targetModuleForQuiz?.title || course.title}
          onSubmit={handleSaveQuiz}
        />
      )}

      {isPreviewOpen && (
        <CoursePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          course={course}
        />
      )}
    </div>
  );
};
