const fs = require('fs');

// Read the verification HTML
let html = '';
try {
    // janpara_debug_all_fresh.html
    html = fs.readFileSync('janpara_debug_relevance.html', 'utf8');
} catch (e) {
    console.error('File not found');
    process.exit(1);
}

const inputItems = [{ json: { data: html, KEYWORDS: 'iPhone 15' } }];

for (const item of inputItems) {
    const htmlContent = item.json.data || '';
    const clean = htmlContent.replace(/\s+/g, ' ');
    const itemBlocks = clean.split(/<div class=["']search_item_s/i);

    console.log(`Total blocks: ${itemBlocks.length}`);

    let validCount = 0;

    for (const block of itemBlocks) {
        if (!block.includes('search_itemprice')) continue;

        const priceMatch = block.match(/class=["']item_amount["'][^>]*>(?:[^0-9<]*)([0-9,]+)/);
        const nameMatch = block.match(/class=["']search_itemname wordturn["']>([^<]+)</);
        const linkMatch = block.match(/class=["']search_itemlink["']\s+href=["']([^"']+)["']/);

        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
        const link = linkMatch ? `https://www.janpara.co.jp${linkMatch[1]}` : '';

        console.log(`Item: ${name} | Price: ${price}`);

        if (price > 10000) validCount++;
    }
    console.log(`Valid Items (>10,000): ${validCount}`);
}
