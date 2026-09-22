import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Users,
  Sigma,
  Layers,
  Info,
  Bot,
  Sparkles,
  Send,
  CheckSquare
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const ResultsPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const analysisType = state?.analysisType || "";
  const result = state?.result || null;
  const datasetId = state?.datasetId;
  const createdAt = state?.datasetCreatedAt;

  // Selected features state for Assistant Analysis
  const [selectedLowItems, setSelectedLowItems] = useState([]);

  const selectedVariables = React.useMemo(() => {
    // 1. Try from result input parameters (saved in database)
    const inputParams = result?.input_params || {};
    if (inputParams.selected_columns && Array.isArray(inputParams.selected_columns) && inputParams.selected_columns.length > 0) {
      return new Set(inputParams.selected_columns.map(c => c.toLowerCase().trim()));
    }
    if (inputParams.independent_vars && Array.isArray(inputParams.independent_vars)) {
      const vars = [...inputParams.independent_vars];
      if (inputParams.dependent_var) vars.push(inputParams.dependent_var);
      return new Set(vars.map(c => c.toLowerCase().trim()));
    }

    // 2. Try from sessionStorage
    try {
      const savedX = sessionStorage.getItem('analysis_xaxis');
      const savedY = sessionStorage.getItem('analysis_yaxis');
      const vars = [];
      if (savedX) {
        const parsedX = JSON.parse(savedX);
        if (Array.isArray(parsedX)) vars.push(...parsedX);
      }
      if (savedY) vars.push(savedY);
      if (vars.length > 0) {
        return new Set(vars.map(c => c.toLowerCase().trim()));
      }
    } catch (e) {}

    return null; // Fallback to all if not found
  }, [result]);

  const EXCLUDED_COLUMNS = React.useMemo(() => new Set([
    'id', 'teacher_id', 'instructor_survey_id', 'is_published', 'edit_token',
    'submitted_at', 'created_at', 'updated_at', 'status', 'course_code'
  ]), []);

  const filteredLowestScoringItems = React.useMemo(() => {
    const items = result?.lowest_scoring_items || [];
    return items.filter(item => {
      const colName = (item.column || item.variable || '').toLowerCase().trim();
      if (EXCLUDED_COLUMNS.has(colName)) return false;
      if (!selectedVariables) return true;
      return selectedVariables.has(colName);
    });
  }, [result, selectedVariables, EXCLUDED_COLUMNS]);

  const filteredCoefficients = React.useMemo(() => {
    const items = result?.coefficients || [];
    return items.filter(item => {
      const colName = (item.feature || '').toLowerCase().trim();
      if (EXCLUDED_COLUMNS.has(colName)) return false;
      if (!selectedVariables) return true;
      return selectedVariables.has(colName);
    });
  }, [result, selectedVariables, EXCLUDED_COLUMNS]);

  useEffect(() => {
    if (filteredLowestScoringItems && filteredLowestScoringItems.length > 0) {
      setSelectedLowItems(filteredLowestScoringItems);
    } else if (filteredCoefficients && filteredCoefficients.length > 0) {
      setSelectedLowItems(
        filteredCoefficients.map((c) => ({
          column: c.feature,
          clean_name: c.clean_feature || c.feature,
          mean: c.coefficient,
        }))
      );
    }
  }, [filteredLowestScoringItems, filteredCoefficients]);

  const toggleFeatureSelection = (item) => {
    const key = item.column || item.feature || item.variable;
    setSelectedLowItems((prev) => {
      const exists = prev.some(
        (f) => (f.column || f.feature || f.variable) === key
      );
      if (exists) {
        return prev.filter(
          (f) => (f.column || f.feature || f.variable) !== key
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const toggleSelectAllLowItems = () => {
    const allItems = filteredLowestScoringItems;
    if (selectedLowItems.length === allItems.length) {
      setSelectedLowItems([]);
    } else {
      setSelectedLowItems(allItems);
    }
  };

  const handleSendToAssistant = (itemsToSend) => {
    const list = itemsToSend && itemsToSend.length > 0 ? itemsToSend : selectedLowItems;
    if (!list || list.length === 0) {
      alert("Please select at least one feature/variable to send to the Assistant.");
      return;
    }
    const formatted = list.map((item) => ({
      variable: item.column || item.feature || item.variable || "Selected Feature",
      clean_name: item.clean_name || item.clean_feature || item.column || "Selected Feature",
      mean: item.mean !== undefined ? item.mean : (item.coefficient !== undefined ? item.coefficient : null),
      // Forward score range so assistant can pick the correct prompt level
      min: item.min ?? null,
      max: item.max ?? null,
    }));

    sessionStorage.setItem("pending_batch_features", JSON.stringify(formatted));
    sessionStorage.setItem("pending_batch_metadata", JSON.stringify({
      datasetId: datasetId || null,
      courseName: state?.courseName || null,
      analysisType: analysisType || "Analysis",
    }));

    navigate("/assistant");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Analysis Results Report
          </h1>
          <p className="text-slate-500 mt-1.5 text-xs sm:text-sm font-medium">
            {analysisType
              ? `${analysisType.toUpperCase()} Analysis • Dataset ${datasetId ?? "-"}`
              : "No active analysis session"}
            {createdAt ? ` • ${new Date(createdAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/analysis">
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl font-bold border-slate-200 bg-white text-slate-600 shadow-sm flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Back To Analysis</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-10 px-4 rounded-xl font-bold border-slate-200 bg-white text-slate-600 shadow-sm flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => window.print()}
            className="h-10 px-4 rounded-xl bg-[#1e3a8a] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-[#1a337a] transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {!result ? (
        <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-10 text-center">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-xl font-black text-slate-900">
              No analysis result found
            </h3>
            <p className="text-sm font-medium text-slate-500">
              Run an analysis first from the Analysis page. This page displays
              only generated results.
            </p>
            <Link to="/analysis">
              <Button className="h-10 px-5 rounded-xl bg-[#1e3a8a] text-white font-black text-[11px] uppercase tracking-widest mt-2">
                Go To Analysis
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {analysisType === "regression" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      R-Squared
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">
                    {result.metrics?.r2 ?? "-"}
                  </span>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      RMSE
                    </span>
                    <Database className="w-5 h-5 text-[#1e3a8a]" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">
                    {result.metrics?.rmse ?? "-"}
                  </span>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Intercept
                    </span>
                    <BarChart3 className="w-5 h-5 text-[#1e3a8a]" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">
                    {result.intercept ?? "-"}
                  </span>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Sample Size
                    </span>
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">
                    {result.metrics?.sample_size ?? result.metrics?.total_rows ?? result.predictions_sample?.length ?? "-"}
                  </span>
                </Card>
              </div>

              {/* Regression Equation Banner */}
              {result.equation && (
                <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6 overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Sigma className="w-5 h-5 text-[#1e3a8a]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Linear Regression Equation</h3>
                      <p className="text-xs text-slate-400 font-bold">Fitted Mathematical Formula</p>
                    </div>
                  </div>
                  <div className="font-mono text-sm leading-relaxed text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 break-all font-bold">
                    {result.equation}
                  </div>
                </Card>
              )}

              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Coefficients & Feature Impact
                </h3>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-wider text-left">
                        <th className="py-3 px-4">Feature</th>
                        <th className="py-3 px-4">Impact Direction</th>
                        <th className="py-3 px-4 text-right">Coefficient</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(filteredCoefficients || []).map((item, index) => {
                        const val = item.coefficient;
                        const isPositive = typeof val === "number" ? val >= 0 : true;
                        return (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800 capitalize">
                              {item.clean_feature || item.feature.replace(/_encoded$/g, '').replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {isPositive ? 'Positive (+)' : 'Negative (-)'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {typeof val === "number" ? val.toFixed(4) : val}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6">
                  Regression Plots
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(result.plots || []).map((img, index) => (
                    <Card
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      <CardContent className="p-4">
                        <img
                          src={img}
                          alt={`regression-plot-${index}`}
                          className="w-full h-auto rounded-xl border border-slate-100 object-cover"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* Structured Predictions Table */}
              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Predictions Sample
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Sample #</th>
                        <th className="py-3 px-4">Actual Value</th>
                        <th className="py-3 px-4">Predicted Value</th>
                        <th className="py-3 px-4 text-right">Absolute Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(result.predictions_sample || []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-500">#{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{typeof row.actual === 'number' ? row.actual.toFixed(4) : row.actual}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#1e3a8a]">{typeof row.predicted === 'number' ? row.predicted.toFixed(4) : row.predicted}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                            {row.error !== undefined ? row.error.toFixed(4) : Math.abs(row.actual - row.predicted).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
          {(analysisType === "basic" || analysisType === "descriptive") && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Records
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-3">
                    {result.total_rows ?? "-"}
                  </p>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Variables
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-3">
                    {result.total_columns ?? "-"}
                  </p>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Features Analyzed
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-3">
                    {Object.keys(result.columns || {}).filter(k => {
                      const colName = k.toLowerCase().trim();
                      if (EXCLUDED_COLUMNS.has(colName)) return false;
                      return !selectedVariables || selectedVariables.has(colName);
                    }).length}
                  </p>
                </Card>
              </div>

              {/* Priority Focus: Lowest Scoring Variables */}
              {filteredLowestScoringItems && filteredLowestScoringItems.length > 0 && (
                <Card className="rounded-[24px] border-rose-200 bg-rose-50/40 p-6 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-rose-100 rounded-lg">
                        <span className="text-rose-700 text-sm font-black">⚠️</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-rose-950">Priority Focus: Lowest Scoring Variables</h3>
                        <p className="text-xs text-rose-700 font-medium">Select low variables to send to Research Assistant for grounded advisory & recommendations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSelectAllLowItems}
                        className="text-xs font-black text-rose-800 bg-white px-3.5 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                      >
                        {selectedLowItems.length === filteredLowestScoringItems.length ? "Clear All" : "Select All"}
                      </button>
                      <Button
                        onClick={() => handleSendToAssistant(selectedLowItems)}
                        disabled={selectedLowItems.length === 0}
                        className="h-10 px-4 rounded-xl bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-wider shadow-md hover:bg-[#1a337a] flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Bot className="w-4 h-4 text-blue-300 animate-pulse" />
                        Send ({selectedLowItems.length}) To Assistant
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredLowestScoringItems.map((item, idx) => {
                      const itemKey = item.column || item.variable;
                      const isSelected = selectedLowItems.some((f) => (f.column || f.variable) === itemKey);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleFeatureSelection(item)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                            isSelected
                              ? 'bg-white border-rose-400 shadow-md ring-2 ring-rose-300/60'
                              : 'bg-white/70 border-rose-200/80 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-rose-300 text-[#1e3a8a] focus:ring-[#1e3a8a] cursor-pointer w-4 h-4"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800 capitalize">
                                {item.clean_name || item.column.replace(/_/g, ' ')}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold">Variable #{idx + 1}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-lg">
                              {item.mean !== undefined ? item.mean.toFixed(2) : '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Column Statistics Table */}
              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6">
                  Descriptive Statistics Summary
                </h3>
                <div className="space-y-4">
                  {Object.entries(result.columns || {})
                    .filter(([column]) => {
                      const colName = column.toLowerCase().trim();
                      if (EXCLUDED_COLUMNS.has(colName)) return false;
                      return !selectedVariables || selectedVariables.has(colName);
                    })
                    .map(([column, stats]) => (
                    <div
                      key={column}
                      className="rounded-2xl border border-slate-100 p-5 bg-slate-50/50 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-slate-800 text-sm">{column}</h4>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white border text-slate-500 uppercase tracking-wider">
                          {stats.type}
                        </span>
                      </div>

                      {stats.type === "numeric" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Mean</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.mean?.toFixed(2) ?? "N/A"}</p>
                          </div>
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Median</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.median?.toFixed(2) ?? "N/A"}</p>
                          </div>
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Min</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.min?.toFixed(2) ?? "N/A"}</p>
                          </div>
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Max</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.max?.toFixed(2) ?? "N/A"}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Unique values</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.unique_count ?? "N/A"}</p>
                          </div>
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Mode</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.mode ?? "N/A"}</p>
                          </div>
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Missing values</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.missing ?? "N/A"}</p>
                          </div>
                          <div className="bg-white border p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">Missing %</p>
                            <p className="text-base font-black text-slate-800 mt-1">{stats.missing_percent}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {analysisType === "pca" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Features
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-3">
                    {result.summary?.total_features ?? "-"}
                  </p>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Components Selected
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-3">
                    {result.summary?.components_selected ?? "-"}
                  </p>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Variance
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-3">
                    {typeof result.summary?.total_variance === 'number' ? result.summary.total_variance.toFixed(2) : result.summary?.total_variance ?? "-"}%
                  </p>
                </Card>
              </div>

              {/* Complete Variance Explained Table */}
              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Variance Explained Table
                </h3>
                <div className="overflow-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Component</th>
                        <th className="py-3 px-4">Eigenvalue</th>
                        <th className="py-3 px-4">Variance Explained (%)</th>
                        <th className="py-3 px-4 text-right">Cumulative Variance (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(result.variance_explained || []).map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#1e3a8a]">PC{v.component_num}</td>
                          <td className="py-3 px-4 font-mono">{typeof v.eigenvalue === 'number' ? v.eigenvalue.toFixed(4) : (v.eigenvalue ?? '-')}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{typeof v.variance_percent === 'number' ? v.variance_percent.toFixed(2) : v.variance_percent}%</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{typeof v.cumulative_variance === 'number' ? v.cumulative_variance.toFixed(2) : v.cumulative_variance}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {result.scree_plot && (
                <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <h3 className="text-lg font-black text-slate-900 mb-4">
                    Scree Plot
                  </h3>
                  <img
                    src={result.scree_plot}
                    alt="Scree plot"
                    className="w-full rounded-lg border border-slate-100"
                  />
                </Card>
              )}

              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6">
                  PCA Visualizations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(result.plots || []).map((plot, index) => (
                    <Card
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-black text-slate-800">
                          {plot.title || `Plot ${index + 1}`}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <img
                          src={plot.image}
                          alt={`pca-plot-${index}`}
                          className="w-full h-auto rounded-xl border border-slate-100 object-cover"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* PC Equations Section */}
              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Sigma className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Principal Component Equations
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {(result.pc_equations || []).map((eq, index) => (
                    <div 
                      key={index} 
                      className="group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-2.5 py-1 rounded-md">
                          {eq.pc_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Linear Combination</span>
                      </div>
                      <div className="font-mono text-[13px] leading-relaxed text-slate-700 bg-white/50 p-4 rounded-xl border border-slate-100 break-all">
                        <span className="font-bold text-blue-700">{eq.pc_name} = </span>
                        {eq.equation}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Feature Loadings Matrix Table */}
              {result.feature_loadings && result.feature_loadings.length > 0 && (
                <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <h3 className="text-lg font-black text-slate-900 mb-4">
                    Feature Loadings Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4">Feature Name</th>
                          {(result.pc_columns || []).map((pc, i) => (
                            <th key={i} className="py-3 px-4 text-center">{pc} Loading</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.feature_loadings.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">{item.feature_name}</td>
                            {(item.loadings || []).map((loadingVal, pcIdx) => (
                              <td key={pcIdx} className={`py-3 px-4 text-center font-mono font-bold ${loadingVal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {loadingVal >= 0 ? '+' : ''}{loadingVal.toFixed(4)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Variable Contributions Table/Grid */}
              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Layers className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Variable Contributions (Top Features)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(result.pc_variable_table || []).map((pc, idx) => (
                    <div key={idx} className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="font-black text-slate-800 text-sm">{pc.pc_name} Dominant Variables</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Impact Threshold &gt; 0.30</span>
                      </div>
                      
                      <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                        {pc.important_variables && pc.important_variables.length > 0 ? (
                          pc.important_variables.map((v, vIdx) => (
                            <div key={vIdx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-sm font-bold text-slate-700">{v.feature_name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${v.loading > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.min(Math.abs(v.loading) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-[11px] font-black w-12 text-right ${v.loading > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {v.loading > 0 ? '+' : ''}{v.loading.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Info className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">No dominant variables found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsPage;
