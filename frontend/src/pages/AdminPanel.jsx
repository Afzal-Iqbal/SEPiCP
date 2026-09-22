import React from 'react';
import {
  Users,
  Shield,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Activity,
  Database,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from '../components/ui/badge';

import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { allUsers, activities } = useAuth();

  // Dynamic stats
  const totalResearchers = allUsers.length;
  const activeSessions = activities.filter(a => a.type === 'login' && (Date.now() - new Date(a.timestamp).getTime()) < 3600000).length; // Active in last hour
  const totalAnalyses = activities.filter(a => a.type === 'analysis').length;
  const securityAlerts = activities.filter(a => a.type === 'login' && a.details.includes('simulation')).length; // Just a mock metric

  // Format activities for the log UI
  const logs = activities.slice(0, 10).map(act => ({
    id: act.id,
    action: act.type.charAt(0).toUpperCase() + act.type.slice(1),
    user: act.userName,
    detail: `${act.userName} (${act.userRole}): ${act.details}`,
    time: new Date(act.timestamp).toLocaleTimeString(),
    type: act.type === 'login' ? 'info' : act.type === 'analysis' ? 'success' : 'info'
  }));

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">System & Security Governance</h1>
          <p className="text-slate-500 mt-3 text-xl font-bold">Manage institutional security layers, user registries, and computational health.</p>
        </div>
        <div className="flex gap-4">
          <Button className="h-16 shadow-2xl shadow-blue-900/20 px-10 rounded-2xl bg-[#1e3a8a] hover:bg-[#1a337a] text-white font-black text-[13px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]">
            <PlusCircle className="w-5 h-5 mr-3" />
            Provision New User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Researchers', value: totalResearchers, change: '+12%', icon: Users, color: 'blue' },
          { label: 'Active Sessions', value: activeSessions, change: 'LIVE', icon: Activity, color: 'emerald' },
          { label: 'Analyses Run', value: totalAnalyses, change: 'STABLE', icon: Database, color: 'purple' },
          { label: 'Security Alerts', value: securityAlerts, change: 'CRITICAL', icon: Shield, color: 'amber' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-[32px] border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm p-8 group border-b-4 border-b-transparent hover:border-b-[#1e3a8a] transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600 group-hover:bg-[#1e3a8a] group-hover:text-white" :
                  stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 group-hover:bg-[#1e3a8a] group-hover:text-white" :
                    stat.color === 'purple' ? "bg-purple-50 text-purple-600 group-hover:bg-[#1e3a8a] group-hover:text-white" :
                      "bg-amber-50 text-amber-600 group-hover:bg-[#1e3a8a] group-hover:text-white"
              )}>
                <stat.icon className="w-7 h-7" />
              </div>
              <Badge className={cn(
                "px-3 py-1 rounded-full font-black text-[10px] tracking-widest border-none",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                  stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    stat.color === 'purple' ? "bg-purple-50 text-purple-600" :
                      "bg-amber-50 text-amber-600"
              )}>{stat.change}</Badge>
            </div>
            <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</h3>
            <p className="text-4xl font-black text-slate-900 leading-none">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <Card className="lg:col-span-2 rounded-[40px] border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden bg-white/80 backdrop-blur-sm border-b-4 border-b-[#1e3a8a]">
          <div className="p-10 border-b border-slate-100 flex flex-wrap gap-6 justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">User Registry</h3>
              <p className="text-slate-500 font-bold text-sm mt-1">Institutional identity management and access control.</p>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <Input
                type="text"
                placeholder="Search registries..."
                className="pl-12 h-14 bg-white border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 border-none shadow-inner"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50/50">
                  <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile</TableHead>
                  <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Credential</TableHead>
                  <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vector</TableHead>
                  <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-blue-50/50 transition-colors group border-b border-slate-50 last:border-0">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#1e3a8a] text-white flex items-center justify-center font-black text-sm shadow-lg ring-4 ring-blue-50 transition-transform group-hover:scale-110">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{u.name}</p>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{u.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                      <p className="text-sm font-bold text-slate-600">{u.email}</p>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest border-none shadow-sm",
                        u.role === 'admin' ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#1e3a8a]"
                      )}>
                        {u.role?.toUpperCase() || 'RESEARCHER'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#1e3a8a] hover:bg-white border border-transparent hover:border-slate-100 shadow-sm transition-all">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="space-y-10">
          <Card className="rounded-[40px] border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden bg-white/80 backdrop-blur-sm border-b-4 border-b-[#1e3a8a]">
            <CardHeader className="p-10 pb-6 border-b border-slate-100 bg-slate-50/30 font-black text-slate-800 uppercase tracking-widest text-xs flex flex-row items-center gap-3">
              <Clock className="w-5 h-5 text-[#1e3a8a]" />
              System Audit
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <div key={log.id} className="p-8 hover:bg-blue-50/50 transition-all group relative">
                    <div className="flex gap-4 items-start relative z-10">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
                        log.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-[#1e3a8a]"
                      )}>
                        {log.action === 'Login' ? <Shield className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="text-[13px] font-black text-slate-900 group-hover:text-[#1e3a8a] transition-colors">{log.action}</p>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">{log.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                <Button variant="ghost" className="w-full h-14 rounded-2xl font-black text-[#1e3a8a] uppercase tracking-widest text-[11px] hover:bg-white shadow-sm border border-transparent hover:border-slate-100 transition-all">
                  View Full Audit registry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

