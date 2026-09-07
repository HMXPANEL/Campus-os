import React, { useEffect, useState } from 'react';
import { 
  Bus, 
  Edit2, 
  AlertCircle, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface TransportRoute {
  id: string;
  route_name: string;
  bus_number: string;
  source: string;
  destination: string;
  next_arrival_mins: number;
  current_stop: string;
  status: string;
  stops: string[];
}

export const AdminTransport: React.FC = () => {
  const { role } = useAdminSession();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [nextArrivalMins, setNextArrivalMins] = useState(8);
  const [currentStop, setCurrentStop] = useState('');
  const [status, setStatus] = useState('On Time');
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
      const { data, error: tErr } = await supabase
        .from('transport_routes')
        .select('*')
        .order('bus_number');
      if (tErr) throw tErr;
      setRoutes(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load transport routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openEditModal = (r: TransportRoute) => {
    setEditingRoute(r);
    setNextArrivalMins(r.next_arrival_mins);
    setCurrentStop(r.current_stop);
    setStatus(r.status);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingRoute) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { error: updErr } = await supabase
        .from('transport_routes')
        .update({
          next_arrival_mins: Number(nextArrivalMins),
          current_stop: currentStop.trim(),
          status,
        })
        .eq('id', editingRoute.id);
      if (updErr) throw updErr;

      setFeedback('Route status updated live!');
      setTimeout(() => setModalOpen(false), 1000);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update route');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Bus className="w-4 h-4" />
            <span>Campus Transit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Campus Shuttles & Transport</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Fleet tracking, shuttle dispatch schedules, live ETA updates, and transit stops.
          </p>
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
          <p className="text-xs text-slate-400">Loading campus fleet from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {routes.map((r) => (
            <div
              key={r.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    Shuttle {r.bus_number}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{r.route_name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {r.source} &rarr; {r.destination}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === 'On Time'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              {/* Status and ETA */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] font-mono block">Current Stop</span>
                  <span className="font-semibold text-white mt-0.5 block">{r.current_stop}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-mono block">Next Arrival</span>
                  <span className="font-mono font-bold text-blue-400 text-sm mt-0.5 block">
                    {r.next_arrival_mins} mins away
                  </span>
                </div>
              </div>

              {/* Stops list */}
              {r.stops && r.stops.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                    Transit Stops
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {r.stops.map((stop, i) => (
                      <span
                        key={i}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border font-mono ${
                          stop === r.current_stop
                            ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {stop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(role === 'admin' || role === 'staff') && (
                <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                  <button
                    onClick={() => openEditModal(r)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update Live Dispatch</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {modalOpen && editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Dispatch Shuttle {editingRoute.bus_number}
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Stop / Location</label>
                <input
                  type="text"
                  required
                  value={currentStop}
                  onChange={(e) => setCurrentStop(e.target.value)}
                  placeholder="e.g. Science Block"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Next Arrival (Minutes)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    required
                    value={nextArrivalMins}
                    onChange={(e) => setNextArrivalMins(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Transit Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="On Time">On Time</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Boarding">Boarding</option>
                  </select>
                </div>
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
                  {saving ? 'Updating…' : 'Save Live ETA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
