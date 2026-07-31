export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hours, minutes = '00'] = timeStr.split(':');
  const h = parseInt(hours, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  const formattedMinutes = minutes.padStart(2, '0');
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

export const getRemainingTimeMinutes = (targetISO: string): number => {
  if (!targetISO) return 0;
  const now = new Date().getTime();
  const target = new Date(targetISO).getTime();
  const diffMs = target - now;
  return Math.max(0, Math.floor(diffMs / 60000));
};

export const formatCountdown = (minutes: number): string => {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes - mins) * 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
