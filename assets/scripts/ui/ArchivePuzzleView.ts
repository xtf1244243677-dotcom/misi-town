import { Color, ImageAsset, Node, Rect, resources, Size, Sprite, SpriteFrame, Texture2D } from 'cc';
import { ArchiveStoryCaseConfig } from '../data/casePrototypes';
import { placementSelectionId, SessionSnapshot } from '../core/PuzzleTypes';
import { puzzleThemes } from '../data/visualCatalog';
import { archiveRegionLabel } from '../data/archiveBoardRules';
import { PuzzleViewShell } from './PuzzleViewShell';
import { RewardedLevelUnlockFlow } from '../services/RewardedLevelUnlockFlow';
import { RewardedHintFlow } from '../services/RewardedHintFlow';

export interface ArchiveViewState {
  hints: RewardedHintFlow;
  levelUnlock?: RewardedLevelUnlockFlow;
  unlockedLevels?: number[];
  completedLevels?: number[];
  caseData: ArchiveStoryCaseConfig;
  caseIndex: number;
  cases: ArchiveStoryCaseConfig[];
  unlockedIndex: number;
  snapshot: SessionSnapshot;
  selectedSubject: number;
  selectedCell: { row: number; column: number } | null;
  started: boolean;
  selectorOpen: boolean;
  selectorPage: number;
  answerOpen: boolean;
  selectedAnswerId: string | null;
  helpOpen: boolean;
  boardExpanded: boolean;
  solved: boolean;
  canUndo: boolean;
  dailyMode?: boolean;
  dailyLevelId?: string;
  dailyCurrentLevelIndex?: number;
  dailyUnlockedLevelIds?: string[];
  dailyTodayAttemptUsed?: boolean;
  dailyRewardClaimed?: boolean;
  dailyCurrency?: number;
  dailyAccessGate?: { kind: 'unlock' | 'retry'; levelId: string; levelTitle: string } | null;
}

export interface ArchiveViewActions {
  town(): void;
  subject(index: number): void;
  cell(row: number, column: number): void;
  confirm(): void;
  undo(): void;
  clear(): void;
  chooseAnswer(id: string): void;
  submitAnswer(): void;
  toggleAnswer(open: boolean): void;
  toggleHelp(open: boolean): void;
  toggleBoardExpanded(open: boolean): void;
  toggleSelector(open: boolean): void;
  selectorPage(page: number): void;
  selectCase(index: number): void;
  start(): void;
  revive(): void;
  declineRevive(): void;
  restart(): void;
  next(): void;
  confirmDailyAccessAd?(): void;
  cancelDailyAccessAd?(): void;
}

/** Archive volumes scale their indexing board and record count together. */
export class ArchivePuzzleView extends PuzzleViewShell {
  private readonly redrawView: () => void;
  private propAtlasRequested = false;
  private propFrames: SpriteFrame[] = [];
  private propTexture: Texture2D | null = null;
  private focusCaseId = '';
  private focusRow = 0;
  private focusColumn = 0;
  private boardOverview = false;
  private recordPage = 0;
  private lastSelectedSubject = '';
  private shelfCollection: number | null = null;

  constructor(redraw: () => void) {
    super(redraw);
    this.redrawView = redraw;
  }

  override dispose(): void {
    this.propFrames.forEach(frame => frame.destroy());
    this.propFrames = [];
    if (this.propTexture?.isValid) this.propTexture.destroy();
    this.propTexture = null;
    super.dispose();
  }

