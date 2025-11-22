/**
 * Converts a time string (e.g., '15m', '7d') into the corresponding number of seconds.
 * Supports: s (seconds), m (minutes), h (hours), d (days), w (weeks), mo (months - 30 days), y (years - 365 days).
 * @param timeString The string representation of time (e.g., '15m').
 * @returns The duration in seconds.
 */
export function convertTimeStringToSeconds(timeString: string | undefined): number {

  if (!timeString) {
    throw new Error(`Invalid time string format: ${timeString}.`);
  }

  const timeValue = parseInt(timeString, 10);
  const unit = timeString.replace(timeValue.toString(), '').toLowerCase();
  if (isNaN(timeValue)) {
    throw new Error(`Invalid time string format: ${timeString}.`);
  }

  // Define time multipliers in seconds
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    mo: 2592000,
    y: 31536000,
  };

  if (multipliers[unit]) {
    return timeValue * multipliers[unit];
  }

  return timeValue;
}
