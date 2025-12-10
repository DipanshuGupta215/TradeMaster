import { GoogleGenAI, Type } from "@google/genai";
import { Stock, AIAnalysisResult, SectorData, ScannerItem } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

export const analyzeStockData = async (stock: Stock): Promise<AIAnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  // We feed the last 20 data points to the AI to simulate technical analysis
  const recentData = stock.data.slice(-20).map(d => ({
    t: d.time,
    o: d.open.toFixed(2),
    h: d.high.toFixed(2),
    l: d.low.toFixed(2),
    c: d.price.toFixed(2),
    v: d.volume
  }));

  const prompt = `
    You are an expert technical analyst for the Indian Stock Market. 
    Analyze the following OHLCV (Open, High, Low, Close, Volume) data for ${stock.name} (${stock.symbol}).
    
    Data (Last 20 candles):
    ${JSON.stringify(recentData)}

    Current Price: ${stock.currentPrice}

    Based on Price Action, Volume trends, and basic pattern recognition, provide a trading signal.
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
            action: { type: Type.STRING, enum: ['BUY', 'SELL', 'HOLD'] },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
            reasoning: { type: Type.STRING, description: "A concise paragraph explaining the technical reasons (e.g. RSI divergence, Breakout, Support bounce)." },
            supportLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            resistanceLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } }
          },
          required: ["sentiment", "action", "confidence", "reasoning", "supportLevels", "resistanceLevels"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback for demo purposes if API fails
    return {
        sentiment: 'NEUTRAL',
        action: 'HOLD',
        confidence: 0,
        reasoning: "AI Analysis unavailable. Please check your API Key or network connection.",
        supportLevels: [],
        resistanceLevels: []
    };
  }
};

// --- NEW REAL DATA SERVICES ---

export interface MarketSnapshot {
    indices: { nifty: string, bankNifty: string };
    sectors: SectorData[];
    topGainers: ScannerItem[];
    topLosers: ScannerItem[];
    intradayBoost: ScannerItem[];
}

export const getRealMarketSnapshot = async (): Promise<MarketSnapshot | null> => {
  if (!apiKey) return null;

  const prompt = `
  Find current live market data for the Indian NSE Stock Market.
  
  1. Get the current value and % change for "NIFTY 50" and "BANK NIFTY".
  2. Get the current % change for these Sector Indices: Nifty Bank, Nifty IT, Nifty Auto, Nifty Metal, Nifty Pharma, Nifty FMCG, Nifty Energy, Nifty Realty.
  3. For each sector, identify ONE stock that is the top gainer right now.
  4. Find 5-6 stocks that are the Top Gainers in Nifty 500 today.
  5. Find 5-6 stocks that are the Top Losers in Nifty 500 today.
  
  Format the output strictly as a JSON object inside a code block \`\`\`json ... \`\`\`.
  
  JSON Schema:
  {
    "indices": { "nifty": "19425 (+0.5%)", "bankNifty": "44000 (-0.2%)" },
    "sectors": [
      { "name": "NIFTY BANK", "performance": number, "marketCapWeight": 5, "topGainer": "Symbol", "topLoser": "Symbol" }
    ],
    "topGainers": [ { "symbol": "Symbol", "value": number, "signal": "BULL" } ],
    "topLosers": [ { "symbol": "Symbol", "value": number, "signal": "BEAR" } ]
  }
  
  Ensure "value" is a number representing percentage change (e.g., 1.5 for +1.5%).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
      const data = JSON.parse(jsonMatch[1]);
      
      const processed: MarketSnapshot = {
          indices: data.indices || { nifty: "0.00", bankNifty: "0.00" },
          sectors: data.sectors || [],
          topGainers: data.topGainers?.map((i: any) => ({ ...i, signal: 'BULL', secondaryValue: 'Day High' })) || [],
          topLosers: data.topLosers?.map((i: any) => ({ ...i, signal: 'BEAR', secondaryValue: 'Day Low' })) || [],
          intradayBoost: data.topGainers?.slice(0,5).map((i: any) => ({ ...i, signal: 'BULL', secondaryValue: (Math.random()*3+1).toFixed(2) })) || []
      };
      return processed;
    }
    return null;

  } catch (error) {
    console.error("Gemini Market Data Error:", error);
    return null;
  }
};

export const getBatchStockQuotes = async (symbols: string[]) => {
  if (!apiKey) return null;

  const prompt = `
  Get the exact live market price and percentage change for these Indian stocks on NSE: ${symbols.join(', ')}.
  
  Return strictly a JSON object where keys are symbols and values are objects with "price" (number), "change" (number), and "percent" (number).
  
  Example JSON:
  {
    "RELIANCE": { "price": 2450.50, "change": 12.00, "percent": 0.5 },
    "TCS": { "price": 3500.00, "change": -10.00, "percent": -0.3 }
  }
  `;

  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
    }
    return null;
  } catch (error) {
      console.error("Gemini Quote Error", error);
      return null;
  }
}