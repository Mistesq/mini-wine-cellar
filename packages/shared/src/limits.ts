export const BOTTLE_LIMITS = {
  text: { min: 1, max: 100 },
  photoUrl: { max: 2048 },
  vintage: { min: 1900 },
} as const;

// UTC so the web form and the api agree on the year regardless of server timezone.
export function getMaxVintage(now: Date = new Date()): number {
  return now.getUTCFullYear();
}
