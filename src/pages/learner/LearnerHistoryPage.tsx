import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchLearnerCourses } from '../../lib/supabase';
import { CourseAssignment } from '../../types/database';

interface LearnerHistoryPageProps {
  onNavigate: (path: string) => void;
}

export const LearnerHistoryPage: React.FC<LearnerHistoryPageProps> = ({ onNavigate }) => {
  const { employeeProfile } = useAuth();
  const [courses, setCourses] = useState<CourseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Learning-table employee_id FKs are employees.id UUIDs, not the employees.employee_id
  // business code — use employeeProfile.id here.
  const empId = employeeProfile?.id ? String(employeeProfile.id) : '';

  const loadData = async () => {
    if (!empId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLearnerCourses(empId);
      setCourses(data);
    } catch (err: any) {
      console.error('Error fetching learner history:', err);
      setError(err?.message || 'Failed to load learning history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [empId]);

  const completedCourses = courses.filter(c => c.status === 'COMPLETED');
  const totalMinutesLearned = completedCourses.reduce((sum, c) => sum + (c.course?.estimated_duration_minutes || 0), 0);
  const totalHours = (totalMinutesLearned / 60).toFixed(1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-950/50 px-2 py-0.5 rounded border border-orange-800/60">
            Learning Records &amp; Milestones
          </span>
          <span className="text-xs text-slate-400">&bull; Verified Completion Log</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          My Learning History
        </h1>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B192C] p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 flex items-center justify-center text-xl shrink-0">
            🏆
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Courses</div>
            <div className="text-2xl font-black text-white mt-0.5">{completedCourses.length}</div>
          </div>
        </div>

        <div className="bg-[#0B192C] p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/80 text-orange-400 border border-orange-800/50 flex items-center justify-center text-xl shrink-0">
            ⏱
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Training Hours</div>
            <div className="text-2xl font-black text-white mt-0.5">{totalHours} hrs</div>
          </div>
        </div>

        <div className="bg-[#0B192C] p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-700/50 flex items-center justify-center text-xl shrink-0">
            📚
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</div>
            <div className="text-2xl font-black text-white mt-0.5">{courses.length}</div>
          </div>
        </div>
      </div>

      {/* Completed Courses Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Completed Courses</span>
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-[#0B192C] p-5 rounded-2xl border border-slate-800 animate-pulse h-24" />
            ))}
          </div>
        ) : completedCourses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0B192C] border border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-white">No completed courses yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Finish all modules and assessments in your assigned courses to earn completion records here.
            </p>
            <button
              onClick={() => onNavigate('/learn/courses')}
              className="mt-3 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase"
            >
              Start Learning Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {completedCourses.map(assignment => (
              <div
                key={assignment.id}
                className="bg-[#0B192C] p-5 rounded-2xl border border-emerald-900/40 hover:border-emerald-700/60 transition shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center justify-center text-lg shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider bg-orange-950/60 px-1.5 py-0.2 rounded">
                        {assignment.course?.category || 'COURSE'}
                      </span>
                      {assignment.course?.code && (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                          {assignment.course.code}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base">{assignment.course?.title}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Completed on: {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'Verified'}</span>
                      <span>&bull;</span>
                      <span>{assignment.course?.estimated_duration_minutes || 30} mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold">
                    100% Passed
                  </span>
                  <button
                    onClick={() => onNavigate(`/learn/courses/${assignment.course_id}`)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition"
                  >
                    Review Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Assignment Audit Log / History Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white">Full Assignment Log</h2>
        
        <div className="bg-[#0B192C] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Course</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Assigned Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {courses.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 font-semibold text-white">
                      <div>{item.course?.title || 'Assigned Course'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.course?.category}</div>
                    </td>
                    <td className="p-4">
                      {item.is_mandatory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-400 border border-orange-800/60">
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                        item.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                        item.status === 'OVERDUE' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-200">
                      {item.progress_percentage || 0}%
                    </td>
                    <td className="p-4 text-slate-400">
                      {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'Self-paced'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onNavigate(`/learn/courses/${item.course_id}`)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white font-bold text-[11px] transition"
                      >
                        Open &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
