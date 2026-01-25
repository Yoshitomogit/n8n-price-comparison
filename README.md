# n8n 楽天市場 vs Amazon ReCommerce 価格比較ワークフロー

Docker Composeで構築されたn8n環境で、楽天市場API（販売価格）とAmazon ReCommerce（買取価格）を比較し、差益（買取 - 販売）が2,000円以上の商品をGoogle Sheetsに出力するワークフローです。

## 📁 ファイル構成

```
n8n/
├── docker-compose.yml          # Docker設定
├── n8n_data/                   # データ永続化フォルダ（自動作成）
├── rakuten_price_comparison.json  # ワークフローJSON
├── test_recommerce_scraping.js # スクレイピングテスト用スクリプト
└── README.md                   # このファイル
```

## 🚀 セットアップ手順

### 1. n8nを起動

```bash
docker compose up -d
```

### 2. ブラウザでアクセス

[http://localhost:5678](http://localhost:5678) を開き、Owner Accountを作成

### 3. ワークフローをインポート

1. 左メニュー「Workflows」→「Add Workflow」→「Import from File」
2. `rakuten_price_comparison.json` を選択

### 4. 設定を変更

以下の値を実際の値に置き換えてください：

| ノード | 設定項目 | 説明 |
|--------|---------|------|
| 🔧 検索パラメータ設定 | `applicationId` | 楽天アプリID |
| 🔧 検索パラメータ設定 | `keyword` | 検索キーワード (例: iPhone 15) |
| 📝 Google Sheets出力 | `documentId` | スプレッドシートID |

### 5. Google Sheets認証（オプション）

1. 「Credentials」→「Add Credential」→「Google Sheets OAuth2」
2. Google Cloud Consoleで認証情報を作成
3. 認証完了後、📝ノードで認証情報を選択

## 🔧 楽天アプリIDの取得方法

1. [楽天Webサービス](https://webservice.rakuten.co.jp/) にアクセス
2. 楽天会員でログイン
3. 「アプリID発行」からアプリを登録
4. 発行されたアプリIDをワークフローに設定

## 📊 ワークフロー構成

```
⏰ 定期実行 → 🔧 パラメータ設定 ─┬→ 🛒 楽天API    → 📦 データ整形 ─┐
                                └→ 🕷️ Amazon買取 → 📦 データ整形 ─┤
                                                                    └→ 🔄 統合 → 📊 利益計算 → ✅ フィルタ → 📝 Sheets
```

## ⚠️ 注意事項

- **モバイル一番のスクレイピング**: サイト構造が変わると動作しなくなる可能性があります
- **楽天API制限**: 1秒あたり1リクエストまで
- **Google Sheets**: 事前にスプレッドシートを作成し、「価格比較結果」シートを追加してください

## 🛠️ よく使うコマンド

```bash
# 起動
docker compose up -d

# 停止
docker compose down

# ログ確認
docker compose logs -f

# 再起動
docker compose restart
```

## 📝 出力例

| 比較日時 | モデル | 容量 | 商品名_Amazon | 商品名_楽天 | 買取価格_Amazon | 販売価格_楽天 | 想定差益 |
|---------|-------|------|--------------|------------|---------------|------------|---------|
| 2026-01-25 | iPhone 15 Pro Max | 256GB | Apple iPhone 15 Pro Max 256GB | iPhone 15 Pro Max 256GB | 155,000 | 145,000 | 10,000 |
