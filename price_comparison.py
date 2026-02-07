#!/usr/bin/env python3
"""
価格比較スクリプト - GitHub Actions 用
楽天市場 vs モバイル一番 の価格を比較し、Google Sheets に出力
"""

import os
import requests
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
import asyncio
import re
import json
import time

# モジュールインポート
from scrape_mobile_ichiban import scrape_mobile_ichiban

# 設定
RAKUTEN_APP_ID = os.environ.get('RAKUTEN_APP_ID')
GOOGLE_SHEET_ID = os.environ.get('GOOGLE_SHEET_ID')
SEARCH_KEYWORD = os.environ.get('SEARCH_KEYWORD', 'iPhone 15')
# 差額閾値（マイナスも許容する場合は調整。今回は「利益が出るか」視点で設定）
# モバイル一番の買取価格 - 楽天の購入価格 > MIN_PROFIT
MIN_PROFIT = int(os.environ.get('MIN_PROFIT', '-5000')) # テスト用に少し緩めに設定

# アクセサリー除外キーワード
EXCLUDE_KEYWORDS = [
    'ケース', 'カバー', 'フィルム', 'ガラス', 'シート',
    'ストラップ', 'ホルダー', 'スタンド', 'ポーチ', 'バンド',
    'シール', 'ステッカー', 'リング', 'グリップ', 'アクセサリー',
    'クロス', 'シンプル', 'レジン', 'デコ', 'ELECOM', 'エレコム',
    '充電器', 'ケーブル', 'イヤホン', 'クリーナー', '100円',
    'レンタル', '中古', '展示品', '訳あり', 'SSD', 'HDD'
]

def extract_capacity(text: str) -> str:
    """テキストから容量(GB/TB)を抽出"""
    match = re.search(r'(\d+(?:GB|TB))', text, re.IGNORECASE)
    return match.group(1).upper() if match else None

def normalize_name(name: str) -> str:
    """商品名を正規化（比較用）"""
    # 全角英数字を半角に
    name = name.translate(str.maketrans({chr(0xFF01 + i): chr(0x21 + i) for i in range(94)}))
    return name.lower()

def fetch_rakuten_products(keyword: str) -> list:
    """楽天市場APIから商品を取得（新品のみ）"""
    url = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"
    
    # API search params
    base_params = {
        'applicationId': RAKUTEN_APP_ID,
        'keyword': keyword, # "iPhone 15"
        'hits': 30, # Max 30
        'minPrice': 80000, # Filter out used items/parts
        'genreId': 560202, # Smartphones
        'sort': '+itemPrice', # Cheapest first
    }
    
    products = []
    
    # Strict Keywords relevant for identifying a NEW Main Unit
    MUST_INCLUDE = ['iPhone 15'] # Must be the target model
    MUST_NOT_INCLUDE = EXCLUDE_KEYWORDS + ['パネル', '修理', '交換', '部品', 'ジャンク']
    
    # Fetch top 3 pages (90 items) to avoid 429
    for page in range(1, 4):
        params = base_params.copy()
        params['page'] = page
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            # 1秒待機（レートリミット対策）
            time.sleep(1) 
        except Exception as e:
            print(f"楽天APIエラー (page {page}): {e}")
            break
        
        items = data.get('Items', [])
        if not items:
            break
            
        print(f"Page {page}: {len(items)} items received")
        
        for item in items:
            i = item['Item']
            name = i['itemName']
            price = i['itemPrice']
            item_code = i['itemCode']
            
            # 1. Check strict excludes
            if any(kw in name for kw in MUST_NOT_INCLUDE):
                 continue

            # 2. Check strict includes
            if not all(kw in name for kw in MUST_INCLUDE):
                continue
                
            # 3. Check for specific "Used" keywords
            if '中古' in name:
                continue
                
            # 4. (Relaxed) Accept if "Used" is not present (and we filtered junk via price/keywords)
            # if '新品' not in name and '未開封' not in name:
            #      continue

            # 容量抽出
            capacity = extract_capacity(name)
            if not capacity:
                continue
                
            products.append({
                'source': '楽天市場',
                'name': name,
                'price': price,
                'capacity': capacity,
                'item_code': item_code,
                'url': i['itemUrl'],
                'shop': i['shopName']
            })
    
    print(f"楽天市場 (新品/厳選): {len(products)} 件の商品を取得")
    return products


