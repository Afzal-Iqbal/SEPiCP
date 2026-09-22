import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Copy, CheckCircle, PlusCircle, FileText, AlertCircle, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { convertCourseToDataset } from '../api/surveyApi';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const navigate = useNavigate();

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAnalyzeCourse = async (courseId, courseCode) => {
    setAnalyzingId(courseId);
    setAnalysisError('');
    try {
      const res = await convertCourseToDataset(courseId, 'instructor_student');
      if (res.data) {
        const cols = (res.columns || Object.keys(res.data[0] || {})).map(key => ({
          header: key.toUpperCase(),
          accessorKey: key
        }));

        sessionStorage.setItem('uploaded_table_data', JSON.stringify(res.data));
        sessionStorage.setItem('uploaded_columns', JSON.stringify(cols));
        sessionStorage.setItem('uploaded_file_info', JSON.stringify({ name: res.name || `Course ${courseCode} Survey`, size: 'Course Data' }));

        navigate('/analysis');
      }
    } catch (err) {
      console.error("Course analysis failed:", err);
      setAnalysisError(err.detail || err.error || `No survey data found for course ${courseCode}.`);
    } finally {
      setAnalyzingId(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access');
    fetch('http://127.0.0.1:8080/api/teacher/dashboard/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-[15px] font-semibold">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Course Dashboard</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Manage and analyze your course evaluations.</p>
        </div>
        <Link to="/teacher" className="bg-[#1e3a8a] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-900 transition-all shadow-md">
          <PlusCircle size={18} /> Add Course Evaluation
        </Link>
      </div>

      {/* Dynamic Dashboard Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Courses Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Courses</span>
            <div className="text-3xl font-black text-slate-900">{data?.courses?.length || 0}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {/* Instructor Form Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor Evaluations</span>
            <div className="text-3xl font-black text-slate-900">
              {data?.courses?.filter(c => c.is_completed).length || 0}
              <span className="text-xs font-bold text-slate-400 ml-1.5">
                Completed ({data?.courses?.filter(c => !c.is_completed).length || 0} Drafts)
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>

        {/* Total Student Evaluations Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Responses</span>
            <div className="text-3xl font-black text-slate-900">
              {data?.courses?.reduce((sum, c) => sum + (c.published_responses || 0), 0) || 0}
              <span className="text-xs font-bold text-slate-400 ml-1.5">
                Submitted ({data?.courses?.reduce((sum, c) => sum + (c.saved_responses || 0), 0) || 0} Drafts)
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {analysisError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-extrabold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span>{analysisError}</span>
          </div>
          <button onClick={() => setAnalysisError('')} className="text-rose-500 hover:text-rose-800 font-bold">✕</button>
        </div>
      )}

      <div className="space-y-4">
        {data?.courses?.map(course => (
          <div key={course.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

            {/* Left: Course Info & Visual Status Indicators */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                {/* 🔴 Red (Incomplete / Draft) / 🟢 Green (Completed / Published) Indicator */}
                {course.is_completed ? (
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Green - Instructor Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-rose-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Red - Instructor Incomplete (Draft)
                  </span>
                )}
                <span className="text-xs text-slate-400 font-bold">Survey ID: #{course.id}</span>
              </div>

              <h2 className="text-xl font-extrabold text-[#1e3a8a]">{course.course_name}</h2>
              <p className="text-sm font-medium text-slate-500">{course.semester}</p>
            </div>

            {/* Right: Metrics, Survey ID / Code & Evaluate Form Action Button */}
            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 flex-wrap">
              {/* Response Counters (Published vs Draft) */}
              <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <div className="text-center px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  <div className="text-[9px] font-black uppercase tracking-wider text-emerald-700">Published</div>
                  <div className="text-sm font-black flex items-center justify-center gap-1 text-emerald-900">
                    <Users size={13} className="text-emerald-600" />
                    {course.published_responses || 0}
                  </div>
                </div>

                <div className="text-center px-3 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                  <div className="text-[9px] font-black uppercase tracking-wider text-amber-700">Drafts</div>
                  <div className="text-sm font-black flex items-center justify-center gap-1 text-amber-900">
                    <Users size={13} className="text-amber-600" />
                    {course.saved_responses || 0}
                  </div>
                </div>
              </div>

              {/* 5-Char Survey Code */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 text-right">
                <div className="text-[10px] font-extrabold text-sky-800 uppercase tracking-widest">Survey Code</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-base font-black text-slate-900 tracking-wider">{course.course_code}</code>
                  <button onClick={() => handleCopy(course.course_code)} className="text-sky-600 hover:text-sky-800 border-none bg-transparent cursor-pointer">
                    {copiedCode === course.course_code ? <CheckCircle size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Analyze Course Action Button */}
              <button
                disabled={analyzingId === course.id}
                onClick={() => handleAnalyzeCourse(course.id, course.course_code)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                title="Run PCA, Linear Regression, and statistical analysis on this course"
              >
                <BarChart3 size={15} />
                {analyzingId === course.id ? "Loading..." : "Analyze Course"}
              </button>

              {/* Evaluate Form Action Button (Shows Draft status explicitly if pending) */}
              <button
                onClick={() => navigate('/teacher/form', {
                  state: {
                    surveyId: course.id,
                    courseName: course.course_name,
                    semester: course.semester
                  }
                })}
                className={course.is_completed
                  ? "bg-[#1e3a8a] hover:bg-blue-900 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  : "bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer animate-bounce-short"
                }
              >
                <FileText size={15} />
                {course.is_completed ? "Edit Form (Completed)" : "Evaluate Form (Draft)"}
              </button>
            </div>

          </div>
        ))}

        {(!data?.courses || data.courses.length === 0) && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
            No course evaluations found. Click <strong>Add Course Evaluation</strong> to start!
          </div>
        )}
      </div>
    </div>
  );
}
