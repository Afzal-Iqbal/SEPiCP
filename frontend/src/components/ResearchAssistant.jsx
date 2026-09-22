import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  BookOpen,
  AlertCircle,
  Sparkles,
  FileText,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Search,
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Layers,
  ArrowUpRight,
  Key,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle,
  XCircle,
  Cpu,
  Download,
  Play,
  Loader2,
  User,
  Trash2,
  ArrowDown,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  Info,
  X
} from 'lucide-react';
import { getRandomPromptForVariable } from '../config/prompts';
import { exportBatchToWord, formatAcademicCitation } from '../lib/docxExport';
import { useAuth } from '../context/AuthContext';

export default function ResearchAssistant() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat History Messages State (Teachers always get a fresh, clean chat session)
  const [messages, setMessages] = useState(() => {
    try {
      const savedUser = localStorage.getItem('research_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      if (parsedUser?.role === 'teacher') {
        return []; // Fresh chat for teacher login
      }
      const saved = sessionStorage.getItem('assistant_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
    return [];
  });

  const [copiedId, setCopiedId] = useState(null);

  // Batch Features State (Ignored for Teachers)
  const [pendingFeatures, setPendingFeatures] = useState([]);
  const [batchMetadata, setBatchMetadata] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [currentBatchFeatureName, setCurrentBatchFeatureName] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Provider, Model & API Key State
  const [provider, setProvider] = useState(() => localStorage.getItem('assistant_provider') || 'gemini');
  const [modelName, setModelName] = useState(() => localStorage.getItem('assistant_model') || 'gemini-2.5-flash');
  const [apiKey, setApiKey] = useState(() => {
    const savedProvider = localStorage.getItem('assistant_provider') || 'gemini';
    return localStorage.getItem(`${savedProvider}_custom_api_key`) || (savedProvider === 'gemini' ? localStorage.getItem('gemini_custom_api_key') || '' : '');
  });

  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showKeyPassword, setShowKeyPassword] = useState(false);

  // Key & Model Validation State
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Auto-scroll refs
  const chatBottomRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Save chat history to sessionStorage (only for non-teacher persistent sessions)
  useEffect(() => {
    if (!isTeacher) {
      try {
        sessionStorage.setItem('assistant_chat_history', JSON.stringify(messages));
      } catch (e) {
        console.error("Error saving chat history:", e);
      }
    }
  }, [messages, isTeacher]);

  // Load pending batch features from sessionStorage (Disabled for teachers)
  useEffect(() => {
    if (isTeacher) {
      setPendingFeatures([]);
      setBatchResults([]);
      return;
    }
    try {
      const storedFeatures = sessionStorage.getItem('pending_batch_features');
      const storedMeta = sessionStorage.getItem('pending_batch_metadata');
      if (storedFeatures) {
        const parsed = JSON.parse(storedFeatures);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPendingFeatures(parsed);
        }
      }
      if (storedMeta) {
        setBatchMetadata(JSON.parse(storedMeta));
      }
    } catch (e) {
      console.error("Error reading pending batch features:", e);
    }
  }, [isTeacher]);

  // Scroll to bottom ONLY if user is already near the bottom (never interrupt reading)
  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, batchLoading]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If user is more than 80px away from bottom, they are actively reading! Do not force scroll them down.
    if (distanceFromBottom > 80) {
      isUserScrolledUpRef.current = true;
      setShowScrollBottom(true);
    } else {
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
    }
  };

  const scrollToBottom = () => {
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const providerPresets = {
    gemini: {
      label: "Google Gemini",
      defaultModel: "gemini-2.5-flash",
      models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    },
    openai: {
      label: "OpenAI",
      defaultModel: "gpt-4o-mini",
      models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]
    },
    groq: {
      label: "Groq (Llama / Mixtral)",
      defaultModel: "llama-3.3-70b-versatile",
      models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]
    }
  };

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    localStorage.setItem('assistant_provider', newProvider);
    const defModel = providerPresets[newProvider]?.defaultModel || '';
    setModelName(defModel);
    localStorage.setItem('assistant_model', defModel);
    setValidationResult(null);

    const savedKey = localStorage.getItem(`${newProvider}_custom_api_key`) || (newProvider === 'gemini' ? localStorage.getItem('gemini_custom_api_key') || '' : '');
    setApiKey(savedKey);
  };

  const handleModelChange = (val) => {
    setModelName(val);
    localStorage.setItem('assistant_model', val);
    setValidationResult(null);
  };

  const handleApiKeyChange = (val) => {
    setApiKey(val);
    setValidationResult(null);
    const keyName = `${provider}_custom_api_key`;
    if (val.trim()) {
      localStorage.setItem(keyName, val.trim());
      if (provider === 'gemini') {
        localStorage.setItem('gemini_custom_api_key', val.trim());
      }
    } else {
      localStorage.removeItem(keyName);
      if (provider === 'gemini') {
        localStorage.removeItem('gemini_custom_api_key');
      }
    }
  };

  const fetchWithRetry = async (url, options, retries = 1, delay = 800) => {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, delay));
        return await fetch(url, options);
      }
      throw err;
    }
  };

  const handleValidateKeyAndModel = async () => {
    setValidating(true);
    setValidationResult(null);

    const validateUrl = 'http://127.0.0.1:8080/api/assistant/validate-key/';

    try {
      const res = await fetchWithRetry(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          api_key: apiKey.trim(),
          model_name: modelName.trim()
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationResult({ valid: true, message: data.message });
      } else {
        setValidationResult({ valid: false, error: data.error || 'Key validation failed.' });
      }
    } catch (err) {
      setValidationResult({ valid: false, error: err.message || 'Could not connect to backend server on port 8080.' });
    } finally {
      setValidating(false);
    }
  };

  const suggestedQueries = [
    "What pedagogical strategies best reduce over-reliance on one-way lectures?",
    "How can instructors structure group problem-solving to ensure equal workload?",
    "What methods help transition quiet students into active class contributors?",
    "What active learning frameworks have documented success in medical courses?"
  ];

  const handleAsk = async (queryToSubmit) => {
    const finalQuestion = typeof queryToSubmit === 'string' ? queryToSubmit : question;
    if (!finalQuestion.trim() || loading) return;

    const userMessageId = 'user-' + Date.now();
    const userMsg = {
      id: userMessageId,
      role: 'user',
      content: finalQuestion.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    isUserScrolledUpRef.current = false;
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('access');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const apiUrl = 'http://127.0.0.1:8080/api/assistant/ask/';

    try {
      const res = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: finalQuestion.trim(),
          api_key: apiKey.trim(),
          provider,
          model_name: modelName.trim()
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: data.answer || "No grounded recommendations found in indexed corpus.",
        citations: data.citations || [],
        suggested_topics: data.suggested_topics || [],
        refused: !!data.refused,
        provider: provider.toUpperCase(),
        modelName: modelName || 'default',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: 'bot-err-' + Date.now(),
        role: 'assistant',
        isError: true,
        content: `Error: ${err.message || 'Could not connect to RAG assistant.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
      setError(err.message || 'Server connection issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (msgId, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm("Do you want to clear your current conversation?")) {
      setMessages([]);
      sessionStorage.removeItem('assistant_chat_history');
      setError(null);
    }
  };

  const getPromptIndexFromScore = (featureObj) => {
    const mean = featureObj.mean;
    if (mean === null || mean === undefined || isNaN(Number(mean))) return 0;
    const val = Number(mean);
    const varName = (featureObj.variable || '').toLowerCase();
    const knownMax = featureObj.max != null ? Number(featureObj.max) : null;

    if (varName.startsWith('methods_') || (knownMax && knownMax > 10) || val > 10) {
      if (val <= 33) return 0;
      if (val <= 66) return 1;
      return 2;
    }

    if (varName.includes('engage') || varName.includes('rating') ||
      (knownMax && knownMax >= 9 && knownMax <= 10)) {
      if (val <= 4) return 0;
      if (val <= 7) return 1;
      return 2;
    }

    if (varName.startsWith('p_attrib') || varName.startsWith('cls_org') ||
      varName.startsWith('challenge_level') || varName.startsWith('cncts') ||
      (knownMax && knownMax >= 6.5 && knownMax <= 7.5)) {
      if (val <= 2) return 0;
      if (val <= 5) return 1;
      return 2;
    }

    if (val <= 2) return 0;
    if (val <= 3.5) return 1;
    return 2;
  };

  const runBatchAnalysis = async () => {
    if (!pendingFeatures || pendingFeatures.length === 0 || batchLoading) return;

    setBatchLoading(true);
    setBatchResults([]);
    setError(null);

    const token = localStorage.getItem('access');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const askUrl = 'http://127.0.0.1:8080/api/assistant/ask/';

    const accumulated = [];

    for (let i = 0; i < pendingFeatures.length; i++) {
      const featureObj = pendingFeatures[i];
      const varName = featureObj.variable || featureObj.clean_name || "Feature";
      setCurrentBatchIndex(i + 1);
      setCurrentBatchFeatureName(featureObj.clean_name || varName);

      const promptIndex = getPromptIndexFromScore(featureObj);
      const promptData =
        getRandomPromptForVariable(featureObj.variable, { promptIndex, returnNullOnNoMatch: true }) ||
        getRandomPromptForVariable(featureObj.clean_name, { promptIndex });

      try {
        const res = await fetchWithRetry(askUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            question: promptData.prompt,
            api_key: apiKey.trim(),
            provider,
            model_name: modelName.trim()
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed with status ${res.status}`);
        }

        const data = await res.json();
        const itemResult = {
          variable: varName,
          clean_name: featureObj.clean_name || varName,
          question: promptData.question,
          column: promptData.column,
          prompt: promptData.prompt,
          answer: data.answer || "No recommendations generated.",
          citations: data.citations || [],
          mean: featureObj.mean,
          checked: true
        };

        accumulated.push(itemResult);
        setBatchResults([...accumulated]);

        // Stream result IMMEDIATELY into the live conversation thread
        const batchMessage = {
          id: `batch-${i}-${Date.now()}`,
          role: 'assistant',
          isBatchItem: true,
          batchIndex: i + 1,
          batchTotal: pendingFeatures.length,
          variable: varName,
          clean_name: featureObj.clean_name || varName,
          question: promptData.question,
          column: promptData.column,
          prompt: promptData.prompt,
          content: data.answer || "No recommendations generated.",
          citations: data.citations || [],
          mean: featureObj.mean,
          provider: provider.toUpperCase(),
          modelName: modelName || 'default',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, batchMessage]);
      } catch (err) {
        console.error(`Error analyzing feature ${varName}:`, err);
        const failedItem = {
          variable: varName,
          clean_name: featureObj.clean_name || varName,
          question: promptData.question,
          column: promptData.column,
          prompt: promptData.prompt,
          answer: `Analysis failed for '${varName}': ${err.message}`,
          citations: [],
          mean: featureObj.mean,
          checked: false,
          error: err.message
        };
        accumulated.push(failedItem);
        setBatchResults([...accumulated]);

        // Stream failure message immediately
        const errorBatchMessage = {
          id: `batch-err-${i}-${Date.now()}`,
          role: 'assistant',
          isBatchItem: true,
          isError: true,
          batchIndex: i + 1,
          batchTotal: pendingFeatures.length,
          variable: varName,
          clean_name: featureObj.clean_name || varName,
          question: promptData.question,
          column: promptData.column,
          prompt: promptData.prompt,
          content: `Diagnostic Analysis failed for '${featureObj.clean_name || varName}': ${err.message}`,
          citations: [],
          mean: featureObj.mean,
          provider: provider.toUpperCase(),
          modelName: modelName || 'default',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, errorBatchMessage]);
      }
    }

    setBatchLoading(false);
  };

  const handleClearBatchQueue = () => {
    sessionStorage.removeItem('pending_batch_features');
    sessionStorage.removeItem('pending_batch_metadata');
    setPendingFeatures([]);
    setBatchResults([]);
  };

  const handleDownloadWordDoc = () => {
    if (!batchResults || batchResults.length === 0) return;
    exportBatchToWord(batchResults, batchMetadata || {});
  };

  /**
   * Enhanced Markdown & Citation Parser
   * Formats bullets, bold text, headings, and [1] citation markers into clean React components
   */
  const renderMarkdownContent = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');

    const formatInline = (inlineText) => {
      // Split by citation brackets e.g. [1], [2], [10]
      const citationParts = inlineText.split(/(\[\d+\])/g);

      return citationParts.map((part, pIdx) => {
        const citMatch = part.match(/\[(\d+)\]/);
        if (citMatch) {
          const num = citMatch[1];
          return (
            <span
              key={pIdx}
              className="inline-flex items-center justify-center px-1.5 py-0.2 mx-0.5 text-[10px] font-black font-mono rounded bg-blue-100/90 text-[#1e3a8a] border border-blue-200 shadow-2xs hover:scale-105 transition-transform"
              title={`Source Citation [${num}]`}
            >
              [{num}]
            </span>
          );
        }

        // Format bold markdown **text**
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            return (
              <strong key={bIdx} className="font-extrabold text-slate-900">
                {bPart.slice(2, -2)}
              </strong>
            );
          }
          return bPart;
        });
      });
    };

    return (
      <div className="space-y-2.5 leading-relaxed text-[13.5px] text-slate-800 font-normal">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Headers: ### or ## or #
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-black text-slate-900 pt-2 pb-0.5 tracking-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                <span>{formatInline(trimmed.replace(/^###\s+/, ''))}</span>
              </h4>
            );
          }
          if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            return (
              <h3 key={idx} className="text-[15px] font-black text-slate-900 pt-2.5 pb-1 tracking-tight">
                {formatInline(trimmed.replace(/^#+\s+/, ''))}
              </h3>
            );
          }

          // Sub-bullets (indented or nested * / -)
          if (/^(\s{2,}|\t)[*-]\s+/.test(line) || /^\*\s+\*\*/.test(trimmed)) {
            const cleanContent = trimmed.replace(/^[*-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-4 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                <div className="flex-1">{formatInline(cleanContent)}</div>
              </div>
            );
          }

          // Regular Bullet Points: * or -
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const bulletContent = trimmed.replace(/^[*-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] shrink-0 mt-2" />
                <div className="flex-1">{formatInline(bulletContent)}</div>
              </div>
            );
          }

          // Numbered lists: 1. 2. etc.
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1.5 py-0.5">
                <span className="font-black text-[11px] font-mono text-[#1e3a8a] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0 mt-0.5">
                  {numMatch[1]}
                </span>
                <div className="flex-1">{formatInline(numMatch[2])}</div>
              </div>
            );
          }

          // Regular Paragraph Text
          return (
            <p key={idx} className="text-slate-800">
              {formatInline(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 bg-white relative overflow-hidden">

      {/* ─────────────────────────────────────────────────────────────
          1. CHATBOT TOP NAVBAR (Full-Width Slim Header)
      ─────────────────────────────────────────────────────────────── */}
      <header className="px-6 py-3.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between gap-4 z-30 shrink-0 w-full">

        {/* Bot Identity & Model Pill */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 relative">
            <Bot className="w-5 h-5 text-blue-100" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight leading-none">
                Research Assistant
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#1e3a8a] border border-blue-200">
                170+ Papers RAG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">
              Grounded exclusively in indexed academic papers
            </p>
          </div>
        </div>

        {/* Right Action Tools: Model Selector + Clear Chat + Settings Drawer Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Model Selector Pill */}
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="h-8 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Switch LLM Model & Key Settings"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-[11px] max-w-[100px] truncate">{modelName || 'gemini-2.5-flash'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-slate-500 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. LLM SETTINGS DRAWER (Collapsible Modal Bar)
      ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showKeyInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-200 bg-slate-50 p-4 md:p-5 text-slate-900 space-y-3 shrink-0 overflow-hidden z-20 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#1e3a8a]" />
                LLM Provider & Model Settings
              </span>
              <button
                type="button"
                onClick={() => setShowKeyInput(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-[#1e3a8a] focus:outline-none"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="groq">Groq (Llama 3.3)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Model Identifier</label>
                <select
                  value={modelName}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-[#1e3a8a] focus:outline-none font-mono"
                >
                  {providerPresets[provider]?.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="custom">Custom Model Name...</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">API Key (Optional)</label>
                <div className="relative">
                  <input
                    type={showKeyPassword ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="Leave blank for .env default"
                    className="w-full rounded-xl border border-slate-200 p-2 pr-8 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPassword(!showKeyPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <button
                type="button"
                onClick={handleValidateKeyAndModel}
                disabled={validating}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {validating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                <span>{validating ? 'Testing...' : 'Test Connection'}</span>
              </button>

              {validationResult && (
                <span className={`font-bold ${validationResult.valid ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {validationResult.valid ? '✓ Verified' : `✕ ${validationResult.error}`}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. BATCH ANALYSIS SLIM ALERT BAR (Hidden for Teachers)
      ─────────────────────────────────────────────────────────────── */}
      {!isTeacher && pendingFeatures && pendingFeatures.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-black text-amber-300 uppercase tracking-wider text-[10px]">
              Batch Diagnostic Queue:
            </span>
            <span className="font-medium text-blue-100 hidden sm:inline">
              {pendingFeatures.length} low-scoring survey features queued
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runBatchAnalysis}
              disabled={batchLoading}
              className="h-7 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {batchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{batchLoading ? `Analyzing (${currentBatchIndex}/${pendingFeatures.length})...` : `Run Batch (${pendingFeatures.length})`}</span>
            </button>

            {batchResults.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadWordDoc}
                className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                title="Download Word Report"
              >
                <Download className="w-3 h-3" />
                <span className="hidden md:inline">Export Docx</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearBatchQueue}
              disabled={batchLoading}
              className="text-slate-300 hover:text-white text-[11px] underline cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CHAT MESSAGE STREAM (ChatGPT Authentic Scroll Area)
      ─────────────────────────────────────────────────────────────── */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-slate-50/20 no-scrollbar relative w-full flex flex-col items-center"
      >
        <div className="w-full max-w-4xl space-y-6 flex-1 flex flex-col justify-start">
          {/* Empty Conversation Welcome State (ChatGPT style) */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-10 px-4 text-center max-w-xl mx-auto space-y-6 flex-1">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1e3a8a] to-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Bot className="w-8 h-8 text-blue-100" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                How can I assist your pedagogical research today?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Ask any question regarding active learning, classroom management, or survey metrics. Every answer is grounded directly in our 170+ paper academic corpus.
              </p>
            </div>

            {/* 4 Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2 text-left">
              {suggestedQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(query)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-300 text-left transition-all group flex items-start gap-3 shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-[#1e3a8a] flex items-center justify-center shrink-0 transition-colors mt-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-[#1e3a8a] leading-snug">
                    {query}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chronological Chat Messages with Spring Motion Animations */}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Bot Avatar on Left */}
            {msg.role === 'assistant' && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-1 relative ${msg.isError ? 'bg-rose-100 text-rose-600' : 'bg-gradient-to-tr from-[#1e3a8a] to-blue-600 text-white shadow-blue-500/20'}`}>
                {msg.isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                {msg.isBatchItem && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                )}
              </div>
            )}

            {/* Message Body */}
            <div className={`max-w-[88%] md:max-w-[80%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

              {/* User Bubble (Right Aligned, Deep Navy Gradient) */}
              {msg.role === 'user' ? (
                <div className="space-y-1">
                  <div className="bg-[#1e3a8a] text-white px-5 py-3.5 rounded-3xl rounded-tr-xs shadow-md text-[13.5px] font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 text-right pr-2">
                    {msg.timestamp}
                  </p>
                </div>
              ) : (
                /* Assistant Bubble (Left Aligned, Clean Structured Card with Glow Accent) */
                <div className={`p-5 md:p-6 rounded-3xl rounded-tl-xs border shadow-sm space-y-4 relative overflow-hidden transition-all ${msg.isError ? 'bg-rose-50/80 border-rose-200 text-rose-900' : 'bg-white border-slate-200/90 text-slate-900 shadow-slate-200/50'}`}>

                  {/* Subtle Top Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${msg.isBatchItem ? 'bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} />

                  {/* Status Banner */}
                  {!msg.isError && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.isBatchItem ? (
                          <>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-[#1e3a8a] border border-indigo-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                              Diagnostic #{msg.batchIndex} of {msg.batchTotal}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {msg.question || msg.clean_name || msg.variable}
                            </span>
                            {msg.mean !== undefined && msg.mean !== null && (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-black rounded-md border border-rose-200">
                                Mean: {Number(msg.mean).toFixed(2)}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${msg.refused ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                              {msg.refused ? 'Query Refused (Out of Domain)' : 'Grounded Research Response'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                              via {msg.provider} ({msg.modelName})
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy answer to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Executed Diagnostic Prompt Box for Batch Items */}
                  {msg.isBatchItem && msg.prompt && (
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 space-y-1">
                      <p className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-wider">
                        Executed Diagnostic Prompt:
                      </p>
                      <p className="text-xs font-semibold text-blue-950 italic">
                        "{msg.prompt}"
                      </p>
                    </div>
                  )}

                  {/* Formatted Markdown Content */}
                  <div className="prose prose-slate max-w-none">
                    {renderMarkdownContent(msg.content)}
                  </div>

                  {/* Refusal Alternative Topics */}
                  {msg.refused && msg.suggested_topics?.length > 0 && (
                    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                      <p className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        Available Topics in Indexed Corpus:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.suggested_topics.map((t, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAsk(`Tell me about ${t}`)}
                            className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>{t}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* APA 7th Citations Grid Footer */}
                  {!msg.refused && msg.citations && msg.citations.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#1e3a8a]" />
                          Supporting Citations (APA 7th Format)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-[#1e3a8a] border border-blue-100">
                          {msg.citations.length} sources cited
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {msg.citations.map((c, i) => {
                          const apaText = formatAcademicCitation(c, i + 1);
                          return (
                            <div
                              key={i}
                              className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-800 flex items-start gap-2.5 shadow-2xs"
                            >
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#1e3a8a] text-[10px] font-black font-mono shrink-0">
                                [{i + 1}]
                              </span>
                              <span className="leading-snug">
                                {apaText.replace(/^\[\d+\]\s*/, '')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Avatar on Right */}
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}

        {/* ─────────────────────────────────────────────────────────────
            ACTIVE STREAMING / LOADING INDICATOR WITH LIVE ANIMATIONS
        ─────────────────────────────────────────────────────────────── */}
        {(loading || batchLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3.5 justify-start"
          >
            {/* Glowing Pulsing Bot Avatar */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 animate-pulse mt-1 relative">
              <Bot className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
              </span>
            </div>

            {/* Streaming Status Card with Shimmer & Progress Bar */}
            <div className="p-4 md:p-5 rounded-3xl rounded-tl-xs bg-white border border-blue-200 shadow-lg shadow-blue-500/10 space-y-3 max-w-[85%] relative overflow-hidden animate-pulse-glow">
              
              {/* Top Animated Shimmer Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 animate-shimmer" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#1e3a8a] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    {batchLoading
                      ? `Analyzing Diagnostic ${currentBatchIndex} of ${pendingFeatures.length}`
                      : 'Retrieving from 170+ Papers...'}
                  </span>
                </div>

                {/* Animated Wave Dots */}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] animate-bounce" />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {batchLoading
                  ? 'Executing targeted diagnostic prompt → Streaming results directly into chat...'
                  : `Synthesizing grounded citations with ${provider.toUpperCase()} (${modelName})...`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={chatBottomRef} />
      </div>
    </div>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 w-8 h-8 rounded-full bg-white border border-slate-300 shadow-lg text-slate-700 hover:text-[#1e3a8a] flex items-center justify-center transition-all z-20 cursor-pointer hover:scale-110"
          title="Scroll to latest response"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. AUTHENTIC CHATGPT FLOATING INPUT BAR
      ─────────────────────────────────────────────────────────────── */}
      <div className="p-4 md:p-5 border-t border-slate-200/80 bg-white shrink-0 w-full z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="max-w-4xl mx-auto w-full relative"
        >
          <div className="relative rounded-2xl md:rounded-3xl border border-slate-200/90 bg-slate-50/80 focus-within:bg-white focus-within:border-[#1e3a8a] focus-within:ring-3 focus-within:ring-blue-100 transition-all p-2 md:p-2.5 flex items-end gap-2 shadow-xs">

            {/* Quick Settings Icon */}
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#1e3a8a] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Provider & Model Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about pedagogical frameworks, active learning techniques, or student survey findings..."
              rows={1}
              disabled={loading}
              className="w-full bg-transparent py-1.5 px-1 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none font-medium leading-relaxed max-h-32 no-scrollbar"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-9 h-9 rounded-2xl bg-[#1e3a8a] hover:bg-[#1b3275] disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all shadow-md flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shrink-0 active:scale-95"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-400 font-medium">
            <span>Research Assistant verified against 170+ papers • Press <kbd className="px-1 py-0.2 rounded bg-slate-100 border text-slate-600 font-mono">Enter ↵</kbd> to send</span>
            <span className="hidden sm:inline font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Zero Hallucination Mode
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
