import { _decorator, Canvas, Component, director, Node, UITransform, view } from 'cc';
import { PuzzleSession } from '../core/PuzzleSession';
import { placementSelectionId } from '../core/PuzzleTypes';
import { archiveStoryCases } from '../data/casePrototypes';
import { LocalProgressStore } from '../services/LocalProgressStore';
import { ArchivePuzzleView } from './ArchivePuzzleView';
import { RewardedLevelUnlockFlow } from '../services/RewardedLevelUnlockFlow';
import { RewardedHintFlow } from '../services/RewardedHintFlow';
import { buildArchiveHint } from '../services/PuzzleHintService';

const { ccclass } = _decorator;

/** Keeps the existing scene component identity; presentation lives in ArchivePuzzleView. */
@ccclass('ArchiveGridGreyboxScene')
export class ArchiveGridGreyboxScene extends Component {
  private selectedCaseIndex = 0;
  private session = new PuzzleSession(archiveStoryCases[0].definition);
  private uiRoot: Node | null = null;
  private puzzleView: ArchivePuzzleView | null = null;
  private selectedSubject = 0;
  private selectedCell: { row: number; column: number } | null = null;
  private hasStartedCase = false;
  private caseSelectorOpen = true;
  private selectorPage = 0;
  private answerOpen = false;
  private selectedAnswerId: string | null = null;
  private helpOpen = false;
  private boardExpanded = false;
  private readonly levelUnlock = new RewardedLevelUnlockFlow(
    () => { if (this.isValid) this.render(); },
    index => {
      if (!this.isValid) return;
      if (LocalProgressStore.unlockLevel('archive', index, archiveStoryCases.length)) this.switchArchiveCase(index);
    },
  );
  private readonly hints = new RewardedHintFlow(
    () => this.session, () => buildArchiveHint(this.activeCase, this.session), () => { if (this.isValid) this.render(); },
  );
  private get activeCase() { return archiveStoryCases[this.selectedCaseIndex]; }

  start(): void {
    if (!this.getComponent(Canvas)) { this.enabled = false; return; }
    // A legacy A05 clear may be saved even while another volume is selected.
    const boundaryIndex = LocalProgressStore.getUnlockedArchiveCaseIndex(archiveStoryCases.length);
    const boundarySession = new PuzzleSession(archiveStoryCases[boundaryIndex].definition);
    if (LocalProgressStore.loadSession(boundarySession) && boundarySession.snapshot().status === 'completed') {
      LocalProgressStore.unlockNextArchiveCase(boundaryIndex, archiveStoryCases.length);
    }
    this.selectedCaseIndex = LocalProgressStore.getSelectedArchiveCaseIndex(archiveStoryCases.length);
    this.selectorPage = Math.floor(this.selectedCaseIndex / 5);
    this.session = new PuzzleSession(this.activeCase.definition);
    LocalProgressStore.loadSession(this.session);
    const restored = this.session.snapshot();
    if (restored.status === 'completed') LocalProgressStore.unlockNextArchiveCase(this.selectedCaseIndex, archiveStoryCases.length);
    this.hasStartedCase = !!restored.rewardedHint || Object.keys(restored.confirmed).length > 0 || Object.keys(restored.drafts).length > 0 || restored.lives < this.activeCase.definition.initialLives;
    this.boardExpanded = this.activeCase.definition.gridSize >= 7;
    this.selectUnplacedSubject();
    this.render();
    view.on('canvas-resize', this.render, this);
    view.on('design-resolution-changed', this.render, this);
  }

  onDestroy(): void {
    view.off('canvas-resize', this.render, this);
    view.off('design-resolution-changed', this.render, this);
    this.puzzleView?.dispose();
    this.hints.dispose();
    this.levelUnlock.dispose();
  }

