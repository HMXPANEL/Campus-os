import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Database,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';
import { CampusAIAgent } from '../../services/aiAgent';
import { AIMessage, NavSection } from '../../types';

interface CampusOSAIViewProps {
  initialPrompt?: string;
  onNavigate: (section: NavSection, meta?: { tab?: string; id?: string }) => void;
}

export const CampusOSAIView: React.FC<CampusOSAIViewProps> = ({ initialPrompt, onNavigate }) => {
  const store = useCampusStore();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello Aditya! I am **CampusOS AI**, your intelligent campus companion. I have real-time access to your academic schedule, physical campus facilities, dining queues, library seat availability, transit schedules, and helpdesk systems.\n\nHow can I help you navigate your campus day?`,
      timestamp: 'Just now',
      dataSources: ['CampusOS Live Service Mesh']
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle initial prompt if redirected from Dashboard
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      const response = await CampusAIAgent.processMessage(query, newHistory);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `I encountered an issue retrieving data from the campus service mesh. Please try again or check connection.`,
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmTicket = (msgId: string) => {
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg || !targetMsg.actionCard) return;

    const draft = targetMsg.actionCard.draft;
    // Create real ticket in unified campus store
    const ticket = store.createHelpdeskTicket({
      title: draft.title,
      description: draft.description,
      location: draft.location,
      category: draft.category,
      priority: draft.priority
    });

    // Update message state in-place
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          actionCard: {
            ...m.actionCard!,
            status: 'confirmed',
            createdTicketId: ticket.id
          }
        };
      }
      return m;
    }));

    // Post AI confirmation in the stream
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `confirm-msg-${Date.now()}`,
          sender: 'assistant',
          text: `✓ **Ticket Created Successfully!**\n\n- **Ticket ID:** \`${ticket.id}\`\n- **Category:** ${ticket.category}\n- **Location:** ${ticket.location}\n- **Status:** **Pending** *(Assigned to Facilities Maintenance)*\n\nThe issue has been registered in the campus queue. You can monitor progress anytime under **Helpdesk ➔ My Tickets**.`,
          timestamp: 'Just now',
          dataSources: ['Helpdesk System']
        }
      ]);
    }, 400);
  };

  const handleCancelTicket = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.actionCard) {
        return {
          ...m,
          actionCard: {
            ...m.actionCard,
            status: 'cancelled'
          }
        };
      }
      return m;
    }));
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared. I am ready for your next campus query.`,
        timestamp: 'Just now',
        dataSources: ['CampusOS Live Service Mesh']
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.5rem)] max-w-5xl mx-auto animate-fade-in">
      
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-4 flex items-center justify-between border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">CampusOS AI</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Service Mesh
              </span>
            </div>
            <p className="text-xs text-slate-400">Your intelligent campus companion.</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Clear chat history"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* CONVERSATION THREAD */}
      {/* ============================================================ */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
        {messages.map((msg) => {
          const isAI = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-2xl flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
                
                {/* Bubble Container */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    isAI
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm shadow-glow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    {renderFormattedContent(msg.text)}
                  </div>

                  {/* Recommendation Cards if present */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-slate-800/80">
                      {msg.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                              {rec.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                              {rec.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            {rec.description}
                          </p>
                          <div className="mt-2 text-[11px] text-blue-300/90 italic bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                            💡 <strong>Why it was recommended:</strong> {rec.reason}
                          </div>
                          {rec.actionTarget && (
                            <button
                              onClick={() => onNavigate(rec.actionTarget!.view, { tab: rec.actionTarget!.tab })}
                              className="mt-2.5 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                              <span>{rec.actionText || 'View Details'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Confirmation Card (Ticket Creation) */}
                  {msg.actionCard && msg.actionCard.type === 'create_ticket' && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-blue-500/40 shadow-glow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-3 uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        <span>Create Helpdesk Ticket?</span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-300 mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Issue:</span>
                          <span className="font-semibold text-white">{msg.actionCard.draft.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Location:</span>
                          <span className="font-semibold text-white">{msg.actionCard.draft.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Category:</span>
                          <span className="font-semibold text-white">{msg.actionCard.draft.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Priority:</span>
                          <span className="font-semibold text-amber-400">{msg.actionCard.draft.priority}</span>
                        </div>
                      </div>

                      {msg.actionCard.status === 'pending_confirmation' && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleCancelTicket(msg.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmTicket(msg.id)}
                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Create Ticket</span>
                          </button>
                        </div>
                      )}

                      {msg.actionCard.status === 'confirmed' && (
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Ticket Created: {msg.actionCard.createdTicketId}
                          </span>
                          <button
                            onClick={() => onNavigate('helpdesk', { tab: 'tickets', id: msg.actionCard?.createdTicketId })}
                            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                          >
                            <span>Open in Helpdesk</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {msg.actionCard.status === 'cancelled' && (
                        <div className="text-xs text-slate-500 italic">
                          Action cancelled by student.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata & Transparent Data Source Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 px-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {msg.timestamp}
                  </span>

                  {isAI && msg.dataSources && msg.dataSources.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                      <Database className="w-2.5 h-2.5 text-blue-400" />
                      <span>Based on: {msg.dataSources.join(' · ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 items-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 rounded-tl-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 ml-1">Consulting campus data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ============================================================ */}
      {/* QUICK SUGGESTION PILLS */}
      {/* ============================================================ */}
      <div className="overflow-x-auto pb-2 flex items-center gap-2 no-scrollbar shrink-0">
        {[
          "Can I skip tomorrow's DBMS class?",
          "Why is my attendance low?",
          "I have 2 hours before my next class. Help me decide what to do.",
          "The AC in Room 204 isn't working.",
          "What is my next class?",
          "Find me somewhere to study.",
          "What do I need to complete this week?"
        ].map((promptText, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(promptText)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>{promptText}</span>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* INPUT FORM */}
      {/* ============================================================ */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask CampusOS AI or request an action... (e.g. 'Room 204 AC is broken')"
            className="w-full pl-4 pr-14 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-lg"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-sm transition-all"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

function renderFormattedContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const isQuote = line.trim().startsWith('>');
    const cleanLine = isQuote ? line.replace(/^>\s*/, '') : line;

    // Parse bold, italic, and inline code
    const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    const content = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIdx} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={partIdx} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={partIdx} className="px-1.5 py-0.5 rounded bg-slate-950 text-blue-300 font-mono text-xs border border-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    if (isQuote) {
      return (
        <div key={lineIdx} className="border-l-2 border-amber-500/70 pl-3 py-1 my-1.5 bg-amber-500/10 rounded-r text-xs text-amber-200">
          {content}
        </div>
      );
    }

    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-0.5 pl-1 text-slate-200">
          <span className="text-blue-400 mt-1 text-xs">•</span>
          <span className="flex-1">{content}</span>
        </div>
      );
    }

    if (line.trim() === '') {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return (
      <p key={lineIdx} className="my-0.5 text-slate-200">
        {content}
      </p>
    );
  });
}
