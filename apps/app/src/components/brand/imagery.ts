/**
 * Brand imagery — the art-directed product photographs used in PANDAM's brand
 * moments (splash, auth, empty states). These are NOT demo listings: they are
 * the product's visual identity, so they render regardless of demo mode.
 *
 * Remote, royalty-free Unsplash photographs, requested at the size they are
 * displayed. Every consumer renders through `<PhotoObject>`, which falls back
 * to a warm gradient if a URL ever fails.
 */
const u = (id: string, w = 640) =>
  `https://images.unsplash.com/${id}?w=${w}&q=72&auto=format&fit=crop`;

export const brandImages = {
  camera: u('photo-1516035069371-29a1b244cc32'),
  headphones: u('photo-1505740420928-5e560c06d30e'),
  sneakers: u('photo-1542291026-7eec264c27ff'),
  laptop: u('photo-1517336714731-489689fd1ca8'),
  guitar: u('photo-1510915361894-db8b60106cb1'),
  plant: u('photo-1485955900006-10f4d324d411'),
  watch: u('photo-1523275335684-37898b6baf30'),
  bike: u('photo-1485965120184-e220f721d03e'),
} as const;

export type BrandImageKey = keyof typeof brandImages;
