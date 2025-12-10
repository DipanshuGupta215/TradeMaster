import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Wallet, LineChart, Bell, Settings, Menu, X, Activity, Radar, BarChart2, RefreshCw } from 'lucide-react';
import StockList from './components/StockList';
import StockChart from './components/StockChart';
import AIAnalyst from './components/AIAnalyst';
import ScannerDashboard from './components/ScannerDashboard';
import { Stock, StockDataPoint, AIAnalysisResult } from './types';
import { analyzeStockData, getRealMarketSnapshot, getBatchStockQuotes } from './services/geminiService';

// --- SMART MOCK DATA GENERATOR ---
// Generates a random walk chart that mathematically connects the Open Price to the Current Price
const generateSmartIntradayData = (currentPrice: number, change: number, points: number = 50): StockDataPoint[] => {
  const openPrice = currentPrice - change;
  const data: StockDataPoint[] = [];
  const now = new Date();
  
  let currentVal = openPrice;
  // Calculate a "drift" per step to ensure we end up near the current price
  const totalSteps = points;
  const targetDrift = change / totalSteps; 
  
  // Base volatility
  const volatility = currentPrice * 0.001; 

  let priceCursor = openPrice;
  
  for (let i = 0; i < points; i++) {
      // Logic: 
      // 1. Add target drift (trend)
      // 2. Add random noise
      // 3. Force the last point to be exactly currentPrice
      
      let noise = (Math.random() - 0.5) * volatility * 2;
      
      // As we get closer to the end, reduce noise and force convergence to currentPrice
      if (i > points - 5) {
          const remainingSteps = points - i;
          const diff = currentPrice - priceCursor;
          priceCursor += (diff / remainingSteps); 
          noise = noise * 0.1; // Reduce noise at the end
      } else {
          priceCursor += targetDrift + noise;
      }
      
      // Ensure we don't drift too wild
      const time = new Date(now.getTime() - (points - 1 - i) * 15 * 60000);
      
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: Number(priceCursor.toFixed(2)),
        open: Number((priceCursor - noise).toFixed(2)),
        high: Number((priceCursor + Math.abs(noise)).toFixed(2)),
        low: Number((priceCursor - Math.abs(noise)).toFixed(2)),
        volume: Math.floor(Math.random() * 50000) + 1000,
      });
  }
  
  // Hard fix last point to match current exactly
  if (data.length > 0) {
      data[data.length - 1].price = currentPrice;
      data[data.length - 1].open = data[data.length - 1].price - (Math.random() * volatility); // Fix open for last candle
  }
  
  return data;
};

// Initial Stocks List Structure (Data will be hydrated)
const WATCHLIST_SYMBOLS = [
    { s: 'RELIANCE', n: 'Reliance Industries', sec: 'Energy' },
    { s: 'TCS', n: 'Tata Consultancy Svcs', sec: 'IT' },
    { s: 'HDFCBANK', n: 'HDFC Bank Ltd', sec: 'Banking' },
    { s: 'INFY', n: 'Infosys Limited', sec: 'IT' },
    { s: 'TATAMOTORS', n: 'Tata Motors', sec: 'Auto' },
    { s: 'ADANIENT', n: 'Adani Enterprises', sec: 'Conglomerate' },
    { s: 'SBIN', n: 'State Bank of India', sec: 'Banking' }
];

const INITIAL_STOCKS: Stock[] = WATCHLIST_SYMBOLS.map(item => ({
    symbol: item.s,
    name: item.n,
    sector: item.sec,
    currentPrice: 0,
    change: 0,
    changePercent: 0,
    data: [] // will be filled
}));

