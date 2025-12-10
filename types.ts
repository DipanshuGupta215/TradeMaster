export interface StockDataPoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  data: StockDataPoint[];
}

export interface AIAnalysisResult {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  supportLevels: number[];
  resistanceLevels: number[];
}

export enum TimeFrame {
  '1D' = '1D',
  '1W' = '1W',
  '1M' = '1M',
}

// --- NEW SCANNER TYPES ---

export interface ScannerItem {
  symbol: string;
  value: number | string; // Primary metric (e.g., % Change, Volume)
  secondaryValue?: string | number; // e.g., "R.Fac", Time
  signal: 'BULL' | 'BEAR' | 'NEUTRAL';
  badge?: string; // e.g., "LIVE", "NEW"
}

export interface SectorData {
  name: string;
  performance: number;
  marketCapWeight: number; // 1-10 scale for visual sizing
  topGainer: string;
  topLoser: string;
}

export interface MoneyFluxItem {
  symbol: string;
  strength: number; // -10 to 10 scale for color intensity
  volumeWeight: number; // 1-10 for sizing
  priceChange: number;
}