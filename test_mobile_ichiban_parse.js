#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const getHtml = (obj) => {
  const toStr = (v) => {
    if (typeof v === 'string') return v;
    if (v && v.data) return toStr(v.data);
    if (Buffer.isBuffer && Buffer.isBuffer(v)) return v.toString('utf8');
    return (v != null) ? String(v) : '';
  };
  if (typeof obj === 'string') return obj;
  if (!obj || typeof obj !== 'object') return '';
  for (const k of ['data','body','response','responseBody','text','html','content']) {
    const s = toStr(obj[k]);
    if (s && s.length > 1000) return s;
  }
  return '';
};

const parse = (html) => {
  const results = [];
  const seen = new Set();
  const priceRe = /id="NewPrice_[^"]+">\s*([0-9,]+)\s*円/g;
  let pm;
  while ((pm = priceRe.exec(html)) !== null) {
    const price = parseInt(pm[1].replace(/,/g,''), 10);
    if (price < 1000 || price > 500000) continue;
    const ctx = html.substring(Math.max(0, pm.index - 2500), pm.index + 100);
    const titles = [...ctx.matchAll(/title="([^"]+)"/g)];
    let name = '';
    let condPart = '';
    for (const t of titles) {
      const v = t[1].trim();
      if (v.length > 4 && v.length < 80) {
        if (/iPhone|iPad|Pixel|OPPO|AQUOS|REDMI|simfree|未開封|開封|\d+GB/i.test(v)) {
          if (/simfree|未開封|開封/.test(v)) condPart = v;
          else if (!name) name = v;
        }
      }
    }
    if (!name && condPart) name = condPart;
    if (!name) name = ctx.match(/>\s*([^<]{8,60})\s*</)?.[1]?.trim() || `商品_${results.length}`;
    if (condPart && !name.includes(condPart)) name = (name + ' ' + condPart).trim();
    const hasUnopened = /未開封/.test(ctx);
    const hasOpened = /開封/.test(ctx);
    const cond = hasUnopened ? '新品・未開封' : (hasOpened ? '新品・開封済み' : '新品');
    const key = `${name}_${cond}_${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ 商品名: name, 買取金額: price, 状態: cond });
  }
  return results;
};

https.get('https://www.mobile-ichiban.com/Prod/1', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('HTML length:', body.length);
    console.log('Has NewPrice_:', body.includes('NewPrice_'));
    const r = parse(body);
    console.log('Parsed count:', r.length);
    console.log('Sample:', JSON.stringify(r.slice(0, 5), null, 2));
  });
}).on('error', e => console.error(e));
