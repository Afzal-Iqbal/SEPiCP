import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Settings2, BarChart3, Zap, History } from "lucide-react";
import { cn } from "../lib/utils";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
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

const AnalysisPage = () => {
  const [dataset] = useState("Fall_2023_Survey_Results.xlsx");
  const [xAxis, setXAxis] = useState([]);
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);

  const [step, setStep] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [columns, setColumns] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [variance, setVariance] = useState(95);

  const [analysisType, setAnalysisType] = useState("");
  const navigate = useNavigate();

  // React.useEffect(() => {
  //   const timer = setTimeout(() => setLoading(false), 2000);
  //   return () => clearTimeout(timer);
  // }, []);
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);

    const fetchDatasets = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8080/api/datasets/", {
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
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchDatasets();

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    setXAxis([]);
    setYAxis("");
    setColumns([]);
  }, [selectedDataset]);

  React.useEffect(() => {
    if (!selectedDataset) return;

    const selected = datasets.find((d) => d.id.toString() === selectedDataset);

    if (selected && selected.cleaned_data && selected.cleaned_data.length > 0) {
      const cols = Object.keys(selected.cleaned_data[0]);
      setColumns(cols);
    } else {
      setColumns([]);
    }
  }, [selectedDataset, datasets]);

  React.useEffect(() => {
    if (!selectedDataset) return;

    const selected = datasets.find((d) => d.id.toString() === selectedDataset);

    if (selected && selected.cleaned_data?.length > 0) {
      const data = selected.cleaned_data;

      const cols = Object.keys(data[0]);

      const numericCols = cols.filter((col) => {
        const validValues = data
          .map((row) => row[col])
          .filter((val) => val !== null && val !== "");

        const numericCount = validValues.filter(
          (val) => !isNaN(Number(val)),
        ).length;

        return numericCount / validValues.length > 0.8; // 80% numeric
      });

      setColumns(cols);
      setNumericColumns(numericCols);
    }
  }, [selectedDataset, datasets]);
  // const handleRun = () => {
  //   if (step !== 2) return;
  //   logActivity('analysis', `Ran visualization on ${dataset}`);
  //   navigate('/results');
  // };
  const handleRun = async () => {
    const selected = datasets.find((d) => d.id.toString() === selectedDataset);

    if (!selected) return;

    let url = "";
    let payload = {};

    if (analysisType === "regression") {
      if (xAxis.length === 0 || !yAxis) {
        alert("Select X and Y variables");
        return;
      }
      url = "http://127.0.0.1:8080/api/analysis/regression/";

      payload = {
        independent_vars: xAxis,
        dependent_var: yAxis,
        data: selected.cleaned_data,
      };
    }

    if (analysisType === "pca") {
      if (xAxis.length === 0) {
        alert("Select features");
        return;
      }
      url = "http://127.0.0.1:8080/api/analysis/pca/";

      payload = {
        selected_columns: xAxis,
        variance_threshold: variance,
        data: selected.cleaned_data,
      };
    }

    try {
      setLoading(true);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      navigate("/results", {
        state: {
          analysisType,
          result: data,
          datasetId: selected.id,
          datasetCreatedAt: selected.created_at,
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Analysis Configuration
          </h1>
          <p className="text-slate-500 mt-1.5 text-xs sm:text-sm font-medium">
            Configure parameters for your dataset analysis. Active session:
            <span className="text-[#1e3a8a] font-bold underline cursor-pointer ml-1">
              {dataset}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 px-6 rounded-xl font-bold border-slate-200 bg-white text-slate-600 shadow-sm flex items-center gap-2 text-xs"
          >
            <History className="w-4 h-4 text-slate-400" />
            History
          </Button>
          <Button
            onClick={handleRun}
            className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#1a337a] transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            Run Analysis
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Side: Configuration */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-50">
              <CardTitle className="font-black text-slate-800 flex items-center gap-2.5 text-sm uppercase tracking-wider">
                <Settings2 className="w-4.5 h-4.5 text-slate-400" />
                Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              {step === 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-0.5">
                    Datasets
                  </label>
                  <Select
                    defaultValue="none"
                    value={selectedDataset}
                    onValueChange={setSelectedDataset}
                  >
                    <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 rounded-xl h-11 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {datasets.length === 0 ? (
                        <SelectItem
                          value="none"
                          className="rounded-lg font-bold text-xs"
                        >
                          No datasets
                        </SelectItem>
                      ) : (
                        datasets.map((item, index) => (
                          <SelectItem
                            key={item.id}
                            value={item.id.toString()}
                            className="rounded-lg font-bold text-xs"
                          >
                            Dataset {index + 1}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => {
                      if (!selectedDataset) {
                        alert("Please select dataset");
                        return;
                      }
                      setStep(2);
                    }}
                    className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#1a337a] transition-all flex items-center gap-2"
                  >
                    Next
                  </button>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-700 ml-0.5">
                    Analysis Type
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "regression", label: "Regression" },
                      { id: "pca", label: "PCA" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setAnalysisType(type.id)}
                        className={cn(
                          "h-12 rounded-xl border text-xs font-black uppercase tracking-wider transition-all",
                          analysisType === type.id
                            ? "bg-[#1e3a8a] text-white shadow-lg"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between gap-4">
                    <button
                      onClick={() => {
                        setStep(1);

                        setAnalysisType("");
                      }}
                      className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#1a337a] transition-all flex items-center gap-2"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (!analysisType) {
                          alert("Please select analysis type");
                          return;
                        }
                        setStep(3);
                      }}
                      className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase tracking-widest shadow-lg hover:bg-[#1a337a]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* {step === 3 && analysisType === "regression" && (
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">
                      Independent Variable (X-Axis)
                    </label>
                    <Select
                      onValueChange={(col) => {
                        setXAxis((prev) =>
                          prev.includes(col)
                            ? prev.filter((item) => item !== col)
                            : [...prev, col],
                        );
                      }}
                    >
                      <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 rounded-xl h-11 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs">
                        <SelectValue
                          placeholder={
                            xAxis.length > 0
                              ? xAxis.join(", ")
                              : "Select variables..."
                          }
                        />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl border-slate-100 max-h-52 overflow-y-auto">
                        {columns.map((col, index) => (
                          <SelectItem
                            key={index}
                            value={col}
                            className="rounded-lg font-bold text-xs flex justify-between"
                          >
                            {col} {xAxis.includes(col) && "✓"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400 font-medium ml-0.5 uppercase tracking-wide">
                      Categorical or continuous variable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">
                      Dependent Variable (Y-Axis)
                    </label>
                    <Select
                      value={yAxis}
                      onValueChange={setYAxis}
                      disabled={xAxis.length === 0}
                    >
                      <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 rounded-xl h-11 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs">
                        <SelectValue placeholder="Select outcome..." />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl border-slate-100 max-h-52 overflow-y-auto">
                        {columns
                          .filter((col) => !xAxis.includes(col))
                          .map((col, index) => (
                            <SelectItem
                              key={index}
                              value={col}
                              className="rounded-lg font-bold text-xs"
                            >
                              {col}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    onClick={() => {
                      setStep(2);

                      setXAxis("");
                      setYAxis("");
                    }}
                    className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#1a337a] transition-all flex items-center gap-2"
                  >
                    Back
                  </button>
                </div>
              )} */}
              {step === 3 && analysisType === "regression" && (
                <div className="flex flex-col gap-5">
                  {/* 🔥 X VARIABLES (MULTI SELECT) */}
                  <div>
                    {/* <label className="text-xs font-bold text-slate-700">
                      Independent Variables (X)
                    </label> */}
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-slate-700">
                        Independent Variables (X)
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setXAxis(
                            xAxis.length === columns.length ? [] : [...columns],
                          )
                        }
                        className="text-xs font-bold text-[#1e3a8a] hover:underline"
                      >
                        {xAxis.length === columns.length
                          ? "Clear All"
                          : "Select All"}
                      </button>
                    </div>

                    <div className="max-h-52 overflow-y-auto border rounded-xl p-3 bg-slate-50 mt-2">
                      {columns.map((col) => (
                        <label
                          key={col}
                          className="flex items-center gap-2 text-xs font-bold mb-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={xAxis.includes(col)}
                            onChange={() => {
                              setXAxis((prev) =>
                                prev.includes(col)
                                  ? prev.filter((c) => c !== col)
                                  : [...prev, col],
                              );
                            }}
                          />
                          {col}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 🔥 Y VARIABLE (SINGLE SELECT) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Dependent Variable (Y)
                    </label>

                    <select
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="w-full mt-2 h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                    >
                      <option value="">Select Y</option>
                      {columns
                        .filter((col) => !xAxis.includes(col)) // avoid same variable
                        .map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* 🔙 BACK */}
                  <button
                    onClick={() => {
                      setStep(2);
                      setXAxis([]);
                      setYAxis("");
                    }}
                    className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white text-xs font-bold"
                  >
                    Back
                  </button>
                </div>
              )}
              {/* {step === 3 && analysisType === "pca" && (
                <div className="space-y-6">
               
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">
                      Select Columns (Features)
                    </label>

                    <Select
                      onValueChange={(col) => {
                        setXAxis((prev) =>
                          prev.includes(col)
                            ? prev.filter((c) => c !== col)
                            : [...prev, col],
                        );
                      }}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11 text-xs font-bold">
                        <SelectValue
                          placeholder={
                            xAxis.length > 0
                              ? xAxis.join(", ")
                              : "Select features..."
                          }
                        />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl border-slate-100 max-h-52 overflow-y-auto">
                        {numericColumns.map((col) => (
                          <SelectItem
                            key={col}
                            value={col}
                            className="text-xs font-bold"
                          >
                            {col} {xAxis.includes(col) && "✓"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                      
                    <p className="text-[10px] text-slate-400 font-medium uppercase">
                      Select numeric columns only
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">
                      Variance Threshold (%)
                    </label>

                    <input
                      type="number"
                      value={variance}
                      onChange={(e) => {
                        const val = Number(e.target.value);

                        if (val >= 0 && val <= 100) {
                          setVariance(val);
                        }
                      }}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold"
                    />

                    <p className="text-[10px] text-slate-400 font-medium uppercase">
                      Determines number of components retained
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setStep(2);
                      setXAxis([]);
                    }}
                    className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase tracking-widest shadow-lg hover:bg-[#1a337a]"
                  >
                    Back
                  </button>
                </div>
              )} */}
              {step === 3 && analysisType === "pca" && (
                <div className="space-y-5">
                  {/* 🔥 FEATURE SELECTION */}
                  <div>
                    {/* <label className="text-xs font-bold text-slate-700">
                      Select Features
                    </label> */}
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-slate-700">
                        Select Features
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setXAxis(
                            xAxis.length === numericColumns.length
                              ? []
                              : [...numericColumns],
                          )
                        }
                        className="text-xs font-bold text-[#1e3a8a] hover:underline"
                      >
                        {xAxis.length === numericColumns.length
                          ? "Clear All"
                          : "Select All"}
                      </button>
                    </div>

                    <div className="max-h-52 overflow-y-auto border rounded-xl p-3 bg-slate-50 mt-2">
                      {numericColumns.map((col) => (
                        <label
                          key={col}
                          className="flex items-center gap-2 text-xs font-bold mb-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={xAxis.includes(col)}
                            onChange={() => {
                              setXAxis((prev) =>
                                prev.includes(col)
                                  ? prev.filter((c) => c !== col)
                                  : [...prev, col],
                              );
                            }}
                          />
                          {col}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 🔥 VARIANCE */}
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Variance Threshold (%)
                    </label>

                    <input
                      type="number"
                      value={variance}
                      onChange={(e) => setVariance(Number(e.target.value))}
                      className="w-full mt-2 h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  {/* 🔙 BACK */}
                  <button
                    onClick={() => {
                      setStep(2);
                      setXAxis([]);
                    }}
                    className="h-11 px-6 rounded-xl bg-[#1e3a8a] text-white text-xs font-bold"
                  >
                    Back
                  </button>
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

        {/* Right Side: Preview Area */}
        <div className="lg:col-span-12 xl:col-span-7 h-full">
          <Card className="rounded-[32px] border-slate-200 shadow-xl shadow-slate-200/30 w-full min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] flex items-center justify-center relative overflow-hidden bg-white/60 backdrop-blur-sm">
            {/* Visualizer Background Placeholder */}
            <div className="absolute inset-10 sm:inset-20 opacity-10 pointer-events-none grayscale flex items-end gap-6 sm:gap-10">
              {[4, 5, 8, 4, 10, 6].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-xl sm:rounded-t-2xl bg-slate-300"
                  style={{ height: `${h * 10}%` }}
                ></div>
              ))}
            </div>

            {loading && (
              <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 p-8 sm:p-12 bg-white rounded-[32px] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-500 mx-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-slate-100 border-t-[#1e3a8a] animate-spin"></div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">
                    Generating Preview
                  </p>
                  <p className="text-[12px] font-bold text-slate-400 mt-1 sm:mt-2">
                    Processing 1,240 rows...
                  </p>
                </div>
              </div>
            )}

            {!loading && (
              <div className="relative z-10 flex flex-col items-center gap-3 p-8 text-center">
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  Ready To Run Analysis
                </p>
                <p className="text-[12px] font-bold text-slate-500 max-w-md">
                  Configure variables and click Run Analysis. Results will open
                  in the Results page in a structured report format.
                </p>
              </div>
            )}

            {/* Bottom Controls as seen in image */}
            <div className="absolute bottom-10 flex gap-6 sm:gap-12 opacity-30 grayscale scale-75 sm:scale-90 pointer-events-none">
              <div className="w-20 sm:w-32 h-4 sm:h-6 bg-slate-200 rounded-full"></div>
              <div className="w-20 sm:w-32 h-4 sm:h-6 bg-slate-200 rounded-full"></div>
              <div className="w-20 sm:w-32 h-4 sm:h-6 bg-slate-200 rounded-full"></div>
            </div>

            <div className="absolute top-10 right-10 flex gap-3 sm:gap-4 opacity-30 grayscale scale-75 sm:scale-90 pointer-events-none">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-xl"></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 rounded-xl"></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