  render(root: Node, visible: Size, state: ArchiveViewState, actions: ArchiveViewActions): void {
    this.begin(root, visible, puzzleThemes.archive);
    if (!state.selectorOpen) this.shelfCollection = null;
    this.loadPropAtlas();
    const data = state.caseData;
    const gridSize = data.definition.gridSize;
    if (this.focusCaseId !== data.definition.id) {
      this.focusCaseId = data.definition.id;
      this.focusRow = this.focusColumn = this.recordPage = 0;
      this.boardOverview = false;
      this.lastSelectedSubject = '';
    }
    const selectedId = data.subjects[state.selectedSubject].id;
    if (selectedId !== this.lastSelectedSubject) {
      this.lastSelectedSubject = selectedId;
      this.recordPage = Math.floor(state.selectedSubject / 6);
    }
    const snap = state.snapshot;
    const playing = snap.status === 'playing';
    this.label(state.dailyMode ? '每日档案' : '小镇档案馆', 169, 43, 230, 44, 33, this.ink, true);
    this.label(state.dailyMode
      ? `${state.dailyLevelId ?? `D${String(state.caseIndex + 1).padStart(2, '0')}`} · ${gridSize}×${gridSize}`
      : `${data.collectionTitle ?? '旧宅往事'} · ${state.caseIndex % 5 + 1}/5 · ${gridSize}×${gridSize}`,
    185, 78, 320, 26, 18, this.muted);
    this.button('obtain-hint', 344, 40, 104, 48, state.hints.caption, () => state.hints.open(), 'light', 19,
      !state.started || snap.status !== 'playing');
    this.button('help', 438, 52, 72, 60, '?', () => actions.toggleHelp(true), 'light', 26);
    this.button('open-archive-index', 537, 52, 108, 60, state.dailyMode ? '关卡' : '卷宗', () => actions.toggleSelector(true));
    this.button('back-to-town', 649, 52, 96, 60, state.dailyMode ? '日历' : '小镇', actions.town);
    this.panel('hero-frame', 360, 187, 672, 180, this.paper, 16);
    this.art(0, 360, 185, 656, 164);
    this.panel('case-title-strip', 360, 238, 656, 58, this.teal, 0);
    this.label(`${state.dailyMode ? state.dailyLevelId ?? `D${String(state.caseIndex + 1).padStart(2, '0')}` : `A${String(state.caseIndex + 1).padStart(2, '0')}`}  ${data.title}`,
      252, 237, 400, 44, 29, this.paper, true, 'left');
    this.label(`${'♥ '.repeat(snap.lives)}${'♡ '.repeat(Math.max(0, 2 - snap.lives))}`, 605, 237, 130, 44, 30, new Color(255, 201, 166), true);

    this.panel('clue-card', 360, 352, 672, 144, this.paper, 18);
    this.panel('clue-tab', 96, 304, 116, 36, this.gold, 10);
    this.label('证物摘录', 96, 304, 110, 30, 22, this.ink, true);
    const count = data.definition.requiredConfirmations.filter(id => snap.confirmed[id] === true).length;
    this.label(`已归位 ${count} / ${data.subjects.length} 份`, 588, 304, 176, 30, 21, this.teal, true);
    const clues = data.definition.clues.filter(clue => snap.activeClueIds.indexOf(clue.id) >= 0);
    this.label(clues.length ? clues.map(clue => `• ${clue.text}`).join('\n') : state.solved ? '定位线索已归档。请阅读人物证词，完成结案推理。' : '结合已确认的位置，推理剩余记录。',
      360, 370, 606, 88, 25, this.ink, false, 'left');
    this.label(state.solved ? `结案问题：${data.question}` : '材料全部归位后，解锁人物证词与结案推理。',
      gridSize >= 6 ? 278 : 360, 459, gridSize >= 6 ? 490 : 652, 60, gridSize >= 6 ? 21 : 24, this.teal, true);
    if (gridSize >= 6) this.button('expand-board', 621, 459, 138, 50, '放大棋盘', () => actions.toggleBoardExpanded(true), 'light', 23);
    const regionHint = archiveRegionLabel(gridSize);
    this.label(`↑北 ↓南 ←西 →东 · 每行、每列、每个${regionHint}各一份`, 360, 505, 650, 30, 18, this.muted);

    const columns = gridSize >= 6 ? Math.ceil(gridSize / 2) : gridSize;
    const rows = Math.ceil(data.subjects.length / columns);
    const subjectWidth = Math.min(152, 656 / columns - 6);
    const subjectHeight = rows > 1 ? 54 : gridSize === 4 ? 108 : 78;
    const subjectStartY = rows > 1 ? 546 : gridSize === 4 ? 579 : 572;
    data.subjects.forEach((subject, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = 360 - ((columns - 1) * 656 / columns) / 2 + column * (656 / columns);
      const y = subjectStartY + row * 58;
      const placed = Object.keys(snap.confirmed).some(id => id.startsWith(`placement:${subject.id}:`) && snap.confirmed[id]);
      this.button(`subject-${subject.id}`, x, y, subjectWidth, subjectHeight, '', () => actions.subject(index),
        state.selectedSubject === index && !placed ? 'primary' : 'light', 20, placed || !playing || state.solved);
      const iconSize = rows > 1 ? 32 : gridSize === 4 ? 50 : 38;
      const iconX = rows > 1 ? x - subjectWidth * 0.32 : x;
      const iconY = rows > 1 ? y : y - (subjectHeight === 108 ? 14 : 8);
      this.portrait(subject.id, iconX, iconY, iconSize, iconSize);
      this.label(`${placed ? '✓ ' : ''}${subject.shortName}`, rows > 1 ? x + subjectWidth * 0.15 : x, rows > 1 ? y : y + (subjectHeight === 108 ? 32 : 22),
        rows > 1 ? subjectWidth * 0.66 : subjectWidth - 8, rows > 1 ? 38 : 29, rows > 1 ? 17 : 19,
        state.selectedSubject === index && !placed ? this.paper : this.ink, true);
    });
    this.drawBoard(state, actions);
    const subject = data.subjects[state.selectedSubject];
    this.button('undo-draft', 186, 1080, 324, 56, '↶  撤销暂填', actions.undo, 'light', 23, !state.canUndo);
    this.button('clear-drafts', 534, 1080, 324, 56, '清空暂填', actions.clear, 'light', 23, !playing);
    this.button('confirm', 360, 1170, 672, 76, state.solved ? '阅读证词 · 结案推理  →' : '确认所选落位',
      state.solved ? () => actions.toggleAnswer(true) : actions.confirm, 'primary', 29, !playing);
    this.label(state.selectedCell
      ? state.dailyMode ? `${subject.name} · 已选一个暂填位置` : `${subject.name} · 第 ${state.selectedCell.row} 行第 ${state.selectedCell.column} 列`
      : '先选记录 → 点格子暂填 → 确认落位', 360, 1240, 650, 36, 22, this.muted);

    if (state.boardExpanded && state.started && playing) this.expandedBoard(state, actions);
    if (state.dailyAccessGate) this.modal(
      state.dailyAccessGate.kind === 'unlock' ? `解锁${state.dailyAccessGate.levelId}？` : '再挑战一次？',
      state.dailyAccessGate.kind === 'unlock'
        ? `${state.dailyAccessGate.levelTitle}\n观看一次激励广告即可解锁此往期关卡，之后可从日历或关卡目录进入。`
        : '本次挑战已经结束。观看一次激励广告即可重新开始；重新开始会清空本轮落位、命数和线索进度。',
      '模拟观看广告 · 继续', () => actions.confirmDailyAccessAd?.(), '暂不观看', () => actions.cancelDailyAccessAd?.());
    else if (snap.status === 'awaiting-revive') this.modal('调查暂时停下了', '观看一次广告，可获得 1 条生命继续。\n本关仅有一次复活机会。', '模拟观看广告 · +1 生命', actions.revive, '放弃复活', actions.declineRevive);
    else if (snap.status === 'failed') this.modal('再整理一次思路', '本轮生命已用完。\n重新调查会清空本轮填写和线索进度。', state.dailyMode ? '模拟观看广告 · 重新挑战' : '重新调查', actions.restart);
    else if (snap.status === 'completed' && state.dailyMode) this.modal('每日档案已完成', `${data.completionBody}\n\n${state.dailyRewardClaimed ? '本关首通奖励已领取。' : '首次通关可得6枚小镇纪念章。'} 当前共有${state.dailyCurrency ?? 0}枚。`,
      '查看每日关卡', () => actions.toggleSelector(true), '返回日历', actions.town, true);
    else if (snap.status === 'completed') this.modal('卷宗已整理', data.completionBody,
      state.caseIndex >= state.cases.length - 1 ? '查看档案目录' : (state.caseIndex + 1) % 5 === 0 ? '开启下一案  →' : '打开下一卷  →', actions.next, '返回小镇', actions.town, true);
    else if (!state.started) this.modal(data.title, `${data.subtitle}\n\n${data.intro}`, '开始整理档案', actions.start, '返回小镇', actions.town);
    else if (state.solved && state.answerOpen) this.deduction(state, actions);
    if (state.helpOpen) {
      const regionRule = `每个${archiveRegionLabel(gridSize)}`;
      this.modal('档案整理说明', `${data.subjects.length} 份记录各放一次。每行、每列和${regionRule}各一份。\n上北下南，左西右东。“正北方”指同一竖排上方，不一定紧邻。带“封”的图像格不能落位；普通参照物格可以。\n${gridSize >= 9 ? '大地图：总览中点一处放大，用箭头移动；记录分两页。放大后点格子才暂填。\n' : ''}\n先选记录，再暂填；正式确认才判对错。归位后读证词并提交结论，答错扣一命。`, '明白了', () => actions.toggleHelp(false));
    }
    if (state.selectorOpen) this.directory(state, actions);
    this.rewardedHintDialog(state.hints);
    this.levelUnlockDialog(state.levelUnlock);
  }

