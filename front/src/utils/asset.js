export function assetUrl(baseUrl, item) {
  const path = item.asset_path || `${item.category || "default"}/${item.image || ""}`;
  return `${baseUrl}/assets/${path}`;
}