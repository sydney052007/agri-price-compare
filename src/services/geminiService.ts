import { DailyData } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const analyzeData = async (
  apiKey: string, 
  cropName: string, 
  county: string, 
  data: DailyData[]
): Promise<string> => {
  if (!apiKey) return "請先輸入 API Key";
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai_analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        cropName,
        county,
        data
      }),
    });

    const result = await response.json();

    if (result.success) {
      return result.analysis;
    } else {
      return `分析失敗: ${result.error}`;
    }

  } catch (error) {
    console.error("Analysis Error:", error);
    return "連線錯誤，無法取得 AI 分析報告。";
  }
};