import requests
from bs4 import BeautifulSoup
import re

def inspect():
    url = "https://www.recommerce.co.jp/expensive/search_result.php?word=iPhone+15"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.encoding = response.apparent_encoding
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find product items. Based on typical structures, look for list items.
        # Often search results are in a list or div with class 'result', 'item', 'product', etc.
        # I will print the classes of div elements to guess.
        
        print("--- Page Title ---")
        print(soup.title.string if soup.title else "No title")
        
        print("\n--- Potential Item Containers (checking common classes) ---")
        # Look for divs that contain the price "円"
        price_tags = soup.find_all(string=re.compile(r"円"))
        for tag in price_tags[:3]:
            parent = tag.parent
            print(f"Found price text: {tag.strip()}")
            print(f"Parent tag: {parent.name}, Classes: {parent.get('class')}")
            # Go up to find the item container
            container = parent.find_parent('div')
            if container:
                 print(f"Container tag: {container.name}, Classes: {container.get('class')}")
                 print(f"Container content snippet: {container.text[:100].strip()}...")
            print("-" * 20)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect()
