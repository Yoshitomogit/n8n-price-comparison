#!/usr/bin/env node
/**
 * Parse Prices と同じロジックでローカルHTMLをパースし、_debug 相当の出力を表示
 * 使用例: node run_parse_debug.js janpara_debug_relevance.html
 */
const fs = require('fs');
const path = process.argv[2] || 'janpara_debug_relevance.html';

function getHtml(obj) {
  if (typeof obj === 'string') return obj;
  if (!obj || typeof obj !== 'object') return '';
  const raw = obj.data || obj.body || obj.response || obj.responseBody || obj.text;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && raw.body) return raw.body;
  return '';
}

function normalizeKeywords(term) {
  const s = (term || '').toString().trim();
  const withSpace = s.toLowerCase().split(/\s+/).filter(Boolean);
  const noSpace = s.replace(/\s+/g, '').toLowerCase();
  return { withSpace, noSpace };
}

function matchesSearch(name, searchTerm) {
  const n = (name || '').toLowerCase();
  const { withSpace, noSpace } = normalizeKeywords(searchTerm);
  if (withSpace.length === 0) return true;
  const allKeywords = withSpace.every(kw => n.includes(kw));
  const asOne = noSpace.length > 0 && n.replace(/\s+/g, '').includes(noSpace);
  return allKeywords || asOne;
}

let html;
try {
  html = fs.readFileSync(path, 'utf8');
} catch (e) {
  console.error('File not found:', path);
  process.exit(1);
}

const items = [{ json: { data: html, search_term: 'iPhone 15' } }];
const results = [];

for (const item of items) {
  const htmlContent = getHtml(item.json);
  if (!htmlContent || htmlContent.length < 500) {
    results.push({
      json: {
        _debug: 'HTML empty or too short',
        _keys: Object.keys(item.json || {}),
        _htmlLen: (htmlContent || '').length,
      },
    });
    console.log(JSON.stringify(results[0].json, null, 2));
    process.exit(0);
  }

  const clean = htmlContent.replace(/\s+/g, ' ');
  const itemBlocks = clean.split(/<div class=["']search_item_s(?:\s+first)?/i);
  let searchTerm = item.json.KEYWORDS || item.json.search_term;
  const m = htmlContent.match(/KEYWORDS=([^&]+)/);
  if (!searchTerm && m) searchTerm = decodeURIComponent(m[1].replace(/\+/g, ' '));
  searchTerm = searchTerm || 'iPhone 15';

  for (const block of itemBlocks) {
    if (!block.includes('search_itemprice')) continue;
    const priceMatch = block.match(/class=["']item_amount["'][^>]*>\s*(?:&yen;|¥)?\s*([0-9,]+)/);
    const nameMatch = block.match(/class=["'](?:search_itemname\s+wordturn|wordturn\s+search_itemname)["'][^>]*>\s*([^<]+?)\s*<\/div>/);
    const linkMatch = block.match(/class=["']search_itemlink["'][^>]*href=["']([^"']+)["']/);
    const condMatch = block.match(/class=["']search_itemcondition["'][^>]*>\s*([^<]+?)\s*<\/div>/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
    const name = nameMatch ? nameMatch[1].replace(/&nbsp;/g, ' ').trim() : 'Unknown';
    const link = linkMatch ? 'https://www.janpara.co.jp' + linkMatch[1] : '';
    const condition = condMatch ? condMatch[1].trim() : 'Unknown';

    if (price > 10000 && matchesSearch(name, searchTerm)) {
      results.push({
        json: {
          search_term: searchTerm,
          name: name,
          price: price,
          condition: condition,
          link: link,
          source: 'janpara',
        },
      });
    }
  }

  // _debug_parse 相当
  const blocksWithPrice = itemBlocks.filter((b) => b.includes('search_itemprice')).length;
  const debugParse = {
    blocksTotal: itemBlocks.length,
    blocksWithPrice,
    htmlLength: htmlContent.length,
    resultsCount: results.length,
  };

  if (results.length > 0) {
    results[0].json._debug_parse = debugParse;
  } else {
    console.log(JSON.stringify({ items_found: 0, _debug: 'No matching items', _debug_parse: debugParse }, null, 2));
    process.exit(0);
  }
}

console.log('=== _debug_parse (1件目のアイテムに付与される値) ===');
console.log(JSON.stringify(results[0]?.json?._debug_parse, null, 2));
console.log('\n=== 抽出された商品数 ===', results.length);
results.slice(0, 5).forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.json.name?.substring(0, 50)}... | 価格: ${r.json.price}`);
});
if (results.length > 5) console.log(`  ... 他 ${results.length - 5} 件`);
