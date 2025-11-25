
export function convertTimeStringToSeconds(timeString: string | undefined): number {
  if (!timeString) {
    return 900;
  }

  const timeValue = parseInt(timeString, 10);
  const unit = timeString.replace(timeValue.toString(), '').trim().toLowerCase();

  if (isNaN(timeValue)) {
    throw new Error(`Invalid time string format: ${timeString}`);
  }

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
