/** Pure policies shared by catalogue collection, preparation and offline tests. */
export const DEFAULT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function recordRefreshReason(record, lastModified, { now, ttlMs = DEFAULT_CACHE_TTL_MS, force = false }) {
  if (!Number.isFinite(now) || !Number.isFinite(ttlMs) || ttlMs < 0) throw new RangeError('Refresh policy requires a finite clock and non-negative TTL');
  if (force) return 'forced';
  if (!record) return 'missing-record';
  if ((record.sourceLastModified ?? '') !== (lastModified ?? '')) return 'last-modified-changed';
  const checkedAt = typeof record.checkedAt === 'string' ? Date.parse(record.checkedAt) : NaN;
  if (!Number.isFinite(checkedAt)) return 'missing-or-invalid-timestamp';
  if (checkedAt > now) return 'future-timestamp';
  return now - checkedAt >= ttlMs ? 'ttl-expired' : null;
}

export function canPublishCatalogue(report) {
  return report.limited === false && report.stopped === false && !report.error
    && Number.isInteger(report.discoveredPages) && report.discoveredPages > 0
    && report.attemptedPages === report.discoveredPages
    && report.importedPages === report.discoveredPages
    && report.failures.length === 0 && report.staleRefreshFailures.length === 0
    && report.failedPhotos === 0;
}

export function productMetadata(raw, variant) {
  const categoryPath = raw.categories.map(category => category.name);
  const variantLabel = variant.label ?? '';
  return {
    familyId: raw.id,
    familyName: raw.name.replace(/^\*+/, '').trim(),
    variantLabel,
    categoryPath,
    subcategory: categoryPath.length > 1 ? categoryPath.at(-1) : '',
    // A source variant may describe size or colour, not a verified buying unit.
    pack: variantLabel || 'Pack / unit: confirm with branch',
    packStatus: variantLabel ? 'source-variant' : 'branch-confirmation-required',
  };
}