def compare_prices(rakuten_products: list, mobile_products: list) -> list:
    """価格を比較してリストを作成"""
    results = []
    
    print("\n--- マッチング開始 ---")
    
    # モバイル一番の商品一つ一つに対して、楽天の最安値を探す
    for mobile in mobile_products:
        mobile_name_norm = normalize_name(mobile['name'])
        mobile_capacity = mobile['capacity']
        best_match = None
        max_profit = -99999999
        
        # モバイル一番の商品名からモデル名（iPhone 15 Pro Maxなど）を特定する簡易ロジック
        base_model_name = mobile['name'].replace(mobile['capacity'], '').replace('simfree', '').replace('未開封', '').replace('開封', '').strip()
        base_model_parts = base_model_name.lower().split()
        
        for rakuten in rakuten_products:
            # 容量不一致はスキップ
            if rakuten['capacity'] != mobile_capacity:
                continue
                
            rakuten_name_norm = normalize_name(rakuten['name'])
            
            # モデル名マッチング
            if all(part in rakuten_name_norm for part in base_model_parts):
                
                # 利益計算: 買取価格 - 購入価格
                profit = mobile['price'] - rakuten['price']
                
                # 最も利益が出る（＝楽天が最も安い）ものを選択
                if profit > max_profit:
                    max_profit = profit
                    best_match = rakuten
        
        if best_match:
            # 識別コードの生成 (MobileCode + RakutenCode)
            id_code = f"{mobile.get('code', 'N/A')}_{best_match['item_code']}"
            
            # 結果に追加
            results.append({
                '商品名': mobile['name'],              # Mobile Ichiban Product Name
                'GB容量': mobile_capacity,             # Capacity
                '状態': '新品',                        # Condition (Target: New)
                'モバイル一番買取価格': mobile['price'], # Buyback Price
                '楽天購入価格': best_match['price'],    # Purchase Price
                '識別コード': id_code,                 # Identification Code
                '差益': max_profit,
                '楽天URL': best_match['url'],
                'モバイル一番URL': mobile['url']
            })
            print(f"Match: {mobile['name']} <-> {best_match['name']} (差益: {max_profit}円)")
    
    # 差益の大きい順にソート
    results.sort(key=lambda x: x['差益'], reverse=True)
    
    print(f"\n比較結果: {len(results)} 件のペアを作成")
    return results


def save_to_google_sheets(results: list):
    """Google Sheets に結果を保存"""
    creds_json = os.environ.get('GOOGLE_CREDENTIALS_JSON')
    
    if not creds_json:
        print("警告: Google認証情報がありません。結果をコンソールに出力します。")
        for r in results:
            print(r)
        return
    
    try:
        creds_dict = json.loads(creds_json)
        
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        
        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        client = gspread.authorize(creds)
        
        # スプレッドシートを開く
        sheet = client.open_by_key(GOOGLE_SHEET_ID).worksheet('価格比較結果')
        
        # 既存データをクリア
        sheet.clear()
        
        # ヘッダー追加
        if results:
            headers = list(results[0].keys())
            sheet.append_row(headers)
            
            # データ追加
            rows = [list(r.values()) for r in results]
            sheet.append_rows(rows)
            
        print(f"Google Sheets に {len(results)} 件を保存しました")
        
    except Exception as e:
        print(f"Google Sheets 保存エラー: {e}")


async def main_async():
    print("=" * 50)
    print("価格比較スクリプト開始")
    print(f"検索キーワード: {SEARCH_KEYWORD}")
    print("=" * 50)
    
    # 1. モバイル一番からデータ取得 (Scraping)
    mobile_products = await scrape_mobile_ichiban(SEARCH_KEYWORD)
    
    # データがなければ終了
    if not mobile_products:
        print("モバイル一番から商品を取得できませんでした")
        return

    # 2. 楽天市場からデータ取得 (API)
    rakuten_products = fetch_rakuten_products(SEARCH_KEYWORD)
    
    # 3. 価格比較とマッチング
    results = compare_prices(rakuten_products, mobile_products)
    
    # 4. 結果保存
    if results:
        save_to_google_sheets(results)
    else:
        print("比較可能な商品ペアが見つかりませんでした")
    
    print("完了！")

def main():
    asyncio.run(main_async())

if __name__ == '__main__':
    main()
