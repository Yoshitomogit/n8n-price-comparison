const cheerio = require('cheerio');
const axios = require('axios');

async function testScraping() {
    try {
        const url = 'https://www.mobile-ichiban.com/products/list?name=iPhone+15';
        console.log(`URLを取得中: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        console.log('\n--- HTML抽出テスト ---');

        // n8nのHTML Extractノードと同じロジックを再現
        // 親要素を指定しない場合（ページ全体から抽出する場合の挙動シミュレーション）

        const names = [];
        $('td:nth-child(2)').each((i, el) => {
            names.push($(el).text().trim());
        });

        const newPrices = [];
        $('td:nth-child(3)').each((i, el) => {
            newPrices.push($(el).text().trim());
        });

        const usedPrices = [];
        $('td:nth-child(4)').each((i, el) => {
            usedPrices.push($(el).text().trim());
        });

        console.log(`抽出された件数: ${names.length}件`);

        console.log('\n--- 抽出データ（トップ5） ---');
        for (let i = 0; i < Math.min(5, names.length); i++) {
            if (!names[i].includes('iPhone')) continue;
            console.log(`商品 ${i + 1}:`);
            console.log(`  名前: ${names[i]}`);
            console.log(`  新品価格: ${newPrices[i]}`);
            console.log(`  中古価格: ${usedPrices[i]}`);
        }

    } catch (error) {
        console.error('エラー:', error.message);
    }
}

testScraping();
