import React, { useEffect, useState } from 'react';
import { 
  Flame, 
  Clock, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  X 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Canteen {
  id: string;
  name: string;
  location: string;
  crowd_level: string;
  wait_time_text: string;
}

interface MenuItem {
  id: string;
  canteen_id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  is_popular: boolean;
}

export const AdminCanteen: React.FC = () => {
  const { role } = useAdminSession();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Canteen Status Modal
  const [canteenModalOpen, setCanteenModalOpen] = useState(false);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  const [crowdLevel, setCrowdLevel] = useState('Moderate');
  const [waitTimeText, setWaitTimeText] = useState('10-15 mins');
  const [savingCanteen, setSavingCanteen] = useState(false);

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
      const [cRes, mRes] = await Promise.all([
        supabase.from('canteens').select('*'),
        supabase.from('canteen_menu_items').select('*').order('category'),
      ]);

      if (cRes.error) throw cRes.error;
      setCanteens(cRes.data ?? []);
      setMenuItems(mRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load canteen data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCanteenModal = (c: Canteen) => {
    setSelectedCanteen(c);
    setCrowdLevel(c.crowd_level);
    setWaitTimeText(c.wait_time_text);
    setFeedback(null);
    setCanteenModalOpen(true);
  };

  const handleSaveCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedCanteen) return;
    setSavingCanteen(true);
    setFeedback(null);
    try {
      const { error: updErr } = await supabase
        .from('canteens')
        .update({
          crowd_level: crowdLevel,
          wait_time_text: waitTimeText.trim(),
        })
        .eq('id', selectedCanteen.id);
      if (updErr) throw updErr;

      setFeedback('Canteen live metrics updated!');
      setTimeout(() => setCanteenModalOpen(false), 1000);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update canteen');
    } finally {
      setSavingCanteen(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!supabase) return;
    try {
      const { error: updErr } = await supabase
        .from('canteen_menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      if (updErr) throw updErr;
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to toggle availability');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Flame className="w-4 h-4" />
            <span>Campus Dining</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Canteen & Food Services</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage food courts, live crowd estimation, wait times, and menu stock availability.
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
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading food services from Supabase...</p>
        </div>
      ) : (
        <>
          {/* Canteens Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canteens.map((c) => (
              <div
                key={c.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{c.location}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.crowd_level === 'Low'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : c.crowd_level === 'Moderate'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {c.crowd_level} Rush
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Estimated Wait</span>
                    <span className="font-mono font-bold text-white mt-0.5 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {c.wait_time_text}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Menu Items</span>
                    <span className="font-mono font-bold text-white mt-0.5 block">
                      {menuItems.filter((m) => m.canteen_id === c.id).length} Dishes
                    </span>
                  </div>
                </div>

                {(role === 'admin' || role === 'staff') && (
                  <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                    <button
                      onClick={() => openCanteenModal(c)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Update Crowd & Wait Time</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Menu Items Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-2">
            <div className="p-4 border-b border-slate-800 font-semibold text-xs text-white flex items-center justify-between">
              <span>Daily Canteen Menu ({menuItems.length} Items)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-semibold">Dish Title</th>
                    <th className="p-3.5 font-semibold">Category</th>
                    <th className="p-3.5 font-semibold">Price</th>
                    <th className="p-3.5 font-semibold">Availability</th>
                    {(role === 'admin' || role === 'staff') && (
                      <th className="p-3.5 font-semibold text-right">Toggle Stock</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-sans font-bold text-white flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.is_popular && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                            Popular
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300">{item.category}</td>
                      <td className="p-3.5 text-emerald-400 font-bold">&#8377;{item.price}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.is_available
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          }`}
                        >
                          {item.is_available ? 'In Stock' : 'Sold Out'}
                        </span>
                      </td>
                      {(role === 'admin' || role === 'staff') && (
                        <td className="p-3.5 text-right font-sans">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              item.is_available
                                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                            }`}
                          >
                            {item.is_available ? 'Mark Sold Out' : 'Mark In Stock'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Canteen Status Modal */}
      {canteenModalOpen && selectedCanteen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Live Metrics: {selectedCanteen.name}
              </h3>
              <button onClick={() => setCanteenModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveCanteen} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Crowd Status</label>
                <select
                  value={crowdLevel}
                  onChange={(e) => setCrowdLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Low">Low (Empty tables)</option>
                  <option value="Moderate">Moderate (Normal queue)</option>
                  <option value="High">High (Peak rush hour)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Estimated Wait Time</label>
                <input
                  type="text"
                  required
                  value={waitTimeText}
                  onChange={(e) => setWaitTimeText(e.target.value)}
                  placeholder="e.g. 5-10 mins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCanteenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCanteen}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  {savingCanteen ? 'Updating…' : 'Publish Metrics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
