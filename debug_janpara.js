const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('janpara_correct_maybe.html', 'utf8');

// Mocking n8n input structure
const $input = {
    all: () => [{
        json: {
            data: html,
            merge_id: 'debug_001',
            jan: '4549995400000',
            search_term: 'iPhone 15'
        }
    }]
};
const $node = {
    "📦 楽天データ整形": {
        all: () => [{ json: { merge_id: 'debug_001', jan: '4549995400000', search_term: 'iPhone 15' } }]
    }
};

// Extracted Logic from n8n node
const allInputs = $input.all();
const results = allInputs.map((item, index) => {
    const input = item.json;

    // HTMLデータ取得
    const html = (typeof input === 'string') ? input : (input.data || input.body || input.response || '');
    let mergeId = input.merge_id;
    let jan = input.jan;
    let searchTerm = input.search_term;

    const clean = html.replace(/\s+/g, ' ');
    const parsePrice = (str) => {
        if (!str) return 0;
        const m = str.match(/([0-9]{1,3}(?:,[0-9]{3})*)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
    };

    // より柔軟な価格抽出パターン
    const unusedPatterns = [
        /未使用[\s\S]{0,300}?(?:price|class=["']price["'])[^>]*>(?:[^0-9<]*)([0-9,]+)/i,
        /未使用[\s\S]{0,300}?(?:[^0-9<]*)([0-9]{1,3}(?:,[0-9]{3})*)\s*円/i,
        /<div[^>]*class=["']unused["'][\s\S]{0,300}?(?:[^0-9<]*)([0-9]{1,3}(?:,[0-9]{3})*)/i
    ];
    const usedPatterns = [
        /中古[\s\S]{0,300}?(?:price|class=["']price["'])[^>]*>(?:[^0-9<]*)([0-9,]+)/i,
        /中古[\s\S]{0,300}?(?:[^0-9<]*)([0-9]{1,3}(?:,[0-9]{3})*)\s*円/i,
        /<div[^>]*class=["']used["'][\s\S]{0,300}?(?:[^0-9<]*)([0-9]{1,3}(?:,[0-9]{3})*)/i
    ];

    let unusedPrice = 0;
    let usedPrice = 0;
    for (const p of unusedPatterns) {
        const m = clean.match(p);
        if (m) {
            unusedPrice = parsePrice(m[1]);
            if (unusedPrice > 0) break;
        }
    }
    for (const p of usedPatterns) {
        const m = clean.match(p);
        if (m) {
            usedPrice = parsePrice(m[1]);
            if (usedPrice > 0) break;
        }
    }

    // fallback: 価格一覧から最大値を拾う
    if (unusedPrice === 0 && usedPrice === 0) {
        const all = [...clean.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)\s*円/g)]
            .map(m => parseInt(m[1].replace(/,/g, ''), 10))
            .filter(n => n > 0 && n < 10000000);
        if (all.length > 0) {
            usedPrice = Math.max(...all);
        }
    }

    return {
        merge_id: mergeId || `janpara_${index}`,
        jan: jan || 'UNKNOWN',
        search_term: searchTerm || 'UNKNOWN',
        janpara_unused: unusedPrice,
        janpara_used: usedPrice,
        has_html: html.length > 0
    };
});

console.log(JSON.stringify(results, null, 2));
