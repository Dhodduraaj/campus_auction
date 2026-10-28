import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../../types';
import { conversationService } from '../../services/conversationService';
import { webSocketService } from '../../services/webSocketService';
import { X, Send, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId?: number;
  conversationId?: number;
}

export const ConversationModal: React.FC<ConversationModalProps> = ({
  isOpen,
  onClose,
  listingId,
  conversationId,
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      let conv: Conversation;
      if (conversationId) {
        conv = await conversationService.getConversationById(conversationId);
      } else if (listingId) {
        conv = await conversationService.getConversationByListing(listingId);
      } else {
        return;
      }
      setConversation(conv);

      const msgs = await conversationService.getMessages(conv.id);
      setMessages(msgs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load conversation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (listingId || conversationId)) {
      loadData();
    } else {
      setConversation(null);
      setMessages([]);
      setInputText('');
    }
  }, [isOpen, listingId, conversationId]);

  useEffect(() => {
    if (!conversation) return;

    webSocketService.connect();
    const unsubscribe = webSocketService.subscribe<Message>(
      `/topic/conversations/${conversation.id}`,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const sentMsg = await conversationService.sendMessage(conversation.id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conversation?.listingThumbnailUrl ? (
              <img
                src={conversation.listingThumbnailUrl}
                alt={conversation.listingTitle || 'Item'}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-orange-600/10 text-orange-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                {conversation?.listingTitle || 'Auction Chat'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Talking with <span className="font-semibold text-slate-700 dark:text-slate-200">{conversation?.otherPartyName || 'Participant'}</span>
                {conversation?.currentPrice && (
                  <span className="ml-1.5 font-mono text-emerald-600 dark:text-emerald-400">
                    ({formatCurrency(conversation.currentPrice)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={loadData}
              title="Refresh messages"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50 dark:bg-slate-950/40">
          {loading && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span>Loading conversation...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-lg">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mb-2 text-slate-400 opacity-60" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">Direct Campus Handover Chat</p>
              <p className="mt-1 max-w-xs">
                Discuss pickup time, preferred campus meeting location, and item verification directly.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.mine ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.mine
                      ? 'bg-orange-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  <p className="break-words leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to coordinate campus handover..."
            disabled={loading || !conversation}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending || !conversation}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
