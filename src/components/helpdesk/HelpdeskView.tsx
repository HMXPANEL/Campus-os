import React, { useState } from 'react';
import { 
  LifeBuoy, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  ArrowRight, 
  Filter, 
  ShieldCheck, 
  X,
  FileText
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';
import { HelpdeskTicket, TicketCategory, TicketPriority, TicketStatus } from '../../types';

interface HelpdeskViewProps {
  initialTab?: 'report' | 'tickets';
  initialTicketId?: string;
}

export const HelpdeskView: React.FC<HelpdeskViewProps> = ({ initialTab = 'tickets', initialTicketId }) => {
  const store = useCampusStore();
  const tickets = store.getTickets();
  const student = store.getStudent();

  const [activeTab, setActiveTab] = useState<'report' | 'tickets'>(initialTab);
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(() => {
    if (initialTicketId) {
      return store.getTicketById(initialTicketId) || null;
    }
    return null;
  });

  // Filter state for My Tickets
  const [statusFilter, setStatusFilter] = useState<'All' | TicketStatus>('All');

  // Form state for Report Issue
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Maintenance');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [submittedTicket, setSubmittedTicket] = useState<HelpdeskTicket | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories: TicketCategory[] = [
    'Maintenance',
    'Electrical',
    'Water',
    'Cleaning',
    'Classroom Equipment',
    'Wi-Fi / IT',
    'Other'
  ];

  const quickLocations = [
    'Room 204 (CS Block)',
    'Room 101 (Floor 1)',
    'CS Lab 1',
    'Central Library 2nd Floor',
    'North Canteen Quad',
    'Sports Arena',
    'Seminar Hall B'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !location.trim() || !description.trim()) {
      setFormError('Please complete all required fields (Issue Title, Location, and Description).');
      return;
    }

    setSubmitting(true);
    try {
      // Confirmed by Supabase (row + server-assigned ID + timeline) before success UI.
      const created = await store.createHelpdeskTicket({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
        priority
      });

      setSubmittedTicket(created);
      // Reset inputs
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('Maintenance');
      setPriority('Medium');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Ticket could not be created. Check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filter student tickets
  const studentTickets = tickets.filter(t => t.studentId === student.id);
  const filteredTickets = studentTickets.filter(t => {
    if (statusFilter === 'All') return true;
    return t.status === statusFilter;
  });

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'Pending':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Assigned':
        return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'In Progress':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Resolved':
      case 'Closed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getPriorityColor = (pri: TicketPriority) => {
    switch (pri) {
      case 'High':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Low':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Campus Helpdesk & Issue Registry</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log facility breakdowns, track maintenance progress, and monitor physical campus service SLAs
          </p>
        </div>

        {/* Tab switcher: Report Issue vs My Tickets */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('tickets');
              setSubmittedTicket(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Tickets ({studentTickets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('report');
              setSubmittedTicket(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'report'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: REPORT ISSUE FORM */}
      {/* ============================================================ */}
      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto animate-fade-in">
          {submittedTicket ? (
            /* Success confirmation card */
            <div className="glass-panel p-8 rounded-3xl border-emerald-500/30 text-center space-y-4 shadow-glow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Ticket Created Successfully</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your campus issue has been entered into the physical facilities dispatcher queue.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2.5 max-w-md mx-auto text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket ID:</span>
                  <span className="font-mono font-bold text-blue-400">{submittedTicket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issue Title:</span>
                  <span className="font-semibold text-slate-200">{submittedTicket.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-200">{submittedTicket.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="text-slate-200">{submittedTicket.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-semibold text-amber-400">{submittedTicket.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Report Another Issue
                </button>
                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setSelectedTicket(submittedTicket);
                    setSubmittedTicket(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Track in My Tickets</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Issue Submission Form */
            <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-5">
              <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Campus Problem</h3>
                  <p className="text-xs text-slate-400">Classrooms, labs, internet, water, sanitation, or electrical faults</p>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Issue Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AC unit leaking in Room 204 or Projector HDMI not syncing"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Priority Level <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Low">Low (Minor inconvenience)</option>
                    <option value="Medium">Medium (Impairs study/room)</option>
                    <option value="High">High (Blocks lecture/safety hazard)</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Campus Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Room 204, CS Lab 1, or 2nd floor corridor"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />

                {/* Quick location chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickLocations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detailed Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue, specific workstation or equipment number, and when you first noticed it..."
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-glow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? 'Logging Ticket…' : 'Report Problem'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MY TICKETS LIST */}
      {/* ============================================================ */}
      {activeTab === 'tickets' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Filter pills */}
          <div className="glass-panel p-3.5 rounded-2xl border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 hidden sm:inline">
              Showing {filteredTickets.length} ticket(s)
            </span>
          </div>

          {/* Tickets Cards */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="p-16 text-center glass-panel rounded-3xl">
                <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">No helpdesk tickets found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have no issues logged matching this status. Everything on campus is running smoothly.
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                        {t.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityColor(t.priority)}`}>
                        {t.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                        {t.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {t.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2.5">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {t.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        Created: {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-slate-800 sm:pl-6 flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-xs text-blue-400 group-hover:text-blue-300 font-semibold flex items-center gap-1">
                      <span>Audit Trail</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ticket Detail & Audit Timeline Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl animate-slide-up">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
                {selectedTicket.id}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mt-2">{selectedTicket.title}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {selectedTicket.description}
            </p>

            <div className="grid grid-cols-2 gap-3 my-4 text-xs">
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">Location</span>
                <span className="font-semibold text-slate-200">{selectedTicket.location}</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">Category</span>
                <span className="font-semibold text-slate-200">{selectedTicket.category}</span>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Ticket Lifecycle Audit Trail</span>
              </h4>

              <div className="space-y-3 pl-2 border-l-2 border-slate-800 ml-2">
                {selectedTicket.timeline.map((step, idx) => (
                  <div key={idx} className="relative pl-4">
                    <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-slate-900 shadow-glow-sm" />
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-200">{step.step}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{step.timestamp}</span>
                    </div>
                    {step.note && (
                      <p className="text-xs text-slate-400 mt-0.5">{step.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
