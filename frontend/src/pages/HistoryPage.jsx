import React from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  FileSpreadsheet,
  BarChart2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

import { useAuth } from '../context/AuthContext';

const HistoryPage = () => {
  const { user, activities } = useAuth();

  // Filter activities to only show the logged-in user's records
  const userActivities = activities.filter(act => act.userId === user?.id);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">Institutional Audit Log</h1>
          <p className="text-slate-500 mt-3 text-xl font-bold">Comprehensive history of research activities and security events.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl font-black border-slate-200 bg-white/50 backdrop-blur-sm text-[13px] uppercase tracking-widest shadow-sm hover:bg-white hover:border-[#1e3a8a] transition-all">
            <Download className="w-5 h-5 mr-3" />
            Export Registry
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden bg-white/80 backdrop-blur-sm border-b-4 border-b-[#1e3a8a]">
        <div className="p-10 border-b border-slate-100 flex flex-wrap gap-6 justify-between items-center bg-slate-50/30">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
            <Input
              type="text"
              placeholder="Search registry records..."
              className="pl-14 h-16 bg-white border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 border-none shadow-inner"
            />
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-emerald-50 text-emerald-700 py-2 px-5 rounded-full border border-emerald-100 font-black text-[11px] uppercase tracking-widest">
              Real-time Sync Active
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50/50">
                <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Vector</TableHead>
                <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Event Description</TableHead>
                <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</TableHead>
                <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userActivities.length > 0 ? (
                userActivities.map((item) => (
                  <TableRow key={item.id} className="hover:bg-blue-50/50 transition-colors group border-b border-slate-50 last:border-0">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                          item.type === 'login' ? "bg-emerald-50 text-emerald-600" :
                            item.type === 'analysis' ? "bg-blue-50 text-[#1e3a8a]" :
                              item.type === 'upload' ? "bg-amber-50 text-amber-600" :
                                "bg-slate-50 text-slate-600"
                        )}>
                          {item.type === 'login' ? <Eye className="w-6 h-6" /> :
                            item.type === 'analysis' ? <BarChart2 className="w-6 h-6" /> :
                              <FileSpreadsheet className="w-6 h-6" />}
                        </div>
                        <span className="text-[13px] font-black uppercase tracking-widest text-[#1e3a8a]">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                      <p className="text-sm font-black text-slate-800 leading-relaxed">{item.details}</p>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-sm text-slate-500 font-bold">
                      {new Date(item.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-[#1e3a8a] hover:bg-white shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Eye className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-slate-400 font-medium">
                    No activity records found. Start exploring to generate history!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">Showing <span className="text-slate-900 font-bold">{userActivities.length}</span> records</p>
        </div>
      </Card>
    </div>
  );
};

export default HistoryPage;

