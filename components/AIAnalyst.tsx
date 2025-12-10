import React from 'react';
import { Bot, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';
import { AIAnalysisResult, Stock } from '../types';

interface AIAnalystProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  stockName: string;
  onAnalyze: () => void;
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ analysis, loading, stockName, onAnalyze }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm p-6 shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">TradeMaster AI Analyst</h3>
            <p className="text-xs text-slate-400">AI-Powered Technicals</p>
          </div>
        </div>
        {!analysis && !loading && (
             <button 
             onClick={onAnalyze}
             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
           >
             Analyze Now
           </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm animate-pulse">Scanning chart patterns...</p>
        </div>
      ) : !analysis ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[200px] border-2 border-dashed border-slate-700 rounded-lg">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50"/>
            <p className="text-sm">Select a stock and click Analyze</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Signal Header */}
          <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Recommendation</p>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                analysis.action === 'BUY' ? 'text-green-400' : 
                analysis.action === 'SELL' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {analysis.action}
                {analysis.action === 'BUY' && <TrendingUp className="w-6 h-6" />}
                {analysis.action === 'SELL' && <TrendingDown className="w-6 h-6" />}
                {analysis.action === 'HOLD' && <Minus className="w-6 h-6" />}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Confidence</p>
              <div className="text-xl font-mono font-medium text-white">
                {analysis.confidence}%
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <p className="text-sm text-slate-400 mb-2 font-medium">Technical Reasoning:</p>
            <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/30 p-3 rounded border-l-2 border-indigo-500">
              "{analysis.reasoning}"
            </p>
          </div>

          {/* Key Levels */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-900/10 p-3 rounded border border-red-900/20">
              <p className="text-xs text-red-400 uppercase font-bold mb-2">Resistance</p>
              <div className="flex flex-wrap gap-2">
                {analysis.resistanceLevels.length > 0 ? analysis.resistanceLevels.map((val, idx) => (
                    <span key={idx} className="text-xs font-mono bg-red-500/10 text-red-300 px-2 py-1 rounded">
                        ₹{val}
                    </span>
                )) : <span className="text-xs text-slate-500">None detected</span>}
              </div>
            </div>
            <div className="bg-green-900/10 p-3 rounded border border-green-900/20">
              <p className="text-xs text-green-400 uppercase font-bold mb-2">Support</p>
              <div className="flex flex-wrap gap-2">
                {analysis.supportLevels.length > 0 ? analysis.supportLevels.map((val, idx) => (
                    <span key={idx} className="text-xs font-mono bg-green-500/10 text-green-300 px-2 py-1 rounded">
                        ₹{val}
                    </span>
                )) : <span className="text-xs text-slate-500">None detected</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalyst;