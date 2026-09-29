import { sys } from 'cc';
import { PuzzleSession } from '../core/PuzzleSession';

/** Small local save adapter for greybox sessions and chapter unlocks. */
export class LocalProgressStore {
  private static readonly prefix = 'misi-town:v1:';
  private static readonly legacyPrefix = 'misi-sudoku:v1:';
  private static readonly archiveUnlockKey = `${LocalProgressStore.prefix}archive-unlocked`;
  private static readonly archiveUnlockedCaseKey = `${LocalProgressStore.prefix}archive-unlocked-case`;
  private static readonly archiveSelectedCaseKey = `${LocalProgressStore.prefix}archive-selected-case`;
  private static readonly archiveCompletedCaseKey = `${LocalProgressStore.prefix}archive-completed-case`;
  private static readonly mainStoryLevelKey = `${LocalProgressStore.prefix}main-story-unlocked-level`;
  private static readonly mainStoryCompletedLevelKey = `${LocalProgressStore.prefix}main-story-completed-level`;
  private static readonly dailyEconomyKey = `${LocalProgressStore.prefix}daily-economy`;
  private static readonly dailyCampaignStartKey = `${LocalProgressStore.prefix}daily-campaign-start`;
  private static readonly dailyFreeAttemptsKey = `${LocalProgressStore.prefix}daily-free-attempts`;
  private static readonly dailyUnlockedLevelsKey = `${LocalProgressStore.prefix}daily-unlocked-levels`;

  private static readonly accessCache = new Map<string, { unlocked: number[]; completed: number[] }>();

  /** Migrate contiguous legacy progress once; new ad unlocks never fill skipped gaps. */
  private static access(track: 'main' | 'archive', count: number): { unlocked: number[]; completed: number[] } {
    const key = `${this.prefix}${track}-level-access-v2`;
    let data = this.accessCache.get(key);
    if (!data) {
      try {
        const raw = this.readValue(key);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && Array.isArray(parsed.unlocked) && Array.isArray(parsed.completed)) {
          const valid = (values: unknown[]): number[] => [...new Set(values.filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0))];
          data = { unlocked: valid(parsed.unlocked), completed: valid(parsed.completed) };
        }
      } catch { /* Recover legacy progress if the new record is unreadable. */ }
      if (!data) {
        const main = track === 'main';
        const oldUnlocked = Number(this.readValue(main ? this.mainStoryLevelKey : this.archiveUnlockedCaseKey) ?? '0');
        const oldCompleted = Number(this.readValue(main ? this.mainStoryCompletedLevelKey : this.archiveCompletedCaseKey) ?? '-1');
        const legacyArchiveProof = main && this.isArchiveUnlocked() ? 2 : -1;
        const completed = Math.max(Number.isInteger(oldCompleted) ? oldCompleted : -1, legacyArchiveProof);
        const unlocked = Math.min(count - 1, Math.max(0, Number.isInteger(oldUnlocked) ? oldUnlocked : 0, completed + 1));
        data = {
          unlocked: Array.from({ length: unlocked + 1 }, (_, i) => i),
          completed: Array.from({ length: Math.min(count, Math.max(completed + 1, unlocked)) }, (_, i) => i),
        };
      }
      // Completed levels remain accessible; retain out-of-catalog data for future builds.
      data.unlocked = [...new Set([0, ...data.unlocked, ...data.completed, ...data.completed.map(i => i + 1)])];
      this.accessCache.set(key, data);
      this.persistAccess(track, data);
    }
    return data;
  }

  private static persistAccess(track: string, data: { unlocked: number[]; completed: number[] }): void {
    try { sys.localStorage.setItem(`${this.prefix}${track}-level-access-v2`, JSON.stringify(data)); }
    catch { /* In-memory access remains valid for this app session. */ }
  }

  static getUnlockedLevels(track: 'main' | 'archive', count: number): number[] {
    return this.access(track, count).unlocked.filter(i => i < count).sort((a, b) => a - b);
  }

  static getCompletedLevels(track: 'main' | 'archive', count: number): number[] {
    return this.access(track, count).completed.filter(i => i < count);
  }

  static unlockLevel(track: 'main' | 'archive', index: number, count: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= count) return false;
    const data = this.access(track, count);
    if (!data.unlocked.includes(index)) data.unlocked.push(index);
    this.persistAccess(track, data);
    return true;
  }

  private static completeLevel(track: 'main' | 'archive', index: number, count: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= count) return 0;
    const data = this.access(track, count);
    if (!data.completed.includes(index)) data.completed.push(index);
    this.unlockLevel(track, index, count);
    const next = Math.min(count - 1, index + 1);
    this.unlockLevel(track, next, count);
    return next;
  }

  static getUnlockedMainStoryLevel(caseCount: number): number {
    return Math.max(0, ...this.getUnlockedLevels('main', caseCount));
  }

  static unlockNextMainStoryLevel(completedLevel: number, caseCount: number): number {
    return this.completeLevel('main', completedLevel, caseCount);
  }

  static loadSession(session: PuzzleSession): boolean {
    try {
      const serialized = this.readValue(this.sessionKey(session));
      return serialized ? session.restoreSaveData(JSON.parse(serialized) as unknown) : false;
    } catch {
      return false;
    }
  }

  static saveSession(session: PuzzleSession): void {
    try {
      sys.localStorage.setItem(this.sessionKey(session), JSON.stringify(session.saveData()));
    } catch {
      // Keep the playable round usable if storage is unavailable or full.
    }
  }

  /** Remove one case's saved round so entering it starts a clean attempt. */
  static clearSession(definitionId: string): void {
    try {
      const suffix = `session:${definitionId}`;
      sys.localStorage.removeItem(`${this.prefix}${suffix}`);
      sys.localStorage.removeItem(`${this.legacyPrefix}${suffix}`);
    } catch {
      // The new round can still start cleanly in memory if storage is unavailable.
    }
  }

  static unlockArchive(): void {
    try {
      sys.localStorage.setItem(this.archiveUnlockKey, 'true');
    } catch {
      // Unlock remains available for the current round even if persistence fails.
    }
  }

  static isArchiveUnlocked(): boolean {
    try {
      return this.readValue(this.archiveUnlockKey) === 'true';
    } catch {
      return false;
    }
  }

  static getUnlockedArchiveCaseIndex(caseCount: number): number {
    return Math.max(0, ...this.getUnlockedLevels('archive', caseCount));
  }

  static unlockNextArchiveCase(completedIndex: number, caseCount: number): number {
    return this.completeLevel('archive', completedIndex, caseCount);
  }

  static getSelectedArchiveCaseIndex(caseCount: number): number {
    const value = Number(this.readValue(this.archiveSelectedCaseKey) ?? '0');
    return this.getUnlockedLevels('archive', caseCount).includes(value) ? value : 0;
  }

  static setSelectedArchiveCaseIndex(index: number): void {
    try {
      sys.localStorage.setItem(this.archiveSelectedCaseKey, String(Math.max(0, index)));
    } catch {
      // Current selection still works for this visit if storage is unavailable.
    }
  }

  static getDailyCurrency(): number {
    return this.readDailyEconomy().currency;
  }

  static hasClaimedDailyReward(dateKey: string): boolean {
    return this.readDailyEconomy().claimedDates.includes(dateKey);
  }

  static getClaimedDailyDates(): string[] {
    return [...this.readDailyEconomy().claimedDates];
  }

  /** First-clear reward is idempotent for the Shanghai-local calendar day. */
  static claimDailyReward(dateKey: string, amount: number): boolean {
    if (!dateKey || !Number.isFinite(amount) || amount <= 0) return false;
    try {
      const economy = this.readDailyEconomy();
      if (economy.claimedDates.includes(dateKey)) return false;
      economy.currency += Math.floor(amount);
      economy.claimedDates.push(dateKey);
      sys.localStorage.setItem(this.dailyEconomyKey, JSON.stringify(economy));
      return true;
    } catch {
      return false;
    }
  }

  /** The first visit fixes the ten-day release schedule for this local save. */
  static getOrCreateDailyCampaignStartDate(todayDateKey: string): string {
    try {
      const saved = this.readValue(this.dailyCampaignStartKey);
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return saved;
      if (/^\d{4}-\d{2}-\d{2}$/.test(todayDateKey)) {
        sys.localStorage.setItem(this.dailyCampaignStartKey, todayDateKey);
        return todayDateKey;
      }
    } catch {
      // The schedule remains available for this visit even if local storage is unavailable.
    }
    return todayDateKey;
  }

  static hasUsedDailyFreeAttempt(dateKey: string): boolean {
    return this.readStringArray(this.dailyFreeAttemptsKey).includes(dateKey);
  }

  static markDailyFreeAttemptUsed(dateKey: string): void {
    if (!dateKey) return;
    const attempts = this.readStringArray(this.dailyFreeAttemptsKey);
    if (attempts.includes(dateKey)) return;
    attempts.push(dateKey);
    this.writeStringArray(this.dailyFreeAttemptsKey, attempts);
  }

  static getUsedDailyAttemptDates(): string[] {
    return this.readStringArray(this.dailyFreeAttemptsKey);
  }

  static getUnlockedDailyLevels(): string[] {
    return this.readStringArray(this.dailyUnlockedLevelsKey);
  }

  static isDailyLevelUnlocked(levelId: string): boolean {
    return this.getUnlockedDailyLevels().includes(levelId);
  }

  static unlockDailyLevel(levelId: string): void {
    if (!/^D\d{2}$/.test(levelId)) return;
    const levels = this.getUnlockedDailyLevels();
    if (!levels.includes(levelId)) levels.push(levelId);
    this.writeStringArray(this.dailyUnlockedLevelsKey, levels);
  }

  private static readDailyEconomy(): { currency: number; claimedDates: string[] } {
    try {
      const raw = this.readValue(this.dailyEconomyKey);
      if (!raw) return { currency: 0, claimedDates: [] };
      const saved = JSON.parse(raw) as { currency?: unknown; claimedDates?: unknown };
      const currency = Number(saved.currency ?? 0);
      const claimedDates = Array.isArray(saved.claimedDates)
        ? saved.claimedDates.filter((value): value is string => typeof value === 'string')
        : [];
      return {
        currency: Number.isFinite(currency) ? Math.max(0, Math.floor(currency)) : 0,
        claimedDates,
      };
    } catch {
      return { currency: 0, claimedDates: [] };
    }
  }

  private static readStringArray(key: string): string[] {
    try {
      const raw = this.readValue(key);
      if (!raw) return [];
      const values = JSON.parse(raw) as unknown;
      return Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string') : [];
    } catch {
      return [];
    }
  }

  private static writeStringArray(key: string, values: string[]): void {
    try {
      sys.localStorage.setItem(key, JSON.stringify([...new Set(values)]));
    } catch {
      // The current round stays usable when local storage is unavailable or full.
    }
  }

  private static sessionKey(session: PuzzleSession): string {
    return `${this.prefix}session:${session.definition.id}`;
  }

  /** Lazily copy old local saves to the renamed namespace without resetting progress. */
  private static readValue(key: string): string | null {
    try {
      const current = sys.localStorage.getItem(key);
      if (current !== null) return current;
      if (!key.startsWith(this.prefix)) return null;
      const legacyKey = `${this.legacyPrefix}${key.slice(this.prefix.length)}`;
      const legacy = sys.localStorage.getItem(legacyKey);
      if (legacy === null) return null;
      sys.localStorage.setItem(key, legacy);
      return legacy;
    } catch {
      return null;
    }
  }
}
