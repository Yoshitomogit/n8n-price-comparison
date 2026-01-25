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

# 設定
RAKUTEN_APP_ID = os.environ.get('RAKUTEN_APP_ID')
GOOGLE_SHEET_ID = os.environ.get('GOOGLE_SHEET_ID')
SEARCH_KEYWORD = os.environ.get('SEARCH_KEYWORD', 'iPhone 15')
PRICE_THRESHOLD = int(os.environ.get('PRICE_THRESHOLD', '2000'))
MIN_PRICE = int(os.environ.get('MIN_PRICE', '50000'))

# アクセサリー除外キーワード
EXCLUDE_KEYWORDS = [
    'ケース', 'カバー', 'フィルム', 'ガラス', 'シート',
    'ストラップ', 'ホルダー', 'スタンド', 'ポーチ', 'バンド',
    'シール', 'ステッカー', 'リング', 'グリップ', 'アクセサリー',
    'クロス', 'シンプル', 'レジン', 'デコ', 'ELECOM', 'エレコム',
    '充電器', 'ケーブル', 'イヤホン', 'クリーナー', '100円'
]


def fetch_rakuten_products(keyword: str) -> list:
    """楽天市場APIから商品を取得"""
    url = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"
    params = {
        'applicationId': RAKUTEN_APP_ID,
        'keyword': keyword,
        'hits': 30
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    items = data.get('Items', [])
    products = []
    
    for item in items:
        i = item['Item']
        name = i['itemName']
        price = i['itemPrice']
        
        # アクセサリー除外
        is_accessory = any(kw in name for kw in EXCLUDE_KEYWORDS)
        
        # 価格フィルター（本体のみ）
        if not is_accessory and price >= MIN_PRICE:
            products.append({
                'source': '楽天市場',
                'name': name,
                'price': price,
                'url': i['itemUrl'],
                'shop': i['shopName']
            })
    
    print(f"楽天市場: {len(products)} 件の商品を取得")
    return products


def fetch_mobile_ichiban_products() -> list:
    """モバイル一番の実際の買取価格データ（2026年1月時点）
    注意: サイトの価格は頻繁に変動するため、定期的な更新が必要です
    """
    products = [
        {
            'source': 'モバイル一番',
            'name': 'iPhone 15 128GB simフリー 未開封',
            'price': 83500,
            'url': 'https://www.mobile-ichiban.com/',
            'shop': 'モバイル一番'
        },
        {
            'source': 'モバイル一番',
            'name': 'iPhone 15 128GB simフリー 開封済み',
            'price': 72000,
            'url': 'https://www.mobile-ichiban.com/',
            'shop': 'モバイル一番'
        },
        {
            'source': 'モバイル一番',
            'name': 'iPhone 15 Pro 128GB simフリー 未開封',
            'price': 130000,
            'url': 'https://www.mobile-ichiban.com/',
            'shop': 'モバイル一番'
        },
        {
            'source': 'モバイル一番',
            'name': 'iPhone 15 Pro 128GB simフリー 開封済み',
            'price': 115000,
            'url': 'https://www.mobile-ichiban.com/',
            'shop': 'モバイル一番'
        },
        {
            'source': 'モバイル一番',
            'name': 'iPhone 15 Pro Max 256GB simフリー 未開封',
            'price': 155000,
            'url': 'https://www.mobile-ichiban.com/',
            'shop': 'モバイル一番'
        },
        {
            'source': 'モバイル一番',
            'name': 'iPhone 15 Pro Max 256GB simフリー 開封済み',
            'price': 143000,
            'url': 'https://www.mobile-ichiban.com/',
            'shop': 'モバイル一番'
        }
    ]
    print(f"モバイル一番: {len(products)} 件の商品を取得")
    return products


def compare_prices(rakuten_products: list, mobile_products: list) -> list:
    """価格を比較して差額が閾値以上の商品を抽出"""
    results = []
    
    for mobile in mobile_products:
        for rakuten in rakuten_products:
            price_diff = rakuten['price'] - mobile['price']
            
            if abs(price_diff) >= PRICE_THRESHOLD:
                results.append({
                    '比較日時': datetime.now().isoformat(),
                    '商品名_モバイル一番': mobile['name'],
                    '商品名_楽天': rakuten['name'],
                    '価格_モバイル一番': mobile['price'],
                    '価格_楽天': rakuten['price'],
                    '差額': price_diff,
                    'お得な方': 'モバイル一番' if price_diff > 0 else '楽天市場',
                    'URL_モバイル一番': mobile['url'],
                    'URL_楽天': rakuten['url']
                })
    
    print(f"価格差 {PRICE_THRESHOLD}円以上: {len(results)} 件")
    return results


def save_to_google_sheets(results: list):
    """Google Sheets に結果を保存"""
    # サービスアカウント認証情報を環境変数から取得
    creds_json = os.environ.get('GOOGLE_CREDENTIALS_JSON')
    
    if not creds_json:
        print("警告: Google認証情報がありません。結果をコンソールに出力します。")
        for r in results:
            print(r)
        return
    
    import json
    creds_dict = json.loads(creds_json)
    
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
    client = gspread.authorize(creds)
    
    # スプレッドシートを開く
    sheet = client.open_by_key(GOOGLE_SHEET_ID).worksheet('価格比較結果')
    
    # ヘッダーがなければ追加
    if sheet.row_count == 0 or sheet.cell(1, 1).value is None:
        headers = list(results[0].keys()) if results else []
        if headers:
            sheet.append_row(headers)
    
    # 結果を追加
    for r in results:
        row = list(r.values())
        sheet.append_row(row)
    
    print(f"Google Sheets に {len(results)} 件を保存しました")


def main():
    print("=" * 50)
    print("価格比較スクリプト開始")
    print(f"検索キーワード: {SEARCH_KEYWORD}")
    print(f"価格差閾値: {PRICE_THRESHOLD}円")
    print("=" * 50)
    
    # データ取得
    rakuten_products = fetch_rakuten_products(SEARCH_KEYWORD)
    mobile_products = fetch_mobile_ichiban_products()
    
    # 価格比較
    results = compare_prices(rakuten_products, mobile_products)
    
    # 結果保存
    if results:
        save_to_google_sheets(results)
    else:
        print("差額が閾値以上の商品は見つかりませんでした")
    
    print("完了！")


if __name__ == '__main__':
    main()
