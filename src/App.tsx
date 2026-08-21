import React, { useState } from 'react';
import { 
  CloudRain, TrendingUp, Sprout, Search, Loader2, MapPin, 
  Terminal, Calendar, ChevronDown, Database, Scan, Activity, Wifi 
} from 'lucide-react'
import { CROP_LIST } from '../src/constants';
import { fetchData } from './services/dataService';
import { analyzeData } from './services/geminiService';
import { DailyData } from './types';
import MarketChart from './components/MarketChart';
import ReactMarkdown from 'react-markdown';
const FetchingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white font-mono">
    <div className="relative mb-8">
      {/* 外圈雷達 */}
      <div className="absolute inset-0 rounded-full border-2 border-[#50BFBF]/30 w-32 h-32 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
      <div className="absolute inset-0 rounded-full border border-[#50BFBF]/50 w-32 h-32 animate-[spin_4s_linear_infinite]"></div>
      <div className="absolute inset-2 rounded-full border-t-2 border-[#fff]/80 w-28 h-28 mx-auto my-auto top-0 left-0 right-0 bottom-0 animate-spin"></div>
      
      {/* 中心圖示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Database size={32} className="text-[#50BFBF] animate-pulse" />
      </div>
      
      {/* 佔位 */}
      <div className="w-32 h-32"></div>
    </div>
    
    <div className="flex items-center gap-3 text-[#50BFBF] text-xl font-bold tracking-widest mb-2">
      <Activity className="animate-bounce" size={20} />
      DATA INGESTION
    </div>
    <div className="text-sm text-gray-300 animate-pulse flex items-center gap-2">
      <Wifi size={14} />
      {message}
    </div>
  </div>
);