  private deduction(state: ArchiveViewState, actions: ArchiveViewActions): void {
    const data = state.caseData;
    this.deductionCard({
      caseId: data.definition.id, question: data.question, evidence: data.finalDeduction, options: data.finalOptions,
      selectedAnswerId: state.selectedAnswerId, lives: state.snapshot.lives, hintCaption: state.hints.caption,
    }, {
      choose: actions.chooseAnswer, submit: actions.submitAnswer, close: () => actions.toggleAnswer(false), hint: () => state.hints.open(),
    });
  }

  private directory(state: ArchiveViewState, actions: ArchiveViewActions): void {
    if (!state.dailyMode) { this.archiveShelf(state, actions); return; }
    this.shade('archive-selector');
    this.panel('archive-selector-card', 360, 640, 644, 1000, this.paper, 24);
    const start = state.selectorPage * 5;
    const pageCount = Math.ceil(state.cases.length / 5);
    if (state.dailyMode) {
      this.label('每日档案关卡', 360, 205, 580, 52, 31, this.teal, true);
      this.label('每天开放一关；已过日期的关卡需先看广告解锁。', 360, 260, 584, 40, 20, this.muted);
      const unlocked = new Set(state.dailyUnlockedLevelIds ?? []);
      state.cases.slice(start, start + 5).forEach((data, offset) => {
        const index = start + offset;
        const levelId = `D${String(index + 1).padStart(2, '0')}`;
        const unreleased = index > (state.dailyCurrentLevelIndex ?? 0);
        const today = index === (state.dailyCurrentLevelIndex ?? 0);
        const accessLabel = unreleased ? '尚未开放'
          : today ? state.dailyTodayAttemptUsed ? '今日免费机会已用' : '今日免费一次'
            : unlocked.has(levelId) ? '已解锁' : '看广告解锁';
        const current = index === state.caseIndex;
        this.button(`archive-case-${levelId}`, 360, 350 + offset * 108, 560, 90,
          `${levelId}  ${data.title}\n10×10 · ${accessLabel}`,
          () => actions.selectCase(index), current ? 'primary' : 'light', 23, unreleased);
      });
      this.button('archive-previous-case', 170, 896, 190, 62, '上一页', () => actions.selectorPage(state.selectorPage - 1), 'light', 23, state.selectorPage === 0);
      this.label(`${state.selectorPage + 1} / ${pageCount}`, 360, 896, 150, 42, 25, this.teal, true);
      this.button('archive-next-case', 550, 896, 190, 62, '下一页', () => actions.selectorPage(state.selectorPage + 1), 'light', 23, state.selectorPage === pageCount - 1);
      this.label('完成每日关卡可得6枚纪念章；广告未接入正式SDK时为试玩模拟。', 360, 971, 584, 42, 18, this.muted);
      this.button('archive-selector-close', 214, 1062, 268, 66, '返回当前关卡', () => actions.toggleSelector(false));
      this.button('archive-selector-town', 506, 1062, 268, 66, '返回日历', actions.town, 'primary');
      return;
    }
  }

  /** Upright leather volumes; source-pixel bounds measured on the illustrated spines. */
  private archiveShelf(state: ArchiveViewState, actions: ArchiveViewActions): void {
    this.shade('archive-shelf');
    this.panel('archive-wood-backing', 360, 640, 720, 1280, new Color(63, 43, 32), 0);
    this.imageRegion('art/town/archive-bookshelf-v2', new Rect(0, 0, 941, 1672), 360, 640, 720, 1280);
    this.panel('archive-shelf-title', 360, 152, 422, 66, new Color(63, 40, 25, 230), 9, new Color(172, 128, 71), 1.5);
    this.label('小镇档案馆', 360, 140, 400, 38, 30, new Color(249, 226, 177), true);
    this.label('沿着书脊，翻开一段旧事', 360, 174, 398, 24, 17, new Color(208, 180, 136));
    // [left, top, right, bottom, title center Y], in the 941×1672 art.
    const spines = [
      [180, 281, 274, 724, 491], [292, 299, 386, 726, 494],
      [405, 280, 516, 726, 490], [540, 300, 637, 726, 500], [660, 288, 756, 726, 499],
      [177, 859, 275, 1307, 1070], [294, 858, 389, 1307, 1070],
      [411, 853, 516, 1307, 1070], [542, 879, 637, 1307, 1080], [656, 866, 755, 1307, 1086],
    ];
    const sx = 720 / 941, sy = 1280 / 1672;
    const ink = new Color(244, 216, 160);
    for (let collection = 0; collection < Math.min(spines.length, Math.ceil(state.cases.length / 5)); collection++) {
      const first = collection * 5;
      const [left, top, right, bottom, titleY] = spines[collection];
      const x = (left + right) / 2 * sx, y = (top + bottom) / 2 * sy;
      const locked = !state.unlockedLevels?.some(index => index >= first && index < first + 5);
      const active = Math.floor(state.caseIndex / 5) === collection;
      const book = this.node(`archive-folder-${collection + 1}`, x, y, (right - left) * sx, (bottom - top) * sy);
      const attach = (node: Node) => node.setParent(book, true);
      const numberY = (top + 51) * sy;
      attach(this.panel('book-number-inlay', x, numberY, 36, 30, new Color(45, 32, 26, 220), 9, new Color(170, 123, 66), 1));
      attach(this.label(String(collection + 1).padStart(2, '0'), x, numberY, 34, 28, 20, ink, true));
      if (active) {
        attach(this.panel('current-case-ribbon', (right - 11) * sx, (top + 21) * sy, 12, 54, new Color(156, 49, 42), 1));
        attach(this.panel('ribbon-stitch', (right - 11) * sx, (top + 20) * sy, 2, 43, new Color(224, 166, 98), 0));
      }
      const title = state.cases[first].collectionTitle ?? '旧宅往事';
      const split = title.length > 7 ? Math.ceil(title.length / 2) : title.length;
      const columns = title.length > 7 ? [title.slice(0, split), title.slice(split)] : [title];
      columns.forEach((column, columnIndex) => {
        const columnX = x + (columns.length === 2 ? (columnIndex === 0 ? 12 : -12) : 0);
        [...column].forEach((character, i) => {
          const charY = titleY * sy + (i - (column.length - 1) / 2) * 22;
          attach(this.label(character, columnX + 1, charY + 1, 27, 28, 21, new Color(31, 22, 18, 220), true));
          attach(this.label(character, columnX, charY, 27, 28, 21, ink, true));
        });
      });
      const statusY = (bottom - 32) * sy;
      attach(this.panel('book-state-stamp', x, statusY, 51, 24, active ? new Color(135, 47, 40, 235) : new Color(47, 35, 28, 230), 5,
        active ? new Color(203, 146, 87) : new Color(120, 91, 57), 1));
      attach(this.label(locked ? '封存' : active ? '在查' : '可阅', x, statusY, 48, 23, 15, ink, true));
      this.clickable(book, () => { this.shelfCollection = collection; this.redrawView(); }, false);
    }
    this.label('十案旧事 · 每案五卷 · 轻触书脊取阅', 360, 1103, 590, 38, 21, new Color(244, 223, 188));
    this.button('archive-shelf-resume', 206, 1190, 280, 76, '继续当前卷', () => actions.toggleSelector(false), 'light', 25);
    this.button('archive-shelf-town', 514, 1190, 280, 76, '返回小镇', actions.town, 'primary', 25);
    if (this.shelfCollection !== null) this.archiveFolder(state, actions, this.shelfCollection);
  }