  private render(): void {
    if (!this.uiRoot || !this.uiRoot.isValid) {
      this.uiRoot = new Node('GeneratedUI');
      this.uiRoot.layer = this.node.layer;
      this.uiRoot.addComponent(UITransform);
      this.node.addChild(this.uiRoot);
    }
    for (const child of [...this.uiRoot.children]) child.destroy();
    this.uiRoot.removeAllChildren();
    const size = view.getVisibleSize();
    this.uiRoot.getComponent(UITransform)!.setContentSize(size);
    LocalProgressStore.saveSession(this.session);
    if (!this.puzzleView) this.puzzleView = new ArchivePuzzleView(() => { if (this.isValid) this.render(); });
    this.puzzleView.render(this.uiRoot, size, {
      hints: this.hints,
      caseData: this.activeCase, caseIndex: this.selectedCaseIndex, cases: archiveStoryCases,
      levelUnlock: this.levelUnlock,
      unlockedLevels: LocalProgressStore.getUnlockedLevels('archive', archiveStoryCases.length),
      completedLevels: LocalProgressStore.getCompletedLevels('archive', archiveStoryCases.length),
      unlockedIndex: LocalProgressStore.getUnlockedArchiveCaseIndex(archiveStoryCases.length),
      snapshot: this.session.snapshot(), selectedSubject: this.selectedSubject, selectedCell: this.selectedCell,
      started: this.hasStartedCase, selectorOpen: this.caseSelectorOpen, answerOpen: this.answerOpen,
      selectorPage: this.selectorPage,
      selectedAnswerId: this.selectedAnswerId,
      helpOpen: this.helpOpen, boardExpanded: this.boardExpanded, solved: this.session.isPuzzleSolved(), canUndo: this.session.canUndoDraft(),
    }, {
      town: () => director.loadScene('main-story'),
      subject: index => { this.selectedSubject = index; this.selectedCell = null; this.render(); },
      cell: (row, column) => { this.selectedCell = { row, column }; this.setCurrentDraft(); this.render(); },
      confirm: () => this.confirmCurrent(),
      undo: () => { this.session.undoDraft(); this.selectedCell = null; this.render(); },
      clear: () => { const cleared = this.session.clearDrafts(); this.selectedCell = null; this.render(); if (!cleared) this.toast('当前没有暂填记录'); },
      chooseAnswer: id => { this.selectedAnswerId = id; this.render(); },
      submitAnswer: () => { if (this.selectedAnswerId) this.submitFinalAnswer(this.selectedAnswerId); },
      toggleAnswer: open => { this.answerOpen = open; this.render(); },
      toggleHelp: open => { this.helpOpen = open; this.render(); },
      toggleBoardExpanded: open => { this.boardExpanded = open; this.render(); },
      toggleSelector: open => { this.caseSelectorOpen = open; this.selectorPage = Math.floor(this.selectedCaseIndex / 5); this.render(); },
      selectorPage: page => { this.selectorPage = Math.max(0, Math.min(Math.ceil(archiveStoryCases.length / 5) - 1, page)); this.render(); },
      selectCase: index => this.switchArchiveCase(index),
      start: () => { this.hasStartedCase = true; this.boardExpanded = this.activeCase.definition.gridSize >= 7; this.render(); },
      revive: () => { this.session.acceptAdRevive(); this.render(); },
      declineRevive: () => { this.session.declineAdRevive(); this.render(); },
      restart: () => { this.hints.reset(); this.session.restart(); this.selectedSubject = 0; this.selectedCell = null; this.hasStartedCase = true; this.answerOpen = false; this.selectedAnswerId = null; this.render(); },
      next: () => {
        if (this.selectedCaseIndex < archiveStoryCases.length - 1) this.switchArchiveCase(this.selectedCaseIndex + 1);
        else { this.caseSelectorOpen = true; this.selectorPage = Math.floor(this.selectedCaseIndex / 5); this.render(); }
      },
    });
  }

  private setCurrentDraft(): void {
    if (!this.selectedCell) return;
    const subject = this.activeCase.subjects[this.selectedSubject];
    this.session.setDraft(placementSelectionId(subject.id, this.selectedCell.row, this.selectedCell.column), true);
  }

  private selectUnplacedSubject(): void {
    const confirmed = this.session.snapshot().confirmed;
    const index = this.activeCase.subjects.findIndex(subject => !Object.keys(confirmed).some(id => id.startsWith('placement:' + subject.id + ':') && confirmed[id]));
    if (index >= 0) this.selectedSubject = index;
  }

  private confirmCurrent(): void {
    if (!this.selectedCell) { this.toast('先选记录，再点一个格子暂填'); return; }
    const subject = this.activeCase.subjects[this.selectedSubject];
    const result = this.session.confirm(placementSelectionId(subject.id, this.selectedCell.row, this.selectedCell.column));
    this.selectedCell = null;
    if (result.result === 'correct') this.selectUnplacedSubject();
    if (this.session.isPuzzleSolved()) this.answerOpen = true;
    this.render();
    if (result.result === 'wrong') this.toast('落位错误，失去一条生命');
    else if (result.result === 'correct' && !this.session.isPuzzleSolved()) this.toast('落位正确，线索已更新', true);
  }

  private submitFinalAnswer(id: string): void {
    if (!this.activeCase.finalOptions.some(option => option.id === id)) return;
    const result = this.session.submitFinalAnswer(id);
    this.selectedAnswerId = null;
    if (result === 'correct') LocalProgressStore.unlockNextArchiveCase(this.selectedCaseIndex, archiveStoryCases.length);
    this.render();
    if (result === 'wrong') this.toast('判断错误，失去一条生命');
  }

  private switchArchiveCase(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= archiveStoryCases.length) return;
    if (!LocalProgressStore.getUnlockedLevels('archive', archiveStoryCases.length).includes(index)) {
      this.levelUnlock.open(index, `A${String(index + 1).padStart(2, '0')} ${archiveStoryCases[index].title}`);
      return;
    }
    this.hints.reset();
    const nextCase = archiveStoryCases[index];
    LocalProgressStore.clearSession(nextCase.definition.id);
    LocalProgressStore.setSelectedArchiveCaseIndex(index);
    this.selectedCaseIndex = index;
    this.selectorPage = Math.floor(index / 5);
    this.session = new PuzzleSession(nextCase.definition);
    this.selectedSubject = 0;
    this.selectedCell = null;
    this.hasStartedCase = false;
    this.caseSelectorOpen = false;
    this.answerOpen = false;
    this.selectedAnswerId = null;
    this.helpOpen = false;
    this.boardExpanded = this.activeCase.definition.gridSize >= 7;
    this.render();
  }

  private toast(message: string, correct = false): void { this.puzzleView?.feedback(message, correct); }
}
