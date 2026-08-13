import React, { useEffect, useState } from 'react';
import { BookOpen, Upload, Trash2, Search, FileText, CheckCircle2, Cpu, Sparkles, Loader2, MessageSquare, Bot, Sliders, Settings, Check, RefreshCw } from 'lucide-react';
import { RagDocument, SearchCitation } from '../types';

interface RagKnowledgePageProps {
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export const RagKnowledgePage: React.FC<RagKnowledgePageProps> = ({ 
  selectedModel = 'Gemini 2.5 Flash',
  onModelChange 
}) => {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<SearchCitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Hyperparameter State
  const [model, setModel] = useState(selectedModel);
  const [temperature, setTemperature] = useState(0.2);
  const [topK, setTopK] = useState(20);
  const [topP, setTopP] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemInstruction, setSystemInstruction] = useState(
    'You are an expert TLC Data Analyst and RAG AI Assistant. Provide precise, grounded answers based on the retrieved knowledge context and TLC dataset statistics.'
  );
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      setModel(selectedModel);
    }
  }, [selectedModel]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/rag/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
      setTotalChunks(data.totalChunks || 0);
    } catch (err) {
      console.error('Failed to load RAG documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/rag/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error('Delete document error:', err);
    }
  };

  const handleSaveConfig = () => {
    if (onModelChange) {
      onModelChange(model);
    }
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const executeRagQuery = async (queryToRun?: string) => {
    const q = queryToRun || searchQuery;
    if (!q.trim()) return;

    try {
      setIsSearching(true);
      setAiAnswer(null);
      setCitations([]);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: q,
          model,
          temperature,
          topK,
          topP,
          maxTokens,
          systemInstruction
        })
      });
      const data = await res.json();
      setAiAnswer(data.text || 'No response generated.');
      setCitations(data.citations || []);
    } catch (err) {
      console.error('RAG test search error:', err);
      setAiAnswer('Failed to retrieve response from AI RAG engine.');
    } finally {
      setIsSearching(false);
    }
  };

  const geminiModels = [
    { name: 'Gemini 2.5 Flash', desc: 'Recommended • Ultra Fast Multimodal' },
    { name: 'Gemini 2.5 Pro', desc: 'Advanced Spatial & Analytical Reasoning' },
    { name: 'Gemini 2.0 Flash', desc: 'Ultra Low Latency Streaming' },
    { name: 'Gemini 2.0 Flash Thinking', desc: 'Chain-of-Thought Deep Analysis' },
    { name: 'Gemini 1.5 Pro', desc: '1M Token Large Document Context' },
    { name: 'Gemini 1.5 Flash', desc: 'Lightweight Production Scale' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Vector Search & AI Model Hyperparameters</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            RAG Knowledge Base & AI Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ground Gemini AI models in TLC data dictionaries, Kaggle dataset guidelines, base license codes, and tune Temperature, Top-K, Top-P, and system instructions in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Vector Index:</span>
            <span className="font-bold text-emerald-400">Ready ({totalChunks} Chunks)</span>
          </div>
        </div>
      </div>

      {/* COMBINED HYPERPARAMETER CONFIGURATION & MODEL SELECTOR */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Gemini AI Engine Hyperparameter Tuning</span>
          </h3>
          <button
            onClick={handleSaveConfig}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
          >
            {savedStatus ? <Check className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
            <span>{savedStatus ? 'Config Saved!' : 'Apply Model Config'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">Active Gemini Model</label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                if (onModelChange) onModelChange(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              {geminiModels.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name} — {m.desc}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 block leading-tight">
              Switching model updates reasoning engine for RAG search & AI Data Analyst.
            </span>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Temperature (Creativity)</span>
              <span className="font-mono text-indigo-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Low values (0.1 - 0.2) give deterministic factual RAG grounding.
            </span>
          </div>

          {/* Top-K Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Top-K Vector Retrieval Depth</span>
              <span className="font-mono text-indigo-400">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Number of vector chunks considered during document retrieval.
            </span>
          </div>

          {/* Top-P Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Top-P Nucleus Sampling</span>
              <span className="font-mono text-indigo-400">{topP}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Cumulative probability cutoff for candidate tokens.
            </span>
          </div>

          {/* Max Output Tokens Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Max Generation Tokens</span>
              <span className="font-mono text-indigo-400">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Maximum response length per generation pass.
            </span>
          </div>

          {/* System Instructions */}
          <div className="space-y-1.5 lg:col-span-3">
            <label className="text-slate-300 font-bold block">System Persona & RAG Prompt Instruction</label>
            <textarea
              rows={2}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Indexed Documents Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Indexed Knowledge Documents</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-4 text-xs shadow-md hover:border-slate-700 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{doc.title}</h4>
                  <p className="text-slate-400 font-mono text-[11px] mt-0.5">{doc.filename}</p>

                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500 font-semibold">
                    <span className="text-indigo-300">{doc.chunkCount} Vector Chunks</span>
                    <span>•</span>
                    <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span className="uppercase text-emerald-400">{doc.type}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(doc.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Remove document from RAG index"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive RAG Vector Retrieval Test Console */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div>
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Ask Any RAG Knowledge Question</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Type any question below. The RAG engine uses selected Gemini model (<b>{model}</b>) with <b>Top-K={topK}</b> vector chunks and <b>Temp={temperature}</b>.
          </p>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') executeRagQuery();
            }}
            placeholder="Ask any question (e.g. 'What is Base B02512', 'How is fare calculated', 'Explain surge rules')..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium"
          />
          <button
            onClick={() => executeRagQuery()}
            disabled={isSearching}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isSearching ? 'Querying RAG...' : 'Ask RAG AI'}</span>
          </button>
        </div>

        {/* Generated Answer Display */}
        {aiAnswer && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs border-b border-slate-800/80 pb-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Grounded AI RAG Response ({model})</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed space-y-2 filesystem-content whitespace-pre-wrap font-sans">
              {aiAnswer}
            </div>
          </div>
        )}

        {/* Citations Display */}
        {citations.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Retrieved Top-K Knowledge Vector Chunks & Citations
            </span>
            <div className="space-y-2">
              {citations.map((c, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-bold text-indigo-300 mb-1">
                    <span>{c.documentName} ({c.section})</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Relevance Score: {Math.round(c.relevanceScore * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{c.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
