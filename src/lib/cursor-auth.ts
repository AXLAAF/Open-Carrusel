export function getCursorApiKey(): string | null {
  const key = process.env.CURSOR_API_KEY?.trim();
  return key || null;
}

export function isCursorAvailable(): boolean {
  return getCursorApiKey() !== null;
}
