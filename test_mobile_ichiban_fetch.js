#!/usr/bin/env node
/**
 * モバイル一番 取得・解析のデバッグ
 */
const https = require('https');

const url = 'https://www.mobile-ichiban.com/Prod/1';
https.get(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('=== HTML length:', body.length);
    console.log('=== Has 強化:', body.includes('強化'));
    console.log('=== Has 確定:', body.includes('確定'));
    console.log('=== Sample (first 2000 chars):\n', body.substring(0, 2000));
    console.log('\n=== Price matches:', [...body.matchAll(/([0-9]{2,3},[0-9]{3})\s*円/g)].slice(0, 5));
    console.log('\n=== Split by 強化 count:', body.split(/強化/i).length);
    const blocks = body.split(/強化/i);
    if (blocks.length > 1) {
      const block = blocks[1];
      console.log('\n=== First block (len=' + block.length + '):\n', block.substring(0, 800));
    }
  });
}).on('error', e => console.error(e));
