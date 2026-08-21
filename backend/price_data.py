import requests
import pandas as pd
import urllib3
import json
import re
from datetime import timedelta

crop_mapping = {
    '甘藍': '甘藍',     
    '結球白菜': '包心白菜', 
    '青江菜': '青江白菜',
    '空心菜': '蕹菜',  
    '胡瓜': '胡瓜',
    '絲瓜': '絲瓜',
    '蘿蔔': '蘿蔔',
    '胡蘿蔔': '胡蘿蔔',
    '青蔥': '青蔥',
    '洋蔥': '洋蔥',
    '青花菜': '青花苔', 
    '馬鈴薯': '馬鈴薯',
    '萵苣': '萵苣菜',
    '南瓜': '南瓜',
    '甜椒': '甜椒',
    '蒜頭': '大蒜',   
    '毛豆': '毛豆',
    '落花生': '落花生',
    '甘藷': '甘薯',       
    '花椰菜': '花椰菜',
    '茄子': '茄子',
    '番茄': '番茄',     
    
    '香蕉': '香蕉',
    '番石榴': '番石榴',  
    '鳳梨': '鳳梨',
    '荔枝': '荔枝',
    '紅龍果': '紅龍果', 
    '芒果': '芒果',
    '文旦': '柚子',    
    '梨': '梨',
    '木瓜': '木瓜',
    '葡萄': '葡萄',
    '蓮霧': '蓮霧',
    '棗': '棗子',        
    '番荔枝': '釋迦',   
    '椪柑': '椪柑',
    '茂谷柑': '茂谷柑',
    '桶柑': '桶柑',
    '西瓜': '西瓜',
    '洋香瓜': '洋香瓜',
    '甜柿': '柿子',     
    '龍眼': '龍眼',
    '梅': '梅',
    '(柳)橙': '甜橙',   
    '檸檬': '檸檬'   
}
crop_list = [
    '甘藍', '結球白菜', '青江菜', '空心菜', '胡瓜', '絲瓜', 
    '蘿蔔', '胡蘿蔔', '青蔥', '香蕉', '番石榴', '鳳梨', 
    '荔枝', '紅龍果', '芒果', '文旦', '梨', '檸檬', '洋蔥', 
    '青花菜', '馬鈴薯', '萵苣', '南瓜', '甜椒', '蒜頭', 
    '木瓜', '葡萄', '毛豆', '蓮霧', '棗', '番荔枝', 
    '椪柑', '茂谷柑', '紅豆', '大豆', '落花生', '桶柑', 
    '甘藷', '胡麻', '花椰菜', '茄子', '西瓜', 
    '洋香瓜', '甜柿', '龍眼', '梅', '(柳)橙', '番茄'
]
vegetable_name_list = [
    '蘿蔔', '胡蘿蔔', '馬鈴薯', '洋蔥', '青蔥', '韭菜', '大蒜', '竹筍', '萵苣莖', '芋', 
    '荸薺', '豆薯', '牛蒡', '蓮藕', '甘藷', '薑', '茭白筍', '菱角', '大心菜', 
    '蕎頭', '薯蕷', '蘆筍', '球莖甘藍', '芽菜類', '慈菇', '半天筍', '甘蔗筍', '金針筍', 
    '百合', '草石蠶', '半天花', '晚香玉筍', '甘藍', '小白菜', '包心白菜', '青江白菜', 
    '皇宮菜', '蕹菜', '芹菜', '菠菜', '萵苣菜', '芥菜', '芥藍菜', '茼蒿', '莧菜', '油菜', 
    '甘藷葉', '芫荽', '九層塔', '羅勒', '紅鳳菜', '塌棵菜', '茴香', '海菜', '巴西利', 
    '蕨菜', '西洋菜', '黑甜仔菜', '豬母菜', '人參葉', '珍珠菜', '香椿', '薺菜', '藤川七', 
    '黃秋葵', '樊花', '瓊花', '其他花類', '百果', '花椰菜', '胡瓜', '花胡瓜', '冬瓜', 
    '絲瓜', '苦瓜', '扁蒲', '茄子', '蕃茄', '甜椒', '豌豆', '菜豆', '敏豆', '蠶豆', 
    '萊豆', '豆', '毛豆', '青花苔', '越瓜', '南瓜', '隼人瓜', '瓜苗', '石蓮花', 
    '辣椒', '金針花', '洛神花', '花豆', '虎豆', '玉米', '落花生', '洋菇', '草菇', 
    '濕木耳', '濕香菇', '金絲菇', '蠔菇', '巴西蘑菇', '松茸', '秀珍菇', '杏鮑菇', 
    '鴻禧菇', '珊瑚菇', '猴頭菇', '柳松菇', '其他菇類', '鹹菜', '雪裡紅', '榨菜', 
    '蘿蔔乾', '醃瓜', '熟筍', '桶筍', '筍乾', '筍絲', '筍片', '筍茸', '朴菜', '其他', 
    '進口','甘薯'
]
fruit_name_list = [
    '香蕉', '鳳梨', '椪柑', '茂谷柑', '虎頭柑', '紅柑', '溫州柑', '佛利檬', '豔陽柑', 
    '桶柑', '海梨', '甜橙', '雜柑', '蛋黃果', '黃金果', '酪梨', '奇異果', '香瓜梨', 
    '香櫞', '橄欖', '栗子', '波羅蜜', '柚子', '葡萄柚', '西施柚', '木瓜', '荔枝', '龍眼', 
    '枇杷', '楊桃', '李', '梨', '番石榴', '蓮霧', '芒果', '葡萄', '西瓜', '甜瓜', 
    '洋香瓜', '蘋果', '桃子', '柿子', '椰子', '棗子', '釋迦', '梅', '楊梅', '桑椹', 
    '草莓', '藍莓', '百香果', '甘蔗', '小番茄', '火龍果', '蜜棗', '櫻桃', '石榴', 
    '榴槤', '山竹', '紅毛丹','檸檬', '其他'
]