  private archiveFolder(state: ArchiveViewState, actions: ArchiveViewActions, collection: number): void {
    const first = collection * 5;
    const cases = state.cases.slice(first, first + 5);
    if (!cases.length) { this.shelfCollection = null; return; }
    this.shade('open-folder');
    this.panel('open-folder-tab', 169, 116, 190, 56, new Color(147, 118, 84), 9);
    this.label(`案件 ${String(collection + 1).padStart(2, '0')}`, 169, 110, 178, 32, 25, this.paper, true);
    this.panel('open-folder-cover', 360, 647, 650, 1034, new Color(147, 118, 84), 14);
    this.panel('open-folder-paper', 360, 638, 612, 1000, new Color(252, 245, 226), 6);
    this.label(cases[0].collectionTitle ?? '旧宅往事', 360, 213, 540, 64, 33, this.teal, true);
    const available = cases.filter((_, offset) => state.unlockedLevels?.includes(first + offset)).length;
    this.label(`五卷旧事 · 已开放 ${available}/${cases.length} 卷`, 360, 274, 540, 36, 23, this.muted);
    cases.forEach((data, offset) => {
      const index = first + offset;
      const locked = !state.unlockedLevels?.includes(index);
      const current = index === state.caseIndex;
      this.button(`archive-case-${index + 1}`, 360, 374 + offset * 122, 544, 102,
        `A${String(index + 1).padStart(2, '0')}  ${data.title}\n${data.definition.gridSize}×${data.definition.gridSize} · ${locked ? '看广告解锁' : current ? '当前卷 · 开始新一局' : '开始新一局'}`,
        () => { if (!locked) this.shelfCollection = null; actions.selectCase(index); }, current ? 'primary' : 'light', 24);
    });
    this.label(available ? '重阅会重新开始本卷；通关后开放下一卷。' : '通关上一卷或观看广告，可开放对应卷宗。', 360, 967, 550, 54, 21, this.muted);
    this.button('archive-folder-close', 360, 1063, 520, 68, '放回书架', () => { this.shelfCollection = null; this.redrawView(); }, 'primary', 25);
  }

