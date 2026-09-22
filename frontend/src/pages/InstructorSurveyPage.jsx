import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { INSTRUCTOR_FIELDS, INSTRUCTOR_SECTIONS } from '../config/INSTRUCTOR_FIELDS';
import { STUDENT_FIELDS, STUDENT_SECTIONS } from '../config/STUDENT_FIELDS';
import { submitInstructorSurvey, publishInstructorSurvey, updateInstructorSurvey, submitStudentSurvey, getInstructorSurveyDetail } from '../api/surveyApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Copy, ChevronRight, AlertTriangle,
  BookOpen, ArrowLeft, XCircle, Users, BarChart3, Edit3, Save, Info, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Validation ────────────────────────────────────────────────────────────────
function validateForm(fields, formData) {
  const errors = {};
  fields.forEach(field => {
    const val = (formData[field.name] ?? '').toString().trim();

    // Required check
    if (field.required && val === '') {
      errors[field.name] = 'This field is required';
      return;
    }

    // Skip further checks if empty & optional
    if (val === '') return;

    // Email check
    if (field.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errors[field.name] = 'Enter a valid email address';
      }
      return;
    }

    // Numeric range check
    if (['number', 'percentage', 'rating10', 'rating13'].includes(field.type)) {
      const num = parseFloat(val);
      if (isNaN(num)) {
        errors[field.name] = 'Must be a number';
      } else if (field.min !== undefined && num < field.min) {
        errors[field.name] = `Min value is ${field.min}`;
      } else if (field.max !== undefined && num > field.max) {
        errors[field.name] = `Max value is ${field.max}`;
      }
    }
  });
  return errors;
}

// ── Payload sanitizer ─────────────────────────────────────────────────────────
function sanitizePayload(fields, formData) {
  const clean = { ...formData };
  fields.forEach(field => {
    const val = clean[field.name];
    if (val === '' || val === undefined || val === null) {
      if (['number', 'percentage', 'rating10', 'rating13'].includes(field.type)) {
        clean[field.name] = null;
      } else {
        clean[field.name] = '';
      }
    } else if (['number', 'percentage', 'rating10', 'rating13'].includes(field.type)) {
      const parsed = parseFloat(val);
      clean[field.name] = isNaN(parsed) ? null : parsed;
    }
  });
  return clean;
}

