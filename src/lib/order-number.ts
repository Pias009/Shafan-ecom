export function getOrderNumber(id?: string | null): string {
  return (id || '').slice(-8).toUpperCase();
}

export function formatOrderNumber(id?: string | null): string {
  const num = getOrderNumber(id);
  return num ? `#${num}` : '';
}
