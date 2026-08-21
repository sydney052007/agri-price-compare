import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import urllib3

load_dotenv()
CWA_API_KEY = os.getenv('CWA_API_KEY', '')

# 測站名單
station_dict = dict()
# 縣市雨量數據 (key 包含日期區間，避免跨查詢回傳過期資料)
station_rainfall = dict()
def rainfall(query,start,end):

    query = query.replace('台', '臺')
    print(f"正在查詢雨量: {query}")

    if not station_dict.get(query):
        print("尚未有測站資料")
        url = 'https://hdps.cwa.gov.tw/static/state.html'
            
        try:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            response = requests.get(url, verify=False, timeout=15)
            response.encoding = 'utf-8'

            soup = BeautifulSoup(response.text, 'html.parser')

            data = soup.find("div", id = "existing_station").find_all('tr')
            for item in data:
                cols = item.find_all('td')
                # 跳過標題或空行
                if len(cols) < 7:
                    continue
                # 排除雷達站
                station_name = cols[1].text.strip()
                if "雷達" in station_name:
                    continue

                station_id = cols[0].text.strip()
                station_county = cols[6].text.strip()

                is_rain_station = False

                # 46: 署屬有人站
                # C0: 自動氣象站
                # C1: 自動雨量站      
                is_rain_station = False
                if station_id.startswith(("46", "C0", "C1")):
                    is_rain_station = True

                if is_rain_station:
                    # 將測站 ID 加入該縣市的列表中
                    old_list = station_dict.get(station_county, [])
                    old_list.append(station_id) 
                    station_dict[station_county] = old_list
        except Exception as e:
            print(f"爬蟲發生錯誤: {e}")
    end_dt = end
    start_dt = start
    s_date_str = f"{start_dt.year}-{start_dt.month:02d}-{start_dt.day:02d}"
    e_date_str = f"{end_dt.year}-{end_dt.month:02d}-{end_dt.day:02d}"

    # 快取 key 需包含日期區間，否則同縣市不同日期範圍會拿到過期資料
    cache_key = (query, s_date_str, e_date_str)

    # 如果已有雨量數據，直接回傳
    if station_rainfall.get(cache_key):
        return station_rainfall[cache_key]

    else:
        rainfall_dict = dict()

        base_url = f'https://opendata.cwa.gov.tw/api/v1/rest/datastore/C-B0025-001?Authorization={CWA_API_KEY}&format=JSON&StationID='
        if station_dict.get(query):
            station_ids = station_dict[query]
            
            for each_id in station_ids:
                api_url = base_url + each_id + '&sort=Date&timeFrom=' + s_date_str + '&timeTo=' + e_date_str + '&DataType=stationObsTimes'
                try:
                    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)    
                    response = requests.get(api_url, verify=False, timeout=15)
                    if response.status_code == 200:
                        if not response.text:
                            print("API response none")
                        else:
                            data = response.json() 
                            if data['records']['location']:
                                target_station = data['records']['location'][0]
                                content = target_station['stationObsTimes']['stationObsTime']
                                for each in content:
                                    date = each['Date']
                                    precip_str = each['weatherElements']['Precipitation']
                                    
                                    rain_value = 0.0
                                    if precip_str == 'T':# 微量
                                        rain_value = 0.0
                                    elif precip_str in ['X', '-', 'V']:# 異常值
                                        rain_value = 0.0 
                                    else:
                                        try:
                                            rain_value = float(precip_str)
                                        except ValueError:
                                            rain_value = 0.0

                                    rainfall_dict[date] = rainfall_dict.get(date, 0.0) + rain_value
                except Exception as e:
                    print(f"API 請求錯誤 (測站 {each_id}): {e}")
        else:
            print(f"警告：找不到 {query} 的測站 ID")
        print("雨量資料抓取完成")

        station_rainfall[cache_key] = rainfall_dict
        return rainfall_dict