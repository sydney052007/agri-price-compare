export interface DailyData {
  date: string;     // YYYY-MM-DD
  avgPrice: number; // NTD/Kg
  quantity: number; // Kg
  rainfall: number; // mm
}

export interface CropOption {
  name: string;
  category: 'vegetable' | 'fruit';
  defaultCounty: string;
}

export interface AnalysisResult {
  markdown: string;
  isLoading: boolean;
}

// API Response Types
export interface MOAProductResponse {
  Data: {
    TransDate: string;
    CropName: string;
    Avg_Price: number;
    Trans_Quantity: number;
  }[];
}

export interface CWABoxData {
  records: {
    location: {
      stationObsTimes: {
        stationObsTime: {
          Date: string;
          weatherElements: {
            Precipitation: string;
          };
        }[];
      };
    }[];
  };
}