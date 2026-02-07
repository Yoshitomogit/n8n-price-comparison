# じゃんぱら Parse Prices 問題の調査結果

## 現象
- **症状**: 2件しか商品が表示されない（本来は多数表示されるはず）
- **対象ワークフロー**: Janpara Price Scraper (`janpara_price_scraper.json`)

---

## 調査で判明した原因

### 1. **HTMLレスポンスの取得先が不確定**
n8n の HTTP Request ノードは、Response Format が "text" の場合、レスポンスを以下のいずれかのフィールドに格納する可能性があります：
- `body`
- `data` 
- `response`
- その他（バージョンやオプションにより異なる）

現状のコードは `item.json.data || item.json.body` のみを参照しており、別のフィールドに格納されていると **空文字列** になり、パース対象が空になります。

### 2. **SOLD OUT 商品の扱い**
じゃんぱらのHTMLでは：
- **在庫あり**: `<div class="item_amount">¥68,980～</div>` が存在
- **SOLD OUT**: `item_amount` がなく、`<div class="search_nostock">SOLD OUT</div>` のみ

SOLD OUT は `price = 0` となり、`price > 10000` フィルタで除外されます。**これは正しい動作**ですが、ページの多くが SOLD OUT だと、表示件数が少なくなります。

### 3. **検索キーワードの部分一致**
- 検索語 "iPhone 15" → `searchKeywords = ["iphone", "15"]` → 商品名に両方含まれる必要あり ✅
- 検索語 "iPhone15"（スペースなし）→ `searchKeywords = ["iphone15"]` → 商品名 "iPhone 15 128GB" は `"iphone15"` を含まない ❌

スペースの有無でマッチしなくなる可能性があります。

### 4. **サイトの JavaScript 依存について**
調査の結果、**じゃんぱらの販売検索結果ページはサーバーサイドレンダリング**です。商品リストは初期HTMLに含まれており、JavaScript で動的に読み込んでいるわけではありません。ブラウザ自動化（Playwright 等）は不要です。

### 5. **ボット検知の可能性**
User-Agent は設定されていますが、Accept / Accept-Language / Referer 等がないと、サーバーが簡易版のHTMLを返す可能性があります。

---

## 対策の方向性

1. **HTML取得の強化**: 複数フィールド・ネスト構造に対応
2. **検索キーワードの正規化**: スペース除去での部分一致オプション
3. **HTTP Request のヘッダー強化**: ブラウザ相当のヘッダーを付与
4. **デバッグ出力の追加**: 取得HTML長・ブロック数・フィルタ結果を最初のアイテムに付与
5. **Response Format の明示**: n8n のオプション構造を確認し、確実にテキストを取得

---

## 実施した対策（2026年2月）

1. **ORDER=3 の追加**: 商品名順で並べ替え、在庫あり商品を優先表示
2. **ページネーションの追加**: 「📄 ページ展開 (1〜4ページ)」ノードで 1〜4 ページを取得し、最大約 48 件を取得
3. **レート制限対策**: HTTP Request に 2 秒間隔のバッチ処理を設定

## 今後の拡張案（買取価格 vs 販売価格の比較）

- **販売価格**: 現在の `janpara_price_scraper.json`（sale/search/result）
- **買取価格**: `rakuten_price_comparison.json` 内のじゃんぱら取得（buy/search/result）

同じスペック（JAN/型番）で両者を突き合わせ、買取価格と販売価格の差益を計算する運用が可能です。
