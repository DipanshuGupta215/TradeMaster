import React from 'react';
import { ScannerItem } from '../types';
import { Plus, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface ScannerTableProps {
  title: string;
  description: string;
  data: ScannerItem[];
  primaryLabel: string; // Header for the value column (e.g. "% Change")
  secondaryLabel?: string; // Header for secondary column (e.g. "R.Fac", "Time")
  colorAccent?: 'blue' | 'purple' | 'orange' | 'green' | 'red';
}

const ScannerTable: React.FC<ScannerTableProps> = ({ 
    title, 
    description, 
    data, 
    primaryLabel, 
    secondaryLabel,
    colorAccent = 'blue' 
}) => {

  const accentColors = {
      blue: 'text-blue-400 border-blue-500/50',
      purple: 'text-purple-400 border-purple-500/50',
      orange: 'text-orange-400 border-orange-500/50',
      green: 'text-green-400 border-green-500/50',
      red: 'text-red-400 border-red-500/50',
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-full hover:border-slate-600 transition-colors">
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/20">
        <div className="flex items-start justify-between mb-2">
            <h3 className={`font-bold text-lg ${accentColors[colorAccent].split(' ')[0]}`}>{title}</h3>
            <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-bold animate-pulse">LIVE</span>
                <Info size={16} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
            </div>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[2.5em]">{description}</p>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-800/60 text-[10px] uppercase text-slate-500 font-bold sticky top-0 backdrop-blur-md z-10">
            <div className="col-span-5">Symbol</div>
            <div className="col-span-2 text-center">Sig</div>
            <div className="col-span-3 text-right">{primaryLabel}</div>
            <div className="col-span-2 text-right">{secondaryLabel || 'Action'}</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-700/30">
            {data.length === 0 ? (
                <div className="p-8 text-center text-slate-600 text-xs italic">
                    No stocks matching criteria...
                </div>
            ) : (
                data.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-700/20 items-center transition-colors group">
                        <div className="col-span-5 flex items-center gap-2">
                            <div className={`w-1 h-6 rounded-full ${item.signal === 'BULL' ? 'bg-green-500' : item.signal === 'BEAR' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                            <div>
                                <span className="text-sm font-bold text-slate-200 block leading-tight">{item.symbol}</span>
                                {item.badge && <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300">{item.badge}</span>}
                            </div>
                        </div>
                        
                        <div className="col-span-2 flex justify-center">
                             {item.signal === 'BULL' ? (
                                 <ArrowUpRight size={16} className="text-green-400" />
                             ) : item.signal === 'BEAR' ? (
                                 <ArrowDownRight size={16} className="text-red-400" />
                             ) : (
                                 <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                             )}
                        </div>

                        <div className="col-span-3 text-right">
                             <div className={`font-mono text-sm font-medium ${
                                 typeof item.value === 'number' 
                                    ? item.value > 0 ? 'text-green-400' : item.value < 0 ? 'text-red-400' : 'text-slate-400'
                                    : 'text-slate-200'
                             }`}>
                                 {typeof item.value === 'number' && item.value > 0 ? '+' : ''}{item.value}
                                 {typeof item.value === 'number' ? '%' : ''}
                             </div>
                        </div>

                        <div className="col-span-2 text-right">
                            {item.secondaryValue ? (
                                <span className="text-xs text-slate-500 font-mono">{item.secondaryValue}</span>
                            ) : (
                                <button className="p-1 hover:bg-indigo-600 rounded bg-slate-700 text-white transition-colors">
                                    <Plus size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default ScannerTable;