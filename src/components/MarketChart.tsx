import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DailyData } from '../types';

interface MarketChartProps {
  data: DailyData[];
  cropName: string;
}


const CustomBubble = (props: any) => {
  const { cx, cy, payload, maxQuantity } = props;
  if (!payload || !cx || !cy) return null;

  const quantity = payload.volume || payload.quantity || 0;
  const MAX_RADIUS_PX = 8;
  
  let radius = 0;
  if (maxQuantity > 0) {
      radius = (Math.sqrt(quantity) / Math.sqrt(maxQuantity)) * MAX_RADIUS_PX;
  }
  const finalRadius = Math.max(2, radius);

  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={finalRadius} 
      fill="#50BFBF" 
      fillOpacity={0.5} 
      stroke="none"
    />
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-lg text-sm z-50 min-w-[220px] whitespace-nowrap">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any, index: number) => {
          const val = p.value ?? 0;
          const formattedVal = val.toLocaleString();
          if (p.name === '平均價格') {
            const qty = p.payload.volume || p.payload.quantity || 0;
             return (
              <div key={index}>
                <p className="text-[#50BFBF]">
                  平均價格: {formattedVal} 元/kg
                </p>
                <p className="text-[#4EA686] text-xs">
                  交易量: {qty.toLocaleString()} kg
                </p>
              </div>
             );
          }
          return (
            <p key={index} className="text-gray-500">
              {p.name}: {formattedVal} mm
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const MarketChart: React.FC<MarketChartProps> = ({ data, cropName }) => {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">尚無數據</div>;
  const maxQuantity = Math.max(...data.map(d => d.quantity || 0));

  return (
    <div className="w-full h-[500px] bg-white p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{cropName} 每日行情趨勢 (氣泡大小=交易量)</h3>
      <ResponsiveContainer width="100%" height="95%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
          
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            tickFormatter={(val) => val.substring(5)} 
            minTickGap={30}
          />

          <YAxis 
            yAxisId="left" 
            label={{ value: '平均價格 (元/公斤)', angle: -90, position: 'insideLeft', offset: 0, style: {fill: '#50BFBF'} }} 
            tick={{ fill: 'hsla(180, 40%, 82%, 1.00)' }}
            domain={['auto', 'auto']}
          />
          
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: '產地雨量 (mm)', angle: 90, position: 'insideRight', offset: 0, style: {fill: '#F2C8C4'} }}
            tick={{ fill: '#F2C8C4' }}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: '#50BFBF' }}
          />

          <Bar 
            yAxisId="right" 
            dataKey="rainfall" 
            name="雨量" 
            fill="#F2C8C4" 
            opacity={0.3} 
            barSize={20}
          />

          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="avgPrice" 
            name="平均價格" 
            fill="#50BFBF" 
            stroke="none"
            isAnimationActive={false}
            dot={<CustomBubble maxQuantity={maxQuantity} />}
            activeDot={{ r: 6, fill: '#50BFBF' }}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketChart;
