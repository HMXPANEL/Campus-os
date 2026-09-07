import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Clock, 
  LifeBuoy, 
  Calendar, 
  Bus,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';
import { NavSection, NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection, meta?: { tab?: string; id?: string }) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const store = useCampusStore();
  const notifications = store.getNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'attendance':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'ticket':
        return <LifeBuoy className="w-4 h-4 text-emerald-400" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'transport':
        return <Bus className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slide-left relative"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-medium">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Campus Alerts & Updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => store.markAllNotificationsRead()}
                title="Mark all as read"
                className="p-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">You're all caught up!</p>
              <p className="text-xs text-slate-600 mt-1">No pending campus alerts.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  store.markNotificationRead(notif.id);
                  if (notif.actionLink) {
                    onNavigate(notif.actionLink.view, { tab: notif.actionLink.tab, id: notif.actionLink.id });
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  notif.isRead
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-75 hover:opacity-100 hover:border-slate-700'
                    : 'bg-slate-800/70 border-blue-500/30 hover:border-blue-500/60 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-semibold ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.actionLink && (
                      <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300">
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
          CampusOS Realtime Event Stream
        </div>
      </div>
    </div>
  );
};
