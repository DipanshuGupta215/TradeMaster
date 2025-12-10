import React from 'react';
import { SectorData } from '../types';

interface SectorScopeProps {
  sectors: SectorData[];
}

const SectorScope: React.FC<SectorScopeProps> = ({ sectors }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
            Sector Scope
        </h3>
        <p className="text-slate-400 text-sm">Real-time heat map of market sectors driving momentum.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 h-[400px]">
        {sectors.map((sector, idx) => {
           const isPositive = sector.performance >= 0;
           // Calculate dynamic classes based on performance magnitude
           const opacity = Math.min(Math.abs(sector.performance) / 3 + 0.2, 1); 
           const bgColor = isPositive 
             ? `rgba(34, 197, 94, ${opacity})` // Green
             : `rgba(239, 68, 68, ${opacity})`; // Red
            
            // Randomized span for visual variety (simulating TreeMap sizing)
           const colSpan = sector.marketCapWeight > 7 ? 'md:col-span-2 md:row-span-2' : 'col-span-1';

           return (
            <div 
                key={sector.name} 
                className={`${colSpan} relative rounded-lg border border-slate-900/10 p-4 transition-all hover:scale-[1.02] cursor-pointer group flex flex-col justify-between overflow-hidden`}
                style={{ backgroundColor: bgColor }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none" />
                
                <div className="relative z-10">
                    <h4 className="font-bold text-white text-shadow-sm uppercase tracking-wider text-xs md:text-sm truncate">
                        {sector.name}
                    </h4>
                    <p className="text-white font-mono font-bold text-lg">
                        {sector.performance > 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                    </p>
                </div>

                <div className="relative z-10 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] text-white/90">
                        <div className="flex justify-between">
                            <span>Top: {sector.topGainer}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Low: {sector.topLoser}</span>
                        </div>
                    </div>
                </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default SectorScope;