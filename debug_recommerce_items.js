const cheerio = require('cheerio');
const axios = require('axios');

async function debugReCommerceSearch() {
    try {
        const keyword = 'iPhone 15';
        const url = `https://www.recommerce.co.jp/expensive/search_result.php?category_selection=&word=${encodeURIComponent(keyword)}`;
        console.log(`URL: ${url}`);

        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0...' } });
        const $ = cheerio.load(response.data);

        const names = [];
        $('td.li_title').each((i, el) => {
            names.push($(el).text().trim());
        });

        console.log(`\nTotal items found: ${names.length}`);

        console.log('\n--- Item Name Check ---');
        let matchCount = 0;
        names.forEach((name, index) => {
            // Check if it would be matched by our logic
            let model = '';
            if (name.includes('Pro Max') || name.includes('ProMax')) model = 'Pro Max';
            else if (name.includes('Pro')) model = 'Pro';
            else if (name.includes('15') && !name.includes('Plus')) model = '15';
            else if (name.includes('Plus')) model = 'Plus';

            const isiPhone15 = name.includes('15') || name.includes('iPhone15');

            if (index < 10) { // Limit output
                console.log(`${index + 1}. [${isiPhone15 ? 'MATCH' : 'SKIP'}] ${name} (Model: ${model})`);
            }
            if (isiPhone15) matchCount++;
        });

        console.log(`\nTotal 'iPhone 15' matches in ${names.length} items: ${matchCount}`);

    } catch (error) {
        console.error(error);
    }
}

debugReCommerceSearch();