  private drawBoard(state: ArchiveViewState, actions: ArchiveViewActions, expanded = false): void {
    const data = state.caseData;
    const gridSize = data.definition.gridSize;
    const snap = state.snapshot;
    const playing = snap.status === 'playing';
    const largeExpanded = expanded && gridSize >= 9;
    const windowed = largeExpanded && !this.boardOverview;
    const visibleCount = windowed ? 6 : gridSize;
    const firstRow = windowed ? this.focusRow : 0;
    const firstColumn = windowed ? this.focusColumn : 0;
    const eightExpanded = expanded && gridSize === 8;
    const centerY = largeExpanded ? 714 : eightExpanded ? 726 : expanded ? 745 : 840;
    const boardHeight = largeExpanded ? 604 : eightExpanded ? 676 : expanded ? 630 : 360;
    this.panel('archive-board', 360, centerY, largeExpanded ? 628 : eightExpanded ? 704 : 672, largeExpanded ? 628 : eightExpanded ? 704 : expanded ? 664 : 400, this.paper, 20);
    const gap = largeExpanded ? (windowed ? 4 : 3) : eightExpanded ? 3 : gridSize === 4 ? 8 : 5;
    const boardWidth = largeExpanded ? 604 : eightExpanded ? 676 : expanded ? 630 : gridSize === 4 ? 464 : 620;
    const cellWidth = (boardWidth - gap * (visibleCount - 1)) / visibleCount;
    const cellHeight = (boardHeight - gap * (visibleCount - 1)) / visibleCount;
    const boardLeft = 360 - boardWidth / 2;
    const boardTop = centerY - boardHeight / 2;
    const regionColors = [new Color(255, 242, 219), new Color(226, 240, 231), new Color(229, 239, 248), new Color(249, 231, 224), new Color(239, 231, 246), new Color(227, 241, 239), new Color(239, 237, 202), new Color(217, 224, 239), new Color(249, 221, 234), new Color(221, 233, 210)];
    const referenceByCell = new Map(data.referenceObjects.map(reference => [`${reference.row},${reference.column}`, reference]));
    for (let i = 0; i < visibleCount; i++) {
      const x = boardLeft + cellWidth / 2 + i * (cellWidth + gap);
      const y = boardTop + cellHeight / 2 + i * (cellHeight + gap);
      this.label(`${firstColumn + i + 1}`, x, boardTop - 10, cellWidth, 18, gridSize >= 6 ? 16 : 19, this.muted, true);
      this.label(`${firstRow + i + 1}`, boardLeft - (eightExpanded ? 12 : expanded ? 20 : 28), y, eightExpanded ? 16 : expanded ? 30 : 38, cellHeight, eightExpanded ? 14 : gridSize >= 6 ? 16 : 19, this.muted, true);
    }
    const subject = data.subjects[state.selectedSubject];
    const excluded = new Set(snap.autoExcludedSelectionIds);
    for (let row = firstRow + 1; row <= firstRow + visibleCount; row++) for (let column = firstColumn + 1; column <= firstColumn + visibleCount; column++) {
      const x = boardLeft + cellWidth / 2 + (column - firstColumn - 1) * (cellWidth + gap);
      const y = boardTop + cellHeight / 2 + (row - firstRow - 1) * (cellHeight + gap);
      const occupant = data.subjects.find(item => snap.confirmed[placementSelectionId(item.id, row, column)] === true);
      const drafts = data.subjects.filter(item => {
        const id = placementSelectionId(item.id, row, column);
        return snap.drafts[id] === true && !excluded.has(id) && snap.confirmed[id] === undefined;
      });
      const selected = state.selectedCell?.row === row && state.selectedCell?.column === column;
      const unavailable = excluded.has(placementSelectionId(subject.id, row, column));
      const blocked = data.definition.blockedCellIds?.includes(`${row},${column}`) ?? false;
      const regionId = data.definition.regionByCell?.[`${row},${column}`] ?? 'region-0';
      const regionParts = regionId.split('-').slice(1).map(Number);
      const regionIndex = regionParts.length > 1 ? regionParts[0] * ([4, 8, 10].includes(gridSize) ? 2 : 3) + regionParts[1] : regionParts[0] ?? 0;
      const baseFill = gridSize === 4 ? new Color(251, 245, 229) : regionColors[regionIndex];
      const fill = blocked ? new Color(224, 200, 185) : occupant ? new Color(183, 213, 179) : selected ? new Color(255, 219, 147) : unavailable ? new Color(233, 232, 218) : baseFill;
      const cell = this.panel(`cell-${row}-${column}`, x, y, cellWidth, cellHeight, fill, 8, selected ? this.teal : this.line, selected ? 3 : 1.5);
      const reference = referenceByCell.get(`${row},${column}`);
      if (reference) this.referenceMarker(cell, x, y, cellWidth, cellHeight, reference);
      const subjectPlaced = Object.keys(snap.confirmed).some(id => id.startsWith(`placement:${subject.id}:`) && snap.confirmed[id]);
      if (gridSize >= 9 && (!expanded || this.boardOverview)) {
        this.clickable(cell, () => {
          this.focusRow = Math.max(0, Math.min(gridSize - 6, row - 3));
          this.focusColumn = Math.max(0, Math.min(gridSize - 6, column - 3));
          this.boardOverview = false;
          if (expanded) this.redrawView();
          else actions.toggleBoardExpanded(true);
        }, false);
      } else {
        this.clickable(cell, () => actions.cell(row, column), blocked || !!occupant || unavailable || subjectPlaced || !playing || state.solved);
      }
      const caption = blocked ? '封' : occupant ? `✓ ${occupant.shortName}` : drafts.length ? drafts.map(item => item.shortName).join(' / ') : unavailable ? '×' : '·';
      this.label(caption, x, y + (expanded && reference ? cellHeight * 0.2 : 0) - (drafts.length && !occupant ? 8 : 0),
        cellWidth - 8, cellHeight * (expanded && reference ? 0.36 : 0.62), occupant || drafts.length ? (gridSize >= 6 && !expanded ? 15 : 18) : 26,
        blocked ? new Color(151, 65, 49) : this.teal, !!occupant || blocked);
      if (drafts.length && !occupant) this.label('暂填', x, y + cellHeight * 0.3, cellWidth - 8, 18, 13, this.muted);
    }
  }

  private expandedBoard(state: ArchiveViewState, actions: ArchiveViewActions): void {
    if (state.caseData.definition.gridSize >= 9) {
      this.largeExpandedBoard(state, actions);
      return;
    }
    this.shade('expanded-board');
    this.panel('expanded-board-paper', 360, 640, 720, 1280, this.paper, 0);
    const data = state.caseData;
    const snap = state.snapshot;
    const size = data.definition.gridSize;
    this.label(`${state.dailyMode ? state.dailyLevelId ?? `D${String(state.caseIndex + 1).padStart(2, '0')}` : `A${String(state.caseIndex + 1).padStart(2, '0')}`} · ${data.title}`,
      184, 47, 300, 56, 26, this.teal, true);
    this.button('expanded-hint', 393, 47, 104, 50, state.hints.caption, () => state.hints.open(), 'light', 19);
    this.button('expanded-help', 484, 47, 62, 50, '?', () => actions.toggleHelp(true), 'light', 25);
    this.button('collapse-board', 620, 47, 144, 50, '收起棋盘', () => actions.toggleBoardExpanded(false), 'light', 23);
    this.panel('expanded-clues', 360, size === 8 ? 166 : 190, 672, size === 8 ? 162 : 200, this.cream, 16);
    this.label('当前线索', 114, 113, 152, 32, 23, this.teal, true);
    this.label(`每行、每列、每个${archiveRegionLabel(size)}各一份`, 440, 113, 430, 28, 18, this.muted);
    const clues = data.definition.clues.filter(clue => snap.activeClueIds.includes(clue.id));
    this.label(clues.length ? clues.map(clue => `• ${clue.text}`).join('\n') : state.solved ? '全部材料已归位，可以阅读人物证词。' : '结合已确认的位置，推理剩余记录。',
      360, size === 8 ? 188 : 207, 614, size === 8 ? 100 : 138, 25, this.ink, false, 'left');
    const columns = Math.min(4, data.subjects.length);
    data.subjects.forEach((subject, index) => {
      const row = Math.floor(index / columns), column = index % columns;
      const rowCount = Math.min(columns, data.subjects.length - row * columns);
      const x = 360 + (column - (rowCount - 1) / 2) * 164;
      const y = (size === 8 ? 282 : 326) + row * 58;
      const placed = data.definition.requiredConfirmations.some(id => id.startsWith(`placement:${subject.id}:`) && snap.confirmed[id]);
      this.button(`expanded-subject-${subject.id}`, x, y, 152, 48, `${placed ? '✓ ' : ''}${subject.shortName}`,
        () => actions.subject(index), state.selectedSubject === index && !placed ? 'primary' : 'light', 21, placed || state.solved);
    });
    this.drawBoard(state, actions, true);
    this.button('expanded-undo', 186, 1106, 324, 54, '↶ 撤销暂填', actions.undo, 'light', 23, !state.canUndo);
    this.button('expanded-clear', 534, 1106, 324, 54, '清空暂填', actions.clear, 'light', 23);
    this.button('expanded-confirm', 360, 1181, 672, 74, state.solved ? '阅读证词 · 结案推理' : '确认所选落位',
      state.solved ? () => actions.toggleAnswer(true) : actions.confirm, 'primary', 28);
    const selected = data.subjects[state.selectedSubject];
    this.label(`${selected.name} · 剩余生命 ${'♥'.repeat(snap.lives)} · 带“封”的格子不能落位`, 360, 1248, 672, 32, 20, this.muted);
  }

