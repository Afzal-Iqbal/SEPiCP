import { cn } from '../lib/utils';
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Database,
    BarChart3,
    History,
    FileText,
    TrendingUp,
    Users,
    Clock,
    ArrowRight,
    PlusCircle,
    Activity
} from 'lucide-react';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
    const { user, activities, allUsers } = useAuth();
    
    // Filter Type state for administrator (Global vs. Personal view)
    const [filterType, setFilterType] = useState('personal');

    // Data Filtering: Admin can toggle Global vs. Personal. Standard researcher only sees Personal.
    const displayActivities = useMemo(() => {
        if (user?.role === 'admin' && filterType === 'global') {
            return activities;
        }
        return activities.filter(a => a.userId === user?.id);
    }, [activities, user, filterType]);

    const stats = [
        { label: 'Total Researchers', value: user?.role === 'admin' ? allUsers.length : '1', icon: Users, color: 'blue' },
        { label: 'Analyses Run', value: displayActivities.filter(a => a.type === 'analysis').length, icon: BarChart3, color: 'indigo' },
        { label: 'Uploads', value: displayActivities.filter(a => a.type === 'upload').length, icon: TrendingUp, color: 'emerald' },
        { label: 'Activity Logs', value: displayActivities.length, icon: Clock, color: 'violet' },
        { label: 'Your Role', value: user?.role === 'admin' ? 'Administrator' : 'Researcher', icon: Activity, color: 'fuchsia' },
    ];

    const recentActivity = useMemo(() => {
        return displayActivities.slice(0, 5).map(act => ({
            id: act.id,
            type: act.type,
            title: act.details,
            time: new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userName: act.userName,
            status: 'Completed'
        }));
    }, [displayActivities]);

    // Dynamic Chart Data: compute activity counts for the last 7 calendar days
    const chartData = useMemo(() => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayLabel = daysOfWeek[d.getDay()];
            result.push({
                name: dayLabel,
                dateStr: d.toDateString(),
                value: 0
            });
        }

        displayActivities.forEach(act => {
            try {
                const actDate = new Date(act.timestamp).toDateString();
                const match = result.find(r => r.dateStr === actDate);
                if (match) {
                    match.value += 1;
                }
            } catch (e) {}
        });

        return result.map(r => ({
            name: r.name,
            value: r.value
        }));
    }, [displayActivities]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Dynamic Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                        Welcome, <span className="text-[#1e3a8a]">{user?.name?.split(' ')[0] || 'Researcher'}</span>
                    </h1>
                    <p className="text-slate-500 mt-1.5 text-sm sm:text-base font-bold">
                        Institutional Research Overview & Metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/history">
                        <Button variant="outline" className="rounded-xl font-black h-11 px-5 border-slate-200 bg-white text-[11px] uppercase tracking-widest shadow-sm cursor-pointer hover:bg-slate-50">
                            <History className="w-4 h-4 mr-2.5 text-slate-400" />
                            History
                        </Button>
                    </Link>
                    <Link to="/upload">
                        <Button className="rounded-xl font-black h-11 shadow-lg shadow-blue-900/10 px-6 bg-[#1e3a8a] hover:bg-[#1a337a] text-[11px] uppercase tracking-widest transition-all cursor-pointer">
                            <PlusCircle className="w-4 h-4 mr-2.5" />
                            New Project
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.slice(0, 4).map((stat, i) => (
                    <Card key={i} className="rounded-[24px] border-slate-200/60 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-blue-900/5 transition-all overflow-hidden bg-white group border-b-4 border-b-transparent hover:border-b-[#1e3a8a]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    stat.color === 'blue' ? "bg-blue-50 text-blue-600 group-hover:bg-[#1e3a8a] group-hover:text-white" :
                                        stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600 group-hover:bg-[#1e3a8a] group-hover:text-white" :
                                            stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 group-hover:bg-[#1e3a8a] group-hover:text-white" :
                                                "bg-violet-50 text-violet-600 group-hover:bg-[#1e3a8a] group-hover:text-white"
                                )}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest">Live</Badge>
                            </div>
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Chart Card */}
                <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm p-8">
                    <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900">Activity Overview</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Research operations throughput (last 7 days)</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge 
                                variant={filterType === 'global' ? 'default' : 'outline'} 
                                onClick={() => user?.role === 'admin' && setFilterType('global')}
                                className={cn(
                                    "rounded-lg h-8 px-3 font-bold cursor-pointer transition-all select-none",
                                    filterType === 'global' 
                                        ? "bg-[#1e3a8a] text-white hover:bg-[#1a337a] border-transparent" 
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                                    user?.role !== 'admin' && "opacity-50 cursor-not-allowed"
                                )}
                                title={user?.role !== 'admin' ? "Only administrators can view global statistics" : ""}
                            >
                                Global
                            </Badge>
                            <Badge 
                                variant={filterType === 'personal' ? 'default' : 'outline'} 
                                onClick={() => setFilterType('personal')}
                                className={cn(
                                    "rounded-lg h-8 px-3 font-bold cursor-pointer transition-all select-none",
                                    filterType === 'personal' 
                                        ? "bg-[#1e3a8a] text-white hover:bg-[#1a337a] border-transparent" 
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                Personal
                            </Badge>
                        </div>
                    </CardHeader>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.colors.primary} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                        padding: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={theme.colors.primary}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Recent Activity Card */}
                <div className="space-y-8">
                    <Card className="rounded-3xl border-slate-200 shadow-sm p-6 overflow-hidden bg-white">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-slate-400" />
                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Recent Activity</h3>
                            </div>
                            <Link to="/history" className="text-xs font-bold text-slate-400 hover:text-blue-650 transition-colors">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item, i) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                            item.type === 'upload' ? "bg-amber-50 text-amber-600" :
                                                item.type === 'analysis' ? "bg-blue-50 text-[#1e3a8a]" :
                                                    "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {item.type === 'upload' ? <Database className="w-5 h-5" /> :
                                                item.type === 'analysis' ? <BarChart3 className="w-5 h-5" /> :
                                                    <FileText className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs text-slate-400 font-medium">{item.time}</span>
                                                {filterType === 'global' && item.userName && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-slate-350" />
                                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                            {item.userName}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={item.status === 'Completed' ? 'success' : 'secondary'} className="h-6 px-2 text-[10px] uppercase font-black tracking-widest leading-none">
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center text-slate-400 text-xs">
                                    No recent activities recorded.
                                </div>
                            )}
                        </div>

                        <Link to="/history">
                            <Button className="w-full mt-8 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-black border border-slate-100 group cursor-pointer">
                                View Audit Logs
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </Card>

                    {/* Quick Actions Card */}
                    <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 group">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-2">Need a Research Guide?</h3>
                            <p className="text-indigo-100 text-sm opacity-80 mb-6 leading-relaxed">
                                Explore our institutional documentation for best practices in data ethics and analysis.
                            </p>
                            <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-black rounded-xl h-11 px-6 group">
                                Open Knowledge Base
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                        <FileText className="absolute -bottom-8 -right-8 w-40 h-40 text-white/10 rotate-12 transition-transform group-hover:scale-110" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
