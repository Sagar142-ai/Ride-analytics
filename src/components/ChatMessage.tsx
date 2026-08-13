import React, { useState } from 'react';
import { Bot, User, Code, FileText, Copy, Check } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { ToolProgress } from './ToolProgress';
import { ChartCard } from './ChartCard';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    if (message.sqlQuery) {
      navigator.clipboard.writeText(message.sqlQuery);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
        isUser
          ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-md'
          : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1 text-[10px] opacity-70">
          <span className="font-semibold">{isUser ? 'You' : 'Ride Analytics Agent'}</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Message Content */}
        <div className="whitespace-pre-wrap space-y-2 font-sans text-slate-200">
          {message.text}
        </div>

        {/* Tool Progress Execution Status */}
        {!isUser && message.toolSteps && <ToolProgress steps={message.toolSteps} />}

        {/* SQL Query Viewer */}
        {!isUser && message.sqlQuery && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 mb-1.5 pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-sans text-[10px] uppercase font-semibold text-indigo-300">Executed SQL Query</span>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-amber-300 overflow-x-auto p-1 leading-relaxed">{message.sqlQuery}</pre>
          </div>
        )}

        {/* Embedded Interactive Chart */}
        {!isUser && message.chartConfig && (
          <div className="mt-4 p-2 rounded-xl bg-slate-950 border border-slate-800">
            <ChartCard
              title={message.chartConfig.title}
              type={message.chartConfig.type}
              data={message.chartConfig.data}
              xAxisKey={message.chartConfig.xAxisKey}
              yAxisKey={message.chartConfig.yAxisKey}
              height={220}
            />
          </div>
        )}

        {/* RAG Documentation Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Documentation Citations</span>
            </div>
            <div className="space-y-1.5">
              {message.citations.map((c, i) => (
                <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between font-semibold text-indigo-300 mb-0.5">
                    <span>{c.documentName} ({c.section})</span>
                    <span className="text-[10px] font-mono text-slate-500">{Math.round(c.relevanceScore * 100)}% match</span>
                  </div>
                  <p className="text-slate-400 text-[10px] line-clamp-2">{c.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-sm">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

