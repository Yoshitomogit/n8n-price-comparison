#!/usr/bin/env python3
"""
Janpara Price Comparison Script
Reads Janpara data from a JSON file and compares prices with Rakuten Ichiba.
"""

import os
import json
import re
import requests
from datetime import datetime

# Settings
RAKUTEN_APP_ID = os.environ.get('RAKUTEN_APP_ID')
JANPARA_DATA_FILE = 'janpara_data.json'

# Keywords to exclude for Rakuten search (Accessories etc.)
EXCLUDE_KEYWORDS = [
    'ケース', 'カバー', 'フィルム', 'ガラス', 'シート',
    'ストラップ', 'ホルダー', 'スタンド', 'ポーチ', 'バンド',
    'シール', 'ステッカー', 'リング', 'グリップ', 'アクセサリー',
    'クロス', 'シンプル', 'レジン', 'デコ', 'ELECOM', 'エレコム',
    '充電器', 'ケーブル', 'イヤホン', 'クリーナー', '100円',
    'レンタル'
]

def extract_model_number(name: str) -> str:
    """Extract model number (e.g., MTMK3J/A) from product name."""
    # Pattern for Apple model numbers often looking like MTMK3J/A or similar
    # Simple pattern: alphanumeric string with 5+ chars, usually uppercase
    # But specifically for iPhone, usually starts with M or N, ends with J/A etc.
    match = re.search(r'[A-Z0-9]{5,}J/A', name)
    if match:
        return match.group(0)
    return None

def fetch_rakuten_products(keyword: str, min_price: int = 0) -> list:
    """Search products on Rakuten API."""
    if not RAKUTEN_APP_ID:
        print("Error: RAKUTEN_APP_ID environment variable is not set.")
        return []

    url = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"
    params = {
        'applicationId': RAKUTEN_APP_ID,
        'keyword': keyword,
        'hits': 10, # Get multiple candidates as requested
        'sort': '+itemPrice', # Sort by price ascending to find cheapest
    }
    
    if min_price > 0:
        params['minPrice'] = min_price

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get('Items', [])
    except requests.exceptions.RequestException as e:
        print(f"Rakuten API Request Error: {e}")
        return []

def filter_rakuten_items(items: list, exclude_keywords: list, min_price: int) -> list:
    """Filter out accessories and low price items."""
    filtered = []
    for item_container in items:
        item = item_container['Item']
        name = item['itemName']
        price = item['itemPrice']
        
        # Check exclusion keywords
        if any(kw in name for kw in exclude_keywords):
            continue
            
        if price < min_price:
            continue
            
        filtered.append({
            'name': name,
            'price': price,
            'url': item['itemUrl'],
            'shop': item['shopName']
        })
    return filtered

def main():
    print("Loading Janpara data...")
    if not os.path.exists(JANPARA_DATA_FILE):
        print(f"File {JANPARA_DATA_FILE} not found.")
        return

    with open(JANPARA_DATA_FILE, 'r', encoding='utf-8') as f:
        janpara_items = json.load(f)

    for j_item in janpara_items:
        print("\n" + "="*60)
        
        # New format: flat list of items
        janpara_name = j_item.get('name')
        janpara_price = j_item.get('price')
        
        # Fallback for old format if needed (optional)
        if not janpara_name:
             janpara_name = j_item.get('janpara_used_name') or j_item.get('janpara_unused_name')
             janpara_price = j_item.get('janpara_used_price') or j_item.get('janpara_unused_price')
        
        if not janpara_name:
            print("Skipping item with no name.")
            continue
            
        print(f"Janpara Item: {janpara_name}")
        print(f"Condition: {j_item.get('condition', 'Unknown')}")
        print(f"Janpara Price: {janpara_price:,} JPY")
        
        # Try to find model number for more precise search
        model_number = extract_model_number(janpara_name)
        search_query = model_number if model_number else janpara_name
        
        # If using full name, it might be too long or noisy, try to simplify if no model number?
        # For now let's try model number first, if not found, use a part of the name or search term
        if not model_number:
            # Fallback to search_term + capacity if available in name
            # Simple heuristic: "iPhone 15" + "128GB"
            base_term = j_item.get('search_term', 'iPhone')
            capacity_match = re.search(r'\d+GB', janpara_name)
            if capacity_match:
                search_query = f"{base_term} {capacity_match.group(0)}"
            else:
                search_query = base_term

        print(f"Searching Rakuten for: '{search_query}'")
        
        # Set a min price to avoid accessories (e.g. 50% of Janpara price)
        min_search_price = int(janpara_price * 0.5) if janpara_price else 10000
        
        rakuten_raw_items = fetch_rakuten_products(search_query, min_price=min_search_price)
        rakuten_candidates = filter_rakuten_items(rakuten_raw_items, EXCLUDE_KEYWORDS, min_search_price)
        
        if not rakuten_candidates:
            print("No matching products found on Rakuten.")
        else:
            print(f"Found {len(rakuten_candidates)} candidates on Rakuten:")
            for i, r_item in enumerate(rakuten_candidates[:5]): # Show top 5
                diff = r_item['price'] - janpara_price
                print(f"\n  Candidate {i+1}:")
                print(f"  Name: {r_item['name'][:60]}...")
                print(f"  Price: {r_item['price']:,} JPY (Diff: {diff:+,} JPY)")
                print(f"  URL: {r_item['url']}")

if __name__ == "__main__":
    main()
