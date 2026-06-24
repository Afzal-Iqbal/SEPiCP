import React from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const ResultsPage = () => {
  const { state } = useLocation();
  const analysisType = state?.analysisType || "";
  const result = state?.result || null;
  const datasetId = state?.datasetId;
  const createdAt = state?.datasetCreatedAt;

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
          <Button className="h-10 px-4 rounded-xl bg-[#1e3a8a] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-[#1a337a] transition-all flex items-center gap-2">
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
                    {result.predictions_sample?.length ?? "-"}
                  </span>
                </Card>
              </div>

              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Coefficients
                </h3>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="py-2">Feature</th>
                        <th className="py-2">Coefficient</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.coefficients || []).map((item, index) => (
                        <tr key={index} className="border-b border-slate-50">
                          <td className="py-2">{item.feature}</td>
                          <td className="py-2">
                            {typeof item.coefficient === "number"
                              ? item.coefficient.toFixed(4)
                              : item.coefficient}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">Plots</h3>
                <div className="grid grid-cols-1 gap-4">
                  {(result.plots || []).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`regression-plot-${index}`}
                      className="w-full rounded-lg border border-slate-100"
                    />
                  ))}
                </div>
              </Card> */}
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

              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Predictions Sample
                </h3>
                <pre className="text-[11px] bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-x-auto">
                  {JSON.stringify(result.predictions_sample ?? [], null, 2)}
                </pre>
              </Card>
            </>
          )}
          {analysisType === "basic" && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Rows
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-3">
                    {result.total_rows ?? "-"}
                  </p>
                </Card>
                <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Columns
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
                    {Object.keys(result.columns || {}).length}
                  </p>
                </Card>
              </div>

              {/* Column Statistics Table */}
              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6">
                  Descriptive Statistics Summary
                </h3>
                <div className="space-y-4">
                  {Object.entries(result.columns || {}).map(([column, stats]) => (
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
                    {result.summary?.total_variance ?? "-"}%
                  </p>
                </Card>
              </div>

              <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Variance Explained
                </h3>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2 text-left">Component</th>
                        <th className="py-2 text-left">Variance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.variance_explained || []).map((v, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2">{v.component_num}</td>
                          <td className="py-2">{v.variance_percent}%</td>
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

              {/* <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  PCA Visualizations
                </h3>
                <div className="space-y-4">
                  {(result.plots || []).map((plot, index) => (
                    <div key={index}>
                      <p className="text-sm font-black text-slate-700 mb-2">
                        {plot.title || `Plot ${index + 1}`}
                      </p>
                      <img
                        src={plot.image}
                        alt={`pca-plot-${index}`}
                        className="w-full rounded-lg border border-slate-100"
                      />
                    </div>
                  ))}
                </div>
              </Card> */}
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

              {/* NEW: PC Equations Section */}
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

              {/* NEW: Variable Contributions Table/Grid */}
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
