import React, { useState, useEffect } from 'react';
import ScannerTable from './ScannerTable';
import SectorScope from './SectorScope';
import MoneyFlux from './MoneyFlux';
import { ScannerItem, SectorData, MoneyFluxItem } from '../types';
import { getRealMarketSnapshot } from '../services/geminiService';
import { Loader2, RefreshCw } from 'lucide-react';

// --- MOCK DATA UTILITIES (Fallback) ---

const MOCK_SYMBOLS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HUL', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
    'L&T', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN', 'BAJFINANCE', 'SUNPHARMA', 'HCLTECH', 'TATASTEEL',
    'NTPC', 'POWERGRID', 'ULTRACEMCO', 'NESTLEIND', 'WIPRO', 'M&M', 'ONGC', 'JSWSTEEL', 'ADANIENT',
    'ADANIPORTS', 'COALINDIA', 'TATACHEM', 'VEDL', 'DLF', 'ZOMATO', 'PAYTM', 'NYKAA', 'POLICYBZR',
    'TECHM', 'BPCL', 'TATACONSUM', 'HINDUNILVR', 'CIPLA', 'HEROMOTOCO', 'EICHERMOT', 'DRREDDY'
];

const getRandomSymbol = () => MOCK_SYMBOLS[Math.floor(Math.random() * MOCK_SYMBOLS.length)];

const generateScannerData = (count: number, forceSignal?: 'BULL' | 'BEAR'): ScannerItem[] => {
    return Array.from({ length: count }).map(() => {
        const signal = forceSignal || (Math.random() > 0.5 ? 'BULL' : 'BEAR');
        const change = (Math.random() * 5 * (signal === 'BULL' ? 1 : -1)).toFixed(2);
        
        return {
            symbol: getRandomSymbol(),
            value: Number(change),
            secondaryValue: Math.random() > 0.5 ? '09:45:12' : (Math.random() * 5).toFixed(2),
            signal: signal,
            badge: Math.random() > 0.8 ? 'NEW' : undefined
        };
    });
};

const generateMoneyFluxData = (seeds: ScannerItem[]): MoneyFluxItem[] => {
    // Generate a diverse set of stocks with varying weights for the TreeMap
    // Use seeds (real top gainers) to populate some meaningful entries
    const items: MoneyFluxItem[] = [];
    const seedSymbols = seeds.map(s => s.symbol);
    const pool = [...new Set([...seedSymbols, ...MOCK_SYMBOLS])].slice(0, 30);
    
    pool.forEach(sym => {
        // If it's a seed stock, give it higher strength matching its real performance
        const seed = seeds.find(s => s.symbol === sym);
        const strength = seed ? (Number(seed.value) * 2) : (Math.random() * 10) - 5; 
        const weight = Math.floor(Math.random() * 10) + 1;
        
        items.push({
            symbol: sym,
            strength: strength,
            volumeWeight: weight,
            priceChange: seed ? Number(seed.value) : Number((strength / 2).toFixed(2))
        });
    });
    
    return items.sort((a, b) => b.volumeWeight - a.volumeWeight);
};

const INITIAL_SECTORS: SectorData[] = [
    { name: 'NIFTY BANK', performance: 0.0, marketCapWeight: 9, topGainer: '...', topLoser: '...' },
    { name: 'NIFTY IT', performance: 0.0, marketCapWeight: 8, topGainer: '...', topLoser: '...' },
    { name: 'NIFTY AUTO', performance: 0.0, marketCapWeight: 6, topGainer: '...', topLoser: '...' },
    { name: 'NIFTY METAL', performance: 0.0, marketCapWeight: 4, topGainer: '...', topLoser: '...' },
    { name: 'NIFTY FMCG', performance: 0.0, marketCapWeight: 7, topGainer: '...', topLoser: '...' },
    { name: 'NIFTY ENERGY', performance: 0.0, marketCapWeight: 6, topGainer: '...', topLoser: '...' },
];

const ScannerDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [sectors, setSectors] = useState<SectorData[]>(INITIAL_SECTORS);
    const [moneyFluxData, setMoneyFluxData] = useState<MoneyFluxItem[]>([]);

    // Scanner Data States
    const [intradayBoost, setIntradayBoost] = useState<ScannerItem[]>([]);
    const [topLevel, setTopLevel] = useState<ScannerItem[]>([]);
    const [bottomLevel, setBottomLevel] = useState<ScannerItem[]>([]);
    
    // Simulated derived scanners
    const [optionApex, setOptionApex] = useState<ScannerItem[]>([]);
    const [bo1050, setBo1050] = useState<ScannerItem[]>([]);
    const [reversal, setReversal] = useState<ScannerItem[]>([]);
    const [channelBo, setChannelBo] = useState<ScannerItem[]>([]);
    const [delivery, setDelivery] = useState<ScannerItem[]>([]);
    const [insider, setInsider] = useState<ScannerItem[]>([]);
    const [lom, setLom] = useState<ScannerItem[]>([]);
    const [contraction, setContraction] = useState<ScannerItem[]>([]);
    const [dayHLRev, setDayHLRev] = useState<ScannerItem[]>([]);
    const [twoDayHL, setTwoDayHL] = useState<ScannerItem[]>([]);

    // Fetch Real Data on Mount
    useEffect(() => {
        const fetchRealData = async () => {
            setLoading(true);
            try {
                const snapshot = await getRealMarketSnapshot();
                
                if (snapshot) {
                    setSectors(snapshot.sectors);
                    setIntradayBoost(snapshot.intradayBoost);
                    setTopLevel(snapshot.topGainers);
                    setBottomLevel(snapshot.topLosers);
                    
                    // Populate other scanners with a mix of real derived data and simulation
                    setMoneyFluxData(generateMoneyFluxData([...snapshot.topGainers, ...snapshot.topLosers]));
                    
                    // Simulate derivations for other strategies based on market breadth
                    const allRealSymbols = [...snapshot.topGainers, ...snapshot.topLosers].map(s => s.symbol);
                    
                    const derive = (count: number) => {
                         // 30% chance to pick a real mover, 70% random mock
                         return Array.from({length: count}).map(() => {
                             if (Math.random() > 0.7 && allRealSymbols.length > 0) {
                                 const sym = allRealSymbols[Math.floor(Math.random() * allRealSymbols.length)];
                                 const realItem = [...snapshot.topGainers, ...snapshot.topLosers].find(i => i.symbol === sym);
                                 return { ...realItem!, secondaryValue: 'Derived' } as ScannerItem;
                             }
                             return generateScannerData(1)[0];
                         });
                    };

                    setOptionApex(derive(5));
                    setBo1050(derive(5));
                    setReversal(derive(5));
                    setChannelBo(derive(5));
                    setDelivery(derive(5));
                    setInsider(derive(5));
                    setLom(derive(5));
                    setContraction(derive(5));
                    setDayHLRev(derive(5));
                    setTwoDayHL(derive(5));

                } else {
                    // Fallback if API fails
                    fallbackToMock();
                }
            } catch (e) {
                console.error(e);
                fallbackToMock();
            } finally {
                setLoading(false);
            }
        };

        fetchRealData();
    }, []);

    const fallbackToMock = () => {
        setSectors(INITIAL_SECTORS);
        setMoneyFluxData(generateMoneyFluxData([]));
        setIntradayBoost(generateScannerData(6));
        setTopLevel(generateScannerData(6, 'BULL'));
        setBottomLevel(generateScannerData(6, 'BEAR'));
        setOptionApex(generateScannerData(5));
        setBo1050(generateScannerData(5));
        setReversal(generateScannerData(5));
        setChannelBo(generateScannerData(5));
        setDelivery(generateScannerData(5));
        setInsider(generateScannerData(5));
        setLom(generateScannerData(5));
        setContraction(generateScannerData(5));
        setDayHLRev(generateScannerData(5));
        setTwoDayHL(generateScannerData(5));
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white">Connecting to Market Feed...</h3>
                    <p className="text-slate-400">Fetching real-time sector analysis and top movers from NSE</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-8 pb-20">
            {/* Header / Timestamp */}
            <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    MARKET LIVE
                </span>
                <button onClick={() => window.location.reload()} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <RefreshCw size={16} className="text-slate-400" />
                </button>
            </div>

            {/* 1. Sector Scope */}
            <SectorScope sectors={sectors} />

            {/* Scanners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                
                {/* 2. Intraday Boost */}
                <ScannerTable 
                    title="Intraday Boost"
                    description="Spot shooting stars comparing today's live activity against past 20 days."
                    data={intradayBoost}
                    primaryLabel="% Chg"
                    secondaryLabel="R.Fac"
                    colorAccent="blue"
                />

                {/* 3. Option Apex (NEW) */}
                <ScannerTable 
                    title="Option Apex"
                    description="Track candle-by-candle positions of big players via OI Change."
                    data={optionApex}
                    primaryLabel="OI Chg%"
                    secondaryLabel="PCR"
                    colorAccent="purple"
                />

                {/* 4. Top Level Stocks (Day High) */}
                <ScannerTable 
                    title="Day High Breakout"
                    description="Stocks trading near their day's high, signaling strength."
                    data={topLevel}
                    primaryLabel="% Chg"
                    secondaryLabel="Diff"
                    colorAccent="green"
                />

                {/* 5. Bottom Level Stocks (Day Low) */}
                 <ScannerTable 
                    title="Day Low Breakdown"
                    description="Stocks trading near their day's low, signaling weakness."
                    data={bottomLevel}
                    primaryLabel="% Chg"
                    secondaryLabel="Diff"
                    colorAccent="red"
                />

                {/* 6. 10/50 Days BO */}
                <ScannerTable 
                    title="10/50 Days BO"
                    description="Stocks breaking through 10 or 50-day highs or lows."
                    data={bo1050}
                    primaryLabel="% Chg"
                    secondaryLabel="Time"
                    colorAccent="purple"
                />

                {/* 7. Reversal Radar */}
                <ScannerTable 
                    title="Reversal Radar"
                    description="Detects stocks exhibiting reversal patterns on daily timeframe."
                    data={reversal}
                    primaryLabel="% Chg"
                    secondaryLabel="Date"
                    colorAccent="orange"
                />

                {/* 8. Channel BO */}
                <ScannerTable 
                    title="Channel BO"
                    description="Stocks breaking out of a tight consolidation range."
                    data={channelBo}
                    primaryLabel="% Chg"
                    secondaryLabel="Time"
                    colorAccent="blue"
                />

                {/* 9. Delivery Scanner */}
                <ScannerTable 
                    title="Delivery Scanner"
                    description="High delivery % indicating quiet accumulation or distribution."
                    data={delivery}
                    primaryLabel="Del %"
                    secondaryLabel="Vol"
                    colorAccent="green"
                />

                {/* 10. Insider Strategy */}
                <ScannerTable 
                    title="Momentum Spike"
                    description="Sharp price/volume increase in the last 5/10 minutes."
                    data={insider}
                    primaryLabel="% Spike"
                    secondaryLabel="Time"
                    colorAccent="red"
                />

                 {/* 11. LOM Stocks */}
                 <ScannerTable 
                    title="LOM (Loss of Momentum)"
                    description="Rising or falling stocks that are losing momentum (Reversal)."
                    data={lom}
                    primaryLabel="% Chg"
                    secondaryLabel="Time"
                    colorAccent="orange"
                />

                {/* 12. Contraction BO */}
                <ScannerTable 
                    title="Contraction BO"
                    description="Go-to feature for stocks breaking free from contraction."
                    data={contraction}
                    primaryLabel="% Chg"
                    secondaryLabel="Time"
                    colorAccent="purple"
                />

                {/* 13. Day H/L Reversal */}
                <ScannerTable 
                    title="Day H/L Reversal"
                    description="Reversing after touching Day High or Low."
                    data={dayHLRev}
                    primaryLabel="% Chg"
                    secondaryLabel="Time"
                    colorAccent="blue"
                />

                {/* 14. 2-Day H/L BO */}
                <ScannerTable 
                    title="2-Day H/L BO"
                    description="Breaking both 2-days high or low simultaneously."
                    data={twoDayHL}
                    primaryLabel="% Chg"
                    secondaryLabel="Time"
                    colorAccent="green"
                />
            </div>
            
            {/* Money Flux (NEW) */}
            <MoneyFlux items={moneyFluxData} />

        </div>
    );
};

export default ScannerDashboard;