def product_data(query,start,end):
    trans_query = crop_mapping.get(query)
    products = dict()

    if not trans_query:
        print(f"警告：找不到 {query} 對應的交易類別名稱")
        return products

    end_dt = end
    start_dt = start

    #轉換種類代碼
    tctype = 'N05'
    if trans_query in fruit_name_list:
        tctype = 'N05'
    if trans_query in vegetable_name_list:
        tctype = 'N04'

    #每次擷取7日的資料
    step_days = 7 
    current_start_dt = start_dt

    while current_start_dt < end_dt:
        # 計算這一輪的結束日期
        current_end_dt = current_start_dt + timedelta(days=step_days)
        if current_end_dt > end_dt:
            current_end_dt = end_dt
        # 轉換日期格式為民國年
        roc_year_s = current_start_dt.year - 1911
        s_date_str = f"{roc_year_s}.{current_start_dt.month:02d}.{current_start_dt.day:02d}"
        roc_year_e = current_end_dt.year - 1911
        e_date_str = f"{roc_year_e}.{current_end_dt.month:02d}.{current_end_dt.day:02d}"
        # 組合 API 網址
        product_api = f'https://data.moa.gov.tw/api/v1/AgriProductsTransType/?Start_time={s_date_str}&End_time={e_date_str}&CropName={trans_query}&TcType={tctype}'
        
        try:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            response = requests.get(product_api, verify=False, timeout=15)
            
            if response.status_code == 200:
                if not response.text:
                    #回傳空字串
                    print("API response none")
                else:
                    data = response.json() 
                    
                    if data and 'Data' in data and len(data['Data']) > 0:                        
                        for product in data['Data']:
                            # 數值轉型 
                            product['Avg_Price'] = pd.to_numeric(product['Avg_Price'], errors='coerce')
                            product['Trans_Quantity'] = pd.to_numeric(product['Trans_Quantity'], errors='coerce')
                            
                            now_date = product['TransDate']
                            raw_name = product['CropName']

                            if re.search('休市', raw_name):
                                continue

                            if re.search(trans_query, raw_name):
                                price = product['Avg_Price']
                                quantity = product['Trans_Quantity']

                                product_dict = products.setdefault(query, dict())
                                old = product_dict.get(now_date,[0,0])
                                # [累計總金額, 累計總交易量]
                                product_dict[now_date] = [old[0] + price*quantity, old[1] + quantity] 
                    else:
                        print("API response []")
        except requests.exceptions.RequestException as e:
            print(f"network connect error: {e}")
        except json.JSONDecodeError:
            print("error: no API response")
            print(f"API response: {response.text[:500]}")
        
        current_start_dt = current_end_dt + timedelta(days=1)
        
    if len(products) > 0:
        print(f"成功取得 {len(products.get(query, {}))} 天的交易資料")
    else:
        print("無資料")
    return products

