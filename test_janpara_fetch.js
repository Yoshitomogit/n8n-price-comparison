#!/usr/bin/env node
/**
 * curl でじゃんぱらを直接取得し、Parse Prices と同じロジックでパース
 * 使用例: node test_janpara_fetch.js
 * 
 * n8n で取得できない場合、このスクリプトで動作確認ができます
 */
const https = require('https');
const http = require('http');

const url = 'https://www.janpara.co.jp/sale/search/result/?KEYWORDS=iPhone15&CHKOUTCOM=1&OUTCLSCODE=78&ORDER=3&PAGE=1';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'ja,en-US;q=0.9'
  }
};

function fetch(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    lib.get(urlStr, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, statusCode: res.statusCode }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching:', url);
  const { data: html, statusCode } = await fetch(url);
  console.log('Status:', statusCode);
  console.log('HTML length:', html.length);
  console.log('Contains search_item_s:', html.includes('search_item_s'));
  console.log('Contains search_itemprice:', html.includes('search_itemprice'));
  console.log('');

  if (html.length < 500) {
    console.log('HTML too short. Preview:', html.substring(0, 500));
    return;
  }

  const clean = html.replace(/\s+/g, ' ');
  const itemBlocks = clean.split(/<div class=["']search_item_s(?:\s+first)?/i);
  console.log('Blocks found:', itemBlocks.length);

  const searchTerm = 'iPhone15';
  const searchKwNorm = searchTerm.toLowerCase().replace(/\s/g, '');
  const searchKeywords = searchKwNorm ? [searchKwNorm] : searchTerm.toLowerCase().split(/\s+/);
  const results = [];

  for (let i = 0; i < itemBlocks.length; i++) {
    const block = itemBlocks[i];
    if (!block.includes('search_itemprice')) continue;
    const priceMatch = block.match(/class=["']item_amount["'][^>]*>\s*(?:&yen;|¥)?\s*([0-9,]+)/);
    const nameMatch = block.match(/class=["'](?:search_itemname\s+wordturn|wordturn\s+search_itemname)["'][^>]*>\s*([^<]+?)\s*<\/div>/);
    const hasSoldOut = block.includes('search_nostock');
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
    const nameLower = name.toLowerCase();
    const nameNorm = nameLower.replace(/\s/g, '');
    const isMatch = searchKeywords.every(kw => nameLower.includes(kw) || nameNorm.includes(kw.replace(/\s/g, '')));
    console.log(`Block ${i}: name="${name.substring(0,40)}..." price=${price} hasAmount=${!!priceMatch} SOLD_OUT=${hasSoldOut} match=${isMatch}`);
    if (price > 10000 && isMatch) {
      results.push({ name: name.substring(0, 50), price });
    }
  }

  console.log('Products extracted:', results.length);
  results.slice(0, 5).forEach((r, i) => console.log(`  ${i+1}. ${r.name}... | ${r.price}円`));
}

main().catch(e => console.error('Error:', e.message));
