/** Preview reward flow. Replace the simulated completion with the SDK reward callback. */
export class RewardedLevelUnlockFlow {
  target: { index: number; title: string } | null = null;
  phase: 'offer' | 'ad' = 'offer';
  requestId = 0;
  private disposed = false;
  constructor(private readonly redraw: () => void, private readonly grant: (index: number) => void) {}
  open(index: number, title: string): void {
    if (this.disposed) return;
    this.requestId++; this.target = { index, title }; this.phase = 'offer'; this.redraw();
  }
  watch(id: number): void {
    if (this.disposed || !this.target || id !== this.requestId || this.phase !== 'offer') return;
    this.phase = 'ad'; this.redraw();
  }
  finish(id: number, rewarded: boolean): void {
    if (this.disposed || !this.target || id !== this.requestId || this.phase !== 'ad') return;
    const index = this.target.index;
    this.target = null; this.requestId++;
    if (rewarded) this.grant(index); else this.redraw();
  }
  cancel(id: number): void {
    if (id !== this.requestId || this.disposed) return;
    this.target = null; this.requestId++; this.redraw();
  }
  dispose(): void { this.disposed = true; this.target = null; this.requestId++; }
}
