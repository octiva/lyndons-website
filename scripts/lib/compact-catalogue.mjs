/** Lossless string-table encoding: descriptions and provenance repeat across variants. */
export function compactCatalogue(products) {
  const strings = [];
  const index = new Map();
  function intern(value) {
    if (!index.has(value)) { index.set(value, strings.length); strings.push(value); }
    return index.get(value);
  }
  const fields = [...new Set(products.flatMap(p => Object.keys(p)))];
  const rows = products.map(p => fields.map(key => {
    const value = p[key];
    if (typeof value === 'string') return intern(value);
    if (Array.isArray(value)) return value.map(intern);
    if (value === undefined) return null;
    return value;
  }));
  return { fields, strings, rows };
}
export function expandCatalogue(data) {
  return data.rows.map(row => Object.fromEntries(data.fields.map((key, i) => {
    const value = row[i];
    return [key, typeof value === 'number' ? data.strings[value] : Array.isArray(value) ? value.map(index => data.strings[index]) : value];
  }).filter(([,value]) => value !== null)));
}