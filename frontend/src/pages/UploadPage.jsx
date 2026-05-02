import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileSpreadsheet,
  CloudUpload,
  X,
  Info,
  Settings2,
  ArrowRight,
  RefreshCw,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DataPreviewTable from '../components/DataPreviewTable';
import { cn } from '../lib/utils';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import * as XLSX from "xlsx";

const UploadPage = () => {
  const { user, logActivity } = useAuth();
  const [file, setFile] = useState(null);
  const [isCleaning, setIsCleaning] = useState(true);

  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

 const handleProcess = async () => {
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);
    console.log("Uploading file:", file.name, "Size:", file.size);
    const response = await fetch(
      apiUrl("/datasets/upload/"),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: formData, // ❗ no JSON
      }
    );

    const result = await response.json();
    console.log("Backend response:", result);

    if (!response.ok) {
      alert(result.error || "Upload failed");
      return;
    }

    const cleaned = result.cleaned_data || [];

    setTableData(cleaned);

    const cols = Object.keys(cleaned[0] || {}).map((key) => ({
      header: key.toUpperCase(),
      accessorKey: key
    }));

    setColumns(cols);

    logActivity("upload", `Uploaded dataset: ${file.name}`);

  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Upload Research Data</h1>
          <p className="text-slate-500 mt-1.5 text-xs sm:text-sm font-medium">Manage and preprocess your .xlsx datasets.</p>
        </div>
        <Button variant="outline" className="h-10 px-4 rounded-xl font-bold border-slate-200 bg-white text-slate-600 shadow-sm flex items-center gap-2 text-xs">
          <History className="w-4 h-4 text-slate-400" />
          Recent Uploads
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Main Upload Area */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/30 p-1 bg-linear-to-b from-white to-slate-50/30">
            <div
              {...getRootProps()}
              className={cn(
                "rounded-[20px] border-2 border-dashed transition-all py-10 sm:py-14 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer relative overflow-hidden",
                isDragActive ? "bg-blue-50/50 border-[#1e3a8a]" : "border-slate-200 hover:border-[#1e3a8a]/40 bg-white"
              )}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 flex items-center justify-center text-[#1e3a8a] shadow-sm transform group-hover:scale-110 transition-all">
                <CloudUpload className="w-6 h-6" />
              </div>
              <div className="space-y-1 px-4">
                <p className="text-lg font-black text-slate-900">Click to upload or drag and drop</p>
                <p className="text-xs font-bold text-slate-400">Excel files (.xlsx) only. Maximum file size 50MB.</p>
              </div>

              {file && (
                <div className="mt-2 flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-slate-100 shadow-md animate-in zoom-in-95 duration-300 mx-4">
                  <FileSpreadsheet className="w-4 h-4 text-[#1e3a8a]" />
                  <span className="text-[12px] font-black text-slate-700 truncate max-w-[150px]">{file.name}</span>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px] px-2 py-0.5">Ready</Badge>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isDragActive && (
                <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px] flex items-center justify-center">
                  <p className="text-[#1e3a8a] font-black text-xs sm:text-sm uppercase tracking-widest bg-white/95 px-6 py-3 rounded-xl shadow-2xl border border-blue-100">Drop Registry Here</p>
                </div>
              )}
              <input {...getInputProps()} />
            </div>
          </div>

          {/* Configuration Card */}
          <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-50">
              <CardTitle className="font-black text-slate-800 flex items-center gap-2.5 text-sm uppercase tracking-wider">
                <Settings2 className="w-4.5 h-4.5 text-slate-400" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-slate-900 text-[13px] font-black ">Enable Auto-Cleaning</p>
                  <p className="text-slate-400 text-[11px] font-bold leading-relaxed pr-6">Automatically handle missing values and remove duplicates.</p>
                </div>
                <Switch
                  checked={isCleaning}
                  onCheckedChange={setIsCleaning}
                  className="data-[state=checked]:bg-[#1e3a8a]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Select Sheet</label>
                <Select defaultValue="sheet1">
                  <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 rounded-xl h-11 font-bold text-slate-700 hover:bg-slate-50 transition-all text-[12px]">
                    <SelectValue placeholder="Select Sheet" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="sheet1" className="rounded-lg font-bold text-[12px]">Sheet 1 (Raw Data)</SelectItem>
                    <SelectItem value="sheet2" className="rounded-lg font-bold text-[12px]">Sheet 2 (Clean Data)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* File Details Card */}
          <Card className="rounded-[24px] border-slate-200 shadow-lg shadow-slate-200/20 bg-white p-6">
            <h3 className="font-black text-slate-900 mb-6 text-[11px] uppercase tracking-widest leading-none">File Details</h3>
            <div className="space-y-4">
              {[
                { label: 'File Name', value: file?.name || 'research_data_v2.xlsx' },
                { label: 'Size', value: file ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : '12.4 MB' },
                { label: 'Rows', value: '1,240' },
                { label: 'Columns', value: '8' },
              ].map((detail) => (
                <div key={detail.label} className="flex justify-between items-center text-[12px]">
                  <span className="text-slate-400 font-bold">{detail.label}</span>
                  <span className="font-black text-slate-900 truncate max-w-[120px]">{detail.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
              <Info className="w-4 h-4 shrink-0 text-[#1e3a8a] mt-0.5" />
              <p className="text-[10px] text-[#1e3a8a] leading-relaxed font-black">
                Verify column headers below before confirming upload.
              </p>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
            <Button
              disabled={!file}
              onClick={handleProcess}
              className="flex-1 h-12 rounded-xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#1a337a] transition-all flex items-center justify-center gap-2"
            >
              Confirm & Process
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setFile(null)}
              className="flex-1 h-12 rounded-xl border-slate-200 bg-white text-slate-500 font-bold text-[12px] hover:bg-slate-50 transition-all border-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Data Preview Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Data Preview</h2>
          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/30 overflow-hidden">
          <DataPreviewTable data={tableData} columns={columns} />
        </div>
      </div>
    </div>
  );
};

export default UploadPage;

