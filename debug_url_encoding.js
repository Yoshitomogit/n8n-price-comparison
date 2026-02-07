const keyword = process.argv[2] || 'Pixel 8';
const normalized = keyword.replace(/[ 　]+/g, ' ');
const encoded = encodeURIComponent(normalized);
const finalParam = encoded.replace(/%20/g, '+');

console.log(`Input: "${keyword}"`);
console.log(`Normalized: "${normalized}"`);
console.log(`Encoded: "${encoded}"`);
console.log(`Final Param: "${finalParam}"`);
