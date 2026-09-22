// frontend/src/pages/TeacherHome.jsx
// Teacher landing page — shown immediately after login

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  BarChart3, ClipboardList, ChevronRight, LogOut,
  GraduationCap, BookOpen, TrendingUp, Users, FileText, CheckCircle, Lock, Copy
} from 'lucide-react';
import { submitInstructorSurvey } from '../api/surveyApi';

export default function TeacherHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileFixed, setIsProfileFixed] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    university: '',
    city: '',
  });

  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem(`instructor_fixed_profile_${user.email}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfileData(parsed);
        setIsProfileFixed(true);
      } else {
        setProfileData({
          name: user?.name || user?.username || '',
          email: user?.email || '',
          university: '',
          city: '',
        });
        setIsProfileFixed(false);
      }
    }
  }, [user]);

  const [wantEvaluate, setWantEvaluate] = useState(null); // null | 'yes' | 'no'
  const [selectedSemester, setSelectedSemester] = useState('Fall 2026');
  const [customCourse, setCustomCourse] = useState('');

  // Publish for students now state
  const [publishing, setPublishing] = useState(false);
  const [createdCourseCode, setCreatedCourseCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState('');

  const firstName = user?.name?.split('_')[0] || user?.name || user?.username || 'Teacher';
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const saveAndLockProfile = () => {
    if (user?.email) {
      localStorage.setItem(`instructor_fixed_profile_${user.email}`, JSON.stringify(profileData));
      setIsProfileFixed(true);
    }
  };

  const handleStartEvaluation = () => {
    setApiError('');
    if (!customCourse.trim()) {
      setApiError('Please enter a course code & name (e.g. EM620 Product Design) before starting the evaluation.');
      return;
    }
    saveAndLockProfile();
    navigate('/teacher/form', {
      state: {
        instructorInfo: profileData,
        semester: selectedSemester,
        courseName: customCourse.trim()
      }
    });
  };

  const handlePublishForStudentsNow = async () => {
    setApiError('');
    if (!customCourse.trim()) {
      setApiError('Please enter a course code & name (e.g. EM620 Product Design).');
      return;
    }

    saveAndLockProfile();
    setPublishing(true);
    try {
      // Create initial survey record in 'draft' status (instructor survey pending)
      const res = await submitInstructorSurvey({
        q1_name: profileData.name || user?.name || user?.username || 'Instructor',
        q2_university: profileData.university || 'University',
        q108_email: profileData.email || user?.email || 'instructor@example.com',
        q109_location: profileData.city || 'Campus',
        q3_semester: selectedSemester,
        q4_course: customCourse.trim(),
        year: '2026'
      });

      // Show generated 5-character student survey code
      setCreatedCourseCode(res.course_code);
    } catch (err) {
      console.error(err);
      setApiError(err.detail || 'Failed to generate course evaluation code for students.');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyCode = () => {
    if (createdCourseCode) {
      navigator.clipboard.writeText(createdCourseCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProceedDashboard = () => {
    saveAndLockProfile();
    navigate('/teacher/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1e3a8a', padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, boxShadow: '0 2px 12px rgba(30,58,138,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GraduationCap size={24} color="#93c5fd" />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 17 }}>SEPiCP</span>
          <span style={{ color: '#93c5fd', fontSize: 13, fontWeight: 600, marginLeft: 8 }}>
            Teacher Portal
          </span>
        </div>
        <button onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', borderRadius: 10, padding: '8px 16px',
            cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}>
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Welcome back,
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>
            {displayName} 👋
          </h1>
        </motion.div>

        {/* ── Instructor Profile Section ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0',
            padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 36
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e3a8a', margin: 0 }}>
              Instructor Profile
            </h2>

            {/* Grayed-out / Fixed Profile Badge */}
            {isProfileFixed ? (
              <span style={{
                background: '#e2e8f0', color: '#475569', padding: '6px 14px', borderRadius: 99,
                fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
                border: '1px solid #cbd5e1'
              }}>
                <Lock size={14} color="#64748b" /> Profile Fixed (Non-editable)
              </span>
            ) : (
              <span style={{
                background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: 99,
                fontSize: 12, fontWeight: 800, border: '1px solid #fde68a'
              }}>
                1st Time Profile Setup
              </span>
            )}
          </div>

          {/* Basic Info Inputs (Grayed out & Disabled if fixed) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: isProfileFixed ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Instructor Name
              </label>
              <input
                type="text"
                disabled={isProfileFixed}
                value={profileData.name}
                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  boxSizing: 'border-box',
                  background: isProfileFixed ? '#f1f5f9' : '#f8fafc',
                  color: isProfileFixed ? '#64748b' : '#0f172a',
                  border: isProfileFixed ? '1.5px solid #cbd5e1' : '1.5px solid #cbd5e1',
                  cursor: isProfileFixed ? 'not-allowed' : 'text'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: isProfileFixed ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Academic Email
              </label>
              <input
                type="email"
                disabled={isProfileFixed}
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  boxSizing: 'border-box',
                  background: isProfileFixed ? '#f1f5f9' : '#f8fafc',
                  color: isProfileFixed ? '#64748b' : '#0f172a',
                  border: isProfileFixed ? '1.5px solid #cbd5e1' : '1.5px solid #cbd5e1',
                  cursor: isProfileFixed ? 'not-allowed' : 'text'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: isProfileFixed ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                University / Institution
              </label>
              <input
                type="text"
                disabled={isProfileFixed}
                placeholder="e.g. Stanford University"
                value={profileData.university}
                onChange={e => setProfileData({ ...profileData, university: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  boxSizing: 'border-box',
                  background: isProfileFixed ? '#f1f5f9' : '#fff',
                  color: isProfileFixed ? '#64748b' : '#0f172a',
                  border: isProfileFixed ? '1.5px solid #cbd5e1' : '1.5px solid #cbd5e1',
                  cursor: isProfileFixed ? 'not-allowed' : 'text'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: isProfileFixed ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                City / Campus Location
              </label>
              <input
                type="text"
                disabled={isProfileFixed}
                placeholder="e.g. Boston, MA"
                value={profileData.city}
                onChange={e => setProfileData({ ...profileData, city: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  boxSizing: 'border-box',
                  background: isProfileFixed ? '#f1f5f9' : '#fff',
                  color: isProfileFixed ? '#64748b' : '#0f172a',
                  border: isProfileFixed ? '1.5px solid #cbd5e1' : '1.5px solid #cbd5e1',
                  cursor: isProfileFixed ? 'not-allowed' : 'text'
                }}
              />
            </div>
          </div>

          {/* Prompt: Do you want to evaluate a course? */}
          <div style={{ paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
              Do you want to evaluate a course?
            </h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <button
                onClick={() => setWantEvaluate('yes')}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 12, fontWeight: 800, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                  background: wantEvaluate === 'yes' ? '#1e3a8a' : '#f1f5f9',
                  color: wantEvaluate === 'yes' ? '#fff' : '#334155',
                  boxShadow: wantEvaluate === 'yes' ? '0 4px 12px rgba(30,58,138,0.25)' : 'none'
                }}
              >
                Yes, Add Course Evaluation
              </button>
              <button
                onClick={() => setWantEvaluate('no')}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 12, fontWeight: 800, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                  background: wantEvaluate === 'no' ? '#0f172a' : '#f1f5f9',
                  color: wantEvaluate === 'no' ? '#fff' : '#334155',
                  boxShadow: wantEvaluate === 'no' ? '0 4px 12px rgba(15,23,42,0.25)' : 'none'
                }}
              >
                No, Go to Dashboard
              </button>
            </div>

            {/* Dynamic Semester Selection Logic (If Yes) */}
            {wantEvaluate === 'yes' && !createdCourseCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 16, padding: 20, marginTop: 16 }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0369a1', marginBottom: 12 }}>
                  Dynamic Semester & Course Setup
                </div>

                {apiError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10, color: '#dc2626', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                    {apiError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: 6 }}>
                      Select / Add Semester
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={e => setSelectedSemester(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #7dd3fc', background: '#fff', fontWeight: 700, fontSize: 14 }}
                    >
                      <option value="Fall 2026">Fall 2026</option>
                      <option value="Spring 2026">Spring 2026</option>
                      <option value="Summer 2026">Summer 2026</option>
                      <option value="Fall 2025">Fall 2025</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: 6 }}>
                      Course Code & Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EM620 Product Design"
                      value={customCourse}
                      onChange={e => setCustomCourse(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #7dd3fc', background: '#fff', fontWeight: 700, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Two Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button
                    onClick={handleStartEvaluation}
                    style={{
                      padding: '14px', borderRadius: 12, background: '#1e3a8a',
                      color: '#fff', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(30,58,138,0.3)'
                    }}
                  >
                    Start Evaluation Form Now →
                  </button>
                  <button
                    onClick={handlePublishForStudentsNow}
                    disabled={publishing}
                    style={{
                      padding: '14px', borderRadius: 12, background: publishing ? '#94a3b8' : '#0284c7',
                      color: '#fff', fontWeight: 900, fontSize: 14, border: 'none', cursor: publishing ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(2,132,199,0.3)'
                    }}
                  >
                    {publishing ? 'Publishing...' : 'Publish for Students Now (Fill Survey Later) →'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success Card when Published for Students Now */}
            {createdCourseCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 20, padding: 24, marginTop: 16, textAlign: 'center' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle size={28} color="#16a34a" />
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 900, color: '#166534', margin: 0, marginBottom: 4 }}>
                  Student Survey Code Generated!
                </h4>
                <p style={{ fontSize: 13, color: '#15803d', fontWeight: 600, margin: 0, marginBottom: 16 }}>
                  Students can now complete their evaluations using code: <strong>{createdCourseCode}</strong>. Your instructor survey is currently in <strong>Draft (Incomplete)</strong> status. Fill it anytime from the Dashboard!
                </p>

                <div style={{ background: '#15803d', borderRadius: 16, padding: '16px 24px', display: 'inline-flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: '#fff', fontFamily: 'monospace' }}>
                    {createdCourseCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div>
                  <button
                    onClick={handleProceedDashboard}
                    style={{ padding: '12px 28px', borderRadius: 12, background: '#0f172a', color: '#fff', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer' }}
                  >
                    Go to Dashboard →
                  </button>
                </div>
              </motion.div>
            )}

            {wantEvaluate === 'no' && (
              <button
                onClick={handleProceedDashboard}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, background: '#0f172a',
                  color: '#fff', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer',
                  marginTop: 12
                }}
              >
                Proceed to Main Dashboard →
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Two main option cards ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>

          {/* DASHBOARD card */}
          <motion.button
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}
            onClick={handleProceedDashboard}
            style={{
              background: '#fff', border: '2px solid #e2e8f0',
              borderRadius: 24, padding: '36px 32px', cursor: 'pointer',
              textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 18, background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
            }}>
              <BarChart3 size={30} color="#1e3a8a" />
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>
              Main Dashboard
            </div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              View all active and past course evaluations, student response counters, and status indicators.
            </div>

            <div style={{
              marginTop: 'auto', paddingTop: 20, display: 'flex',
              alignItems: 'center', gap: 6, color: '#1e3a8a', fontWeight: 800, fontSize: 14
            }}>
              Go to Dashboard <ChevronRight size={18} />
            </div>
          </motion.button>

          {/* FORM card */}
          <motion.button
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}
            onClick={handleStartEvaluation}
            style={{
              background: '#1e3a8a', border: '2px solid #1e3a8a',
              borderRadius: 24, padding: '36px 32px', cursor: 'pointer',
              textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 0,
              boxShadow: '0 4px 24px rgba(30,58,138,0.25)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
            }}>
              <ClipboardList size={30} color="#fff" />
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 10 }}>
              Evaluation Form
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 24 }}>
              Fill the 75-question instructor survey and generate 5-character student survey codes.
            </div>

            <div style={{
              marginTop: 'auto', paddingTop: 20, display: 'flex',
              alignItems: 'center', gap: 6, color: '#93c5fd', fontWeight: 800, fontSize: 14
            }}>
              Open Form <ChevronRight size={18} />
            </div>
          </motion.button>
        </div>

      </div>
    </div>
  );
}