const App: React.FC = () => {
  // Navigation State
  const [activeView, setActiveView] = useState<'TERMINAL' | 'SCANNERS'>('TERMINAL');

  const [selectedSymbol, setSelectedSymbol] = useState<string>(INITIAL_STOCKS[0].symbol);
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AIAnalysisResult>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [indices, setIndices] = useState({ nifty: 'Loading...', bank: 'Loading...' });
  const [loadingStocks, setLoadingStocks] = useState(true);

  const currentStock = useMemo(() => 
    stocks.find(s => s.symbol === selectedSymbol) || stocks[0], 
    [stocks, selectedSymbol]
  );

  const handleAIAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeStockData(currentStock);
      setAiAnalysis(prev => ({
        ...prev,
        [currentStock.symbol]: result
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to run analysis. Check API Key.");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchRealData = async () => {
        setLoadingStocks(true);
        
        // A. Get Indices
        const snap = await getRealMarketSnapshot();
        if(snap && snap.indices) {
            setIndices({ nifty: snap.indices.nifty, bank: snap.indices.bankNifty });
        }

        // B. Get Watchlist Prices
        const symbols = WATCHLIST_SYMBOLS.map(x => x.s);
        const quotes = await getBatchStockQuotes(symbols);
        
        if (quotes) {
            const updatedStocks = WATCHLIST_SYMBOLS.map(item => {
                const q = quotes[item.s] || { price: 1000, change: 0, percent: 0 }; // fallback
                return {
                    symbol: item.s,
                    name: item.n,
                    sector: item.sec,
                    currentPrice: q.price,
                    change: q.change,
                    changePercent: q.percent,
                    // Re-generate chart to end at new real price
                    data: generateSmartIntradayData(q.price, q.change)
                };
            });
            setStocks(updatedStocks);
        } else {
             // Keep existing if fail, just stop loading
             if(stocks[0].currentPrice === 0) {
                 // only fallback if we have no data
                 const fallbackStocks = WATCHLIST_SYMBOLS.map(item => ({
                    symbol: item.s,
                    name: item.n,
                    sector: item.sec,
                    currentPrice: 2000 + Math.random() * 500,
                    change: 15,
                    changePercent: 0.75,
                    data: generateSmartIntradayData(2000, 15)
                }));
                setStocks(fallbackStocks);
             }
        }
        setLoadingStocks(false);
  };

  // 1. Fetch Real Market Data on Mount
  useEffect(() => {
    fetchRealData();
  }, []);

  // 2. Simulate Live Ticks on top of Real Data
  useEffect(() => {
    const interval = setInterval(() => {
      if (loadingStocks) return;

      setStocks(prevStocks => prevStocks.map(stock => {
        // Subtle movement around the real price
        const lastPrice = stock.data[stock.data.length - 1].price;
        const volatility = lastPrice * 0.0002; // Very small tick movement
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = lastPrice + change;
        
        const newPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: Number(newPrice.toFixed(2)),
            open: Number(lastPrice),
            high: Number(Math.max(lastPrice, newPrice).toFixed(2)),
            low: Number(Math.min(lastPrice, newPrice).toFixed(2)),
            volume: Math.floor(Math.random() * 5000) + 100 // smaller volume for ticks
        };
        
        // Keep array size fixed
        const newData = [...stock.data.slice(1), newPoint];
        
        return {
            ...stock,
            currentPrice: Number(newPrice.toFixed(2)),
            data: newData
        };
      }));
    }, 2000); 

    return () => clearInterval(interval);
  }, [loadingStocks]);

  const isPositive = currentStock.change >= 0;

  return (
    <div className="flex h-screen w-full bg-[#0b1120] text-slate-200 overflow-hidden">
      
      {/* Mobile Drawer Toggle */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 shadow-2xl">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
                <Activity className="w-6 h-6 text-indigo-500 mr-2" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    TradeMaster
                </span>
            </div>
            
            {/* Main Navigation */}
            <div className="p-4 space-y-2 border-b border-slate-800">
                <button 
                    onClick={() => setActiveView('TERMINAL')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'TERMINAL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    <LineChart size={20} />
                    <span className="font-medium">Terminal</span>
                </button>
                <button 
                    onClick={() => setActiveView('SCANNERS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'SCANNERS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    <Radar size={20} />
                    <span className="font-medium">Pro Scanners</span>
                    <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 rounded animate-pulse">LIVE</span>
                </button>
            </div>
            
            {/* Stock List (Only visible in Terminal View) */}
            {activeView === 'TERMINAL' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Watchlist</span>
                        {loadingStocks && <span className="text-indigo-400 animate-pulse text-[10px]">Syncing...</span>}
                    </div>
                    <StockList 
                        stocks={stocks} 
                        selectedSymbol={selectedSymbol} 
                        onSelect={(sym) => {
                            setSelectedSymbol(sym);
                            setMobileMenuOpen(false);
                        }} 
                    />
                </div>
            )}
            
            {/* User Profile */}
            <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        TR
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Trader One</p>
                        <p className="text-xs text-green-400">Pro Plan Active</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 z-10">
            {activeView === 'TERMINAL' ? (
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    {currentStock.name} 
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{currentStock.sector}</span>
                </h2>
            ) : (
                <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
                    <Radar className="w-5 h-5" />
                    Algorithmic Scanners
                </h2>
            )}
            
            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-8 mr-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500">NIFTY 50</p>
                        <p className="text-sm font-mono text-slate-200">{indices.nifty}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">BANK NIFTY</p>
                        <p className="text-sm font-mono text-slate-200">{indices.bank}</p>
                    </div>
                    {/* SYNC BUTTON */}
                    <button 
                        onClick={fetchRealData}
                        disabled={loadingStocks}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs text-indigo-400 font-medium transition-colors"
                    >
                        <RefreshCw size={14} className={loadingStocks ? 'animate-spin' : ''} />
                        Sync Prices
                    </button>
                </div>
                <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
                    <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><Bell size={18} /></button>
                    <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><Settings size={18} /></button>
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
            {activeView === 'TERMINAL' ? (
                 <div className="p-4 md:p-6 space-y-6">
                    {/* Price Header Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                            <p className="text-xs text-slate-500 uppercase">Current Price</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold text-white">
                                    {loadingStocks ? '...' : `₹${currentStock.currentPrice.toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                            <p className="text-xs text-slate-500 uppercase">Day Change</p>
                            <div className={`flex items-baseline gap-2 mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                <span className="text-2xl font-bold">
                                    {loadingStocks ? '...' : (isPositive ? '+' : '') + currentStock.change.toFixed(2)}
                                </span>
                                <span className="text-sm">
                                    ({loadingStocks ? '...' : currentStock.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                            <p className="text-xs text-slate-500 uppercase">Volume</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold text-white">{(Math.random() * 10).toFixed(2)}M</span>
                            </div>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm flex flex-col justify-center">
                            <div className="flex gap-2">
                                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">BUY</button>
                                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">SELL</button>
                            </div>
                        </div>
                    </div>

                    {/* Chart and AI Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <StockChart 
                                data={currentStock.data} 
                                color={isPositive ? '#22c55e' : '#ef4444'} 
                                analysis={aiAnalysis[currentStock.symbol] || null}
                                symbol={currentStock.symbol}
                            />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                    <span className="text-xs text-slate-500 block">Open</span>
                                    <span className="font-mono text-slate-200">
                                        {currentStock.data.length > 0 ? `₹${currentStock.data[0].price.toFixed(2)}` : '...'}
                                    </span>
                                </div>
                                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                    <span className="text-xs text-slate-500 block">High</span>
                                    <span className="font-mono text-slate-200">
                                        {currentStock.data.length > 0 ? `₹${Math.max(...currentStock.data.map(d=>d.high)).toFixed(2)}` : '...'}
                                    </span>
                                </div>
                                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                    <span className="text-xs text-slate-500 block">Low</span>
                                    <span className="font-mono text-slate-200">
                                         {currentStock.data.length > 0 ? `₹${Math.min(...currentStock.data.map(d=>d.low)).toFixed(2)}` : '...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 h-full">
                            <AIAnalyst 
                                analysis={aiAnalysis[currentStock.symbol] || null}
                                loading={analyzing}
                                stockName={currentStock.name}
                                onAnalyze={handleAIAnalyze}
                            />
                        </div>
                    </div>

                    {/* Strategy / Stats Row */}
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
                        <h3 className="text-md font-semibold text-white mb-4">Market Depth (Level 2)</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="flex justify-between text-xs text-slate-500 mb-2 border-b border-slate-700 pb-1">
                                    <span>Bid Qty</span>
                                    <span>Bid Price</span>
                                </div>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex justify-between text-sm font-mono py-1 text-green-400/80">
                                        <span>{(Math.random() * 1000).toFixed(0)}</span>
                                        <span>{(currentStock.currentPrice - (i * 0.5)).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-500 mb-2 border-b border-slate-700 pb-1">
                                    <span>Ask Price</span>
                                    <span>Ask Qty</span>
                                </div>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex justify-between text-sm font-mono py-1 text-red-400/80">
                                        <span>{(currentStock.currentPrice + (i * 0.5)).toFixed(2)}</span>
                                        <span>{(Math.random() * 1000).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
            ) : (
                <ScannerDashboard />
            )}
        </main>
      </div>
    </div>
  );
};

export default App;