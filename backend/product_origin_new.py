import requests
from datetime import datetime
from bs4 import BeautifulSoup
import time
import urllib3

crop_list = [
    '甘藍', '結球白菜', '青江菜', '空心菜', '胡瓜', '絲瓜', 
    '蘿蔔', '胡蘿蔔', '青蔥', '香蕉', '番石榴', '鳳梨', 
    '荔枝', '紅龍果', '芒果', '文旦', '梨', '檸檬', '洋蔥', 
    '青花菜', '馬鈴薯', '萵苣', '南瓜', '甜椒', '蒜頭', 
    '木瓜', '葡萄', '毛豆', '蓮霧', '棗', '番荔枝', 
    '椪柑', '茂谷柑', '紅豆', '大豆', '落花生', '桶柑', 
    '海梨柑', '甘藷', '胡麻', '花椰菜', '茄子', '西瓜', 
    '洋香瓜', '甜柿', '龍眼', '梅', '(柳)橙', '番茄'
]
# 作物與 ID 的對照表
crop_id = dict()
def find_origin(query):
    d = datetime.now()
    # 一：取得作物 ID (cropUID)
    if not crop_id.get(query):   
        # 產生當下時間戳記
        query_time = int(time.time() * 1000)
        # 擷取所有作物的 ID 網站
        id_base_url = 'https://pbi.afa.gov.tw/AFABI_Open/ForecastProduct/ProductMap/New/?year='+ str(d.year) +'&cropUID=&querytime=' + str(query_time)
        if query in crop_list:
            try:
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
                response = requests.get(id_base_url, verify=False, timeout=15)
                response.encoding = 'utf-8'# 避免中文亂碼
                html_content = response.text
                soup = BeautifulSoup(html_content ,'html.parser')
                # 找到下拉選單 <select id="ddlcrop"> 中的所有選項 <option>
                data = soup.find('select', id = 'ddlcrop').find_all('option')
                #<option value="ID">名稱</option>
                for item in data:
                    name = item.string
                    id = item['value']
                    crop_id[name] = id
            except Exception as e:
                print(f"抓取作物 ID 失敗: {e}")
                return None
            
    # 二：查詢主要產地
    # 參數 range=1 表示全台，order=amount 表示按產量排序
    origin_base_url = 'https://pbi.afa.gov.tw/AFABI_Open/ForecastProduct/ProductMapTable/?year=' + str(d.year-1) + '&range=1&order=amount&cropUID='
    # 設定 Headers 偽裝成瀏覽器
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://pbi.afa.gov.tw/AFABI_Open/" 
    }

    if crop_id.get(query):
        try:
            query_time = int(time.time() * 1000)
            url = origin_base_url
            url += crop_id[query] + '&querytime=' + str(query_time)
            
            print(f"正在查詢產地 URL: {url}")
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            response = requests.get(url, headers=headers, verify=False, timeout=15)
            response.encoding = 'utf-8'
            html_content = response.text
            soup = BeautifulSoup(html_content ,'html.parser')
            
            data = soup.find_all('tr')
            # data[0][1]是表格資訊，data[2] 是產量第一名的縣市
            if len(data) > 2:
                col = data[2].find_all('td')[0]
                target_county = col.string
                print(target_county)
                return target_county
            else:
                print("找不到產地資料 (表格為空)")
                return None
        except Exception as e:
            print(f"爬取產地資料時發生錯誤: {e}")
            return None
    else:
        print(f"錯誤: 找不到 '{query}' 的作物代碼")
        return None