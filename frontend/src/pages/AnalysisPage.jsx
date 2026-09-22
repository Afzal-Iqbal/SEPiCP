import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Database, Settings2, BarChart3, Zap, History } from "lucide-react";
import { cn } from "../lib/utils";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { apiUrl } from "../lib/api";
import DataPreviewTable from "../components/DataPreviewTable";

const AnalysisPage = () => {
  const [xAxis, setXAxis] = useState(() => {
    try {
      const saved = sessionStorage.getItem('analysis_xaxis');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [yAxis, setYAxis] = useState(() => {
    return sessionStorage.getItem('analysis_yaxis') || "";
  });
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);

  const [step, setStep] = useState(() => {
    return Number(sessionStorage.getItem('analysis_step')) || 1;
  });
  const [selectedDataset, setSelectedDataset] = useState(() => {
    return sessionStorage.getItem('analysis_selected_dataset') || "";
  });
  const [columns, setColumns] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [variance, setVariance] = useState(95);

  // Detect when we're in "course direct" mode (loaded from Analyse Course/Instructor button)
  const [courseDirectData, setCourseDirectData] = useState(() => {
    const raw = sessionStorage.getItem('course_direct_data');
    if (raw) { try { return JSON.parse(raw); } catch { return null; } }
    return null;
  });
  const [courseDirectName, setCourseDirectName] = useState(() => sessionStorage.getItem('course_direct_name') || '');
  const isCourseMode = courseDirectData && courseDirectData.length > 0;

  const analysisTypeRaw = sessionStorage.getItem('analysis_type') || "";
  const [analysisType, setAnalysisType] = useState(analysisTypeRaw);
  const navigate = useNavigate();
  const location = useLocation();

  // On mount, check if there's a datasetId in the URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qsDatasetId = params.get('datasetId');
    if (qsDatasetId) {
      setSelectedDataset(qsDatasetId);
      setStep(2); // Jump straight to step 2
      sessionStorage.setItem('analysis_selected_dataset', qsDatasetId);
      sessionStorage.setItem('analysis_step', 2);
    }
  }, [location.search]);

  // Compute table data and columns for dataset preview
  // In course mode: always show the course-specific rows, not the full DB dataset
  const tableData = React.useMemo(() => {
    if (isCourseMode) return courseDirectData || [];
    if (!selectedDataset || selectedDataset === "none") return [];
    const selected = datasets.find((d) => d.id.toString() === selectedDataset);
    if (selected?.cleaned_data?.length > 0) return selected.cleaned_data;
    // Fallback: sessionStorage uploaded table
    try {
      const stored = sessionStorage.getItem('uploaded_table_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  }, [selectedDataset, datasets, isCourseMode, courseDirectData]);

  const tableColumns = React.useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]).map((key) => ({
      header: key.toUpperCase(),
      accessorKey: key
    }));
  }, [tableData]);

  // Compute the active dataset name dynamically
  const activeSessionName = React.useMemo(() => {
    // Course direct mode: name comes from sessionStorage set by Responses tab
    if (isCourseMode) return courseDirectName || 'Course Analysis';
    if (!selectedDataset || selectedDataset === "none") {
      return "No Active Dataset";
    }
    const selected = datasets.find((d) => d.id.toString() === selectedDataset);
    if (selected) {
      const isLatest = datasets[0] && datasets[0].id === selected.id;
      if (isLatest) {
        const saved = sessionStorage.getItem('uploaded_file_info');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.name) return parsed.name;
          } catch {}
        }
      }
      return `Dataset #${selected.id}`;
    }
    return "No Active Dataset";
  }, [selectedDataset, datasets, isCourseMode, courseDirectName]);

  // Sync states to sessionStorage on change
  React.useEffect(() => {
    sessionStorage.setItem('analysis_selected_dataset', selectedDataset);
  }, [selectedDataset]);

  React.useEffect(() => {
    sessionStorage.setItem('analysis_step', step);
  }, [step]);

  React.useEffect(() => {
    sessionStorage.setItem('analysis_type', analysisType);
  }, [analysisType]);

  React.useEffect(() => {
    sessionStorage.setItem('analysis_xaxis', JSON.stringify(xAxis));
  }, [xAxis]);

  React.useEffect(() => {
    sessionStorage.setItem('analysis_yaxis', yAxis);
  }, [yAxis]);

  // If a selected Y variable is checked in X (independent features), reset Y to enforce showing only remaining unselected features
  React.useEffect(() => {
    if (yAxis && xAxis.includes(yAxis)) {
      setYAxis('');
    }
  }, [xAxis, yAxis]);

  React.useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setDatasetsLoading(true);
        const response = await fetch(apiUrl("/datasets/"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to fetch datasets", data);
          return;
        }

        const sorted = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );

        setDatasets(sorted.slice(0, 5));

        // Auto-select latest dataset if none is selected
        // ⛔ Skip auto-select if we're in course-direct mode (came from Analyse Course button)
        const params = new URLSearchParams(location.search);
        const qsDatasetId = params.get('datasetId');
        const inCourseMode = !!sessionStorage.getItem('course_direct_data');
        if (qsDatasetId) {
          // Handled by the other useEffect
        } else if (!inCourseMode && !sessionStorage.getItem('analysis_selected_dataset') && sorted.length > 0) {
          setSelectedDataset(sorted[0].id.toString());
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setDatasetsLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  // Helper: extract column names from raw data array
  const extractColumnsFromData = React.useCallback((rawData) => {
    let data = rawData;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return; }
    }
    if (!Array.isArray(data) || data.length === 0) return;
    const firstRow = data[0] || {};
    const EXCLUDED_COLUMNS = new Set([
      'id', 'teacher_id', 'instructor_survey_id', 'is_published', 'edit_token',
      'submitted_at', 'created_at', 'updated_at', 'status', 'course_code'
    ]);
    const cols = Object.keys(firstRow).filter(
      col => !EXCLUDED_COLUMNS.has(col.toLowerCase().trim())
    );
    const numericCols = cols.filter((col) => {
      const validValues = data.map((row) => row[col]).filter((val) => val !== null && val !== '' && val !== undefined);
      if (validValues.length === 0) return false;
      const numericCount = validValues.filter((val) => !isNaN(Number(val)) && val !== true && val !== false).length;
      return (numericCount / validValues.length) >= 0.2;
    });
    setColumns(cols);
    setNumericColumns(numericCols.length > 0 ? numericCols : cols);
  }, []);

  // Effect: populate columns — PRIORITY: course direct data > DB dataset > sessionStorage
  React.useEffect(() => {
    setXAxis([]);
    setYAxis('');
    setColumns([]);
    setNumericColumns([]);

    // ✅ PRIORITY 1: Course direct mode (came from Analyse Course/Instructor button)
    if (isCourseMode) {
      extractColumnsFromData(courseDirectData);
      return;
    }

    if (!selectedDataset) return;

    // ✅ PRIORITY 2: DB dataset already loaded in state
    const selected = datasets.find((d) => d && d.id && d.id.toString() === selectedDataset);
    if (selected) {
      const rawData = (selected.cleaned_data && selected.cleaned_data.length > 0)
        ? selected.cleaned_data
        : selected.original_data;
      if (rawData && Array.isArray(rawData) && rawData.length > 0) {
        extractColumnsFromData(rawData);
        return;
      }
    }

    // ✅ PRIORITY 3: sessionStorage uploaded_table_data fallback
    const storedData = sessionStorage.getItem('uploaded_table_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          extractColumnsFromData(parsed);
          return;
        }
      } catch { /* ignore */ }
    }

    // ✅ PRIORITY 4: Fetch from API by dataset ID
    const fetchDatasetById = async () => {
      try {
        const res = await fetch(`${apiUrl('/datasets/')}${selectedDataset}/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access')}`,
          },
        });
        if (!res.ok) return;
        const ds = await res.json();
        const rawData = (ds.cleaned_data && Array.isArray(ds.cleaned_data) && ds.cleaned_data.length > 0)
          ? ds.cleaned_data
          : ds.original_data;
        extractColumnsFromData(rawData);
      } catch (err) {
        console.error('Failed to fetch dataset detail:', err);
      }
    };
    fetchDatasetById();
  }, [selectedDataset, datasets, isCourseMode, courseDirectData, extractColumnsFromData]);

  // const handleRun = () => {
  //   if (step !== 2) return;
  //   logActivity('analysis', `Ran visualization on ${dataset}`);
  //   navigate('/results');
  // };
  const filterSelectedData = (data, cols) => {
    if (!Array.isArray(data) || !cols || cols.length === 0) return data;
    const colSet = new Set(cols.map(c => c.toLowerCase().trim()));
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      const newRow = {};
      Object.keys(row).forEach(k => {
        if (colSet.has(k.toLowerCase().trim())) {
          newRow[k] = row[k];
        }
      });
      return newRow;
    });
  };

  const handleRun = async () => {
    // ── Resolve the data to analyse ──────────────────────────────────────
    // In course-mode the data came from the Responses tab; otherwise use DB dataset.
    let cleanedData = null;
    let datasetId = null;
    let datasetCreatedAt = null;

    if (isCourseMode) {
      // Use the course-specific data stored in sessionStorage
      cleanedData = courseDirectData;
      datasetId = sessionStorage.getItem('course_direct_id') || null;
    } else {
      const selected = datasets.find((d) => d.id.toString() === selectedDataset);
      if (!selected) {
        alert('Please select a dataset first.');
        return;
      }
      datasetId = selected.id;
      datasetCreatedAt = selected.created_at;
      cleanedData = (selected.cleaned_data && selected.cleaned_data.length > 0)
        ? selected.cleaned_data
        : (selected.original_data || []);

      // Fallback: try sessionStorage
      if (!cleanedData || !Array.isArray(cleanedData) || cleanedData.length === 0) {
        try {
          const stored = sessionStorage.getItem('uploaded_table_data');
          if (stored) cleanedData = JSON.parse(stored);
        } catch { /* ignore */ }
      }
    }

    if (typeof cleanedData === 'string') {
      try { cleanedData = JSON.parse(cleanedData); } catch { /* ignore */ }
    }

    if (!cleanedData || !Array.isArray(cleanedData) || cleanedData.length === 0) {
      alert('The selected dataset is empty. Please re-upload or select a valid dataset.');
      return;
    }

    // ── Build request payload by analysis type ───────────────────────────
    let url = '';
    let payload = {};

    if (analysisType === 'regression') {
      const independentVars = xAxis.filter((col) => col !== yAxis);
      if (independentVars.length === 0 || !yAxis) {
        alert('Please select at least one Independent Feature (X) and one Dependent Variable (Y).');
        return;
      }
      url = apiUrl('/analysis/regression/');
      const selectedCols = [...independentVars, yAxis];
      const filteredData = filterSelectedData(cleanedData, selectedCols);
      payload = { independent_vars: independentVars, dependent_var: yAxis, data: filteredData, dataset_id: datasetId, missing_values: 'mean' };
    } else if (analysisType === 'pca') {
      if (xAxis.length === 0) { alert('Select at least one feature'); return; }
      url = apiUrl('/analysis/pca/');
      const filteredData = filterSelectedData(cleanedData, xAxis);
      payload = { selected_columns: xAxis, variance_threshold: variance, data: filteredData, dataset_id: datasetId, missing_values: 'mean' };
    } else if (analysisType === 'basic' || analysisType === 'descriptive') {
      url = apiUrl('/analysis/basic/');
      const selectedCols = xAxis.length > 0 ? xAxis : columns;
      const filteredData = filterSelectedData(cleanedData, selectedCols);
      payload = { selected_columns: selectedCols, data: filteredData, dataset_id: datasetId };
    } else if (analysisType === 'correlation') {
      url = apiUrl('/analysis/correlation/');
      const selectedCols = xAxis.length > 0 ? xAxis : columns;
      const filteredData = filterSelectedData(cleanedData, selectedCols);
      payload = { selected_columns: selectedCols, data: filteredData, dataset_id: datasetId };
    } else if (analysisType === 'kmeans') {
      url = apiUrl('/analysis/kmeans/');
      const selectedCols = xAxis.length > 0 ? xAxis : columns;
      const filteredData = filterSelectedData(cleanedData, selectedCols);
      payload = { selected_columns: selectedCols, data: filteredData, dataset_id: datasetId };
    }

    if (!url) {
      alert('Please select an analysis algorithm first.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Analysis failed. Note: Statistical algorithms (PCA, Regression, Correlation) require at least 2 sample rows. For single-row Instructor surveys, please analyze Student responses or Descriptive statistics.");
        return;
      }
      navigate('/results', {
        state: {
          analysisType,
          result: data,
          datasetId,
          datasetCreatedAt,
          courseName: isCourseMode ? courseDirectName : null,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleSelectAll = (availableColumns) => {
    if (xAxis.length === availableColumns.length) {
      setXAxis([]); // Unselect all
    } else {
      setXAxis([...availableColumns]); // Select all
    }
  };

  const StatBox = ({ label, value }) => (
    <div className="rounded-xl bg-white border border-slate-200 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="text-lg font-black text-slate-900 mt-1">
        {typeof value === "number" ? value.toFixed(2) : value ?? "N/A"}
      </p>
    </div>
  );

  const SURVEY_SECTIONS = [
    { id: "basic_info", name: "🏫 Section 1: Basic Information & Metadata", prefixes: ["q1_", "q2_", "q3_", "q4_", "q104_", "q105_", "q107_", "q108_", "q109_", "q111_", "year", "semester", "role", "degree", "location", "student_count", "course_code", "course_name", "teacher_name", "university", "department"] },
    { id: "engagement", name: "⚡ Section 2: Overall Engagement", prefixes: ["total_engage", "engage_score", "engage"] },
    { id: "content", name: "📚 Section 3: Content Usage", prefixes: ["content_"] },
    { id: "relevance", name: "🎯 Section 4: Relevance", prefixes: ["relevance_"] },
    { id: "discuss", name: "💬 Section 5: Discussion Methods", prefixes: ["discuss_"] },
    { id: "act_part", name: "🚀 Section 6: Active Participation", prefixes: ["act_part_"] },
    { id: "methods", name: "🎓 Section 7: Teaching Methods (% of time)", prefixes: ["methods_", "methods_p_", "methods_s_", "methods_p", "methods_s"] },
    { id: "cls_org", name: "📋 Section 8: Class Organization", prefixes: ["cls_org_"] },
    { id: "challenge", name: "🧠 Section 9: Challenge Level", prefixes: ["challenge_", "challenge"] },
    { id: "cncts", name: "🤝 Section 10: Connection with Students/Professor", prefixes: ["cncts_"] },
    { id: "prof_attr", name: "⭐ Section 11: Professor Attributes & Feedback", prefixes: ["prof_", "attr_", "q_prof_"] },
  ];

  const renderCategorizedFeatureSelector = (colsToRender) => {
    const categorized = {};
    const assigned = new Set();

    SURVEY_SECTIONS.forEach((sec) => {
      categorized[sec.id] = colsToRender.filter((c) =>
        sec.prefixes.some((prefix) => c.toLowerCase().startsWith(prefix.toLowerCase()))
      );
      categorized[sec.id].forEach((c) => assigned.add(c));
    });

    const remaining = colsToRender.filter((c) => !assigned.has(c));
    if (remaining.length > 0) {
      categorized["general"] = remaining;
    }

    const allColsSelected = colsToRender.length > 0 && colsToRender.every((c) => xAxis.includes(c));

    return (
      <div className="space-y-3 mt-2">
        {/* 🔥 Top Global Quick Selector (Select All Sections / Clear All) */}
        <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
          <span className="text-xs font-black text-slate-800">
            Feature Selection ({xAxis.length} of {colsToRender.length} selected)
          </span>
          <button
            type="button"
            onClick={() => {
              if (allColsSelected) {
                setXAxis((prev) => prev.filter((c) => !colsToRender.includes(c)));
              } else {
                setXAxis((prev) => Array.from(new Set([...prev, ...colsToRender])));
              }
            }}
            className="text-xs font-black text-[#1e3a8a] bg-white px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
          >
            {allColsSelected ? "Clear All Features" : "Select All (Sections 1–11)"}
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {SURVEY_SECTIONS.map((sec) => {
            const cols = categorized[sec.id] || [];
            if (cols.length === 0) return null;
            const selectedCount = cols.filter((c) => xAxis.includes(c)).length;
            const allSelected = cols.every((c) => xAxis.includes(c));

            return (
              <div key={sec.id} className="border border-slate-200 rounded-xl p-3 bg-white shadow-xs">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">{sec.name}</span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {selectedCount}/{cols.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (allSelected) {
                        setXAxis((prev) => prev.filter((c) => !cols.includes(c)));
                      } else {
                        setXAxis((prev) => Array.from(new Set([...prev, ...cols])));
                      }
                    }}
                    className="text-[10px] font-bold text-[#1e3a8a] hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    {allSelected ? "Clear Section" : "Select Section"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {cols.map((col) => (
                    <label key={col} className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={xAxis.includes(col)}
                        onChange={() => {
                          setXAxis((prev) =>
                            prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
                          );
                        }}
                        className="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                      />
                      {col}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {categorized["general"] && categorized["general"].length > 0 && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">📊 General / Other Features</span>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {categorized["general"].filter((c) => xAxis.includes(c)).length}/{categorized["general"].length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const cols = categorized["general"];
                    const allSelected = cols.every((c) => xAxis.includes(c));
                    if (allSelected) {
                      setXAxis((prev) => prev.filter((c) => !cols.includes(c)));
                    } else {
                      setXAxis((prev) => Array.from(new Set([...prev, ...cols])));
                    }
                  }}
                  className="text-[10px] font-bold text-[#1e3a8a] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Select / Clear
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {categorized["general"].map((col) => (
                  <label key={col} className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={xAxis.includes(col)}
                      onChange={() => {
                        setXAxis((prev) =>
                          prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
                        );
                      }}
                      className="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                    />
                    {col}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const currentDatasetObj = datasets.find((d) => d && d.id && d.id.toString() === selectedDataset);
  let activeDatasetName = "Active Survey Dataset";

  const savedFileInfo = sessionStorage.getItem('uploaded_file_info');
  if (savedFileInfo) {
    try {
      const parsed = JSON.parse(savedFileInfo);
      if (parsed.name && parsed.name !== 'Survey Data') {
        activeDatasetName = parsed.name;
      }
    } catch (e) {}
  } else if (currentDatasetObj) {
    activeDatasetName = currentDatasetObj.name || currentDatasetObj.file_name || `Survey Dataset #${currentDatasetObj.id}`;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* 🚀 Modern Unique Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isCourseMode ? (
              <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-purple-200">
                📌 Course Analysis Mode
              </span>
            ) : (
              <span className="px-3 py-1 bg-blue-50 text-[#1e3a8a] text-[10px] font-black uppercase tracking-wider rounded-full border border-blue-200">
                Active Session
              </span>
            )}
            <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {activeSessionName}
            </span>
            {columns.length > 0 && (
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                {columns.length} variables available
              </span>
            )}
            {isCourseMode && sessionStorage.getItem('course_direct_type') && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                sessionStorage.getItem('course_direct_type') === 'instructor'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : sessionStorage.getItem('course_direct_type') === 'student'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {sessionStorage.getItem('course_direct_type') === 'instructor' ? '🧑‍🏫 Instructor' : sessionStorage.getItem('course_direct_type') === 'student' ? '👩‍🎓 Students' : '🔗 Combined'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Statistical &amp; Machine Learning Analysis
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Configure algorithm parameters, select features across Sections 1–11, and generate interactive analytics reports.
          </p>
        </div>

        {/* Dataset Switcher — shows course exit button in course mode */}
        <div className="relative z-10 shrink-0">
          {isCourseMode ? (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Course Mode Active</span>
              <button
                type="button"
                onClick={() => {
                  // Exit course mode — clear ALL course and uploaded slot data
                  sessionStorage.removeItem('course_direct_data');
                  sessionStorage.removeItem('course_direct_name');
                  sessionStorage.removeItem('course_direct_type');
                  sessionStorage.removeItem('course_direct_id');
                  sessionStorage.removeItem('course_direct_code');
                  // Also clear uploaded slots so stale course data doesn't persist
                  sessionStorage.removeItem('uploaded_table_data');
                  sessionStorage.removeItem('uploaded_columns');
                  sessionStorage.removeItem('uploaded_file_info');
                  sessionStorage.removeItem('analysis_xaxis');
                  sessionStorage.removeItem('analysis_yaxis');
                  setCourseDirectData(null);
                  setCourseDirectName('');
                  setXAxis([]);
                  setYAxis('');
                  setColumns([]);
                  setNumericColumns([]);
                  // Auto-select first DB dataset if available
                  if (datasets.length > 0) {
                    setSelectedDataset(datasets[0].id.toString());
                  }
                }}
                className="w-64 h-11 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-2 px-4 cursor-pointer"
              >
                <Database className="w-4 h-4 text-slate-500" />
                Switch to Saved Datasets
              </button>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Switch Dataset
              </label>
              <Select
                value={selectedDataset}
                onValueChange={setSelectedDataset}
              >
                <SelectTrigger className="w-64 bg-slate-50 border border-slate-200 rounded-xl h-11 font-extrabold text-slate-800 hover:bg-slate-100 transition-all text-xs cursor-pointer shadow-xs">
                  <Database className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                  <SelectValue placeholder="Select active dataset..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-1">
                  {datasets.length === 0 ? (
                    <SelectItem value="none" className="rounded-xl font-bold text-xs">
                      No saved datasets
                    </SelectItem>
                  ) : (
                    datasets.map((item, index) => {
                      let dName = item.name || item.file_name || `Survey Dataset #${item.id}`;
                      if (index === 0 && savedFileInfo) {
                        try {
                          const p = JSON.parse(savedFileInfo);
                          if (p.name) dName = p.name;
                        } catch {}
                      }
                      return (
                        <SelectItem
                          key={item.id}
                          value={item.id.toString()}
                          className="rounded-xl font-bold text-xs py-2.5"
                        >
                          {dName}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Horizontal Configurations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="rounded-[28px] border-slate-200/80 shadow-xl shadow-slate-200/30 bg-white overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="font-black text-slate-900 flex items-center gap-2.5 text-sm uppercase tracking-wider">
                <Settings2 className="w-4.5 h-4.5 text-[#1e3a8a]" />
                Analysis Setup &amp; Variable Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Select Analysis Algorithm
                    </label>
                    <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Step 1 of 2
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "pca", title: "Principal Component Analysis (PCA)", desc: "Dimensionality reduction & feature variance structure." },
                      { id: "regression", title: "Linear Regression", desc: "Model relationship between dependent (Y) & independent (X) features." },
                      { id: "correlation", title: "Correlation Matrix", desc: "Analyze feature-to-feature correlation coefficients." },
                      { id: "kmeans", title: "K-Means Clustering", desc: "Group responses into distinct behavioral clusters." },
                      { id: "descriptive", title: "Descriptive Statistics", desc: "Mean, median, standard deviation, and distribution metrics." },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAnalysisType(item.id);
                          setStep(2);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          analysisType === item.id
                            ? "bg-blue-50/80 border-[#1e3a8a] ring-2 ring-blue-900/10"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-900">{item.title}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1 leading-snug">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Algorithm selection header info bar */}
                  <div className="flex items-center justify-between bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Selected Algorithm
                      </span>
                      <span className="text-xs font-black text-[#1e3a8a] capitalize">
                        {analysisType === 'pca' ? 'Principal Component Analysis (PCA)' : analysisType === 'regression' ? 'Linear Regression' : analysisType === 'correlation' ? 'Correlation Matrix' : analysisType === 'kmeans' ? 'K-Means Clustering' : 'Descriptive Statistics'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-[#1e3a8a] hover:underline cursor-pointer"
                    >
                      Change Algorithm
                    </button>
                  </div>

                  {/* Feature Selector for Analysis (Sections 1-11) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Select Features (Sections 1–11)
                      </label>
                      {columns.length > 0 && (
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {columns.length} features available
                        </span>
                      )}
                    </div>

                    {columns.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
                        <div className="flex gap-1 items-end h-6">
                          {[0,1,2,3,4].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1 rounded-full bg-blue-400"
                              animate={{ height: [6, 18, 6] }}
                              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-slate-400">Loading dataset columns…</p>
                        <p className="text-[10px] text-slate-300 font-medium">Please select a dataset first or wait for data to load</p>
                      </div>
                    ) : (
                      renderCategorizedFeatureSelector(columns)
                    )}
                  </div>


                  {analysisType === 'regression' && (
                    <div className="mt-3">
                      <label className="text-xs font-bold text-slate-700">
                        Dependent Variable (Y)
                      </label>
                      <select
                        value={yAxis}
                        onChange={(e) => setYAxis(e.target.value)}
                        className="w-full mt-1.5 h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 cursor-pointer"
                      >
                        {columns.filter((col) => !xAxis.includes(col)).length === 0 ? (
                          <option value="">Nothing left to select</option>
                        ) : (
                          <>
                            <option value="">Select Y Variable...</option>
                            {columns
                              .filter((col) => !xAxis.includes(col))
                              .map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {analysisType === 'pca' && (
                    <div className="mt-3">
                      <label className="text-xs font-bold text-slate-700">
                        Variance Threshold (%)
                      </label>
                      <input
                        type="number"
                        value={variance}
                        onChange={(e) => setVariance(Number(e.target.value))}
                        className="w-full mt-1.5 h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  )}

                  {/* 🔙 BACK & RUN */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all flex-1 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleRun}
                      disabled={loading}
                      className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-900/20 hover:bg-[#1a337a] transition-all flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="flex items-center gap-0.5 h-4">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                className="w-0.5 rounded-full bg-white"
                                style={{ height: "4px" }}
                                animate={{
                                  height: [4, 14, 4]
                                }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: i * 0.15
                                }}
                              />
                            ))}
                          </div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white animate-pulse" />
                          Run Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-50">
              <CardTitle className="font-black text-slate-800 flex items-center gap-2.5 text-sm uppercase tracking-wider">
                <BarChart3 className="w-4.5 h-4.5 text-slate-400" />
                Chart Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/50 rounded-2xl">
                {[
                  { id: "bar", label: "Bar", icon: BarChart3 },
                  { id: "line", label: "Line", icon: Settings2 },
                  { id: "scatter", label: "Scatter", icon: Database },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setChartType(type.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all",
                      chartType === type.id
                        ? "bg-white text-[#1e3a8a] shadow-sm font-black ring-1 ring-slate-200"
                        : "text-slate-400 hover:text-slate-600 font-bold",
                    )}
                  >
                    <type.icon className="w-4.5 h-4.5" />
                    <span className="text-[10px] uppercase tracking-widest">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-slate-900 text-[13px] font-black">
                      Exclude Outliers
                    </p>
                    <p className="text-slate-400 text-[11px] font-bold">
                      Remove values {">"} 3 SD
                    </p>
                  </div>
                  <Switch
                    defaultChecked
                    className="data-[state=checked]:bg-[#1e3a8a] scale-90"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-slate-900 text-[13px] font-black">
                      Show Confidence Int.
                    </p>
                    <p className="text-slate-400 text-[11px] font-bold">
                      95% CI shading
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-[#1e3a8a] scale-90" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Preview */}
        {selectedDataset && tableData && tableData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Data Preview</h2>
            </div>
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/30 overflow-hidden">
              <DataPreviewTable data={tableData} columns={tableColumns} />
            </div>
          </div>
        )}
      </div>

      {/* Analysis Running Full Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-8 z-[9999] transition-all duration-300 animate-in fade-in">
          {/* Waveform container */}
          <div className="flex items-center gap-2 h-28">
            {[...Array(15)].map((_, i) => {
              const shieldHeights = [16, 24, 42, 60, 76, 84, 72, 54, 72, 84, 76, 60, 42, 24, 16];
              const undulateHeights = [
                40 + Math.sin(i * 0.6 + 0.0) * 22,
                40 + Math.sin(i * 0.6 + 1.5) * 22,
                40 + Math.sin(i * 0.6 + 3.0) * 22,
                40 + Math.sin(i * 0.6 + 4.5) * 22,
                shieldHeights[i],
                shieldHeights[i],
                40 + Math.sin(i * 0.6 + 6.0) * 22,
                40 + Math.sin(i * 0.6 + 7.5) * 22,
              ];
              return (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-cyan-400 via-blue-500 to-purple-600"
                  animate={{
                    height: undulateHeights
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </div>
          <div className="space-y-1.5 text-center">
            <h3 className="text-sm font-black tracking-widest text-cyan-400 uppercase animate-pulse">Learning Engagement</h3>
            <p className="text-[11px] font-bold text-slate-400 max-w-[240px]">AI agent syncing with classroom dataset...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
