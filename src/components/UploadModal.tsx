import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'dataset' | 'rag'>('dataset');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = uploadType === 'dataset' ? '/api/dataset/upload' : '/api/rag/upload';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          text: uploadType === 'dataset' 
            ? `Successfully uploaded and profiled "${file.name}" (${data.metadata?.rowCount.toLocaleString() || '0'} rows)!` 
            : `Successfully indexed documentation file "${file.name}" into RAG Vector Store!`
        });
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 1500);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to process uploaded file.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Network error during upload.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-400" />
          <span>Upload File to Cloud Server</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload an Uber CSV/XLSX trip dataset to the cloud server for analysis or documentation for RAG search.
        </p>

        {/* Upload Type Switcher */}
        <div className="flex p-1 my-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => { setUploadType('dataset'); setFile(null); }}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              uploadType === 'dataset'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Uber Dataset (CSV / XLSX)
          </button>
          <button
            onClick={() => { setUploadType('rag'); setFile(null); }}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              uploadType === 'rag'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RAG Documentation (TXT / PDF)
          </button>
        </div>

        {/* Drop Zone */}
        <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-950/50 hover:bg-slate-950 transition-all cursor-pointer">
          <input
            type="file"
            accept={uploadType === 'dataset' ? '.csv,.xlsx,.xls' : '.txt,.pdf,.doc,.docx'}
            onChange={handleFileChange}
            className="hidden"
          />
          <FileText className="w-10 h-10 text-indigo-400/80 mb-2" />
          <span className="text-xs font-semibold text-slate-200">
            {file ? file.name : `Click or drag ${uploadType === 'dataset' ? 'Uber dataset (.csv, .xlsx)' : 'Documentation (.txt, .pdf)'}`}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">
            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Max size 25MB • Cloud Server Sync'}
          </span>
        </label>

        {/* Status Messages */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isUploading ? 'Ingesting File...' : 'Upload & Process'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
