import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  BookOpen, 
  Calendar, 
  Building2, 
  CheckSquare, 
  LifeBuoy, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';
import { NavSection } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection, meta?: { tab?: string; id?: string }) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const store = useCampusStore();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Index and search campus records
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: {
      id: string;
      title: string;
      subtitle: string;
      category: 'Timetable' | 'Events' | 'Facilities' | 'Library' | 'Deadlines' | 'Helpdesk';
      icon: any;
      section: NavSection;
      meta?: { tab?: string; id?: string };
    }[] = [];

    // Timetable
    store.getTimetable().forEach(t => {
      if (
        t.subjectName.toLowerCase().includes(q) ||
        t.subjectCode.toLowerCase().includes(q) ||
        t.room.toLowerCase().includes(q) ||
        t.faculty.toLowerCase().includes(q)
      ) {
        results.push({
          id: t.id,
          title: `${t.subjectName} (${t.subjectCode})`,
          subtitle: `${t.dayOfWeek} ${t.startTime}–${t.endTime} • ${t.room} • ${t.faculty}`,
          category: 'Timetable',
          icon: BookOpen,
          section: 'student-data',
          meta: { tab: 'timetable' }
        });
      }
    });

    // Events
    store.getEvents().forEach(e => {
      if (
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: e.id,
          title: e.title,
          subtitle: `${e.category} • ${e.date} • ${e.location}`,
          category: 'Events',
          icon: Calendar,
          section: 'events',
          meta: { id: e.id }
        });
      }
    });

    // Facilities
    store.getFacilities().forEach(f => {
      if (
        f.name.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: f.id,
          title: f.name,
          subtitle: `${f.location} • ${f.availableSeats}/${f.capacity} seats available (${f.occupancyPercentage}% full)`,
          category: 'Facilities',
          icon: Building2,
          section: 'dashboard'
        });
      }
    });

    // Deadlines
    store.getDeadlines().forEach(d => {
      if (
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: d.id,
          title: d.title,
          subtitle: `[${d.category}] Due: ${d.dueDate} • Priority: ${d.priority}`,
          category: 'Deadlines',
          icon: CheckSquare,
          section: 'student-data',
          meta: { tab: 'deadlines' }
        });
      }
    });

    // Helpdesk
    store.getTickets().forEach(tk => {
      if (
        tk.id.toLowerCase().includes(q) ||
        tk.title.toLowerCase().includes(q) ||
        tk.location.toLowerCase().includes(q) ||
        tk.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: tk.id,
          title: `${tk.id}: ${tk.title}`,
          subtitle: `${tk.category} • ${tk.location} • Status: ${tk.status}`,
          category: 'Helpdesk',
          icon: LifeBuoy,
          section: 'helpdesk',
          meta: { tab: 'tickets', id: tk.id }
        });
      }
    });

    return results.slice(0, 8);
  }, [query, store]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
        
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classes, events, library, deadlines, study rooms, or tickets..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-300">Quick Global Search</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Type keywords like "DBMS", "Hackathon", "Library", "AC", or "Scholarship" to jump directly to any campus record.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No matching campus records found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((res) => {
                const IconComponent = res.icon;
                return (
                  <button
                    key={`${res.category}-${res.id}`}
                    onClick={() => {
                      onNavigate(res.section, res.meta);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {res.category}
                          </span>
                          <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {res.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {res.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search powered by CampusOS Universal Index</span>
          <span>Tab / Arrows to navigate</span>
        </div>
      </div>
    </div>
  );
};
