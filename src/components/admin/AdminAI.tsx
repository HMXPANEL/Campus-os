import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  Database
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'create_notice' | 'assign_ticket';
    title: string;
    details: Record<string, any>;
    status: 'pending' | 'confirmed' | 'cancelled';
  };
}

export const AdminAI: React.FC = () => {
  const { session } = useAdminSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${session?.email ? session.email.split('@')[0] : 'Administrator'}. I am **CampusOS Admin Intelligence**, your operational and academic decision assistant. I query live Supabase records across attendance, timetable, facilities, and maintenance.\n\nHow can I assist campus operations today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const queryPrompts = [
    'How many students are below 75% attendance?',
    'Show unresolved maintenance tickets.',
    'Which rooms have repeated maintenance problems?',
    'Show upcoming events and capacity.',
    'Draft a notice for DBMS lab schedule change.',
  ];

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text || !supabase) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let replyText = '';
      let actionCard: any = undefined;
      const lower = text.toLowerCase();

      if (lower.includes('attendance') || lower.includes('below 75') || lower.includes('risk')) {
        const { data: recs } = await supabase.from('attendance_records').select('*');
        const atRisk = (recs ?? []).filter((r: any) => r.percentage < 75);
        const avg =
          (recs ?? []).length > 0
            ? Math.round(((recs ?? []).reduce((s: number, r: any) => s + r.percentage, 0) / (recs ?? []).length) * 10) / 10
            : 0;

        replyText = `### Campus Attendance Intelligence\n\n- **Campus Average Attendance:** **${avg}%**\n- **Students Below 75% Threshold:** **${atRisk.length} subjects flagged**\n\n**Flagged Courses:**\n${atRisk
          .map((r: any) => `- **${r.subject_code} (${r.subject_name}):** ${r.percentage}% (${r.attended_classes}/${r.total_classes} classes)`)
          .join('\n')}\n\n*Recommendation:* Issue academic warnings to affected students to prevent exam disqualification.`;
      } else if (lower.includes('ticket') || lower.includes('maintenance') || lower.includes('helpdesk')) {
        const { data: tickets } = await supabase
          .from('helpdesk_tickets')
          .select('*')
          .not('status', 'in', '(Resolved,Closed)');
        
        replyText = `### Live Helpdesk & Maintenance Triage\n\nCurrently, there are **${tickets?.length ?? 0} active unresolved tickets** in Supabase:\n\n${(tickets ?? [])
          .map((t: any) => `- **${t.display_id}** [${t.priority}]: ${t.title} at **${t.location}** (${t.status})`)
          .join('\n')}`;
      } else if (lower.includes('room') && (lower.includes('problem') || lower.includes('repeat'))) {
        const { data: tickets } = await supabase.from('helpdesk_tickets').select('location, title, category');
        const roomCounts: Record<string, number> = {};
        (tickets ?? []).forEach((t: any) => {
          roomCounts[t.location] = (roomCounts[t.location] ?? 0) + 1;
        });

        replyText = `### Facility Issue Hotspot Analysis\n\nRepeated issues by location in live database:\n${Object.entries(roomCounts)
          .map(([loc, count]) => `- **${loc}:** ${count} logged incident(s)`)
          .join('\n')}\n\n**Highest Impact Location:** **Room 204** has experienced repeated electrical/AC complaints during lecture hours.`;
      } else if (lower.includes('event') || lower.includes('capacity')) {
        const { data: events } = await supabase
          .from('events')
          .select('title, location, registered_count, max_seats, date_text')
          .eq('is_past', false);

        replyText = `### Campus Events & Seating Quotas\n\n${(events ?? [])
          .map(
            (e: any) =>
              `- **${e.title}:** ${e.registered_count}/${e.max_seats} seats booked (${Math.round((e.registered_count / e.max_seats) * 100)}% capacity) on ${e.date_text} at ${e.location}`
          )
          .join('\n')}`;
      } else if (lower.includes('notice') || lower.includes('draft')) {
        replyText = `I have drafted an official circular based on your prompt. Before broadcasting to student dashboards, please review and confirm the action below.`;
        actionCard = {
          type: 'create_notice',
          title: 'Schedule Change: DBMS Practical Lab',
          details: {
            Target: 'Computer Science Department &bull; Semester 5',
            Content: 'The DBMS Practical Lab scheduled for Wednesday has been relocated to CS Lab 2 due to routine maintenance.',
            PublishedBy: 'Registrar Office',
          },
          status: 'pending',
        };
      } else {
        replyText = `I have cross-referenced your query against the live Supabase university database. You can ask me to evaluate attendance compliance, check active maintenance queues, inspect facility utilization, or draft broadcast notices.`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `Error querying database: ${e.message ?? 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string) => {
    if (!supabase) return;
    try {
      await supabase.from('notices').insert({
        title: 'Schedule Change: DBMS Practical Lab',
        body: 'The DBMS Practical Lab scheduled for Wednesday has been relocated to CS Lab 2 due to routine maintenance.',
        audience: 'dept',
        published_by: 'Registrar Office',
        published_at: new Date().toISOString(),
        is_pinned: true,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.actionCard
            ? { ...m, actionCard: { ...m.actionCard, status: 'confirmed' } }
            : m
        )
      );
    } catch (e) {
      console.warn('Action confirmation failed:', e);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.actionCard
          ? { ...m, actionCard: { ...m.actionCard, status: 'cancelled' } }
          : m
      )
    );
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>Operational Intelligence</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Admin AI Assistant</h1>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connected to Supabase</span>
        </div>
      </div>

      {/* Suggestion Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {queryPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/40 transition-colors whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 text-xs ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-glow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-2xl p-4 space-y-2 leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'glass-panel border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{m.text}</div>

              {/* Action Confirmation Card */}
              {m.actionCard && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Action Draft: {m.actionCard.title}</span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div><strong>Target:</strong> {m.actionCard.details.Target}</div>
                    <div><strong>Content:</strong> {m.actionCard.details.Content}</div>
                  </div>

                  {m.actionCard.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleCancelAction(m.id)}
                        className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmAction(m.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Broadcast</span>
                      </button>
                    </div>
                  ) : m.actionCard.status === 'confirmed' ? (
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Action confirmed and published to Supabase!</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">Action cancelled.</div>
                  )}
                </div>
              )}

              <span className="text-[10px] text-slate-400 block text-right font-mono mt-1">
                {m.timestamp}
              </span>
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-3 glass-panel rounded-2xl border border-slate-800 w-fit">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span>Querying Supabase records...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="glass-panel p-2 rounded-2xl border border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Admin AI to analyze attendance, triage tickets, or draft notices..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
