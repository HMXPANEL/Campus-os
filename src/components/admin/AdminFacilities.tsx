import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Search, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  X 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Facility {
  id: string;
  name: string;
  building: string;
  floor: string;
  type: string;
  capacity: number;
  available_seats: number;
  status: string;
  amenities: string[];
}

export const AdminFacilities: React.FC = () => {
  const { role } = useAdminSession();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [availableSeats, setAvailableSeats] = useState(50);
  const [status, setStatus] = useState('Open');
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
      const { data, error: fErr } = await supabase.from('facilities').select('*').order('name');
      if (fErr) throw fErr;
      setFacilities(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openEditModal = (f: Facility) => {
    setEditingFacility(f);
    setAvailableSeats(f.available_seats);
    setStatus(f.status);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingFacility) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { error: updErr } = await supabase
        .from('facilities')
        .update({
          available_seats: Number(availableSeats),
          status,
        })
        .eq('id', editingFacility.id);
      if (updErr) throw updErr;

      setFeedback('Facility occupancy updated!');
      setTimeout(() => setModalOpen(false), 1000);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update facility');
    } finally {
      setSaving(false);
    }
  };

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.building.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <MapPin className="w-4 h-4" />
            <span>Campus Infrastructure</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Facilities & Spaces</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Study lounges, laboratories, seminar halls, and live seat occupancy meters.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search facilities by name or building..."
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
          <p className="text-xs text-slate-400">Loading facilities from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacilities.map((f) => {
            const occupancyPct =
              f.capacity > 0 ? Math.round(((f.capacity - f.available_seats) / f.capacity) * 100) : 0;
            return (
              <div
                key={f.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {f.type}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{f.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {f.building} &bull; Floor {f.floor}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      f.status === 'Open'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                {/* Capacity Meter */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">
                      {f.available_seats} / {f.capacity} Seats Available
                    </span>
                    <span className="font-mono font-bold text-blue-400">{occupancyPct}% Full</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                {/* Amenities */}
                {f.amenities && f.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {f.amenities.map((a, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                {(role === 'admin' || role === 'staff' || role === 'maintenance') && (
                  <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                    <button
                      onClick={() => openEditModal(f)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Update Status & Seats</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {modalOpen && editingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Update {editingFacility.name}</h3>
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Available Seats (Max: {editingFacility.capacity})
                </label>
                <input
                  type="number"
                  min={0}
                  max={editingFacility.capacity}
                  required
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed for Maintenance</option>
                  <option value="Reserved">Reserved for Exam</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {saving ? 'Updating…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
