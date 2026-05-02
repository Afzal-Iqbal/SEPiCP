import React, { useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  History,
  Settings,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  Database,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['student', 'admin'] },
    { icon: Upload, label: 'Upload Data', path: '/upload', roles: ['student', 'admin'] },
    { icon: BarChart3, label: 'Analysis', path: '/analysis', roles: ['student', 'admin'] },
    { icon: FileText, label: 'Results', path: '/results', roles: ['student', 'admin'] },
    { icon: History, label: 'History', path: '/history', roles: ['student', 'admin'] },
    { icon: Users, label: 'Admin Panel', path: '/admin', roles: ['admin'] },
  ];

  const projects = [
    { name: 'Alpha Study', color: 'bg-blue-500' },
    { name: 'Beta Lab', color: 'bg-emerald-500' },
    { name: 'Gamma Registry', color: 'bg-amber-500' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e3a8a] flex items-center justify-center text-white shadow-lg">
              <Database className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 tracking-tighter text-lg leading-tight">RES.PLATFORM</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dept. of Statistics</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {menuItems
          .filter(item => !item.roles || item.roles.includes(user?.role))
          .map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-[13px] group relative",
                location.pathname === item.path
                  ? "bg-blue-50 text-[#1e3a8a]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-4.5 h-4.5 transition-colors",
                location.pathname === item.path ? "text-[#1e3a8a]" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {item.label}
              {location.pathname === item.path && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#1e3a8a] animate-in fade-in zoom-in-50 duration-300" />
              )}
            </Link>
          ))}
      </nav>

      <div className="px-4 py-6 border-t border-slate-50">
        <div className="flex items-center justify-between px-4 mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Projects</p>
          <button className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest hover:underline">New</button>
        </div>
        <div className="space-y-1">
          {projects.map((p) => (
            <button key={p.name} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-[12px] group text-left">
              <div className={cn("w-2 h-2 rounded-full", p.color)} />
              <span className="flex-1">{p.name}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 mt-auto">
        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100 group">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-[#1e3a8a] text-xs border border-slate-100">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-slate-900 truncate">{user?.name || 'Researcher'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.role || 'Guest'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-white hover:text-red-500 rounded-lg text-slate-400 transition-all shadow-sm border border-transparent hover:border-slate-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white border border-slate-200 shadow-xl text-slate-600 active:scale-95 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 bg-white border-r border-slate-200 z-50 transition-all shrink-0">
        <SidebarContent />
      </aside>

      <div className={cn(
        "fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity lg:hidden",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsOpen(false)} />

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white z-60 shadow-2xl transition-transform lg:hidden flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
