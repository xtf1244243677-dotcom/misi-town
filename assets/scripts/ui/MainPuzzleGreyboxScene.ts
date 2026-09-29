import { _decorator, Canvas, Component, director, Node, UITransform, view } from 'cc';
import { PuzzleSession } from '../core/PuzzleSession';
import { placementSelectionId, relationSelectionId } from '../core/PuzzleTypes';
import { archiveUnlockMainCaseIndex, mainStoryCases } from '../data/casePrototypes';
import {
  createDailyCalendarModel, dailyChallengeFirstClearReward, formatDailyChallengeDateLabel,
  getDailyChallengeDateKey, getDailyChallengeDateParts, getDailyChallengeLevelIndex, getDailyChallengeReleaseDate,
} from '../data/dailyChallenge';
import { dailyArchiveCases } from '../data/dailyArchiveCases';
import { LocalProgressStore } from '../services/LocalProgressStore';
import { MainStoryPuzzleView } from './MainStoryPuzzleView';
import { ArchivePuzzleView } from './ArchivePuzzleView';
import { RewardedLevelUnlockFlow } from '../services/RewardedLevelUnlockFlow';
import { RewardedHintFlow } from '../services/RewardedHintFlow';
import { buildArchiveHint, buildMainStoryHint } from '../services/PuzzleHintService';

const { ccclass } = _decorator;

/** Main-story relationship grids. Add to a Canvas in a portrait 2D scene. */
@ccclass('MainPuzzleGreyboxScene')
export class MainPuzzleGreyboxScene extends Component {
  private static hasShownTitleCover = false;
  private caseIndex = 0;
  private dailyMode = false;
  private dailyDateKey = '';
  private dailyIndex = 0;
  private dailyCampaignStartDate = getDailyChallengeDateKey();
  private dailyFreeAttemptPending = false;
  private dailyBoardExpanded = true;
  private dailyAccessGate: { kind: 'unlock' | 'retry'; index: number; dateKey: string } | null = null;
  private dailySelectedSubject = 0;
  private dailySelectedCell: { row: number; column: number } | null = null;
  private dailyCalendarOpen = false;
  private dailyCalendarYear = getDailyChallengeDateParts().year;
  private dailyCalendarMonth = getDailyChallengeDateParts().month;
  private selectedDailyDateKey = getDailyChallengeDateKey();
  private lastObservedDailyDateKey = getDailyChallengeDateKey();
  private calendarRefreshElapsed = 0;
  private session = new PuzzleSession(mainStoryCases[0].definition);
  private uiRoot: Node | null = null;
  private activePair = mainStoryCases[0].pairs[0].id;
  private selected: { person: string; option: string } | null = null;
  private positiveMark = true;
  private showCover = false;
  private showCaseSelector = false;
  private puzzleView: MainStoryPuzzleView | null = null;
  private archivePuzzleView: ArchivePuzzleView | null = null;
  private answerOpen = false;
  private selectedAnswerId: string | null = null;
  private hasStartedCase = false;
  private selectorPage = 0;
  private helpOpen = false;
  private notesOpen = false;
  private readonly levelUnlock = new RewardedLevelUnlockFlow(
    () => { if (this.isValid) this.render(); },
    index => {
      if (!this.isValid) return;
      if (LocalProgressStore.unlockLevel('main', index, mainStoryCases.length)) this.switchCase(index);
    },
  );
  private readonly hints = new RewardedHintFlow(
    () => this.session, () => buildMainStoryHint(this.currentCase, this.session), () => { if (this.isValid) this.render(); },
  );
  private readonly dailyHints = new RewardedHintFlow(
    () => this.session, () => buildArchiveHint(dailyArchiveCases[this.dailyIndex], this.session), () => { if (this.isValid) this.render(); },
  );

  start(): void {
    // This controller owns Canvas-local UI. A copy on an ordinary scene node
    // creates invisible controls that can intercept the real board's touches.
    if (!this.getComponent(Canvas)) {
      this.enabled = false;
      return;
    }
    this.dailyCampaignStartDate = LocalProgressStore.getOrCreateDailyCampaignStartDate(getDailyChallengeDateKey());
    this.caseIndex = LocalProgressStore.getUnlockedMainStoryLevel(mainStoryCases.length);
    this.loadCase(this.caseIndex);
    const saved = this.session.snapshot();
    if (saved.status === 'completed' && this.caseIndex >= archiveUnlockMainCaseIndex) LocalProgressStore.unlockArchive();
    // Resume progression from completed rounds after more cases are added.
    if (saved.status === 'completed' && this.caseIndex < mainStoryCases.length - 1) {
      const next = LocalProgressStore.unlockNextMainStoryLevel(this.caseIndex, mainStoryCases.length);
      if (next > this.caseIndex) {
        LocalProgressStore.clearSession(mainStoryCases[next].definition.id);
        this.loadCase(next);
      }
    }
    // Show the illustrated cover once per app session, then enter the town map.
    this.showCover = !MainPuzzleGreyboxScene.hasShownTitleCover;
    MainPuzzleGreyboxScene.hasShownTitleCover = true;
    this.showCaseSelector = !this.showCover;
    this.selectorPage = Math.floor(this.caseIndex / 20);
    this.render();
    view.on('canvas-resize', this.render, this);
    view.on('design-resolution-changed', this.render, this);
  }

  onDestroy(): void {
    view.off('canvas-resize', this.render, this);
    view.off('design-resolution-changed', this.render, this);
    this.puzzleView?.dispose();
    this.archivePuzzleView?.dispose();
    this.hints.dispose();
    this.levelUnlock.dispose();
    this.dailyHints.dispose();
  }

  update(dt: number): void {
    this.calendarRefreshElapsed += dt;
    if (this.calendarRefreshElapsed < 1) return;
    this.calendarRefreshElapsed = 0;
    const today = getDailyChallengeDateKey();
    if (today === this.lastObservedDailyDateKey) return;
    this.lastObservedDailyDateKey = today;
    if (this.dailyMode && this.dailyFreeAttemptPending && this.dailyDateKey < today) {
      this.dailyMode = false;
      this.dailyDateKey = '';
      this.dailyFreeAttemptPending = false;
      this.loadCase(this.caseIndex);
      this.dailyCalendarOpen = true;
      this.selectedDailyDateKey = today;
      const parts = getDailyChallengeDateParts();
      this.dailyCalendarYear = parts.year;
      this.dailyCalendarMonth = parts.month;
      this.render();
      return;
    }
    if (this.dailyCalendarOpen) {
      const parts = getDailyChallengeDateParts();
      this.dailyCalendarYear = parts.year;
      this.dailyCalendarMonth = parts.month;
      this.selectedDailyDateKey = today;
      this.render();
    }
  }

  private get currentCase() {
    return mainStoryCases[this.caseIndex];
  }

  private get currentDailyCase() { return dailyArchiveCases[this.dailyIndex]; }

  private loadCase(index: number): void {
    this.dailyMode = false;
    this.dailyHints.reset();
    this.hints.reset();
    this.caseIndex = Math.max(0, Math.min(mainStoryCases.length - 1, index));
    this.prepareCurrentCase();
  }

  private openDailyCalendar(): void {
    this.dailyCampaignStartDate = LocalProgressStore.getOrCreateDailyCampaignStartDate(getDailyChallengeDateKey());
    this.dailyCalendarOpen = true;
    this.showCaseSelector = false;
    const today = getDailyChallengeDateKey();
    this.selectedDailyDateKey = this.dailyMode && this.dailyDateKey === today ? this.dailyDateKey : today;
    const parts = this.dailyCalendarParts(this.selectedDailyDateKey);
    this.dailyCalendarYear = parts.year;
    this.dailyCalendarMonth = parts.month;
    this.render();
  }

  private closeDailyCalendar(): void {
    this.dailyCalendarOpen = false;
    this.showCaseSelector = !this.dailyMode;
    this.render();
  }

  private selectDailyDate(dateKey: string): void {
    if (dateKey > getDailyChallengeDateKey() || getDailyChallengeLevelIndex(dateKey, this.dailyCampaignStartDate) < 0) return;
    this.selectedDailyDateKey = dateKey;
    this.render();
  }

  private shiftDailyCalendarMonth(delta: number): void {
    const next = new Date(Date.UTC(this.dailyCalendarYear, this.dailyCalendarMonth - 1 + delta, 1));
    const candidateYear = next.getUTCFullYear();
    const candidateMonth = next.getUTCMonth() + 1;
    const today = getDailyChallengeDateParts();
    if (candidateYear * 12 + candidateMonth > today.year * 12 + today.month) return;
    this.dailyCalendarYear = candidateYear;
    this.dailyCalendarMonth = candidateMonth;
    this.selectedDailyDateKey = '';
    this.render();
  }

  private startDailyChallenge(dateKey: string): void {
    if (!dateKey || dateKey > getDailyChallengeDateKey()) return;
    const index = getDailyChallengeLevelIndex(dateKey, this.dailyCampaignStartDate);
    if (index < 0 || index >= dailyArchiveCases.length) return;
    this.requestDailyEntry(index, dateKey);
  }

  private leaveDailyChallenge(): void {
    const returnDate = this.dailyDateKey || getDailyChallengeDateKey();
    this.dailyMode = false;
    this.dailyDateKey = '';
    this.dailyAccessGate = null;
    this.dailyFreeAttemptPending = false;
    this.showCaseSelector = false;
    this.loadCase(this.caseIndex);
    this.dailyCalendarOpen = true;
    this.selectedDailyDateKey = returnDate;
    const parts = this.dailyCalendarParts(returnDate);
    this.dailyCalendarYear = parts.year;
    this.dailyCalendarMonth = parts.month;
    this.render();
  }

  private requestDailyEntry(index: number, dateKey: string): void {
    const today = getDailyChallengeDateKey();
    if (index < 0 || index >= dailyArchiveCases.length || dateKey > today) return;
    const levelId = `D${String(index + 1).padStart(2, '0')}`;
    this.dailyIndex = index;
    this.dailyDateKey = dateKey;
    this.dailyMode = true;
    this.dailyCalendarOpen = false;
    this.showCaseSelector = false;
    this.dailySelectedSubject = 0;
    this.dailySelectedCell = null;
    this.dailyBoardExpanded = true;
    this.dailyHints.reset();
    this.hints.reset();

    if (this.session.definition.id !== this.currentDailyCase.definition.id) LocalProgressStore.saveSession(this.session);
    const savedSession = new PuzzleSession(this.currentDailyCase.definition);
    const hasSavedSession = LocalProgressStore.loadSession(savedSession);
    this.session = savedSession;

    if (dateKey < today && !LocalProgressStore.isDailyLevelUnlocked(levelId)) {
      this.dailyAccessGate = { kind: 'unlock', index, dateKey };
      this.render();
      return;
    }

    const definitionId = this.currentDailyCase.definition.id;
    const savedStatus = hasSavedSession ? savedSession.snapshot().status : 'playing';
    const isToday = dateKey === today;
    const freeAttemptUsed = isToday && LocalProgressStore.hasUsedDailyFreeAttempt(dateKey);

    if (isToday && freeAttemptUsed && (savedStatus === 'failed' || savedStatus === 'completed')) {
      this.dailyAccessGate = { kind: 'retry', index, dateKey };
      this.render();
      return;
    }
    if (!isToday && hasSavedSession && (savedStatus === 'failed' || savedStatus === 'completed')) {
      this.dailyAccessGate = { kind: 'retry', index, dateKey };
      this.render();
      return;
    }

    const startFresh = !hasSavedSession || (isToday && !freeAttemptUsed);
    if (startFresh) LocalProgressStore.clearSession(definitionId);
    this.dailyFreeAttemptPending = isToday && !freeAttemptUsed;
    this.prepareDailyCase(startFresh);
    this.render();
  }

  private prepareDailyCase(startFresh: boolean): void {
    if (startFresh) LocalProgressStore.clearSession(this.currentDailyCase.definition.id);
    this.dailyHints.reset();
    this.session = new PuzzleSession(this.currentDailyCase.definition);
    LocalProgressStore.loadSession(this.session);
    const saved = this.session.snapshot();
    const levelId = `D${String(this.dailyIndex + 1).padStart(2, '0')}`;
    if (saved.status === 'completed') LocalProgressStore.claimDailyReward(levelId, dailyChallengeFirstClearReward);
    this.dailySelectedSubject = this.findUnplacedDailySubject();
    this.dailySelectedCell = null;
    this.hasStartedCase = !!saved.rewardedHint || Object.keys(saved.confirmed).length > 0 ||
      Object.keys(saved.drafts).length > 0 || saved.lives < this.currentDailyCase.definition.initialLives || saved.status !== 'playing';
    this.answerOpen = this.session.isPuzzleSolved();
    this.selectedAnswerId = null;
    this.helpOpen = false;
    this.showCaseSelector = false;
    this.dailyBoardExpanded = true;
    this.dailyAccessGate = null;
  }

  private selectDailyArchiveCase(index: number): void {
    const todayIndex = getDailyChallengeLevelIndex(getDailyChallengeDateKey(), this.dailyCampaignStartDate);
    if (!Number.isInteger(index) || index < 0 || index > todayIndex || index >= dailyArchiveCases.length) return;
    const dateKey = index === todayIndex ? getDailyChallengeDateKey() : getDailyChallengeReleaseDate(index, this.dailyCampaignStartDate);
    this.requestDailyEntry(index, dateKey);
  }

  private confirmDailyAccessAd(): void {
    const gate = this.dailyAccessGate;
    if (!gate) return;
    this.dailyAccessGate = null;
    if (gate.kind === 'unlock') {
      LocalProgressStore.unlockDailyLevel(`D${String(gate.index + 1).padStart(2, '0')}`);
      this.dailyFreeAttemptPending = false;
      this.prepareDailyCase(true);
      this.render();
      return;
    }
    if (gate.dateKey < getDailyChallengeDateKey()) {
      LocalProgressStore.unlockDailyLevel(`D${String(gate.index + 1).padStart(2, '0')}`);
    }
    LocalProgressStore.clearSession(this.currentDailyCase.definition.id);
    this.dailyFreeAttemptPending = false;
    this.prepareDailyCase(true);
    this.render();
  }

  private cancelDailyAccessAd(): void {
    if (!this.dailyAccessGate) return;
    this.dailyAccessGate = null;
    this.leaveDailyChallenge();
  }

  private dailyCalendarParts(dateKey: string): { year: number; month: number } {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(dateKey);
    if (!match) return getDailyChallengeDateParts();
    return { year: Number(match[1]), month: Number(match[2]) };
  }

  private prepareCurrentCase(): void {
    this.hints.reset();
    this.session = new PuzzleSession(this.currentCase.definition);
    this.activePair = this.currentCase.initialPairId ?? this.currentCase.pairs[0].id;
    this.selected = null;
    this.positiveMark = true;
    this.answerOpen = false;
    this.selectedAnswerId = null;
    this.selectorPage = Math.floor(this.caseIndex / 20);
    this.helpOpen = false;
    this.notesOpen = false;
    LocalProgressStore.loadSession(this.session);
    const saved = this.session.snapshot();
    const currentClue = this.currentCase.definition.clues.find(clue => saved.activeClueIds.includes(clue.id));
    if (currentClue?.pairId) this.activePair = currentClue.pairId;
    this.hasStartedCase = !this.currentCase.intro || saved.status !== 'playing' || saved.lives < 2 ||
      !!saved.rewardedHint || Object.keys(saved.confirmed).length > 0 || Object.keys(saved.drafts).length > 0;
  }

  private render(): void {
    if (!this.uiRoot || !this.uiRoot.isValid) {
      this.uiRoot = new Node('GeneratedUI');
      this.uiRoot.layer = this.node.layer;
      this.uiRoot.addComponent(UITransform).setContentSize(view.getVisibleSize());
      this.node.addChild(this.uiRoot);
    }
    for (const child of [...this.uiRoot.children]) child.destroy();
    this.uiRoot.removeAllChildren();
    const size = view.getVisibleSize();
    const snap = this.session.snapshot();
    LocalProgressStore.saveSession(this.session);
    this.uiRoot.getComponent(UITransform)!.setContentSize(size);
    if (this.dailyMode) {
      this.renderDailyArchive(size, snap);
      return;
    }
    const claimedIds = LocalProgressStore.getClaimedDailyDates().filter(value => /^D\d{2}$/.test(value));
    const calendarModel = createDailyCalendarModel(
      this.dailyCalendarYear, this.dailyCalendarMonth, this.dailyCampaignStartDate, this.selectedDailyDateKey,
      LocalProgressStore.getUnlockedDailyLevels(), this.getUsedDailyAttemptDates(), claimedIds, Date.now(),
    );
    const selectedDay = calendarModel.days.find(day => day.dateKey === this.selectedDailyDateKey);
    const selectedLevelId = selectedDay?.levelId ?? '';
    const selectedStatusLabel = !selectedDay ? '请选择一个日期'
      : selectedDay.status === 'available' ? '今日免费机会尚未使用'
        : selectedDay.status === 'free-used' ? '今日免费机会已用完'
          : selectedDay.status === 'completed' ? '今日已完成 · 首通奖励已领取'
            : selectedDay.status === 'ad-locked' ? '往期关卡 · 观看广告解锁'
              : selectedDay.status === 'unlocked' ? '已看广告解锁 · 可进入'
                : selectedDay.status === 'upcoming' ? '尚未开放' : '挑战活动开始前';
    const selectedStartCaption = !selectedDay ? '请选择日期'
      : selectedDay.status === 'ad-locked' ? `模拟看广告解锁 ${selectedLevelId}`
        : selectedDay.status === 'free-used' || selectedDay.status === 'completed' ? `模拟看广告重玩 ${selectedLevelId}`
          : selectedDay.status === 'unlocked' ? `进入 ${selectedLevelId}`
            : selectedDay.status === 'available' ? `开始今日免费挑战 ${selectedLevelId}` : '尚未开放';
    const selectedCanStart = !!selectedDay && !['empty', 'upcoming', 'unavailable'].includes(selectedDay.status);
    {
      if (!this.puzzleView) this.puzzleView = new MainStoryPuzzleView(() => {
        if (this.isValid) this.render();
      });
      this.puzzleView.render(this.uiRoot, size, {
        hints: this.hints,
        caseIndex: this.caseIndex, caseData: this.currentCase, snapshot: snap, activePair: this.activePair,
        caseBadge: `M${String(this.caseIndex + 1).padStart(2, '0')}`,
        dailyMode: false,
        dailyDateLabel: getDailyChallengeDateKey(),
        dailyRewardClaimed: false,
        dailyCurrency: LocalProgressStore.getDailyCurrency(),
        dailyCalendarOpen: this.dailyCalendarOpen,
        dailyCalendarMonthLabel: calendarModel.monthLabel,
        dailyCalendarDays: calendarModel.days,
        dailyCalendarCanGoNext: calendarModel.canGoNext,
        dailySelectedDateLabel: this.selectedDailyDateKey ? formatDailyChallengeDateLabel(this.selectedDailyDateKey) : '请选择日期',
        dailySelectedDateKey: this.selectedDailyDateKey,
        dailySelectedIsToday: this.selectedDailyDateKey === getDailyChallengeDateKey(),
        dailySelectedCompleted: !!selectedDay && selectedDay.status === 'completed',
        dailySelectedLevelId: selectedLevelId,
        dailySelectedStatusLabel: selectedStatusLabel,
        dailySelectedStartCaption: selectedStartCaption,
        dailySelectedCanStart: selectedCanStart,
        selected: this.selected, positiveMark: this.positiveMark,
        canUndo: this.session.canUndoDraft(), solved: this.session.isPuzzleSolved(),
        coverOpen: this.showCover,
        answerOpen: this.answerOpen, helpOpen: this.helpOpen, notesOpen: this.notesOpen, selectorOpen: this.showCaseSelector,
        selectedAnswerId: this.selectedAnswerId, started: this.hasStartedCase, selectorPage: this.selectorPage,
        levelUnlock: this.levelUnlock,
        unlockedLevels: LocalProgressStore.getUnlockedLevels('main', mainStoryCases.length),
        completedLevels: LocalProgressStore.getCompletedLevels('main', mainStoryCases.length),
        unlockedLevel: LocalProgressStore.getUnlockedMainStoryLevel(mainStoryCases.length),
        archiveUnlocked: LocalProgressStore.isArchiveUnlocked(),
        caseTitles: mainStoryCases.map(caseData => caseData.title),
      }, {
        startGame: () => {
          this.showCover = false;
          this.showCaseSelector = true;
          this.selectorPage = Math.floor(this.caseIndex / 20);
          this.render();
        },
        select: (person, option) => {
          this.selected = { person, option };
          const draft = this.session.snapshot().drafts[relationSelectionId(this.activePair, person, option)];
          if (draft !== undefined) this.positiveMark = draft;
          this.render();
        },
        tab: id => { this.activePair = id; this.selected = null; this.render(); },
        mark: positive => { this.positiveMark = positive; this.writeDraft(); },
        confirm: () => this.confirm(),
        undo: () => { this.session.undoDraft(); this.render(); },
        clear: () => {
          if (!this.session.clearDrafts()) { this.toast('当前没有暂填标记'); return; }
          this.selected = null;
          this.render();
        },
        answer: id => this.submit(id),
        chooseAnswer: id => { this.selectedAnswerId = id; this.render(); },
        submitAnswer: () => { if (this.selectedAnswerId) this.submit(this.selectedAnswerId); },
        start: () => { this.hasStartedCase = true; this.render(); },
        toggleAnswer: open => { this.answerOpen = open; this.render(); },
        toggleHelp: open => { this.helpOpen = open; this.render(); },
        toggleNotes: open => { this.notesOpen = open; this.render(); },
        toggleSelector: open => { this.showCaseSelector = open; this.selectorPage = Math.floor(this.caseIndex / 20); this.render(); },
        selectorPage: page => { this.selectorPage = Math.max(0, Math.min(Math.ceil(mainStoryCases.length / 20) - 1, page)); this.render(); },
        selectCase: index => this.selectCase(index),
        openDaily: () => this.openDailyCalendar(),
        openDailyCalendar: () => this.openDailyCalendar(),
        closeDailyCalendar: () => this.closeDailyCalendar(),
        shiftDailyCalendarMonth: delta => this.shiftDailyCalendarMonth(delta),
        selectDailyDate: dateKey => this.selectDailyDate(dateKey),
        startDailyChallenge: dateKey => this.startDailyChallenge(dateKey),
        leaveDaily: () => this.leaveDailyChallenge(),
        openArchive: () => director.loadScene('archive-room'),
        revive: () => { this.session.acceptAdRevive(); this.render(); },
        declineRevive: () => { this.session.declineAdRevive(); this.render(); },
        restart: () => { this.hints.reset(); this.session.restart(); this.selected = null; this.positiveMark = true; this.answerOpen = false; this.selectedAnswerId = null; this.hasStartedCase = true; this.activePair = this.currentCase.initialPairId ?? this.currentCase.pairs[0].id; this.render(); },
        next: () => this.advanceCase(),
      });
      return;
    }
  }

