import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { Stock, AIAnalysisResult } from '../types';

interface StockChartProps {
  data: Stock['data'];
  color: string;
  analysis: AIAnalysisResult | null;
  symbol: string; // Added symbol prop
}

const StockChart: React.FC<StockChartProps> = ({ data, color, analysis, symbol }) => {
  
  // Transform data for Candlestick + Volume rendering
  const chartData = useMemo(() => {
    return data.map(d => {
      const isBullish = d.price >= d.open;
      return {
        ...d,
        // Range for the candle body: [min, max]
        body: [Math.min(d.open, d.price), Math.max(d.open, d.price)], 
        // Range for the wick: [low, high]
        wick: [d.low, d.high],
        // Color for this candle
        color: isBullish ? '#22c55e' : '#ef4444', // Green-500 : Red-500
        // Net change for tooltip
        netChange: d.price - d.open
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900/90 border border-slate-700 p-3 rounded shadow-xl backdrop-blur-md text-xs font-mono z-50">
          <p className="text-slate-400 mb-2 border-b border-slate-700 pb-1">{label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-slate-500">Open:</span>
            <span className="text-slate-200 text-right">₹{d.open.toFixed(2)}</span>
            
            <span className="text-slate-500">High:</span>
            <span className="text-slate-200 text-right">₹{d.high.toFixed(2)}</span>
            
            <span className="text-slate-500">Low:</span>
            <span className="text-slate-200 text-right">₹{d.low.toFixed(2)}</span>
            
            <span className="text-slate-500">Close:</span>
            <span className="text-slate-200 text-right">₹{d.price.toFixed(2)}</span>
            
            <span className="text-slate-500">Vol:</span>
            <span className="text-yellow-500 text-right">{(d.volume / 1000).toFixed(1)}k</span>
            
            <span className="text-slate-500">Chg:</span>
            <span className={`text-right ${d.netChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {d.netChange > 0 ? '+' : ''}{d.netChange.toFixed(2)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[500px] w-full bg-slate-800/50 rounded-xl border border-slate-700/50 p-1 backdrop-blur-sm shadow-xl flex flex-col">
      {/* Chart Header - TradingView Style */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700/30">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                 <h3 className="text-white text-md font-bold tracking-wide">{symbol}</h3>
                 <span className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded">NSE</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-2">
                 <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                 </span>
                 <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Market Open</span>
            </div>
        </div>
        <div className="flex gap-2">
            <button className="px-2 py-1 rounded hover:bg-slate-700 text-xs text-indigo-400 font-bold font-mono transition-colors">15m</button>
            <button className="px-2 py-1 rounded hover:bg-slate-700 text-xs text-slate-400 font-mono transition-colors">1H</button>
            <button className="px-2 py-1 rounded hover:bg-slate-700 text-xs text-slate-400 font-mono transition-colors">4H</button>
            <button className="px-2 py-1 rounded hover:bg-slate-700 text-xs text-slate-400 font-mono transition-colors">1D</button>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={true} horizontal={true} />
            
            <XAxis 
              dataKey="time" 
              xAxisId="main"
              stroke="#64748b" 
              tick={{fontSize: 10, fill: '#64748b'}} 
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            
            {/* Hidden Axis for overlay alignment */}
            <XAxis 
              dataKey="time" 
              xAxisId="overlay" 
              hide 
            />

            {/* Price Axis (Right) */}
            <YAxis 
              yAxisId="price"
              domain={['auto', 'auto']} 
              orientation="right" 
              stroke="#64748b" 
              tick={{fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8'}} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toFixed(0)}`}
              width={50}
            />
            
            {/* Volume Axis (Left, Hidden or minimized) */}
            <YAxis 
              yAxisId="volume"
              domain={[0, 'dataMax * 4']} 
              orientation="left" 
              hide
            />

            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4', opacity: 0.5 }}
              isAnimationActive={false} // Disable animation for snappier feel
            />

            {/* --- VOLUME BARS --- */}
            <Bar 
                dataKey="volume" 
                yAxisId="volume" 
                xAxisId="main" 
                barSize={4} 
                opacity={0.3}
            >
                {chartData.map((entry, index) => (
                    <Cell key={`vol-${index}`} fill={entry.color} />
                ))}
            </Bar>

            {/* --- CANDLE WICKS (Thin Bar from Low to High) --- */}
            <Bar 
                dataKey="wick" 
                yAxisId="price" 
                xAxisId="main" 
                barSize={1} // Thin wick
            >
                {chartData.map((entry, index) => (
                    <Cell key={`wick-${index}`} fill={entry.color} />
                ))}
            </Bar>

            {/* --- CANDLE BODIES (Thick Bar from Open to Close) --- */}
            <Bar 
                dataKey="body" 
                yAxisId="price" 
                xAxisId="overlay" 
                barSize={6} // Candle body width
            >
                {chartData.map((entry, index) => (
                    <Cell key={`body-${index}`} fill={entry.color} />
                ))}
            </Bar>
            
            {/* AI Levels */}
            {analysis && analysis.supportLevels.map((level, i) => (
               <ReferenceLine yAxisId="price" key={`sup-${i}`} y={level} stroke="#10b981" strokeDasharray="3 3" opacity={0.7} label={{ position: 'insideLeft', value: 'SUP', fill: '#10b981', fontSize: 9 }} />
            ))}
            {analysis && analysis.resistanceLevels.map((level, i) => (
               <ReferenceLine yAxisId="price" key={`res-${i}`} y={level} stroke="#ef4444" strokeDasharray="3 3" opacity={0.7} label={{ position: 'insideLeft', value: 'RES', fill: '#ef4444', fontSize: 9 }} />
            ))}

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;