# n8n 楽天市場 vs モバイル一番 価格比較ワークフロー

Docker Composeで構築されたn8n環境で、楽天市場APIとモバイル一番の価格を比較し、差額2,000円以上の商品をGoogle Sheetsに出力するワークフローです。

## 📁 ファイル構成

```
n8n/
├── docker-compose.yml          # Docker設定
├── n8n_data/                   # データ永続化フォルダ（自動作成）
├── rakuten_price_comparison.json  # ワークフローJSON
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
| 🔧 検索パラメータ設定 | `keyword` | 検索キーワード |
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
                                └→ 🕷️ モバイル一番 → 📦 データ整形 ─┤
                                                                    └→ 🔄 統合 → 📊 価格比較 → ✅ フィルタ → 📝 Sheets
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

| 比較日時 | 商品名_モバイル一番 | 商品名_楽天 | 価格_モバイル一番 | 価格_楽天 | 差額 | お得な方 |
|---------|-------------------|------------|-----------------|---------|------|---------|
| 2026-01-22 | iPhone 15 128GB 中古A | iPhone 15 128GB | 89,800 | 95,000 | 5,200 | モバイル一番 |