  /** Large archive boards keep the same map coordinates while showing six rows at a time. */
  private largeExpandedBoard(state: ArchiveViewState, actions: ArchiveViewActions): void {
    this.shade('expanded-board');
    this.panel('expanded-board-paper', 360, 640, 720, 1280, this.paper, 0);
    const data = state.caseData, snap = state.snapshot, size = data.definition.gridSize;
    const selected = data.subjects[state.selectedSubject];
    this.focusRow = Math.max(0, Math.min(size - 6, this.focusRow));
    this.focusColumn = Math.max(0, Math.min(size - 6, this.focusColumn));
    this.label(`${state.dailyMode ? state.dailyLevelId ?? `D${String(state.caseIndex + 1).padStart(2, '0')}` : `A${String(state.caseIndex + 1).padStart(2, '0')}`} · ${data.title}`,
      184, 47, 300, 56, 26, this.teal, true);
    this.button('expanded-hint', 393, 47, 104, 50, state.hints.caption, () => state.hints.open(), 'light', 19);
    this.button('expanded-help', 484, 47, 62, 50, '?', () => actions.toggleHelp(true), 'light', 25);
    this.button('collapse-board', 620, 47, 144, 50, '收起棋盘', () => actions.toggleBoardExpanded(false), 'light', 23);
    this.panel('expanded-clues', 360, 163, 672, 150, this.cream, 16);
    this.label('当前线索', 114, 111, 152, 30, 23, this.teal, true);
    this.label(`每行、每列、每个${archiveRegionLabel(size)}各一份`, 440, 111, 430, 28, 18, this.muted);
    const clues = data.definition.clues.filter(clue => snap.activeClueIds.includes(clue.id));
    this.label(clues.length ? clues.map(clue => `• ${clue.text}`).join('\n') : state.solved ? '材料已归位，请阅读人物证词。' : '结合已确认位置，推理剩余记录。',
      360, 183, 614, 98, 25, this.ink, false, 'left');
    const pages = Math.ceil(data.subjects.length / 6);
    this.recordPage = Math.max(0, Math.min(pages - 1, this.recordPage));
    this.button('records-previous', 97, 262, 138, 38, '上一页记录', () => { this.recordPage--; this.redrawView(); }, 'light', 19, this.recordPage === 0);
    this.label(`记录 ${this.recordPage + 1}/${pages} · 已归位 ${data.definition.requiredConfirmations.filter(id => snap.confirmed[id]).length}/${size}`,
      360, 262, 338, 32, 21, this.teal, true);
    this.button('records-next', 623, 262, 138, 38, '下一页记录', () => { this.recordPage++; this.redrawView(); }, 'light', 19, this.recordPage === pages - 1);
    data.subjects.slice(this.recordPage * 6, this.recordPage * 6 + 6).forEach((subject, offset) => {
      const index = this.recordPage * 6 + offset;
      const placed = data.definition.requiredConfirmations.some(id => id.startsWith(`placement:${subject.id}:`) && snap.confirmed[id]);
      this.button(`expanded-subject-${subject.id}`, 140 + offset % 3 * 220, 310 + Math.floor(offset / 3) * 50, 204, 44,
        `${placed ? '✓ ' : ''}${subject.shortName}`, () => actions.subject(index),
        state.selectedSubject === index && !placed ? 'primary' : 'light', 22, placed || state.solved);
    });
    this.drawBoard(state, actions, true);
    const move = (row: number, column: number) => {
      this.focusRow = Math.max(0, Math.min(size - 6, this.focusRow + row));
      this.focusColumn = Math.max(0, Math.min(size - 6, this.focusColumn + column));
      this.redrawView();
    };
    if (this.boardOverview) {
      this.label('点地图中的一处，放大查看并落位', 292, 1054, 510, 42, 24, this.teal, true);
      this.button('board-focus', 620, 1054, 140, 48, '返回局部', () => { this.boardOverview = false; this.redrawView(); }, 'light', 22);
    } else {
      this.button('board-north', 98, 1054, 120, 48, '↑ 北', () => move(-3, 0), 'light', 24, this.focusRow === 0);
      this.button('board-south', 229, 1054, 120, 48, '↓ 南', () => move(3, 0), 'light', 24, this.focusRow === size - 6);
      this.button('board-overview', 360, 1054, 120, 48, '总览', () => { this.boardOverview = true; this.redrawView(); }, 'primary', 24);
      this.button('board-west', 491, 1054, 120, 48, '← 西', () => move(0, -3), 'light', 24, this.focusColumn === 0);
      this.button('board-east', 622, 1054, 120, 48, '→ 东', () => move(0, 3), 'light', 24, this.focusColumn === size - 6);
    }
    this.button('expanded-undo', 186, 1120, 324, 54, '↶ 撤销暂填', actions.undo, 'light', 23, !state.canUndo);
    this.button('expanded-clear', 534, 1120, 324, 54, '清空暂填', actions.clear, 'light', 23);
    const selectedOutside = state.selectedCell && !this.boardOverview &&
      (state.selectedCell.row <= this.focusRow || state.selectedCell.row > this.focusRow + 6 ||
        state.selectedCell.column <= this.focusColumn || state.selectedCell.column > this.focusColumn + 6);
    this.button('expanded-confirm', 360, 1191, 672, 66, state.solved ? '阅读证词 · 结案推理' : this.boardOverview ? '先放大并选择落位' : selectedOutside ? '所选格在视野外，请重新选格' : '确认所选落位',
      state.solved ? () => actions.toggleAnswer(true) : actions.confirm, 'primary', 27, !state.solved && (this.boardOverview || !!selectedOutside));
    this.label(`${selected.shortName} · ${this.boardOverview ? '全图' : `局部 ${this.focusRow + 1}–${this.focusRow + 6} 行 / ${this.focusColumn + 1}–${this.focusColumn + 6} 列`} · ${'♥'.repeat(snap.lives)}`,
      360, 1252, 672, 30, 21, this.muted);
  }

