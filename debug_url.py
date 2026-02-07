
import requests
import os

RAKUTEN_APP_ID = '1004649499121188262'
keyword = "iPhone 15 新品"
url = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"
params = {
    'applicationId': RAKUTEN_APP_ID,
    'keyword': keyword,
    'hits': 30
}

req = requests.Request('GET', url, params=params)
prepared = req.prepare()

try:
    response = requests.Session().send(prepared)
    print(f"Status: {response.status_code}")
    print(f"Request Headers: {prepared.headers}")
    print(f"Response: {response.text}")
except Exception as e:
    print(e)