  private renderDailyArchive(size: ReturnType<typeof view.getVisibleSize>, snap: ReturnType<PuzzleSession['snapshot']>): void {
    if (!this.archivePuzzleView) this.archivePuzzleView = new ArchivePuzzleView(() => { if (this.isValid) this.render(); });
    const todayIndex = getDailyChallengeLevelIndex(getDailyChallengeDateKey(), this.dailyCampaignStartDate);
    const levelId = `D${String(this.dailyIndex + 1).padStart(2, '0')}`;
    const gate = this.dailyAccessGate;
    this.archivePuzzleView.render(this.uiRoot!, size, {
      hints: this.dailyHints,
      caseData: this.currentDailyCase,
      caseIndex: this.dailyIndex,
      cases: dailyArchiveCases,
      unlockedIndex: Math.max(0, todayIndex),
      snapshot: snap,
      selectedSubject: this.dailySelectedSubject,
      selectedCell: this.dailySelectedCell,
      started: this.hasStartedCase,
      selectorOpen: this.showCaseSelector,
      selectorPage: this.selectorPage,
      answerOpen: this.answerOpen,
      selectedAnswerId: this.selectedAnswerId,
      helpOpen: this.helpOpen,
      boardExpanded: this.dailyBoardExpanded,
      solved: this.session.isPuzzleSolved(),
      canUndo: this.session.canUndoDraft(),
      dailyMode: true,
      dailyLevelId: levelId,
      dailyCurrentLevelIndex: todayIndex,
      dailyUnlockedLevelIds: LocalProgressStore.getUnlockedDailyLevels(),
      dailyTodayAttemptUsed: LocalProgressStore.hasUsedDailyFreeAttempt(getDailyChallengeDateKey()),
      dailyRewardClaimed: LocalProgressStore.hasClaimedDailyReward(levelId),
      dailyCurrency: LocalProgressStore.getDailyCurrency(),
      dailyAccessGate: gate ? {
        kind: gate.kind,
        levelId: `D${String(gate.index + 1).padStart(2, '0')}`,
        levelTitle: dailyArchiveCases[gate.index].title,
      } : null,
    }, {
      town: () => this.leaveDailyChallenge(),
      subject: index => { this.dailySelectedSubject = index; this.dailySelectedCell = null; this.render(); },
      cell: (row, column) => { this.dailySelectedCell = { row, column }; this.setDailyDraft(); this.render(); },
      confirm: () => this.confirmDailyPlacement(),
      undo: () => { this.session.undoDraft(); this.dailySelectedCell = null; this.render(); },
      clear: () => { const cleared = this.session.clearDrafts(); this.dailySelectedCell = null; this.render(); if (!cleared) this.toast('当前没有暂填记录'); },
      chooseAnswer: id => { this.selectedAnswerId = id; this.render(); },
      submitAnswer: () => { if (this.selectedAnswerId) this.submitDailyAnswer(this.selectedAnswerId); },
      toggleAnswer: open => { this.answerOpen = open; this.render(); },
      toggleHelp: open => { this.helpOpen = open; this.render(); },
      toggleBoardExpanded: open => { this.dailyBoardExpanded = open; this.render(); },
      toggleSelector: open => { this.showCaseSelector = open; this.selectorPage = Math.floor(this.dailyIndex / 5); this.render(); },
      selectorPage: page => { this.selectorPage = Math.max(0, Math.min(1, page)); this.render(); },
      selectCase: index => this.selectDailyArchiveCase(index),
      start: () => {
        if (this.dailyFreeAttemptPending) {
          LocalProgressStore.markDailyFreeAttemptUsed(this.dailyDateKey);
          this.dailyFreeAttemptPending = false;
        }
        this.hasStartedCase = true;
        this.dailyBoardExpanded = true;
        this.render();
      },
      revive: () => { this.session.acceptAdRevive(); this.render(); },
      declineRevive: () => { this.session.declineAdRevive(); this.render(); },
      restart: () => { this.dailyAccessGate = { kind: 'retry', index: this.dailyIndex, dateKey: this.dailyDateKey }; this.render(); },
      next: () => { this.showCaseSelector = true; this.selectorPage = Math.floor(this.dailyIndex / 5); this.render(); },
      confirmDailyAccessAd: () => this.confirmDailyAccessAd(),
      cancelDailyAccessAd: () => this.cancelDailyAccessAd(),
    });
  }

