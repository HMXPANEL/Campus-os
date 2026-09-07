import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Users, 
  MapPin, 
  AlertCircle, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date_text: string;
  time_text: string;
  location: string;
  organizer: string;
  category: string;
  max_seats: number;
  registered_count: number;
  banner_image: string | null;
  is_published: boolean;
  is_past: boolean;
}

export const AdminEvents: React.FC = () => {
  const { role } = useAdminSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateText, setDateText] = useState('Sep 20, 2026');
  const [timeText, setTimeText] = useState('10:00 AM - 4:00 PM');
  const [location, setLocation] = useState('Main Auditorium');
  const [organizer, setOrganizer] = useState('Campus Coding Club');
  const [category, setCategory] = useState('Technical');
  const [maxSeats, setMaxSeats] = useState(150);
  const [bannerImage, setBannerImage] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80'
  );
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase backend not configured');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: evErr } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      if (evErr) throw evErr;
      setEvents(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setDateText('Sep 20, 2026');
    setTimeText('10:00 AM - 4:00 PM');
    setLocation('Main Auditorium');
    setOrganizer('Campus Coding Club');
    setCategory('Technical');
    setMaxSeats(150);
    setIsPublished(true);
    setFeedback(null);
    setModalOpen(true);
  };

  const openEditModal = (ev: EventItem) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setDateText(ev.date_text);
    setTimeText(ev.time_text);
    setLocation(ev.location);
    setOrganizer(ev.organizer);
    setCategory(ev.category);
    setMaxSeats(ev.max_seats);
    setBannerImage(ev.banner_image ?? '');
    setIsPublished(ev.is_published ?? true);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;
    try {
      const { error: updErr } = await supabase
        .from('events')
        .update({ is_published: !currentStatus })
        .eq('id', id);
      if (updErr) throw updErr;
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Could not update publication status');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        date_text: dateText.trim(),
        time_text: timeText.trim(),
        location: location.trim(),
        organizer: organizer.trim(),
        category,
        max_seats: Number(maxSeats),
        banner_image: bannerImage.trim() || null,
        is_published: isPublished,
        is_past: false,
      };

      if (editingEvent) {
        const { error: updErr } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('events').insert({
          ...payload,
          registered_count: 0,
          tags: [category],
        });
        if (insErr) throw insErr;
      }

      setFeedback('Event saved successfully!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !window.confirm('Delete this event?')) return;
    try {
      const { error: delErr } = await supabase.from('events').delete().eq('id', id);
      if (delErr) throw delErr;
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete event');
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Calendar className="w-4 h-4" />
            <span>Campus Engagement</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Events & Workshops</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage events, publish invitations, regulate seating quotas, and track registrations.
          </p>
        </div>
        {(role === 'admin' || role === 'staff' || role === 'vice_principal') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading events from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => {
            const isPub = ev.is_published ?? true;
            return (
              <div
                key={ev.id}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                {/* Banner */}
                {ev.banner_image && (
                  <div className="h-36 w-full overflow-hidden relative">
                    <img
                      src={ev.banner_image}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                          isPub
                            ? 'bg-emerald-500/80 text-white'
                            : 'bg-amber-500/80 text-white'
                        }`}
                      >
                        {isPub ? 'Published' : 'Draft / Hidden'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {ev.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{ev.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{ev.description}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300 font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{ev.date_text} &bull; {ev.time_text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {ev.registered_count} / {ev.max_seats} Seats Booked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(role === 'admin' || role === 'staff' || role === 'vice_principal') && (
                  <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleTogglePublish(ev.id, isPub)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                        isPub
                          ? 'text-amber-400 hover:bg-amber-500/10'
                          : 'text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {isPub ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isPub ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tech Fest 2026 Hackathon"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event agenda and guidelines..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date Text</label>
                  <input
                    type="text"
                    required
                    value={dateText}
                    onChange={(e) => setDateText(e.target.value)}
                    placeholder="Sep 25, 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Time Text</label>
                  <input
                    type="text"
                    required
                    value={timeText}
                    onChange={(e) => setTimeText(e.target.value)}
                    placeholder="10:00 AM - 4:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Location / Venue</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Main Auditorium"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Organizer</label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="CSE Society"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Maximum Capacity</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={1000}
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="pubCheck" className="text-xs text-slate-300">
                  Publish immediately (visible to all students)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
