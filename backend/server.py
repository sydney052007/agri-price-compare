import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from google import genai
import time

from rainfall_data import rainfall
from product_origin_new import find_origin
from price_data import product_data

app = Flask(__name__)

# 允許的前端來源，可透過環境變數 CORS_ORIGINS（逗號分隔）覆寫，預設只開放本機開發用的位址
allowed_origins = os.getenv(
    'CORS_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')
CORS(app, origins=allowed_origins)
# 一: 數據抓取
@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        query = data.get('crop')

        start_date_str = data.get('startDate') 
        end_date_str = data.get('endDate')

        try:
            # 將字串 (YYYY-MM-DD) 轉為 datetime
            start_dt = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date_str, '%Y-%m-%d')
        except (ValueError, TypeError):
            end_dt = datetime.now()
            start_dt = end_dt - timedelta(days=180)
            print("日期格式錯誤，使用預設時間範圍")
        print(f"收到請求: {query}, 日期: {start_date_str} ~ {end_date_str}")
        
        if not query:
            return jsonify({"success": False, "error": "未提供作物名稱"}), 400
        
        # 找產地
        origin = find_origin(query)
        rainfall_dict = {}
        if not origin:
            print(f"系統提示：找不到 {query} 的產地，將只顯示價格數據。")
            origin = "產地未知"
        else:
            # 只有找到產地才去抓雨量
            try:
                rainfall_dict = rainfall(origin, start_dt, end_dt)
            except Exception as e:
                print(f"抓取雨量失敗，但繼續執行: {e}")
                rainfall_dict = {}
        # 抓價格
        products_dict = product_data(query, start_dt,end_dt)
        
        if query not in products_dict:
             return jsonify({"success": False, "error": "查無此作物的交易資料"}), 404

        date_data = products_dict[query]

        # 將價格與雨量依照日期合併，轉成圖表需要的格式
        chart_data = []
        sorted_daily_data = sorted(date_data.items())

        for date_str, values in sorted_daily_data:
            total_revenue = values[0]
            total_quantity = values[1]
            
            if total_quantity > 0:
                avg_price = total_revenue / total_quantity
                # 民國年轉西元
                y, m, d = date_str.split('.')
                ad_year = int(y) + 1911
                ad_date_str = f"{ad_year}-{int(m):02d}-{int(d):02d}"
                # 過濾日期範圍
                if start_date_str and end_date_str:
                    if not (start_date_str <= ad_date_str <= end_date_str):
                        continue
                daily_rain = rainfall_dict.get(ad_date_str, 0.0)

                chart_data.append({
                    "date": ad_date_str,
                    "avgPrice": round(avg_price, 1),
                    "rainfall": daily_rain,
                    "quantity": total_quantity
                })

        if not chart_data:
            return jsonify({"success": False, "error": "該區間無有效資料"}), 404
        # 回傳給前端
        return jsonify({
            "success": True,
            "detectedCounty": origin,
            "data": chart_data
        })

    except Exception as e:
        print(f"伺服器錯誤: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
# 二: AI 分析 
@app.route('/api/ai_analyze', methods=['POST'])
def ai_analyze():
    try:
        req_data = request.json
        user_api_key = req_data.get('apiKey')
        crop_name = req_data.get('cropName')
        county = req_data.get('county')
        daily_data = req_data.get('data')
        
        print(f"收到 AI 分析請求: {crop_name}")

        if not user_api_key:
            return jsonify({"success": False, "error": "未提供 API Key，請在網頁上方輸入。"}), 400

        if not daily_data:
            return jsonify({"success": False, "error": "沒有數據可分析"}), 400
        #把數據算成「月平均」
        monthly_stats = {}
        
        for d in daily_data:
            month = d['date'][:7]# 取出 YYYY-MM
            
            if month not in monthly_stats:
                monthly_stats[month] = {'pSum': 0, 'qSum': 0, 'rSum': 0, 'count': 0}
            
            stats = monthly_stats[month]
            stats['pSum'] += d.get('avgPrice', 0)
            stats['qSum'] += d.get('volume', 0)
            stats['rSum'] += d.get('rainfall', 0)
            stats['count'] += 1

        # 將統計結果轉成文字字串
        summary_text = f"作物: {crop_name}\n主要產地: {county}\n數據摘要 (月均):\n"
        
        for m in sorted(monthly_stats.keys()):
            s = monthly_stats[m]
            if s['count'] > 0:
                avg_p = round(s['pSum'] / s['count'], 1)
                tot_q = int(s['qSum'])
                tot_r = int(s['rSum'])
                summary_text += f"- {m}: 均價 {avg_p}元/kg, 總交易量 {tot_q}kg, 總雨量 {tot_r}mm\n"

        prompt = f"""
        我有一份台灣 "{crop_name}" 的市場交易與產地 ("{county}") 雨量數據。
        請根據以下月度摘要數據，扮演一位專業的農業市場分析師，提供一份繁體中文的簡短分析報告。
        
        重點要求：**請將「購買建議」放在第一段，直接告訴使用者現在是否適合購買。**

        數據如下:
        {summary_text}

        請依序分析：
        1. **購買建議** (最重要)：現在是盛產期嗎？價格比起往年或上個月是便宜還是貴？現在買划算嗎？
        2. **產季與市場趨勢**：根據價格與交易量，判斷目前的產季狀況與近期價格走勢。
        3. **雨量影響**：觀察雨量是否影響了近期的價格或產量。

        請使用 Markdown 格式，條列式呈現，保持專業且易讀。不超過 350 字。
        """
        max_retries = 3   
        base_delay = 5
        client = genai.Client(api_key=user_api_key)

        for attempt in range(max_retries):
            try:
                print(f"嘗試呼叫 Gemini API (第 {attempt + 1} 次)...")
                
                response = client.models.generate_content(
                    model=os.getenv('GEMINI_MODEL', 'gemini-3.6-flash'),
                    contents=prompt
                )
                return jsonify({"success": True, "analysis": response.text})

            except Exception as e:
                error_str = str(e)
                # 檢查是否為配額錯誤 (429)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    if attempt < max_retries - 1:
                        # 計算等待時間 
                        wait_time = base_delay * (attempt + 1)
                        print(f"配額額滿 (429)，系統將等待 {wait_time} 秒後重試...")
                        time.sleep(wait_time)
                        continue 
                    else:
                        # 已經試了 3 次還是失敗
                        print("重試次數已達上限，放棄請求。")
                        return jsonify({
                            "success": False, 
                            "error": "AI 服務目前過於繁忙 (Quota Exceeded)，請稍等一分鐘後再試。"
                        }), 429
                else:
                    raise e

    except Exception as e:
        print(f"AI 伺服器錯誤: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    
if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False') == 'True'
    print("後端伺服器啟動中... http://localhost:5000")
    app.run(port=5000, debug=debug_mode, threaded=True)