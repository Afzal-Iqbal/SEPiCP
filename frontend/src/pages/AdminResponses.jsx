import React, { useState, useEffect } from 'react';
import {
  Download, Database, FileSpreadsheet, CheckCircle, AlertTriangle,
  User, ClipboardList, BookOpen, Clock, X, BarChart3, AlertCircle, Info
} from 'lucide-react';
import {
  getAllSurveysAdmin,
  exportAdminSurveysExcel,
  convertAdminSurveysToDataset,
  convertCourseToDataset,
  getAdminSurveyDetail
} from '../api/surveyApi';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminResponses() {
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState({ instructors: 0, students: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Detail Modal State
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('instructor'); // 'instructor' | 'student'

  const handleAnalyzeIndividualCourse = async (courseId, courseCode, type = 'instructor_student') => {
    try {
      setError('');
      setSuccess('');
      const res = await convertCourseToDataset(courseId, type);
      setSuccess(`Course ${courseCode} data loaded! Redirecting to Analysis…`);
      if (res.data && res.data.length > 0) {
        const name = res.name || `Course ${courseCode} - ${type === 'instructor' ? 'Instructor' : type === 'student' ? 'Student' : 'Combined'} Responses`;
        const cols = (res.columns || Object.keys(res.data[0] || {})).map(key => ({
          header: key.toUpperCase(),
          accessorKey: key
        }));

        // Store course data with a dedicated key so AnalysisPage detects it directly
        sessionStorage.setItem('course_direct_data', JSON.stringify(res.data));
        sessionStorage.setItem('course_direct_name', name);
        sessionStorage.setItem('course_direct_type', type);
        sessionStorage.setItem('course_direct_id', String(courseId));
        sessionStorage.setItem('course_direct_code', courseCode);

        // Also store in uploaded slots for preview table compatibility
        sessionStorage.setItem('uploaded_table_data', JSON.stringify(res.data));
        sessionStorage.setItem('uploaded_columns', JSON.stringify(cols));
        sessionStorage.setItem('uploaded_file_info', JSON.stringify({ name, size: 'Course Data' }));

        // Clear DB dataset selection so AnalysisPage uses the direct course data
        sessionStorage.removeItem('analysis_selected_dataset');
        sessionStorage.removeItem('analysis_step');
        sessionStorage.removeItem('analysis_xaxis');
        sessionStorage.removeItem('analysis_yaxis');
        sessionStorage.removeItem('analysis_type');

        setTimeout(() => window.location.href = '/analysis', 1200);
      } else {
        setError(`No response data found for course ${courseCode}.`);
      }
    } catch (err) {
      setError(err.detail || err.error || `No responses found to analyze for course ${courseCode}.`);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const data = await getAllSurveysAdmin();
      setTeachers(data);

      let totalInstructors = 0;
      let totalInstructorDrafts = 0;
      let totalStudents = 0;
      let totalStudentDrafts = 0;
      
      data.forEach(t => {
        t.surveys.forEach(s => {
          if (s.instructor_completed) {
            totalInstructors += 1;
          } else {
            totalInstructorDrafts += 1;
          }
          totalStudents += s.completed_student_count || 0;
          totalStudentDrafts += s.saved_student_count || s.uncompleted_student_count || 0;
        });
      });
      
      setStats({ 
        instructors: totalInstructors, 
        instructorDrafts: totalInstructorDrafts,
        students: totalStudents,
        studentDrafts: totalStudentDrafts
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch survey statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      setError('');
      setSuccess('');
      await exportAdminSurveysExcel(type);
      setSuccess(`${type === 'instructor' ? 'Instructor' : 'Student'} Excel downloaded successfully!`);
    } catch (err) {
      setError(`Failed to download ${type} Excel file.`);
    }
  };

  const handleDownloadCourseExcel = async (courseId, courseCode, type = 'student') => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('access');
      const res = await fetch(`http://127.0.0.1:8080/api/admin/surveys/export/?course_id=${courseId}&type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const typeLabel = type === 'instructor' ? 'instructor' : type === 'student' ? 'students' : 'all';
      a.download = `course_${courseCode}_${typeLabel}_responses.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`Excel file (${typeLabel}) for course ${courseCode} downloaded successfully!`);
    } catch (err) {
      setError(`Failed to download Excel file for course ${courseCode}.`);
    }
  };

  const handleConvertToDataset = async (type) => {
    try {
      setError('');
      setSuccess('');
      const res = await convertAdminSurveysToDataset(type);
      setSuccess(res.message || 'Data retrieved successfully!');
      if (res.data) {
        const cols = (res.columns || Object.keys(res.data[0] || {})).map(key => ({
          header: key.toUpperCase(),
          accessorKey: key
        }));

        sessionStorage.setItem('uploaded_table_data', JSON.stringify(res.data));
        sessionStorage.setItem('uploaded_columns', JSON.stringify(cols));
        sessionStorage.setItem('uploaded_file_info', JSON.stringify({ name: res.name || 'Survey Data', size: 'DB' }));

        setTimeout(() => window.location.href = '/upload', 1500);
      }
    } catch (err) {
      setError(err.detail || err.error || `Failed to retrieve ${type} data.`);
    }
  };

  const handleOpenAudit = async (survey) => {
    setSelectedSurvey(survey);
    setDetailLoading(true);
    setDetailData(null);
    setActiveTab('instructor'); // Reset to instructor tab on open
    try {
      const detail = await getAdminSurveyDetail(survey.id);
      setDetailData(detail);
    } catch (err) {
      console.error(err);
      setError('Failed to load survey details.');
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading responses...</div>;
  }

  // Calculate average engagement score for student responses
  const getAverageStudentEngagement = () => {
    if (!detailData || detailData.students_completed.length === 0) return 'N/A';
    const total = detailData.students_completed.reduce((acc, curr) => acc + (curr.total_engage_score_s || 0), 0);
    return (total / detailData.students_completed.length).toFixed(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 mt-8 px-4">

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Survey Responses</h1>
          <p className="text-slate-500 mt-2 font-bold">Manage collected instructor and student survey data.</p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top dashboard summary metrics & quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-slate-200 shadow-xl shadow-slate-200/50 p-6 flex flex-col justify-between">
          <div className="flex justify-around items-center bg-slate-50 p-4 rounded-2xl h-full gap-4">
            <div className="text-center flex-1">
              <div className="text-3xl font-black text-slate-900">{stats.instructors}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Instructor Completed</div>
              {stats.instructorDrafts > 0 && (
                <div className="text-[10px] font-bold text-amber-600 mt-0.5">({stats.instructorDrafts} Drafts)</div>
              )}
            </div>
            <div className="text-center flex-1 border-l border-slate-200 pl-4">
              <div className="text-3xl font-black text-slate-900">{stats.students}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Student Completed</div>
              {stats.studentDrafts > 0 && (
                <div className="text-[10px] font-bold text-amber-600 mt-0.5">({stats.studentDrafts} Drafts)</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-xl shadow-slate-200/50 p-6">
          <CardTitle className="text-sm font-black text-[#1e3a8a] uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Export Data
          </CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleDownload('instructor')} className="h-12 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs">
              Instructor Data
            </Button>
            <Button onClick={() => handleDownload('student')} className="h-12 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs">
              Student Data
            </Button>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-xl shadow-slate-200/50 p-6">
          <CardTitle className="text-sm font-black text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Database className="w-4 h-4" /> Import to Upload Data Table
          </CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleConvertToDataset('instructor')} className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs">
              Instructor Data
            </Button>
            <Button onClick={() => handleConvertToDataset('student')} className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs">
              Student Data
            </Button>
          </div>
        </Card>
      </div>

      {/* Teachers Registry & Grouped Surveys */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Faculty Surveys</h2>

        {teachers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 font-medium text-slate-400">
            No instructors have initialized surveys yet.
          </div>
        ) : (
          teachers.map(teacher => (
            <div key={teacher.teacher_id} className="bg-white border border-slate-100 rounded-3xl shadow-md overflow-hidden">
              {/* Teacher Header */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-black">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg leading-snug">{teacher.teacher_name}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{teacher.teacher_email}</p>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-blue-50/50 text-[#1e3a8a] rounded-full text-xs font-black tracking-wider uppercase">
                  {teacher.surveys.length} survey{teacher.surveys.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Surveys Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 text-slate-400 font-black text-[10px] uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4 pl-6">Course</th>
                      <th className="p-4">Semester</th>
                      <th className="p-4">Instructor Status</th>
                      <th className="p-4">Student Responses</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacher.surveys.map(survey => (
                      <tr key={survey.id} className="hover:bg-slate-50/40 border-b last:border-0 border-slate-100 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-800">{survey.course_name}</div>
                          <div className="text-xs font-semibold text-slate-400 mt-0.5">Code: {survey.course_code}</div>
                        </td>
                        <td className="p-4 text-slate-600 font-semibold text-sm">
                          {survey.semester} {survey.year && `· ${survey.year}`}
                        </td>
                        <td className="p-4">
                          {survey.instructor_completed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Green - Instructor Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Red - Instructor Incomplete
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 items-center">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg border border-emerald-200" title="Published student evaluations">
                              Published: {survey.completed_student_count}
                            </span>
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-black rounded-lg border border-amber-200" title="Student responses currently saved as draft">
                              Draft: {survey.uncompleted_student_count}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                            {/* 🟣 Analyse Instructor Survey */}
                            <button
                              onClick={() => handleAnalyzeIndividualCourse(survey.id, survey.course_code, 'instructor')}
                              className="bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 rounded-xl text-xs font-extrabold h-9 px-3 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                              title="Analyze instructor self-evaluation survey for this specific course"
                            >
                              <BarChart3 className="w-3.5 h-3.5" /> Analyse Instructor
                            </button>

                            {/* 🔵 Analyse Course (Student Surveys) */}
                            <button
                              onClick={() => handleAnalyzeIndividualCourse(survey.id, survey.course_code, 'student')}
                              className="bg-blue-50 hover:bg-[#1e3a8a] text-[#1e3a8a] hover:text-white border border-blue-200 rounded-xl text-xs font-extrabold h-9 px-3 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                              title="Analyze student evaluation survey responses for this specific course"
                            >
                              <BarChart3 className="w-3.5 h-3.5" /> Analyse Course
                            </button>

                            {/* 🟣 Export Instructor Excel */}
                            <button
                              onClick={() => handleDownloadCourseExcel(survey.id, survey.course_code, 'instructor')}
                              className="bg-purple-50/60 hover:bg-purple-700 text-purple-800 hover:text-white border border-purple-300 rounded-xl text-xs font-bold h-9 px-2.5 transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Export instructor response Excel for this course"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" /> Inst. Excel
                            </button>

                            {/* 🟢 Export Student Excel */}
                            <button
                              onClick={() => handleDownloadCourseExcel(survey.id, survey.course_code, 'student')}
                              className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold h-9 px-2.5 transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Export student responses Excel for this course"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" /> Stud. Excel
                            </button>

                            {/* 🔍 View Audit Detail */}
                            <button
                              onClick={() => handleOpenAudit(survey)}
                              className="bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-200 rounded-xl text-xs font-bold h-9 px-3 transition-all cursor-pointer"
                            >
                              Audit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Audit Modal */}
      <AnimatePresence>
        {selectedSurvey && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-5xl h-[85vh] flex flex-col p-6 md:p-8 relative shadow-2xl overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => { setSelectedSurvey(null); setDetailData(null); }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0 pr-12">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-black">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Survey Audit Details</h3>
                    <p className="text-slate-500 text-sm font-bold">Course Code: {selectedSurvey.course_code} · {selectedSurvey.semester} {selectedSurvey.year}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => handleAnalyzeIndividualCourse(selectedSurvey.id, selectedSurvey.course_code, 'instructor')}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black h-10 px-3.5 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" /> Analyse Instructor
                  </button>
                  <button
                    onClick={() => handleAnalyzeIndividualCourse(selectedSurvey.id, selectedSurvey.course_code, 'student')}
                    className="bg-[#1e3a8a] hover:bg-blue-900 text-white rounded-xl text-xs font-black h-10 px-3.5 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" /> Analyse Course
                  </button>
                  <button
                    onClick={() => handleDownloadCourseExcel(selectedSurvey.id, selectedSurvey.course_code, 'instructor')}
                    className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 rounded-xl text-xs font-black h-10 px-3 transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Inst. Excel
                  </button>
                  <button
                    onClick={() => handleDownloadCourseExcel(selectedSurvey.id, selectedSurvey.course_code, 'student')}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-black h-10 px-3 transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Stud. Excel
                  </button>
                </div>
              </div>

              {/* Tabs Selector */}
              <div className="flex border-b border-slate-200 mb-6 shrink-0">
                <button
                  onClick={() => setActiveTab('instructor')}
                  className={`py-3 px-6 font-extrabold text-sm border-b-2 transition-all ${activeTab === 'instructor'
                      ? 'border-[#1e3a8a] text-[#1e3a8a]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Instructor Data
                </button>
                <button
                  onClick={() => setActiveTab('student')}
                  className={`py-3 px-6 font-extrabold text-sm border-b-2 transition-all ${activeTab === 'student'
                      ? 'border-[#1e3a8a] text-[#1e3a8a]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Student Data ({detailData ? detailData.students_completed.length : 0})
                </button>
              </div>

              {detailLoading ? (
                <div className="p-12 text-center text-slate-500 font-bold grow flex items-center justify-center">Loading audit data...</div>
              ) : detailData ? (
                <div className="grow overflow-y-auto pr-2 space-y-6">

                  {/* TAB 1: INSTRUCTOR DATA */}
                  {activeTab === 'instructor' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Course Metadata Grid */}
                      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-slate-50/50">
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Teacher Name</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q1_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Email Address</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q108_email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">University</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q2_university || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Location</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q109_location || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Course Name</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q4_course || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Degree Level</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q111_degree_level || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Class Format</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q105_class_format || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Student Count</span>
                            <p className="font-bold text-slate-800 mt-1">{detailData.instructor_survey.q104_student_count || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Survey Status</span>
                            <p className="font-bold text-slate-800 mt-1 capitalize">{detailData.instructor_survey.status || 'N/A'}</p>
                          </div>
                        </div>
                      </Card>

                      {/* Instructor Teaching & Pedagogy details */}
                      <div className="space-y-4">
                        <h4 className="text-md font-black text-slate-800 tracking-tight">Pedagogical Methods & Engagement Score</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Panel - Engagement & Teaching methods */}
                          <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
                            <h5 className="font-extrabold text-sm text-slate-700">Engagement Score & Lecture Ratios</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-bold">Total Engagement Score Given:</span>
                                <span className="text-sm font-black text-[#1e3a8a]">{detailData.instructor_survey.total_engage_score_p || 'N/A'} / 10</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-bold">One-way lectures (Percentage):</span>
                                <span className="text-sm font-bold text-slate-800">{detailData.instructor_survey.methods_p_1 ?? '0'}%</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-bold">Interactive lectures (Percentage):</span>
                                <span className="text-sm font-bold text-slate-800">{detailData.instructor_survey.methods_p_2 ?? '0'}%</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-bold">Slides presentations (Percentage):</span>
                                <span className="text-sm font-bold text-slate-800">{detailData.instructor_survey.methods_p_3 ?? '0'}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Panel - Frequencies */}
                          <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
                            <h5 className="font-extrabold text-sm text-slate-700">Frequency of Key Practices</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-bold">Uses real-world examples:</span>
                                <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">{detailData.instructor_survey.content_p_1 || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-bold">Encourages class debate:</span>
                                <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">{detailData.instructor_survey.discuss_2p || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-bold">Requires active participation:</span>
                                <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">{detailData.instructor_survey.act_part_2p || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                <span className="text-xs text-slate-500 font-bold">Knows students by name:</span>
                                <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">{detailData.instructor_survey.cncts_1p || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: STUDENT DATA */}
                  {activeTab === 'student' && (
                    <div className="space-y-6 animate-in fade-in duration-300">

                      {/* Student aggregate statistics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="p-5 border-slate-100 bg-emerald-50/10 rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wide">Total Responses</span>
                            <div className="text-3xl font-black text-emerald-600 mt-1">
                              {detailData.students_completed.length + detailData.students_drafts.length}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-slate-500 flex flex-col gap-1 items-end">
                            <span className="text-emerald-600">Completed: {detailData.students_completed.length}</span>
                            <span className="text-slate-400">Incomplete Drafts: {detailData.students_drafts.length}</span>
                          </div>
                        </Card>

                        <Card className="p-5 border-slate-100 bg-blue-50/10 rounded-2xl">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wide">Average Engagement (Students)</span>
                          <div className="text-3xl font-black text-[#1e3a8a] mt-1">
                            {getAverageStudentEngagement()} <span className="text-sm font-bold text-slate-400">/ 10</span>
                          </div>
                        </Card>
                      </div>

                      {/* Students list */}
                      <div className="space-y-4">
                        <h4 className="text-md font-black text-slate-800 tracking-tight">Student Responses List</h4>

                        {detailData.students_completed.length === 0 && detailData.students_drafts.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-2xl">
                            No student responses recorded for this course yet.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Completed list */}
                            {detailData.students_completed.map((student, sIdx) => (
                              <div key={student.id} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                    <span className="font-extrabold text-slate-800 text-sm">Response #{sIdx + 1} (Completed)</span>
                                  </div>
                                  <span className="text-xs font-bold text-slate-400">Submitted: {new Date(student.submitted_at).toLocaleDateString()}</span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/40 p-4 rounded-xl text-xs">
                                  <div>
                                    <span className="text-slate-400 font-bold">Engagement Score:</span>
                                    <p className="font-extrabold text-[#1e3a8a] mt-0.5">{student.total_engage_score_s || 'N/A'} / 10</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-bold">Class Format:</span>
                                    <p className="font-bold text-slate-700 mt-0.5">{student.q105_class_format || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-bold">Degree Level:</span>
                                    <p className="font-bold text-slate-700 mt-0.5">{student.q111_degree_level || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-bold">Class Size:</span>
                                    <p className="font-bold text-slate-700 mt-0.5">{student.q104_student_count || 'N/A'} students</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div className="border border-slate-100 rounded-xl p-3">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Course Material Frequencies</span>
                                    <div className="space-y-1.5 mt-2">
                                      <div className="flex justify-between"><span className="text-slate-500">Real world examples:</span> <span className="font-bold">{student.content_s_1 || 'N/A'}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Personal experiences:</span> <span className="font-bold">{student.content_s_2 || 'N/A'}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Applicable outside class:</span> <span className="font-bold">{student.content_s_3 || 'N/A'}</span></div>
                                    </div>
                                  </div>
                                  <div className="border border-slate-100 rounded-xl p-3">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Interaction Frequencies</span>
                                    <div className="space-y-1.5 mt-2">
                                      <div className="flex justify-between"><span className="text-slate-500">Allows career connects:</span> <span className="font-bold">{student.relevance_1s || 'N/A'}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Encourages class debate:</span> <span className="font-bold">{student.discuss_2s || 'N/A'}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Knows students by name:</span> <span className="font-bold">{student.cncts_1s || 'N/A'}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Draft list */}
                            {detailData.students_drafts.map((student, sIdx) => (
                              <div key={student.id} className="border border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50/30 shadow-none flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>
                                  <div>
                                    <span className="font-extrabold text-slate-500 text-sm">Response #{sIdx + 1} (Incomplete Draft)</span>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Last Saved: {new Date(student.updated_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg border border-slate-200">
                                  Draft
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="p-8 text-center text-red-500 font-bold">Failed to load survey details.</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
