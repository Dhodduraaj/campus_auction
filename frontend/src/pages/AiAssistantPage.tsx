import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { ListingCard, AiBidConfirmation } from '../types';
import { AuctionCard } from '../components/auction/AuctionCard';
import { formatCurrency } from '../utils/currency';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AiAssistantPageProps {
  onNavigate: (page: string, params?: any) => void;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: ListingCard[];
  bidConfirmation?: AiBidConfirmation;
  bidPlaced?: boolean;
}

const EXAMPLE_PROMPTS = [
  'Find a cycle under ₹2,000',
  'Show calculators closing soon',
  'Compare the cheapest textbooks',
  'Which auctions fit my budget of ₹1,500?',
  'Show me items with fewer than 5 minutes left',
  'Help me bid on this cycle up to ₹1,800',
];

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your Campus Auction AI Assistant. I can help you discover items, analyze prices, compare textbooks, and prepare verified bids grounded in real campus listings.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingAuthToken, setConfirmingAuthToken] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setActionError(null);
    setInputText('');

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await aiService.chat(text, history);

      const assistantMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        recommendations: response.recommendations,
        bidConfirmation: response.bidConfirmation,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          err?.message ||
          'Sorry, I could not retrieve auction records right now. Please try again or browse the marketplace directly.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBid = async (msgId: string, authToken: string) => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }

    if (user?.role === 'SENIOR') {
      setActionError('Seniors are restricted from bidding. Only Junior accounts may place bids.');
      return;
    }

    setConfirmingAuthToken(authToken);
    setActionError(null);

    try {
      const res = await aiService.confirmBid(authToken);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              bidPlaced: true,
              content: `${m.content}\n\n✅ Bid confirmed! You placed a bid of ₹${res.amount} on listing #${res.listingId}.`,
              bidConfirmation: undefined,
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit bid confirmation.');
    } finally {
      setConfirmingAuthToken(null);
    }
  };

  const handleCancelBid = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            bidConfirmation: undefined,
            content: `${m.content}\n\n❌ Bid preparation cancelled by user.`,
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              AI Auction Assistant
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                Grounded Search
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real database prices, natural language constraints, and explicit bid approvals.
            </p>
          </div>
        </div>

        {user?.role === 'SENIOR' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5" />
            Seller account: Browsing mode
          </span>
        )}
      </div>

      {/* Action Error Banner if any */}
      {actionError && (
        <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-lg text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-600 text-white rounded-br-none shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none shadow-sm space-y-3'
              }`}
            >
              {/* Text Body */}
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Grounded Recommended Auction Cards */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Matching Campus Auctions ({msg.recommendations.length})</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      Authoritative DB Records
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {msg.recommendations.map((card) => (
                      <div key={card.id} className="scale-95 origin-top-left">
                        <AuctionCard
                          listing={card}
                          onClick={() => onNavigate('listing-detail', { id: card.id })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicit Bid Confirmation Card */}
              {msg.bidConfirmation && (
                <div className="mt-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500/80 dark:border-amber-500/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Explicit Bid Authorization Required
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold">
                      ONE-TIME CONFIRMATION
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {msg.bidConfirmation.listingTitle} (Auction #{msg.bidConfirmation.listingId})
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block">Current Bid</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(msg.bidConfirmation.currentHighestBid)}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block">Exact Bid to Submit</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(msg.bidConfirmation.exactBidAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>Authorized Maximum: <strong>{formatCurrency(msg.bidConfirmation.maxAuthorizedAmount)}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires in 5 minutes
                      </span>
                    </div>
                  </div>

                  {/* Confirmation Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled={confirmingAuthToken === msg.bidConfirmation.authToken}
                      onClick={() => handleConfirmBid(msg.id, msg.bidConfirmation!.authToken)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-2 rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {confirmingAuthToken === msg.bidConfirmation.authToken ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirm Bid ({formatCurrency(msg.bidConfirmation.exactBidAmount)})</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCancelBid(msg.id)}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold uppercase">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>Checking active campus auctions and ranking results...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Suggestions:
        </span>
        {EXAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <span>{prompt}</span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask anything: e.g. 'Find a cycle under ₹2000' or 'Compare cheapest textbooks'..."
          disabled={loading}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
