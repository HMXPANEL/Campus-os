import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  GraduationCap, 
  Calendar, 
  LifeBuoy, 
  Search, 
  Bell, 
  Clock
} from 'lucide-react';
import { NavSection } from '../../types';
import { useCampusStore } from '../../services/campusStore';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { StudentProfileModal } from '../common/StudentProfileModal';

interface StudentShellProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection, meta?: { tab?: string; id?: string }) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const StudentShell: React.FC<StudentShellProps> = ({
  currentSection,
  onNavigate,
  onLogout,
  children
}) => {
  const store = useCampusStore();
  const student = store.getStudent();
  const notifications = store.getNotifications();
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Clock ticker for live campus time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Global Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Exactly 5 Primary Navigation Sections
  const navItems: { id: NavSection; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai', label: 'CampusOS AI', icon: Sparkles, badge: 'AI' },
    { id: 'student-data', label: 'Student Data', icon: GraduationCap },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'helpdesk', label: 'Helpdesk', icon: LifeBuoy }
  ];

  return (
    <div className="min-h-screen bg-campus-bg text-campus-text flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (Visible md:flex, Hidden on mobile) */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0A0E1A] border-r border-slate-800/80 sticky top-0 h-screen z-30 shrink-0">
        {/* Brand & Logo */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">CampusOS</span>
              <span className="text-[10px] px-1.5 py-0.5 font-mono rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Attendance OS</p>
          </div>
        </div>

        {/* Navigation Items (Exact 5 Primary Items) */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Student Portal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-glow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Academic Status Chip */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">Campus Online</span>
            </div>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentTime || '10:00 AM'}
            </span>
          </div>
        </div>

        {/* User Quick Pill in Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 text-left w-full p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{student.name}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{student.id}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTAINER */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-[#080C14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Mobile Brand / Page Title */}
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">CampusOS</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Current Section &bull;
              </span>
              <span className="text-sm font-semibold text-slate-200 capitalize">
                {currentSection === 'ai' ? 'CampusOS AI Companion' : currentSection.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Right Header Actions: Search, Notifications, Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs transition-colors shadow-sm"
              title="Search Campus (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-slate-400">Search campus...</span>
              <kbd className="hidden sm:inline font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title="Student Profile"
            >
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-8 h-8 rounded-lg object-cover border border-blue-500/50 shadow-sm"
              />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Visible <md, Hidden on desktop) */}
      {/* ============================================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0E1A]/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-blue-500/15 shadow-glow-sm' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {item.id === 'ai' ? 'AI' : item.id === 'student-data' ? 'Student Data' : item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Common Modals & Slide-overs */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={onNavigate}
      />

      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={onLogout}
      />
    </div>
  );
};
