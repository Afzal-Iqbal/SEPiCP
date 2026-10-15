import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    HelpCircle, 
    Bell, 
    ChevronRight, 
    LayoutDashboard, 
    Upload, 
    BarChart3, 
    FileText, 
    History, 
    Database, 
    Search, 
    Activity, 
    ExternalLink 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const TopBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, activities } = useAuth();

    // Filter activities: Admin sees all activities, Student sees only their own
    const displayActivities = React.useMemo(() => {
        if (user?.role === 'admin') {
            return activities;
        }
        return activities.filter(act => act.userId === user?.id);
    }, [activities, user]);

    // Dataset status state
    const [datasetInfo, setDatasetInfo] = useState(null);

    // Command palette state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Notification dropdown state
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);

    // Monitor sessionStorage for active dataset changes
    useEffect(() => {
        const checkDataset = () => {
            const fileInfoRaw = sessionStorage.getItem('uploaded_file_info');
            const selectedDataset = sessionStorage.getItem('analysis_selected_dataset');
            
            if (fileInfoRaw) {
                try {
                    const fileInfo = JSON.parse(fileInfoRaw);
                    setDatasetInfo({
                        name: fileInfo.name,
                        size: fileInfo.size ? `${(fileInfo.size / 1024).toFixed(1)} KB` : null,
                    });
                    return;
                } catch (e) {}
            }
            
            if (selectedDataset) {
                setDatasetInfo({
                    name: selectedDataset.endsWith('.csv') ? selectedDataset : `${selectedDataset}.csv`,
                    size: null,
                });
                return;
            }
            
            setDatasetInfo(null);
        };

        checkDataset();
        const interval = setInterval(checkDataset, 1500);
        return () => clearInterval(interval);
    }, []);

    // Command palette list
    const commands = [
        { label: 'Go to Dashboard', path: user?.role === 'teacher' ? '/teacher/dashboard' : '/', icon: LayoutDashboard, category: 'Navigation' },
        { label: 'Upload Data File', path: '/upload', icon: Upload, category: 'Data' },
        { label: 'Configure Analysis Model', path: '/analysis', icon: BarChart3, category: 'Analysis' },
        { label: 'View Results Report', path: '/results', icon: FileText, category: 'Analysis' },
        { label: 'Check Analysis History', path: '/history', icon: History, category: 'Data' },
    ];

    const filteredCommands = commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Command palette keyboard listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
                setSearchQuery('');
                setSelectedIndex(0);
            }
            if (isSearchOpen) {
                if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        navigate(filteredCommands[selectedIndex].path);
                        setIsSearchOpen(false);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, selectedIndex, filteredCommands, navigate]);

    // Click outside notification menu listener
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Navigation pipeline configuration
    const steps = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Responses', path: '/responses', icon: Database, roles: ['admin'] },
        { label: 'Upload Data', path: '/upload', icon: Upload },
        { label: 'Analysis', path: '/analysis', icon: BarChart3 },
        { label: 'Results', path: '/results', icon: FileText },
        { label: 'History', path: '/history', icon: History }
    ].filter(s => !s.roles || s.roles.includes(user?.role));

    const currentStepIdx = steps.findIndex(s => s.path === location.pathname);

    return (
        <header className="w-full h-auto min-h-16 flex flex-wrap items-center justify-between px-4 sm:px-6 lg:px-10 py-3 rounded-none border-b border-slate-200/50 bg-white/75 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)] z-40 transition-all shrink-0">
            {/* Sequential Navigation Steps */}
            {!location.pathname.startsWith('/teacher') && (
                <nav className="flex items-center gap-1 ml-12 lg:ml-0">
                    {steps.map((step, idx) => {
                    const isActive = location.pathname === step.path;
                    const isCompleted = idx < currentStepIdx && currentStepIdx !== -1;
                    
                    return (
                        <React.Fragment key={step.path}>
                            {idx > 0 && (
                                <ChevronRight className={cn(
                                    "w-3 h-3 text-slate-350 mx-0.5 shrink-0",
                                    (idx <= currentStepIdx && currentStepIdx !== -1) ? "text-blue-300" : "text-slate-200",
                                    isActive ? "hidden md:block" : "hidden md:block"
                                )} />
                            )}
                            <div className={cn(
                                isActive ? "flex" : "hidden md:flex",
                                "items-center"
                            )}>
                                <Link
                                    to={step.path}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-[11px] tracking-wide border cursor-pointer select-none",
                                        isActive
                                            ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 text-[#1e3a8a] border-blue-200/60 shadow-xs"
                                            : isCompleted
                                                ? "bg-emerald-50/30 text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700"
                                                : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50/50"
                                    )}
                                >
                                    {isCompleted ? (
                                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] shrink-0 font-black">✓</span>
                                    ) : (
                                        <step.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-[#1e3a8a]" : isCompleted ? "text-slate-400" : "text-slate-300")} />
                                    )}
                                    <span className="truncate">{step.label}</span>
                                    {isActive && (
                                        <span className="relative flex h-1.5 w-1.5 ml-0.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1e3a8a]"></span>
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </React.Fragment>
                    );
                })}
                </nav>
            )}

            {/* Right-side quick controls */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Active Dataset Pill */}
                {datasetInfo ? (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide animate-in fade-in slide-in-from-top-1">
                        <Database className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        <span className="truncate max-w-[110px]">{datasetInfo.name}</span>
                        {datasetInfo.size && <span className="text-emerald-500/80 font-normal">({datasetInfo.size})</span>}
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
                    </div>
                ) : (
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/30 text-slate-400 text-[10px] font-bold select-none">
                        <Database className="w-3.5 h-3.5 text-slate-300" />
                        <span>No Active Dataset</span>
                    </div>
                )}

                {/* Command search trigger pill */}
                <button 
                    onClick={() => {
                        setIsSearchOpen(true);
                        setSearchQuery('');
                        setSelectedIndex(0);
                    }}
                    className="hidden xl:flex items-center justify-between gap-3 h-9 w-44 px-3 rounded-xl border border-slate-200/50 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 text-slate-400 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-650 transition-colors" />
                        <span className="text-[10px] tracking-wider">Quick Search</span>
                    </div>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-bold text-slate-400 shadow-2xs group-hover:border-slate-300">
                        <span>Ctrl</span><span>K</span>
                    </kbd>
                </button>

                {/* Help button */}
                <button className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/40 text-slate-600 font-bold text-[10px] uppercase tracking-wider transition-all group">
                    <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-[#1e3a8a] transition-colors" />
                    <span className="hidden sm:inline">Help Center</span>
                </button>

                {/* Notifications Bell & Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={cn(
                            "relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all group cursor-pointer",
                            isNotifOpen 
                                ? "border-blue-200 bg-blue-50/50 text-[#1e3a8a]" 
                                : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/40 text-slate-400 hover:text-[#1e3a8a]"
                        )}
                    >
                        <Bell className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform duration-300" />
                        {displayActivities.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-12 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-50 p-1 origin-top-right"
                            >
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <span className="text-xs font-black text-slate-800 tracking-wide uppercase">Activity Logs</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent {Math.min(5, displayActivities.length)}</span>
                                </div>
                                <div className="max-h-[260px] overflow-y-auto py-1">
                                    {displayActivities.length > 0 ? (
                                        displayActivities.slice(0, 5).map((act) => (
                                            <div key={act.id} className="px-3.5 py-2.5 hover:bg-slate-50/80 transition-all rounded-xl flex gap-3 text-left">
                                                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#1e3a8a] shrink-0 mt-0.5">
                                                    <Activity className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-slate-700 truncate">{act.type.toUpperCase()}</p>
                                                    <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 mt-0.5">{act.details}</p>
                                                    <span className="text-[9px] font-semibold text-slate-400 block mt-1">
                                                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center text-slate-400 text-[11px]">
                                            No recent activities found.
                                        </div>
                                    )}
                                </div>
                                <div className="px-3 py-2 border-t border-slate-100 text-center bg-slate-50/20">
                                    <Link to="/history" onClick={() => setIsNotifOpen(false)} className="text-[10px] font-bold text-[#1e3a8a] hover:underline flex items-center justify-center gap-1">
                                        View Complete History <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Command Palette Modal */}
            <AnimatePresence>
                {isSearchOpen && (
                    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSearchOpen(false)}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
                        />
                        
                        {/* Modal Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-lg mx-4 bg-white border border-slate-200 rounded-[24px] shadow-2xl overflow-hidden z-[1000]"
                        >
                            {/* Input header */}
                            <div className="flex items-center gap-3 px-4 border-b border-slate-100 h-14 bg-slate-50/50">
                                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                <input 
                                    type="text"
                                    placeholder="Search command or type path..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                    className="flex-1 bg-transparent border-0 outline-none text-slate-800 text-sm placeholder-slate-400 focus:ring-0 focus:outline-hidden"
                                    autoFocus
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 select-none">ESC</span>
                            </div>
                            
                            {/* Results */}
                            <div className="max-h-[300px] overflow-y-auto p-2">
                                {filteredCommands.length > 0 ? (
                                    filteredCommands.map((cmd, idx) => (
                                        <button
                                            key={cmd.path}
                                            onClick={() => {
                                                navigate(cmd.path);
                                                setIsSearchOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all text-xs font-bold cursor-pointer",
                                                idx === selectedIndex 
                                                    ? "bg-blue-50 text-[#1e3a8a]" 
                                                    : "text-slate-600 hover:bg-slate-50/85"
                                            )}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <cmd.icon className={cn("w-4 h-4", idx === selectedIndex ? "text-[#1e3a8a]" : "text-slate-400")} />
                                                <span>{cmd.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {idx === selectedIndex && (
                                                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                                                        Go <ChevronRight className="w-3 h-3" />
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-normal text-slate-400">{cmd.category}</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400 text-xs">
                                        No matching commands found.
                                    </div>
                                )}
                            </div>
                            
                            {/* Footer */}
                            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400 font-bold select-none">
                                <span className="flex items-center gap-1">
                                    Use <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200">↑↓</kbd> to navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    Press <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200">Enter</kbd> to select
                                </span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default TopBar;
