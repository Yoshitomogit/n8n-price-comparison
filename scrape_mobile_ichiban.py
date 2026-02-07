#!/usr/bin/env python3
"""
モバイル一番 スクレイピングスクリプト（改善版）
Playwright を使用して動的コンテンツから価格を取得
"""

import asyncio
import json
import re
from playwright.async_api import async_playwright


async def scrape_mobile_ichiban(search_keyword: str = "iPhone 15") -> list:
    """
    モバイル一番から商品価格をスクレイピング
    
    Args:
        search_keyword: 検索キーワード（デフォルト: iPhone 15）
    
    Returns:
        商品リスト [{'name': ..., 'price': ..., 'url': ...}, ...]
    """
    products = []
    
    async with async_playwright() as p:
        # ブラウザ起動（ヘッドレスモード）
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # モバイル一番のサイトにアクセス
            print(f"サイトにアクセス中: https://www.mobile-ichiban.com/")
            await page.goto("https://www.mobile-ichiban.com/", timeout=30000)
            await page.wait_for_load_state("networkidle")
            
            # 検索ボックスに入力（正しいセレクタを使用）
            print(f"検索中: {search_keyword}")
            search_input = await page.query_selector('#G01SearchIpt')
            if search_input:
                await search_input.fill(search_keyword)
                
                # 検索ボタンをクリック
                search_button = await page.query_selector('#G01Searchbtn')
                if search_button:
                    await search_button.click()
                else:
                    await search_input.press("Enter")
                
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)  # 結果読み込み待ち
            else:
                print("検索ボックスが見つかりません")
            
            # リストビューに切り替え
            print("リストビューに切り替え中...")
            list_view_button = await page.query_selector('#g01List')
            if list_view_button:
                await list_view_button.click()
                await asyncio.sleep(2)
            
            # スクロールして全ての結果を読み込む
            await page.mouse.wheel(0, 500)
            await asyncio.sleep(1)
            
            # テーブルから価格情報を取得
            print("価格情報を取得中...")
            
            # tr.first_Tr から商品情報を取得
            rows = await page.query_selector_all('tr.first_Tr')
            print(f"見つかった行数: {len(rows)}")
            
            for row in rows:
                try:
                    # 各列を取得
                    cells = await row.query_selector_all('td')
                    if len(cells) >= 4:
                        # 商品名（2列目）
                        name_cell = cells[1]
                        name = await name_cell.inner_text()
                        name = name.strip()
                        
                        # 容量の抽出 (例: 128GB, 256GB, 512GB, 1TB)
                        capacity_match = re.search(r'(\d+(?:GB|TB))', name, re.IGNORECASE)
                        capacity = capacity_match.group(1).upper() if capacity_match else "不明"
                        
                        # 新品価格セルの処理
                        new_price_cell = cells[2]
                        # IDから商品コードを抽出 (例: NewPrice_S004221 -> S004221)
                        # Playwrightのevaluateを使ってID属性を取得
                        cell_id = await new_price_cell.get_attribute('id')
                        product_code = ""
                        if cell_id and '_' in cell_id:
                            product_code = cell_id.split('_')[1]
                        
                        new_price_text = await new_price_cell.inner_text()
                        
                        # 価格を数値に変換
                        def parse_price(text):
                            match = re.search(r'([\d,]+)', text)
                            if match:
                                return int(match.group(1).replace(',', ''))
                            return None
                        
                        new_price = parse_price(new_price_text)
                        # 新品価格があり、かつ30000円以上の場合のみ抽出
                        if new_price and new_price >= 30000:
                            products.append({
                                'source': 'モバイル一番',
                                'name': name,
                                'capacity': capacity,
                                'price': new_price,
                                'code': product_code,
                                'url': 'https://www.mobile-ichiban.com/',
                                'shop': 'モバイル一番',
                                'condition': '新品・未開封'
                            })
                            
                except Exception as e:
                    print(f"行の解析エラー: {e}")
                    continue
            
            print(f"取得した商品数: {len(products)}")
            
        except Exception as e:
            print(f"スクレイピングエラー: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()
    
    return products


import argparse
import sys

# Logging helper
def log(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

async def scrape_mobile_ichiban(search_keyword: str = None, min_price: int = None, json_mode: bool = False) -> list:
    """
    モバイル一番から商品価格をスクレイピング
    """
    # Load config if arguments not provided
    if not search_keyword or min_price is None:
        try:
            with open('search_config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
                if not search_keyword:
                    search_keyword = config.get('keyword', 'iPhone 15')
                if min_price is None:
                    min_price = config.get('min_price', 30000)
        except FileNotFoundError:
            search_keyword = search_keyword or 'iPhone 15'
            min_price = min_price if min_price is not None else 30000

    products = []
    
    # Customize logger based on mode
    def log_msg(msg):
        if not json_mode:
            print(msg)
        else:
            log(msg)

    async with async_playwright() as p:
        # ブラウザ起動（ヘッドレスモード）
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            log_msg(f"サイトにアクセス中: https://www.mobile-ichiban.com/")
            await page.goto("https://www.mobile-ichiban.com/", timeout=30000)
            await page.wait_for_load_state("networkidle")
            
            log_msg(f"検索中: {search_keyword}")
            search_input = await page.query_selector('#G01SearchIpt')
            if search_input:
                await search_input.fill(search_keyword)
                
                search_button = await page.query_selector('#G01Searchbtn')
                if search_button:
                    await search_button.click()
                else:
                    await search_input.press("Enter")
                
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
            else:
                log_msg("検索ボックスが見つかりません")
            
            log_msg("リストビューに切り替え中...")
            list_view_button = await page.query_selector('#g01List')
            if list_view_button:
                await list_view_button.click()
                await asyncio.sleep(2)
            
            await page.mouse.wheel(0, 500)
            await asyncio.sleep(1)
            
            log_msg("価格情報を取得中...")
            rows = await page.query_selector_all('tr.first_Tr')
            log_msg(f"見つかった行数: {len(rows)}")
            
            for row in rows:
                try:
                    cells = await row.query_selector_all('td')
                    if len(cells) >= 4:
                        name_cell = cells[1]
                        
                        # リンクの取得
                        product_url = "https://www.mobile-ichiban.com/"
                        try:
                            link_element = await name_cell.query_selector('a')
                            if link_element:
                                href = await link_element.get_attribute('href')
                                if href:
                                    if href.startswith('http'):
                                        product_url = href
                                    else:
                                        # 相対パスの解決
                                        base_url = "https://www.mobile-ichiban.com"
                                        product_url = f"{base_url}{href}" if href.startswith('/') else f"{base_url}/{href}"
                        except Exception as e:
                            log_msg(f"URL extraction error: {e}")

                        name = await name_cell.inner_text()
                        name = name.strip()
                        
                        capacity_match = re.search(r'(\d+(?:GB|TB))', name, re.IGNORECASE)
                        capacity = capacity_match.group(1).upper() if capacity_match else "不明"
                        
                        new_price_cell = cells[2]
                        cell_id = await new_price_cell.get_attribute('id')
                        product_code = ""
                        if cell_id and '_' in cell_id:
                            product_code = cell_id.split('_')[1]
                        
                        new_price_text = await new_price_cell.inner_text()
                        
                        def parse_price(text):
                            match = re.search(r'([\d,]+)', text)
                            if match:
                                return int(match.group(1).replace(',', ''))
                            return None
                        
                        new_price = parse_price(new_price_text)
                        
                        # 新品価格があり、かつ30000円以上の場合のみ抽出
                        if new_price and new_price >= 30000:
                            products.append({
                                'source': 'モバイル一番',
                                'name': name,
                                'capacity': capacity,
                                'price': new_price,
                                'code': product_code,
                                'url': f"{product_url}#{product_code}" if product_code else product_url,
                                'shop': 'モバイル一番',
                                'condition': '新品・未開封'
                            })
                        else:
                            log_msg(f"  [SKIP] {name} | Price: {new_price} (Limit: {min_price})")
                            
                except Exception as e:
                    log_msg(f"行の解析エラー: {e}")
                    import traceback
                    if not json_mode:
                        traceback.print_exc()
                    continue
            
            log_msg(f"取得した商品数: {len(products)}")
            
        except Exception as e:
            log_msg(f"スクレイピングエラー: {e}")
            import traceback
            if not json_mode:
                traceback.print_exc()
            else:
                traceback.print_exc(file=sys.stderr)
        finally:
            await browser.close()
    
    return products


async def main():
    parser = argparse.ArgumentParser(description='Scrape Mobile Ichiban prices.')
    parser.add_argument('--json', action='store_true', help='Output results in JSON format only')
    parser.add_argument('--keyword', type=str, default='iPhone 15', help='Search keyword')
    args = parser.parse_args()

    if not args.json:
        print("=" * 50)
        print("モバイル一番 スクレイピング開始")
        print("=" * 50)
    
    products = await scrape_mobile_ichiban(args.keyword if args.keyword != 'iPhone 15' else None, json_mode=args.json)
    
    if args.json:
        # Strict JSON output to stdout
        print(json.dumps(products, ensure_ascii=False))
    else:
        print("\n=== 取得した商品 ===")
        for i, p in enumerate(products, 1):
            print(f"{i}. {p['name']}")
            print(f"   価格: {p['price']:,}円")
            print()
        
        # Save to file as backup even in normal mode
        output_file = "mobile_ichiban_prices.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print(f"結果を {output_file} に保存しました")

if __name__ == '__main__':
    asyncio.run(main())