// [動畫 B] AI 分析區塊動畫 (對應 analyzing 狀態)
const AIAnalyzingBlock = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 rounded-lg p-6 relative overflow-hidden group min-h-[300px]">
    {/* 網格背景 */}
    <div className="absolute inset-0 opacity-20" 
         style={{backgroundImage: 'radial-gradient(#50BFBF 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
    </div>

    {/* 掃描線 */}
    <div className="absolute left-0 right-0 h-0.5 bg-[#50BFBF] shadow-[0_0_15px_rgba(80,191,191,0.8)] animate-[scan_2s_ease-in-out_infinite] z-10"></div>
    
    <div className="z-20 text-[#50BFBF] flex flex-col items-center">
      <Scan size={48} className="mb-4 animate-pulse" />
      <h4 className="text-lg font-bold mb-2">AI 模型運算中</h4>
      <p className="text-xs text-[#50BFBF]/70 font-mono text-center max-w-[200px]">
        ANALYZING MARKET TRENDS & WEATHER PATTERNS...
      </p>
    </div>

    {/* 底部進度條裝飾 */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
      <div className="h-full bg-[#50BFBF] animate-[progress_2s_ease-in-out_infinite] w-full origin-left"></div>
    </div>
  </div>
);
function App() {
  const [selectedCrop, setSelectedCrop] = useState(CROP_LIST[0]);
  const [detectedCounty, setDetectedCounty] = useState('');
  const [apiKey, setApiKey] = useState('');

  const today = new Date();
  // 預設抓近 3 個月：後端每次查詢會對政府開放資料平台發多次分頁請求，
  // 區間越長（例如近一年）耗時會明顯拉長，先給一個能快速跑完的預設值。
  const defaultStart = new Date();
  defaultStart.setMonth(today.getMonth() - 3);

  // CWA 雨量開放資料 API 只提供「當年度」資料，早於今年 1/1 的區間查不到雨量
  const currentYearStart = `${today.getFullYear()}-01-01`;

  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('系統準備中...');
  
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleCropChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCrop(e.target.value);
    setDetectedCounty('');
    setData([]);
    setAnalysis('');
  };

  const handleSearch = async () => {
    setLoading(true);
    setAnalysis(''); 
    setData([]);
    setDetectedCounty('');
    setProgressMsg('正在連線至政府資料開放平台...');
    
    try {
      const result = await fetchData(
        selectedCrop, 
        startDate,
        endDate,
        setProgressMsg,
        (foundCounty) => setDetectedCounty(foundCounty)
      );
      setData(result);
    } catch (error) {
      console.error(error);
      alert('分析失敗，請確認網路連線。注意：部分政府網站可能在瀏覽器環境中阻擋連線。');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = async () => {
    if (!apiKey) {
      alert('請先在右上方輸入 Gemini API Key');
      return;
    }
    if (data.length === 0) return;

    setAnalyzing(true);
    try {
      const result = await analyzeData(apiKey, selectedCrop, detectedCounty, data);
      setAnalysis(result);
    } catch (error) {
      setAnalysis('AI 分析發生錯誤。');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-10">
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.5); }
          100% { transform: scaleX(1); }
        }
      `}</style>

      {/* 1. 如果正在 Loading (抓取資料)，顯示全螢幕動畫遮罩 */}
      {loading && <FetchingOverlay message={progressMsg} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-[#50BFBF]" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#50BFBF] to-teal-600">
              AgriSight AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <input 
              type="password"
              placeholder="貼上 Gemini API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-48 md:w-64"
             />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
      {/* Search Card */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-[#50BFBF]" />
            查詢條件
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex-1 w-full lg:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-2 ">農作物</label>
              <div className="relative">
                <select 
                  value={selectedCrop} 
                  onChange={handleCropChange}
                  className="w-full appearance-none border-[#F2C8C4] rounded-lg shadow-sm focus:border-[#F2C8C4] focus:ring-[#F2C8C4]/50 py-2.5 px-3 pr-10 bg-[#F2C8C4]/20"
                >
                  {CROP_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown className="h-4 w-4 text-[#F2C8C4]" />
                </div>
              </div>
            </div>

             <div className="flex-1 w-full lg:w-1/4">
               <label className="block text-sm font-medium text-gray-700 mb-2">日期區間 (起)</label>
               <div className="relative">
                 <Calendar className="absolute right-3 top-4 h-4 w-4 text-[#50BFBF] pointer-events-none" />
                 <input 
                   type="date"
                   value={startDate}
                   max={new Date().toISOString().split("T")[0]}
                   onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (newStart > endDate) {
                      setEndDate(newStart);
                    }
                  }}
                   className="w-full  border-[#50BFBF]/60 rounded-lg shadow-sm focus:border-[#4EA686]/70 focus:ring-[#4EA686] py-2.5 px-3 bg-[#50BFBF]/20
                   [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
                 />
               </div>
             </div>

             <div className="flex-1 w-full lg:w-1/4">
               <label className="block text-sm font-medium text-gray-700 mb-2">日期區間 (迄)</label>
               <div className="relative">
                 <Calendar className="absolute right-3 top-4 h-4 w-4 text-[#50BFBF] pointer-events-none" />
                 <input 
                   type="date"
                   value={endDate}
                   min={startDate}
                   max={new Date().toISOString().split("T")[0]}
                   onChange={(e) => {
                    const newEnd = e.target.value;
                    if (newEnd < startDate) {
                        alert("結束日期不能早於開始日期");
                        return;
                    } else {
                        setEndDate(newEnd);
                    }
                  }}
                   className="w-full border-[#50BFBF]/60 rounded-lg shadow-sm focus:border-[#4EA686]/70 focus:ring-[#4EA686] py-2.5 px-3 bg-[#50BFBF]/20
                   [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
                 />
               </div>
               <p className="mt-1 text-xs text-gray-400">雨量資料僅提供 {today.getFullYear()} 年 1 月 1 日以後的區間</p>
             </div>

            <div className="flex-1 w-full lg:w-1/4">
               <label className="block text-sm font-medium text-gray-700 mb-2">主要產地</label>
               <div className="w-full bg-gray-100 rounded-lg py-2.5 px-3 text-gray-700 border border-transparent flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-[#50BFBF]" />
                 {loading ? (
                   <span className="text-gray-400 text-sm">正在查詢...</span>
                 ) : detectedCounty ? (
                   <span className="font-medium text-[#50BFBF]">{detectedCounty}</span>
                 ) : (
                   <span className="text-[#50BFBF] text-sm">系統將自動偵測</span>
                 )}
               </div>
            </div>

            <div className="w-full lg:w-auto">
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full lg:w-32 bg-[#50BFBF] hover:bg-[#50BFBF]/80 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '分析中...' : '開始分析'}
              </button>
            </div>
          </div>
          {startDate < currentYearStart && (
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              提醒：開始日期早於 {today.getFullYear()} 年 1 月 1 日，該部分區間將沒有雨量資料（僅價格資料照常顯示）。
            </p>
          )}
        </section>

        {/* Dashboard Grid */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Section (Span 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <MarketChart data={data} cropName={selectedCrop} />
              
              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#50BFBF]">
                  <p className="text-xs text-[#50BFBF] mb-1">平均價格 (期間)</p>
                  <p className="text-2xl font-bold text-[#50BFBF]">
                    ${(data.reduce((acc, cur) => acc + cur.avgPrice, 0) / data.length).toFixed(1)}
                    <span className="text-sm font-normal text-[#50BFBF] ml-1">/kg</span>
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#F2C8C4]">
                   <p className="text-xs text-[#F2C8C4] mb-1">產地累積雨量 (期間)</p>
                   <p className="text-2xl font-bold text-[#F2C8C4]">
                    {data.reduce((acc, cur) => acc + cur.rainfall, 0).toFixed(0)}
                    <span className="text-sm font-normal text-[#F2C8C4] ml-1">mm</span>
                   </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#4EA686] hidden sm:block">
                   <p className="text-xs text-[#4EA686] mb-1">資料筆數</p>
                   <p className="text-2xl font-bold text-[#4EA686]">
                    {data.length}
                    <span className="text-sm font-normal text-gray-400 ml-1">天</span>
                   </p>
                </div>
              </div>
            </div>

            {/* AI Analysis Panel (Span 1 col) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#4EA686]" />
                  AI 市場分析
                </h3>
                {!analysis && (
                  <button 
                    onClick={handleAnalysis}
                    disabled={analyzing}
                    className="text-xs bg-[#4EA686] text-white px-3 py-1.5 rounded-full hover:bg-[#38A668] disabled:opacity-50 transition-colors"
                  >
                    產生報告
                  </button>
                )}
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
                {analyzing ? (
                  <AIAnalyzingBlock />
                )  : analysis ? (
                  <div className="prose prose-sm prose-purple max-w-none">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                    <button 
                      onClick={handleAnalysis}
                      className="mt-6 text-xs text-purple-600 hover:underline w-full text-center"
                    >
                      重新分析
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    <CloudRain className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm">點擊「產生報告」<br/>讓 AI 建議您現在是否適合購買</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && data.length === 0 && (
          <div className="text-center py-20">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#50BFBF]/20 mb-4">
                <Sprout className="h-8 w-8 text-[#50BFBF]" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">歡迎使用 AgriSight AI</h3>
             <p className="mt-2 text-gray-500">請在上方選擇作物與日期，系統將自動偵測主要產地與分析行情。</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
