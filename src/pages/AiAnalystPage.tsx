import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, RefreshCw, Code, BookOpen, BarChart3, HelpCircle } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { ChatMessage } from '../components/ChatMessage';

export const AiAnalystPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am **Ride Analytics Dashboard**, your autonomous AI Data Analyst.

I can inspect your TLC ride-hailing dataset, calculate statistical aggregations with Pandas & SQL, retrieve TLC rules & documentation using RAG, and generate interactive visualizations.

**How can I help you analyze your Uber dataset today?**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: '📈 Highest Demand Month', query: 'Which month had the highest number of trips?' },
    { label: '📍 Top Pickup Hubs', query: 'Show top 5 pickup locations by trip count and fare revenue.' },
    { label: '📖 TLC Base Code Meaning', query: 'What does TLC Base B02512 mean and how is fare calculated?' },
    { label: '📊 Hourly Commute Peak', query: 'Show me hourly trip demand distribution.' },
    { label: '💻 SQL Query Execution', query: 'Execute SQL query to get total trips and average fare by payment type.' },
    { label: '🔍 Complex Cause Analysis', query: 'Why did trip demand increase significantly during June?' }
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages
        })
      });

      const data: ChatMessageType = await response.json();
      setMessages(prev => [...prev, data]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessageType = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I encountered an error connecting to the analytical agent engine. Please ensure your query is formatted properly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-950 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>AI Data Analyst Agent</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active & Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">Pandas Dataframes + Safe Read-Only SQL + Vector RAG Retrieval</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 my-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-400 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>Analyzing dataset, routing tools & generating evidence-backed response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="pt-2 pb-3 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          <HelpCircle className="w-3 h-3 text-amber-400" />
          <span>Suggested Questions for AI Data Analyst</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp.query)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="shrink-0 relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-amber-500/50 transition-all shadow-lg"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your dataset (e.g., 'Show monthly demand trend', 'Execute SQL for average fare')..."
            disabled={isLoading}
            className="flex-1 bg-transparent px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 transition-colors cursor-pointer shrink-0 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
