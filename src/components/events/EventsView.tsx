import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  Users, 
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCampusStore } from '../../services/campusStore';
import { EventItem } from '../../types';

interface EventsViewProps {
  initialEventId?: string;
}

export const EventsView: React.FC<EventsViewProps> = ({ initialEventId }) => {
  const store = useCampusStore();
  const events = store.getEvents();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(() => {
    if (initialEventId) {
      return events.find(e => e.id === initialEventId) || null;
    }
    return null;
  });

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Competition', 'Seminar'];

  const filteredEvents = events.filter(evt => {
    const isPastEvent = evt.isPast || false;
    const matchTab = activeTab === 'upcoming' ? !isPastEvent : isPastEvent;
    const matchCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    const matchSearch = 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizer.toLowerCase().includes(searchQuery.toLowerCase());

    return matchTab && matchCategory && matchSearch;
  });

  const handleRegisterToggle = async (eventId: string) => {
    setActionError(null);
    setBusyEventId(eventId);
    try {
      // Confirmed by Supabase (row + capacity guard) before any UI claims success.
      const res = await store.toggleEventRegistration(eventId);
      if (!res.success) {
        setActionError(res.error || 'Registration could not be completed. Please try again.');
        return;
      }
      if (res.isRegistered) {
        // Trigger celebratory confetti only on confirmed registration
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.7 }
        });
      }

      if (selectedEventModal && selectedEventModal.id === eventId) {
        setSelectedEventModal(res.event || null);
      }
    } finally {
      setBusyEventId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Campus Events & Activities</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover hackathons, cultural festivals, sports tournaments, and technical summits
          </p>
        </div>

        {/* Upcoming vs Past Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Past Archives
          </button>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, organizer, or venue..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards Grid */}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {actionError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full p-16 text-center glass-panel rounded-3xl">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No events found</h3>
            <p className="text-xs text-slate-500 mt-1">Try tweaking your search or selected category filter.</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const seatsLeft = event.maxSeats - event.registeredCount;

            return (
              <div
                key={event.id}
                className="glass-panel rounded-3xl overflow-hidden border-slate-800 flex flex-col justify-between group hover:border-slate-700 transition-all duration-300"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                    <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-blue-400 border border-slate-800 shadow-sm">
                      {event.category}
                    </span>

                    {event.isRegistered && (
                      <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-glow-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="mt-4 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{event.date} &bull; {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{event.organizer}</span>
                      </div>
                    </div>

                    {/* Capacity meter */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{event.registeredCount} / {event.maxSeats} spots taken</span>
                        </span>
                        <span className={seatsLeft < 20 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                          {seatsLeft} slots left
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            seatsLeft < 20 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(event.registeredCount / event.maxSeats) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEventModal(event)}
                    className="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => void handleRegisterToggle(event.id)}
                    disabled={busyEventId === event.id}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 disabled:cursor-wait ${
                      event.isRegistered
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm'
                    }`}
                  >
                    {event.isRegistered ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Registered</span>
                      </>
                    ) : (
                      <span>Register Now</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
            <div className="relative h-48 sm:h-56">
              <img
                src={selectedEventModal.bannerImage}
                alt={selectedEventModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button
                onClick={() => setSelectedEventModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="absolute bottom-4 left-5 text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white">
                {selectedEventModal.category}
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{selectedEventModal.title}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {selectedEventModal.description}
              </p>

              <div className="grid grid-cols-2 gap-3 my-5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Date & Time</span>
                  <span className="font-semibold text-slate-200">{selectedEventModal.date}</span>
                  <span className="block text-slate-400 text-[11px]">{selectedEventModal.time}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Venue</span>
                  <span className="font-semibold text-slate-200">{selectedEventModal.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Organizer</span>
                  <span className="font-semibold text-slate-200">{selectedEventModal.organizer}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Registration Deadline</span>
                  <span className="font-semibold text-slate-200">{selectedEventModal.registrationDeadline}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {selectedEventModal.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Register / Cancel Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleRegisterToggle(selectedEventModal.id)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                    selectedEventModal.isRegistered
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm'
                  }`}
                >
                  {selectedEventModal.isRegistered ? (
                    <span>Cancel Registration</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Confirm Free Registration</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
