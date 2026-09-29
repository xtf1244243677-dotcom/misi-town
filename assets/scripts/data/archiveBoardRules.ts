/** Shared region assignment for the full 4×4 through 10×10 archive progression. */
export function buildArchiveRegions(size: number): Record<string, string> {
  if (![4, 5, 6, 7, 8, 9, 10].includes(size)) throw new Error(`Archive region layout not yet authored for ${size}x${size}`);
  const regions: Record<string, string> = {};
  for (let row = 1; row <= size; row++) for (let column = 1; column <= size; column++) {
    if (size === 4) regions[`${row},${column}`] = `region-${Math.floor((row - 1) / 2)}-${Math.floor((column - 1) / 2)}`;
    else if (size === 5 || size === 7) regions[`${row},${column}`] = `region-${(row + column - 2) % size}`;
    else if (size === 8) regions[`${row},${column}`] = `region-${Math.floor((row - 1) / 2)}-${Math.floor((column - 1) / 4)}`;
    else if (size === 9) regions[`${row},${column}`] = `region-${Math.floor((row - 1) / 3)}-${Math.floor((column - 1) / 3)}`;
    else if (size === 10) regions[`${row},${column}`] = `region-${Math.floor((row - 1) / 2)}-${Math.floor((column - 1) / 5)}`;
    else regions[`${row},${column}`] = `region-${Math.floor((row - 1) / 3)}-${Math.floor((column - 1) / 2)}`;
  }
  return regions;
}

export function archiveRegionLabel(size: number): string {
  if (size === 4) return '2×2区域';
  if (size === 6) return '3行×2列分区';
  if (size === 8) return '2行×4列分区';
  if (size === 9) return '3×3分区';
  if (size === 10) return '2行×5列分区';
  return '同色索引组';
}