// ── Reusable field renderer ────────────────────────────────────────────────────
function FieldInput({ field, value, onChange, hasError, onFix }) {
  const baseStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
    boxSizing: 'border-box',
    border: hasError ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
    background: hasError ? '#fff5f5' : '#f8fafc',
    color: '#0f172a',
  };

  const handleChange = (e) => {
    onChange(e);
    if (hasError) onFix(field.name);
  };

  if (field.type === 'textarea') {
    return (
      <textarea
        name={field.name}
        value={value}
        onChange={handleChange}
        rows={3}
        style={{ ...baseStyle, resize: 'vertical' }}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select name={field.name} value={value} onChange={handleChange}
        style={{ ...baseStyle, cursor: 'pointer' }}>
        <option value="">— Select —</option>
        {field.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  const inputType =
    field.type === 'email' ? 'email'
      : ['number', 'percentage', 'rating10', 'rating13'].includes(field.type) ? 'number'
        : 'text';

  return (
    <input
      type={inputType}
      name={field.name}
      value={value}
      onChange={handleChange}
      min={field.min}
      max={field.max}
      placeholder={
        field.type === 'percentage' ? '0 – 100'
          : field.type === 'rating10' ? '1 – 10'
            : field.type === 'rating13' ? '1 – 13'
              : ''
      }
      style={baseStyle}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const createCleanEmptyState = (fields) => {
  return Object.fromEntries(fields.map(f => [f.name, '']));
};

// Exclude Basic Information section so repetitive basic info fields are removed from the survey form UI
const VISIBLE_SECTIONS = INSTRUCTOR_SECTIONS.filter(s => s !== "Basic Information");
const SURVEY_FIELDS = INSTRUCTOR_FIELDS.filter(f => f.section !== "Basic Information");

export default function InstructorSurveyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getInitialState = () => {
    const targetId = location.state?.surveyId;
    const localDraft = (targetId && localStorage.getItem(`instructor_draft_${targetId}`)) ||
                       localStorage.getItem('instructor_draft_latest');
    
    let savedData = {};
    let savedIdx = 0;
    
    if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft);
        if (parsed.formData) savedData = parsed.formData;
        if (typeof parsed.activeSectionIdx === 'number' && parsed.activeSectionIdx >= 0 && parsed.activeSectionIdx < VISIBLE_SECTIONS.length) {
          savedIdx = parsed.activeSectionIdx;
        }
      } catch (e) { console.error(e); }
    }
    
    const userEmail = user?.email || '';
    const fixedProfile = JSON.parse(localStorage.getItem(`instructor_fixed_profile_${userEmail}`) || '{}');
    
    const defaults = createCleanEmptyState(INSTRUCTOR_FIELDS);
    
    const nameVal = savedData.q1_name || fixedProfile.name || location.state?.instructorInfo?.name || '';
    const univVal = savedData.q2_university || fixedProfile.university || location.state?.instructorInfo?.university || '';
    const emailVal = savedData.q108_email || fixedProfile.email || location.state?.instructorInfo?.email || '';
    const locVal = savedData.q109_location || fixedProfile.city || location.state?.instructorInfo?.city || '';
    const semVal = savedData.q3_semester || location.state?.semester || 'Fall';
    const courseVal = savedData.q4_course || location.state?.courseName || '';
    
    return {
      formData: {
        ...defaults,
        ...savedData,
        q1_name: nameVal,
        q2_university: univVal,
        q108_email: emailVal,
        q109_location: locVal,
        q3_semester: semVal,
        q4_course: courseVal,
        year: savedData.year || '2026'
      },
      activeSectionIdx: savedIdx,
      resumed: !!localDraft
    };
  };

  const [initialData] = useState(getInitialState);
  const [formData, setFormData] = useState(initialData.formData);
  const [errors, setErrors] = useState({});
  const [surveyId, setSurveyId] = useState(location.state?.surveyId || null);
  const [courseCode, setCourseCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  // steps: 'fill' | 'confirm' | 'done' | 'self_fill' | 'self_fill_done'
  const [step, setStep] = useState('fill');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // self-fill (teacher fills the student form themselves)
  const selfInitial = createCleanEmptyState(STUDENT_FIELDS);
  const [selfData, setSelfData] = useState(selfInitial);
  const [selfErrors, setSelfErrors] = useState({});
  const [editToken, setEditToken] = useState(null);
  const firstErrorRef = useRef(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(initialData.activeSectionIdx);
  const isMandatory = location.state?.mandatory;

  // ── Show toast on draft resume mount ──────────────────────────────────────
  React.useEffect(() => {
    if (initialData.resumed) {
      showToast('info', `ℹ️ Resumed survey draft at Section "${VISIBLE_SECTIONS[initialData.activeSectionIdx]}".`);
    }
  }, [initialData]);

  // ── Redirect safeguard against unnamed courses ─────────────────────────────
  React.useEffect(() => {
    const courseName = location.state?.courseName || formData.q4_course;
    if (!courseName && !surveyId) {
      navigate('/teacher');
    }
  }, [location.state, formData.q4_course, surveyId, navigate]);

  // ── Fetch existing survey details from DB on resume ────────────────────────
  React.useEffect(() => {
    const fetchSurveyDbData = async () => {
      const targetId = surveyId || location.state?.surveyId;
      if (targetId) {
        setLoading(true);
        try {
          const dbData = await getInstructorSurveyDetail(targetId);
          setFormData(prev => {
            const merged = { ...prev };
            Object.keys(dbData).forEach(key => {
              if (dbData[key] !== undefined && dbData[key] !== null && dbData[key] !== '') {
                merged[key] = dbData[key];
              }
            });
            return merged;
          });
        } catch (err) {
          console.error("Failed to load survey data from database:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSurveyDbData();
  }, [surveyId, location.state]);

  // ── Auto-Sync current draft and active section to localStorage ──────────────
  React.useEffect(() => {
    if (step === 'fill') {
      const targetId = surveyId || location.state?.surveyId;
      const draftData = JSON.stringify({
        formData,
        activeSectionIdx,
        timestamp: Date.now()
      });
      if (targetId) {
        localStorage.setItem(`instructor_draft_${targetId}`, draftData);
      }
      localStorage.setItem('instructor_draft_latest', draftData);
    }
  }, [formData, activeSectionIdx, surveyId, location.state, step]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Clear a single field error once the user starts fixing it
  const clearError = (name) => {
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSave = async () => {
    setApiError('');

    // Run validation on substantive survey fields (excluding Basic Information)
    const newErrors = validateForm(SURVEY_FIELDS, formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Auto-jump to the first section that contains an error
      const firstErrorFieldName = Object.keys(newErrors)[0];
      const errorField = SURVEY_FIELDS.find(f => f.name === firstErrorFieldName);
      if (errorField) {
        const errorSectionIdx = VISIBLE_SECTIONS.indexOf(errorField.section);
        if (errorSectionIdx !== -1) {
          setActiveSectionIdx(errorSectionIdx);
        }
      }

      // Scroll to first error field
      setTimeout(() => {
        const el = document.querySelector('[data-field-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setLoading(true);
    const payload = sanitizePayload(INSTRUCTOR_FIELDS, formData);
    try {
      let result;
      const targetId = surveyId || location.state?.surveyId;
      if (targetId) {
        result = await updateInstructorSurvey(targetId, payload);
        setSurveyId(targetId);
      } else {
        result = await submitInstructorSurvey(payload);
        setSurveyId(result.id);
      }
      setStep('confirm');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setApiError(err.detail || JSON.stringify(err));
      showToast('error', err.detail || 'Failed to save survey.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setLoading(true);
    const currentSection = VISIBLE_SECTIONS[activeSectionIdx] || VISIBLE_SECTIONS[0];
    const payload = sanitizePayload(INSTRUCTOR_FIELDS, formData);
    try {
      let result;
      const targetId = surveyId || location.state?.surveyId;
      if (targetId) {
        result = await updateInstructorSurvey(targetId, payload);
        setSurveyId(targetId);
      } else {
        result = await submitInstructorSurvey(payload);
        setSurveyId(result.id);
      }

      const savedId = targetId || result.id;
      localStorage.setItem(`instructor_draft_${savedId}`, JSON.stringify({
        formData,
        activeSectionIdx,
        timestamp: Date.now()
      }));

      showToast('success', `💾 Draft saved on Tab "${currentSection}"! Returning to Dashboard...`);
      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 600);
    } catch (err) {
      showToast('error', err.detail || 'Failed to save draft.');
    } finally {
      setLoading(false);
    }
  };


  const handlePublish = async () => {
    setLoading(true);
    setApiError('');
    try {
      const targetId = surveyId || location.state?.surveyId;
      const result = await publishInstructorSurvey(targetId);
      setCourseCode(result.course_code);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setApiError(JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelfChange = (e) => {
    setSelfData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const clearSelfError = (name) => {
    if (selfErrors[name]) setSelfErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSelfSubmit = async () => {
    setApiError('');
    const newErrors = validateForm(STUDENT_FIELDS, selfData);
    if (Object.keys(newErrors).length > 0) {
      setSelfErrors(newErrors);
      setTimeout(() => { document.querySelector('[data-self-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
      return;
    }
    setLoading(true);
    try {
      const result = await submitStudentSurvey({ ...selfData, course_code: courseCode, publish: true });
      setEditToken(result.edit_token || '');
      setStep('self_fill_done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setApiError(err.detail || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePublishForAnalysis = async () => {
    // Mark the instructor survey as ready for analysis
    // For now navigate back to teacher home with success indicator
    navigate('/teacher', { state: { published: true, courseCode } });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(courseCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(editToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorCount = Object.keys(errors).length;
  const selfErrorCount = Object.keys(selfErrors).length;

  // ── STEP: DONE ─────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#dcfce7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
        }}>
          <CheckCircle size={40} color="#16a34a" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
          Survey Published!
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32 }}>
          Share this code with your students.
        </p>
        <div style={{ background: '#1e3a8a', borderRadius: 20, padding: '32px 40px', marginBottom: 20 }}>
          <p style={{
            color: '#93c5fd', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12
          }}>
            Course Code
          </p>
          <div style={{
            fontSize: 52, fontWeight: 900, letterSpacing: 12,
            color: '#ffffff', fontFamily: 'monospace'
          }}>
            {courseCode}
          </div>
          <button onClick={handleCopy}
            style={{
              marginTop: 20, padding: '10px 20px', borderRadius: 10,
              background: copied ? '#16a34a' : 'rgba(255,255,255,0.15)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8, margin: '20px auto 0'
            }}>
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left'
        }}>
          <AlertTriangle size={18} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ color: '#7f1d1d', fontSize: 13, fontWeight: 600 }}>
            Save this code. If lost, students cannot fill the survey.
          </p>
        </div>
      </motion.div>
    );
  }

  // ── STEP: CONFIRM ─────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 660, margin: '60px auto', padding: '0 20px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Review &amp; Choose Next Step</h2>
        <p style={{ color: '#64748b', marginBottom: 28 }}>Survey saved as draft. How would you like to proceed?</p>

        {apiError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10, padding: '12px 16px', color: '#dc2626',
            marginBottom: 20, fontSize: 14
          }}>
            {apiError}
          </div>
        )}

        {/* Summary card */}
        <div style={{
          background: '#f0f9ff', border: '1px solid #bae6fd',
          borderRadius: 16, padding: '20px 24px', marginBottom: 28
        }}>
          {['q1_name', 'q2_university', 'q4_course', 'q3_semester', 'q111_degree_level', 'q105_class_format'].map(key => {
            const field = INSTRUCTOR_FIELDS.find(f => f.name === key);
            return formData[key] ? (
              <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#0f172a', minWidth: 160, fontSize: 13 }}>{field?.label}:</span>
                <span style={{ color: '#475569', fontSize: 13 }}>{formData[key]}</span>
              </div>
            ) : null;
          })}
        </div>

        {/* Two path buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Option A: Publish for students */}
          <button onClick={handlePublish} disabled={loading}
            style={{
              background: '#1e3a8a', border: 'none', borderRadius: 16,
              padding: '24px 20px', cursor: loading ? 'not-allowed' : 'pointer',
              textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
              boxShadow: '0 4px 20px rgba(30,58,138,0.25)',
              opacity: loading ? 0.6 : 1,
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={22} color="#fff" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginTop: 4 }}>
              Publish for Students
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Generate a course code to share with your students so they can fill their survey.
            </div>
          </button>

          {/* Option B: Fill it yourself */}
          <button
            disabled={loading}
            onClick={async () => {
              setApiError('');
              setLoading(true);
              try {
                const result = await publishInstructorSurvey(surveyId);
                setCourseCode(result.course_code);
                setStep('self_fill');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } catch (err) {
                setApiError(JSON.stringify(err));
              } finally {
                setLoading(false);
              }
            }}
            style={{
              background: '#fff', border: '2px solid #1e3a8a', borderRadius: 16,
              padding: '24px 20px', cursor: loading ? 'not-allowed' : 'pointer',
              textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
              opacity: loading ? 0.6 : 1,
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Edit3 size={22} color="#1e3a8a" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1e3a8a', marginTop: 4 }}>
              Fill it Yourself
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              Fill the student survey yourself, then choose to edit or publish for analysis.
            </div>
          </button>
        </div>

        <button onClick={() => { setStep('fill'); setActiveSectionIdx(0); }} disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#475569',
            fontSize: 13,
          }}>
          <ArrowLeft size={15} /> Edit Instructor Survey
        </button>


      </motion.div>
    );
  }

  // ── STEP: FILL ─────────────────────────────────────────────────────────────
  const totalAllFields   = SURVEY_FIELDS.length;
  const filledAllFields  = SURVEY_FIELDS.filter(f => formData[f.name] !== undefined && formData[f.name] !== null && formData[f.name] !== '').length;
  const overallPct       = totalAllFields > 0 ? Math.round((filledAllFields / totalAllFields) * 100) : 0;

  const activeSecName   = VISIBLE_SECTIONS[activeSectionIdx] || VISIBLE_SECTIONS[0];
  const activeSecFields = SURVEY_FIELDS.filter(f => f.section === activeSecName);
  const activeSecTotal  = activeSecFields.length;
  const activeSecFilled = activeSecFields.filter(f => {
    const v = formData[f.name];
    return v !== undefined && v !== null && v !== '';
  }).length;
  const activeSecPct    = activeSecTotal > 0 ? Math.round((activeSecFilled / activeSecTotal) * 100) : 0;

  const required     = SURVEY_FIELDS.filter(f => f.required);
  const filled       = required.filter(f => formData[f.name] !== undefined && formData[f.name] !== null && formData[f.name] !== '').length;
  const isFormReady  = filled >= required.length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        {isMandatory && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fcd34d',
            borderRadius: 12, padding: '14px 18px', marginBottom: 24,
            color: '#92400e', fontWeight: 600, fontSize: 13
          }}>
            ⚠️ Please complete your instructor survey before accessing the dashboard.
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: '#1e3a8a',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BookOpen size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Instructor Course Evaluation
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              Fill all required fields (*) before publishing to students.
            </p>
          </div>
        </div>

        {/* Overall Form Completion Progress */}
        <div style={{ marginTop: 16 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, color: '#64748b', marginBottom: 6
          }}>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>
              Overall Form Completion Progress
            </span>
            <span style={{ fontWeight: 800, color: overallPct === 100 ? '#16a34a' : '#1e3a8a' }}>
              {filledAllFields} / {totalAllFields} attributes filled ({overallPct}%)
            </span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99 }}>
            <div style={{
              height: '100%', width: `${overallPct}%`,
              background: overallPct === 100 ? '#16a34a' : '#1e3a8a',
              borderRadius: 99, transition: 'width 0.3s'
            }} />
          </div>
        </div>

        {/* 🚀 Dynamic Section Completion Timeline with Visible Scrollbar */}
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto', padding: '14px 4px 14px 4px',
          margin: '16px 0 12px 0',
          scrollbarWidth: 'thin',
          scrollbarColor: '#94a3b8 #f1f5f9'
        }}>
          {VISIBLE_SECTIONS.map((secName, idx) => {
            const secFields = INSTRUCTOR_FIELDS.filter(f => f.section === secName);
            const total = secFields.length;
            const secFilled = secFields.filter(f => {
              const v = formData[f.name];
              return v !== undefined && v !== null && v !== '';
            }).length;
            const secPct = total > 0 ? Math.round((secFilled / total) * 100) : 0;
            const isComplete = total > 0 && secFilled === total;
            const hasError = secFields.some(f => errors[f.name]);
            const isActive = idx === activeSectionIdx;

            let bg = '#f8fafc';
            let borderColor = '#e2e8f0';
            let textColor = '#64748b';
            let badgeBg = '#cbd5e1';
            let badgeColor = '#334155';

            if (isActive) {
              bg = '#eff6ff';
              borderColor = '#1e3a8a';
              textColor = '#1e3a8a';
              badgeBg = '#1e3a8a';
              badgeColor = '#ffffff';
            } else if (hasError) {
              bg = '#fef2f2';
              borderColor = '#fecaca';
              textColor = '#dc2626';
              badgeBg = '#dc2626';
              badgeColor = '#ffffff';
            } else if (isComplete) {
              bg = '#f0fdf4';
              borderColor = '#bbf7d0';
              textColor = '#15803d';
              badgeBg = '#16a34a';
              badgeColor = '#ffffff';
            }

            return (
              <button
                key={secName}
                type="button"
                onClick={(e) => {
                  setActiveSectionIdx(idx);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 99,
                  background: bg, border: `1.5px solid ${borderColor}`,
                  color: textColor, fontWeight: isActive ? 800 : 700,
                  fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s', flexShrink: 0,
                  boxShadow: isActive ? '0 4px 12px rgba(30,58,138,0.12)' : 'none'
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: badgeBg, color: badgeColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900
                }}>
                  {isComplete ? '✓' : idx + 1}
                </span>
                <span>{secName}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  padding: '2px 6px', borderRadius: 99,
                  background: isComplete ? '#dcfce7' : isActive ? '#dbeafe' : '#e2e8f0',
                  color: isComplete ? '#166534' : isActive ? '#1e40af' : '#475569'
                }}>
                  {secPct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '12px 16px', color: '#dc2626',
          marginBottom: 24, fontSize: 14
        }}>
          {apiError}
        </div>
      )}

      {/* Validation error banner */}
      <AnimatePresence>
        {errorCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: '#fef2f2', border: '1.5px solid #fecaca',
              borderRadius: 14, padding: '16px 20px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
            <XCircle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 14 }}>
                {errorCount} field{errorCount > 1 ? 's' : ''} need attention
              </div>
              <div style={{ color: '#7f1d1d', fontSize: 12 }}>
                Fields highlighted in red must be corrected before saving.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sections */}
      {/* Active Section Card */}
      {(() => {
        const section = VISIBLE_SECTIONS[activeSectionIdx] || VISIBLE_SECTIONS[0];
        const sectionFields = INSTRUCTOR_FIELDS.filter(f => f.section === section);
        const sectionHasError = sectionFields.some(f => errors[f.name]);
        const sIdx = activeSectionIdx;

        const totalSec = sectionFields.length;
        const secFilled = sectionFields.filter(f => {
          const v = formData[f.name];
          return v !== undefined && v !== null && v !== '';
        }).length;
        const secPct = totalSec > 0 ? Math.round((secFilled / totalSec) * 100) : 100;

        return (
          <motion.div key={section}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fff', borderRadius: 20, padding: 32, marginBottom: 24,
              border: sectionHasError ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
              boxShadow: sectionHasError ? '0 2px 16px rgba(239,68,68,0.06)' : '0 2px 12px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s',
            }}>

            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: sectionHasError ? '#fef2f2' : '#eff6ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900,
                  color: sectionHasError ? '#dc2626' : '#1e3a8a',
                }}>
                  {sIdx + 1}
                </div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {section}
                </h2>
                {sectionHasError && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: '#dc2626',
                    background: '#fef2f2', padding: '2px 8px', borderRadius: 99
                  }}>
                    Has errors
                  </span>
                )}
              </div>

              <span style={{ fontSize: 12, fontWeight: 800, color: secFilled === totalSec ? '#16a34a' : '#1e3a8a' }}>
                Section Progress: {secFilled} / {totalSec} filled ({secPct}%)
              </span>
            </div>

            {/* Dynamic Section Progress Bar */}
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${secPct}%`,
                background: secPct === 100 ? '#16a34a' : '#1e3a8a',
                borderRadius: 99, transition: 'width 0.3s'
              }} />
            </div>

            {/* Fields Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 20,
            }}>
              {sectionFields.map(field => {
                const hasError = !!errors[field.name];
                return (
                  <div key={field.name}
                    data-field-error={hasError ? 'true' : undefined}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 4,
                      gridColumn: field.type === 'textarea' ? 'span 2' : 'span 1',
                    }}>

                    <label style={{
                      fontSize: 13, fontWeight: 600, lineHeight: 1.4,
                      color: hasError ? '#dc2626' : '#374151',
                      transition: 'color 0.2s',
                    }}>
                      {field.label}
                      {field.required && (
                        <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>
                      )}
                      {field.type === 'percentage' && (
                        <span style={{ color: '#94a3b8', fontWeight: 400 }}> (%)</span>
                      )}
                      {field.type === 'rating10' && (
                        <span style={{ color: '#94a3b8', fontWeight: 400 }}> (1–10)</span>
                      )}
                    </label>

                    <FieldInput
                      field={field}
                      value={formData[field.name]}
                      onChange={handleChange}
                      hasError={hasError}
                      onFix={clearError}
                    />

                    {/* Inline error message */}
                    <AnimatePresence>
                      {hasError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{
                            fontSize: 11, color: '#dc2626', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                          <AlertTriangle size={11} />
                          {errors[field.name]}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* Wizard Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <div>
          {activeSectionIdx > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveSectionIdx(prev => prev - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                padding: '14px 24px', borderRadius: 12, border: '1px solid #e2e8f0',
                background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#475569',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.2s',
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>

        {/* 💾 Save as Draft Button on Every Tab */}
        <button
          type="button"
          onClick={handleSaveAsDraft}
          disabled={loading}
          style={{
            padding: '14px 22px', borderRadius: 12, border: '1.5px solid #0284c7',
            background: '#f0f9ff', color: '#0369a1', cursor: 'pointer',
            fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <Save size={16} /> {loading ? 'Saving...' : 'Save as Draft'}
        </button>

        <div>
          {activeSectionIdx < VISIBLE_SECTIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                const section = VISIBLE_SECTIONS[activeSectionIdx];
                const sectionFields = INSTRUCTOR_FIELDS.filter(f => f.section === section);
                const sectionErrors = validateForm(sectionFields, formData);
                if (Object.keys(sectionErrors).length > 0) {
                  setErrors(prev => ({ ...prev, ...sectionErrors }));
                  showToast('error', `Please fix ${Object.keys(sectionErrors).length} error(s) in Section "${section}" before proceeding.`);
                  setTimeout(() => {
                    document.querySelector('[data-field-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                  return;
                }
                setActiveSectionIdx(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                padding: '14px 28px', borderRadius: 12, border: 'none',
                background: '#1e3a8a', color: '#fff', cursor: 'pointer',
                fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
            >
              Next Section <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              title={!isFormReady ? `Required fields completed: (${filled}/${required.length})` : ''}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: '#1e3a8a',
                color: '#fff',
                border: 'none',
                fontWeight: 900, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(30,58,138,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.3s',
              }}
            >
              {loading ? 'Saving...' : <>Save &amp; Review <ChevronRight size={18} /></>}
            </button>
          )}
        </div>
      </div>

      {/* 🔔 Toaster Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed', top: 24, right: 24, zIndex: 9999,
              background: toast.type === 'error' ? '#fef2f2' : toast.type === 'success' ? '#f0fdf4' : '#f0f9ff',
              border: toast.type === 'error' ? '1.5px solid #fecaca' : toast.type === 'success' ? '1.5px solid #86efac' : '1.5px solid #bae6fd',
              color: toast.type === 'error' ? '#dc2626' : toast.type === 'success' ? '#166534' : '#0369a1',
              borderRadius: 16, padding: '14px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', gap: 12, fontWeight: 800, fontSize: 14
            }}
          >
            {toast.type === 'error' ? <AlertTriangle size={18} /> : toast.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8 }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
