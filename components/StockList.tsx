import React from 'react';
import { Stock } from '../types';
import { Search, ChevronRight } from 'lucide-react';

interface StockListProps {
  stocks: Stock[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

const StockList: React.FC<StockListProps> = ({ stocks, selectedSymbol, onSelect }) => {
  return (
    <div className="w-full md:w-80 bg-slate-800/50 border-r border-slate-700/50 flex flex-col h-full backdrop-blur-sm">
      <div className="p-4 border-b border-slate-700/50">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search symbol..." 
                className="w-full bg-slate-900 text-slate-200 text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {stocks.map((stock) => {
            const isPositive = stock.change >= 0;
            const isSelected = selectedSymbol === stock.symbol;

            return (
                <button
                    key={stock.symbol}
                    onClick={() => onSelect(stock.symbol)}
                    className={`w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-all border-b border-slate-700/30 ${isSelected ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                >
                    <div className="text-left">
                        <h4 className={`font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-200'}`}>{stock.symbol}</h4>
                        <span className="text-xs text-slate-500">{stock.name}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-200 font-mono text-sm">₹{stock.currentPrice.toFixed(2)}</p>
                        <p className={`text-xs font-mono flex items-center justify-end gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </p>
                    </div>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default StockList;