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
                        
                        # 新品価格（3列目）
                        new_price_cell = cells[2]
                        new_price_text = await new_price_cell.inner_text()
                        
                        # 中古価格（4列目）
                        used_price_cell = cells[3]
                        used_price_text = await used_price_cell.inner_text()
                        
                        # 価格を数値に変換
                        def parse_price(text):
                            match = re.search(r'([\d,]+)', text)
                            if match:
                                return int(match.group(1).replace(',', ''))
                            return None
                        
                        new_price = parse_price(new_price_text)
                        used_price = parse_price(used_price_text)
                        
                        # 新品価格がある場合
                        if new_price and new_price >= 50000:
                            products.append({
                                'source': 'モバイル一番',
                                'name': f"{name} (新品/未開封)",
                                'price': new_price,
                                'url': 'https://www.mobile-ichiban.com/',
                                'shop': 'モバイル一番',
                                'condition': '新品・未開封'
                            })
                        
                        # 中古価格がある場合
                        if used_price and used_price >= 50000:
                            products.append({
                                'source': 'モバイル一番',
                                'name': f"{name} (中古/開封済み)",
                                'price': used_price,
                                'url': 'https://www.mobile-ichiban.com/',
                                'shop': 'モバイル一番',
                                'condition': '中古・開封済み'
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


async def main():
    """メイン関数"""
    print("=" * 50)
    print("モバイル一番 スクレイピング開始")
    print("=" * 50)
    
    products = await scrape_mobile_ichiban("iPhone 15")
    
    print("\n=== 取得した商品 ===")
    for i, p in enumerate(products, 1):
        print(f"{i}. {p['name']}")
        print(f"   価格: {p['price']:,}円")
        print()
    
    # JSONファイルに保存
    output_file = "mobile_ichiban_prices.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"結果を {output_file} に保存しました")
    
    return products


if __name__ == '__main__':
    asyncio.run(main())
