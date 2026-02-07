const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, 'janpara_debug_live.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// The logic from the proposed n8n node
const clean = html.replace(/\s+/g, ' ');
const itemBlocks = clean.split(/<div class=["']search_item_s/i);

const parsedItems = [];
const searchKeywords = ['iphone', '15']; // Simulating search terms

console.log(`Total blocks found: ${itemBlocks.length}`);

// Debug: print first block
if (itemBlocks.length > 1) {
    console.log('--- First Block Content (Snippet) ---');
    console.log(itemBlocks[1].substring(0, 300));
    console.log('-------------------------------------');
}

for (const block of itemBlocks) {
    // Note: The split consumes the opening div tag of search_item_s

    // search_itemprice check
    if (!block.includes('search_itemprice')) continue;

    // Regex adjustments for "clean" HTML (all newlines are spaces)
    // 1. Price: class="item_amount">&yen;1,980～</div>
    const priceMatch = block.match(/class=["']item_amount["'][^>]*>\s*(?:&yen;|¥)?\s*([0-9,]+)/);

    // 2. Name: class="search_itemname wordturn"> Name </div>
    const nameMatch = block.match(/class=["']search_itemname wordturn["'][^>]*>\s*([^<]+?)\s*<\/div>/);

    // 3. Link: class="search_itemlink" href="..."
    const linkMatch = block.match(/class=["']search_itemlink["'][^>]*href=["']([^"']+)["']/);

    // 4. Condition: class="search_itemcondition">中古</div>
    const condMatch = block.match(/class=["']search_itemcondition["'][^>]*>\s*([^<]+?)\s*<\/div>/);

    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
    const link = linkMatch ? `https://www.janpara.co.jp${linkMatch[1]}` : '';
    const condition = condMatch ? condMatch[1] : 'Unknown';

    // Log if unknown to inspect
    // if (name === 'Unknown') console.log("Failed to parse name in block");

    // Filter logic
    // We want to see all items for debugging, so lower threshold or remove filters
    // const searchTerm = 'iPhone 15';
    // if (name.includes(searchTerm)) ...

    if (price > 0) {
        parsedItems.push({
            name,
            price,
            link,
            condition,
            source: 'janpara'
        });
    }
}

console.log(`Parsed ${parsedItems.length} valid items.`);
if (parsedItems.length > 0) {
    console.log('Sample items:');
    console.log(JSON.stringify(parsedItems.slice(0, 3), null, 2));
}
