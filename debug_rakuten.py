
import os
import requests
import json

RAKUTEN_APP_ID = os.environ.get('RAKUTEN_APP_ID')

def debug_rakuten(keyword):
    url = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"
    params = {
        'applicationId': RAKUTEN_APP_ID,
        'keyword': keyword,
        'hits': 30,
        'minPrice': 50000,
        #'itemCondition': 1, # New (Seems unreliable)
        'genreId': 560202,
        'sort': '+itemPrice',
    }
    
    print(f"Requesting Rakuten API with keyword: {keyword}")
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code != 200:
        print(response.text)
        return

    data = response.json()
    print(f"Total Count: {data.get('count', 0)}")
    
    items = data.get('Items', [])
    print(f"Items received: {len(items)}")
    
    for i, item in enumerate(items[:5]):
        print(f"[{i}] {item['Item']['itemName']} - {item['Item']['itemPrice']} yen - Genre: {item['Item']['genreId']}")

if __name__ == "__main__":
    debug_rakuten("iPhone 15 新品")
