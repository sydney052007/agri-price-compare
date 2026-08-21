import { DailyData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const fetchData = async (
  cropName: string,
  startDate: string,
  endDate: string,
  onProgress: (msg: string) => void,
  onOriginFound: (county: string) => void
): Promise<DailyData[]> => {
  
  onProgress('正在連線至 Python 後端伺服器...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop: cropName,
        startDate: startDate,
        endDate: endDate
      }),
    });

    if (!response.ok) {
      throw new Error(`後端回應錯誤: ${response.status}`);
    }

    onProgress('正在接收分析結果...');
    const result = await response.json();

    if (result.success) {
      onOriginFound(result.detectedCounty);
      
      return result.data;
    } else {
      throw new Error(result.error || '未知的後端錯誤');
    }

  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};