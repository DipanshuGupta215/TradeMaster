import React from 'react';
import { MoneyFluxItem } from '../types';

interface MoneyFluxProps {
  items: MoneyFluxItem[];
}

const MoneyFlux: React.FC<MoneyFluxProps> = ({ items }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm shadow-xl mt-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
            Money Flux
        </h3>
        <p className="text-slate-400 text-sm">Find stocks where operators are active and building positions to guide index movement.</p>
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 h-[450px]">
        {items.map((item, idx) => {
           const isPositive = item.strength >= 0;
           // Calculate opacity based on strength absolute value (max 1)
           const opacity = Math.min(Math.abs(item.strength) / 10 + 0.3, 1); 
           const bgColor = isPositive 
             ? `rgba(34, 197, 94, ${opacity})` // Green
             : `rgba(239, 68, 68, ${opacity})`; // Red
            
           // Determine span based on volume weight to create TreeMap effect
           let colSpan = 'col-span-1';
           let rowSpan = 'row-span-1';
           
           if (item.volumeWeight >= 9) { colSpan = 'col-span-2 md:col-span-3'; rowSpan = 'row-span-2'; }
           else if (item.volumeWeight >= 7) { colSpan = 'col-span-2'; rowSpan = 'row-span-2'; }
           else if (item.volumeWeight >= 5) { colSpan = 'col-span-2'; rowSpan = 'row-span-1'; }

           return (
            <div 
                key={item.symbol} 
                className={`${colSpan} ${rowSpan} relative rounded border border-slate-900/20 p-3 transition-all hover:scale-[1.01] hover:z-10 cursor-pointer group flex flex-col justify-center items-center text-center overflow-hidden`}
                style={{ backgroundColor: bgColor }}
            >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                
                <div className="relative z-10">
                    <h4 className="font-bold text-white text-shadow-sm text-xs md:text-sm tracking-tight mb-0.5">
                        {item.symbol}
                    </h4>
                    <span className="text-[10px] md:text-xs font-mono text-white/90 font-semibold bg-black/20 px-1.5 py-0.5 rounded">
                        {item.priceChange > 0 ? '+' : ''}{item.priceChange.toFixed(2)}%
                    </span>
                </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default MoneyFlux;