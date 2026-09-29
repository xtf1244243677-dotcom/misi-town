export type DailyCalendarStatus =
  | 'empty' | 'upcoming' | 'unavailable' | 'available' | 'free-used' | 'completed' | 'ad-locked' | 'unlocked';

export interface DailyCalendarDay {
  day: number | null;
  dateKey: string;
  status: DailyCalendarStatus;
  isToday: boolean;
  isSelected: boolean;
  levelIndex: number | null;
  levelId: string;
}

export interface DailyCalendarModel {
  monthLabel: string;
  days: DailyCalendarDay[];
  canGoNext: boolean;
}

/** The daily calendar uses China Standard Time, regardless of device timezone. */
export function getDailyChallengeDateParts(now = Date.now()): { year: number; month: number; day: number } {
  const shanghai = new Date(now + 8 * 60 * 60 * 1000);
  return { year: shanghai.getUTCFullYear(), month: shanghai.getUTCMonth() + 1, day: shanghai.getUTCDate() };
}

/** Shanghai-local calendar key; the new date becomes available at 00:00 UTC+8. */
export function getDailyChallengeDateKey(now = Date.now()): string {
  const { year, month, day } = getDailyChallengeDateParts(now);
  return formatDailyChallengeDateKey(year, month, day);
}

export function formatDailyChallengeDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatDailyChallengeDateLabel(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  return match ? `${Number(match[2])}月${Number(match[3])}日` : dateKey;
}

function dateOrdinal(dateKey: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return Number.NaN;
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000);
}

/** D01 is released on the campaign's first day; each following day advances one case. */
export function getDailyChallengeLevelIndex(dateKey: string, campaignStartDate: string): number {
  const date = dateOrdinal(dateKey), start = dateOrdinal(campaignStartDate);
  if (!Number.isFinite(date) || !Number.isFinite(start) || date < start) return -1;
  return Math.min(9, date - start);
}

export function getDailyChallengeReleaseDate(levelIndex: number, campaignStartDate: string): string {
  const start = dateOrdinal(campaignStartDate);
  if (!Number.isFinite(start) || !Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex > 9) return '';
  const date = new Date((start + levelIndex) * 86400000);
  return formatDailyChallengeDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Build a Sunday-first calendar. Older released cases require a persistent rewarded-ad unlock. */
export function createDailyCalendarModel(
  year: number,
  month: number,
  campaignStartDate: string,
  selectedDateKey: string,
  unlockedLevelIds: string[],
  usedFreeAttemptDateKeys: string[],
  completedLevelIds: string[],
  now = Date.now(),
): DailyCalendarModel {
  const safeMonth = Math.max(1, Math.min(12, Math.floor(month)));
  const firstWeekday = new Date(Date.UTC(year, safeMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, safeMonth, 0)).getUTCDate();
  const todayDateKey = getDailyChallengeDateKey(now);
  const todayParts = getDailyChallengeDateParts(now);
  const visibleMonthIndex = year * 12 + safeMonth - 1;
  const currentMonthIndex = todayParts.year * 12 + todayParts.month - 1;
  const unlocked = new Set(unlockedLevelIds);
  const used = new Set(usedFreeAttemptDateKeys);
  const completed = new Set(completedLevelIds);
  const days: DailyCalendarDay[] = [];

  for (let cell = 0; cell < 42; cell += 1) {
    const day = cell - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) {
      days.push({ day: null, dateKey: '', status: 'empty', isToday: false, isSelected: false, levelIndex: null, levelId: '' });
      continue;
    }
    const dateKey = formatDailyChallengeDateKey(year, safeMonth, day);
    const isToday = dateKey === todayDateKey;
    const levelIndex = getDailyChallengeLevelIndex(dateKey, campaignStartDate);
    const levelId = levelIndex >= 0 ? `D${String(levelIndex + 1).padStart(2, '0')}` : '';
    let status: DailyCalendarStatus;
    if (dateKey > todayDateKey) status = 'upcoming';
    else if (levelIndex < 0) status = 'unavailable';
    else if (isToday && used.has(dateKey) && completed.has(levelId)) status = 'completed';
    else if (isToday && used.has(dateKey)) status = 'free-used';
    else if (isToday) status = 'available';
    else status = unlocked.has(levelId) ? 'unlocked' : 'ad-locked';
    days.push({ day, dateKey, status, isToday, isSelected: dateKey === selectedDateKey, levelIndex, levelId });
  }

  return {
    monthLabel: `${year}年${safeMonth}月`,
    days,
    canGoNext: visibleMonthIndex < currentMonthIndex,
  };
}

export const dailyChallengeFirstClearReward = 6;
