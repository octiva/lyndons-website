// Small sample-catalogue search. Exact codes rank first; fuzzy results never auto-add.
export function normalize(value) {
  return String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) next.push(Math.min(next[j] + 1, row[j + 1] + 1, row[j] + Number(a[i] !== b[j])));
    row = next;
  }
  return row[b.length];
}
export function searchProducts(products, query) {
  const q = normalize(query).slice(0, 120);
  if (!q) return { items: products, approximate: false };
  const terms = q.split(/\s+/);
  const text = p => normalize(`${p.name} ${p.id} ${p.brand} ${p.pack} ${p.type} ${p.category}`);
  const direct = products.filter(p => terms.every(t => text(p).includes(t)));
  if (direct.length) return { items: [...direct].sort((a,b) => Number(normalize(b.id) === q) - Number(normalize(a.id) === q)), approximate: false };
  if (q.length < 4) return { items: [], approximate: false };
  const scored = products.map(p => {
    const words = text(p).split(' ');
    const score = terms.reduce((sum, term) => {
      if (words.some(w => w.includes(term))) return sum;
      // Numeric quantities/codes must not be silently substituted.
      if (/\d/.test(term) || term.length < 4) return Infinity;
      const best = Math.min(...words.map(w => distance(term, w)));
      return sum + (best <= (term.length >= 7 ? 2 : 1) ? best : Infinity);
    }, 0);
    return { p, score };
  }).filter(x => Number.isFinite(x.score)).sort((a,b) => a.score-b.score);
  return { items: scored.map(x => x.p), approximate: scored.length > 0 };
}