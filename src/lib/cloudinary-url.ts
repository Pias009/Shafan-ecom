export function getOptimizedUrl(url: string, width: number): string {
  if (!url || typeof url !== 'string') return url;
  const isCloudinary = url.includes('res.cloudinary.com');
  if (!isCloudinary) return url;
  const prefix = url.includes('/upload/') ? '/upload/' : '/upload/v';
  const idx = url.indexOf(prefix);
  if (idx === -1) return url;
  return url.slice(0, idx + prefix.length) + `f_auto,q_auto,w_${width}/` + url.slice(idx + prefix.length);
}
