export function newKey(tag: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `pw-${tag}-${Date.now()}-${rand}`;
}
