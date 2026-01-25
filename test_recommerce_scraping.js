const cheerio = require('cheerio');
const axios = require('axios');

async function testReCommerceScraping() {
    try {
        const keyword = 'iPhone 15';
        const url = `https://www.recommerce.co.jp/expensive/search_result.php?category_selection=&word=${encodeURIComponent(keyword)}`;
        console.log(`URLを取得中: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        console.log('\n--- HTML抽出テスト (ReCommerce) ---');

        const products = [];

        // 商品名: td.li_title
        // 価格: td.li_price

        const titleElements = $('td.li_title');
        const priceElements = $('td.li_price');

        console.log(`Title Elements found: ${titleElements.length}`);
        console.log(`Price Elements found: ${priceElements.length}`);

        titleElements.each((i, el) => {
            const name = $(el).text().trim();
            // Price is at the same index
            if (i < priceElements.length) {
                const priceText = $(priceElements[i]).text().trim();

                // Extract prices
                // Example: "買取価格：44,625円～89,250円"
                // Remove "買取価格："
                const cleanPriceText = priceText.replace('買取価格：', '');

                // Split by "～"
                const parts = cleanPriceText.split('～');
                let minPriceStr = parts[0] ? parts[0].trim() : "0";
                let maxPriceStr = parts[1] ? parts[1].trim() : minPriceStr;

                // Parse integers
                const parse = (s) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
                const minPrice = parse(minPriceStr);
                const maxPrice = parse(maxPriceStr);

                products.push({
                    name,
                    priceText: cleanPriceText,
                    minBuyback: minPrice,
                    maxBuyback: maxPrice
                });
            }
        });

        console.log(`抽出された件数: ${products.length}件`);

        console.log('\n--- 抽出データ（トップ5） ---');
        for (let i = 0; i < Math.min(5, products.length); i++) {
            console.log(`商品 ${i + 1}:`);
            console.log(`  名前: ${products[i].name}`);
            console.log(`  買取価格帯: ${products[i].priceText}`);
            console.log(`  上限買取価格: ${products[i].maxBuyback}円`);
        }

    } catch (error) {
        console.error('エラー:', error.message);
    }
}

testReCommerceScraping();