  private selectCase(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= mainStoryCases.length) return;
    if (!LocalProgressStore.getUnlockedLevels('main', mainStoryCases.length).includes(index)) {
      this.levelUnlock.open(index, `M${String(index + 1).padStart(2, '0')} ${mainStoryCases[index].title}`);
      return;
    }
    this.switchCase(index);
  }

  private getUsedDailyAttemptDates(): string[] {
    return LocalProgressStore.getUsedDailyAttemptDates();
  }

  private findUnplacedDailySubject(): number {
    const confirmed = this.session.snapshot().confirmed;
    const index = this.currentDailyCase.subjects.findIndex(subject =>
      !Object.keys(confirmed).some(id => id.startsWith(`placement:${subject.id}:`) && confirmed[id]));
    return index < 0 ? 0 : index;
  }

  private setDailyDraft(): void {
    if (!this.dailySelectedCell) return;
    const subject = this.currentDailyCase.subjects[this.dailySelectedSubject];
    this.session.setDraft(placementSelectionId(subject.id, this.dailySelectedCell.row, this.dailySelectedCell.column), true);
  }

  private confirmDailyPlacement(): void {
    if (!this.dailySelectedCell) { this.toast('先选一份记录，再点一个格子暂填'); return; }
    const subject = this.currentDailyCase.subjects[this.dailySelectedSubject];
    const id = placementSelectionId(subject.id, this.dailySelectedCell.row, this.dailySelectedCell.column);
    if (this.session.snapshot().drafts[id] === undefined) this.session.setDraft(id, true);
    const result = this.session.confirm(id);
    this.dailySelectedCell = null;
    if (result.result === 'correct') this.dailySelectedSubject = this.findUnplacedDailySubject();
    if (this.session.isPuzzleSolved()) this.answerOpen = true;
    this.render();
    if (result.result === 'wrong') this.toast(result.status === 'awaiting-revive' ? '生命耗尽' : '落位错误，失去一条生命');
    else if (result.result === 'correct' && !this.session.isPuzzleSolved()) this.toast('落位正确，旧线索已归档，新线索出现', true);
  }

  private submitDailyAnswer(answerId: string): void {
    if (!this.currentDailyCase.finalOptions.some(option => option.id === answerId)) return;
    const result = this.session.submitFinalAnswer(answerId);
    this.selectedAnswerId = null;
    if (result === 'correct') {
      const levelId = `D${String(this.dailyIndex + 1).padStart(2, '0')}`;
      LocalProgressStore.claimDailyReward(levelId, dailyChallengeFirstClearReward);
    }
    this.render();
    if (result === 'wrong') this.toast('判断错误，失去一条生命');
  }

  private switchCase(index: number): void {
    LocalProgressStore.clearSession(mainStoryCases[index].definition.id);
    this.showCaseSelector = false;
    this.loadCase(index);
    this.render();
  }

  private writeDraft(): void {
    if (!this.selected) { this.toast('先选择一个格子'); return; }
    this.session.setDraft(relationSelectionId(this.activePair, this.selected.person, this.selected.option), this.positiveMark);
    this.render();
  }

  private confirm(): void {
    if (!this.selected) { this.toast('先选择一个格子'); return; }
    const id = relationSelectionId(this.activePair, this.selected.person, this.selected.option);
    if (this.session.snapshot().drafts[id] === undefined) this.writeDraft();
    const result = this.session.confirm(id);
    if (result.result === 'correct') {
      this.selected = null;
      const newClue = this.currentCase.definition.clues.find(clue => result.unlockedClueIds.includes(clue.id));
      if (newClue?.pairId) this.activePair = newClue.pairId;
    }
    if (this.session.isPuzzleSolved()) this.answerOpen = true;
    this.render();
    if (result.result === 'wrong') this.toast(result.status === 'awaiting-revive' ? '生命耗尽' : '标记错误，失去一条生命');
    else if (result.result === 'correct' && !this.session.isPuzzleSolved()) {
      this.toast(result.unlockedClueIds.length || result.archivedClueIds.length
        ? '确认正确，线索已更新' : '关系已确认，继续推理当前线索', true);
    }
  }

  private submit(answerId: string): void {
    const options = this.currentCase.finalOptions ?? this.currentCase.people;
    if (!options.some(option => option.id === answerId)) return;
    const result = this.session.submitFinalAnswer(answerId);
    this.selectedAnswerId = null;
    if (result === 'correct') {
      if (this.caseIndex >= archiveUnlockMainCaseIndex) LocalProgressStore.unlockArchive();
      LocalProgressStore.unlockNextMainStoryLevel(this.caseIndex, mainStoryCases.length);
    }
    this.render();
    if (result === 'wrong') this.toast('答案错误，失去一条生命');
  }

  private advanceCase(): void {
    this.switchCase(Math.min(this.caseIndex + 1, mainStoryCases.length - 1));
  }

  private toast(message: string, correct = false): void {
    if (this.dailyMode) this.archivePuzzleView?.feedback(message, correct);
    else this.puzzleView?.feedback(message, correct);
  }
}