  private referenceMarker(
    cell: Node,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    reference: ArchiveViewState['caseData']['referenceObjects'][number],
  ): void {
    const iconWidth = Math.min(48, cellWidth * 0.45);
    const iconHeight = Math.min(44, cellHeight * 0.62);
    const iconX = x - cellWidth * 0.25;
    const iconY = y - cellHeight * 0.2;
    const icon = this.node(`reference-image-${reference.kind}`, iconX, iconY, iconWidth, iconHeight);
    const frameIndex: Record<typeof reference.kind, number> = {
      window: 0, door: 1, hallway: 2, shelf: 3, desk: 4, hearth: 6, phone: 7, steps: 8,
    };
    const frame = this.propFrames[frameIndex[reference.kind]];
    if (frame) {
      const sprite = icon.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.spriteFrame = frame;
    }
    const badgeX = x + cellWidth * 0.18;
    const badgeY = y - cellHeight * 0.29;
    const badgeWidth = Math.min(62, cellWidth * 0.58);
    const badge = this.panel(`reference-${reference.label}`, badgeX, badgeY, badgeWidth, 19, new Color(255, 250, 237, 235), 6, new Color(207, 171, 112), 1);
    const badgeText = this.label(reference.label, badgeX, badgeY, badgeWidth - 4, 17, 12, new Color(112, 86, 52), true);
    if (reference.blocksPlacement) {
      const sealX = x + cellWidth * 0.34;
      const sealY = y - cellHeight * 0.34;
      const seal = this.panel('blocked-cell-seal', sealX, sealY, 23, 21, new Color(164, 68, 50), 8);
      const sealText = this.label('封', sealX, sealY, 22, 20, 13, Color.WHITE, true);
      seal.setParent(cell, true);
      sealText.setParent(cell, true);
    }
    icon.setParent(cell, true);
    badge.setParent(cell, true);
    badgeText.setParent(cell, true);
  }

  private loadPropAtlas(): void {
    if (this.propAtlasRequested) return;
    this.propAtlasRequested = true;
    resources.load('art/archive/archive-props-atlas-v1', ImageAsset, (error, asset) => {
      if (error || !asset || !this.stage?.isValid) {
        console.warn('[ArchivePuzzleView] Scene prop atlas unavailable.', error?.message ?? 'No image asset returned.');
        return;
      }
      const texture = new Texture2D();
      texture.image = asset;
      const tileWidth = Math.floor(asset.width / 3);
      const tileHeight = Math.floor(asset.height / 3);
      this.propTexture = texture;
      this.propFrames = Array.from({ length: 9 }, (_, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const frame = new SpriteFrame();
        frame.texture = texture;
        frame.rect = new Rect(column * tileWidth, row * tileHeight, tileWidth, tileHeight);
        frame.originalSize = new Size(tileWidth, tileHeight);
        frame.packable = false;
        return frame;
      });
      this.redrawView();
    });
  }
}

