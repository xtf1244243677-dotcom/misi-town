import { Color, Graphics, Node, Rect, Size } from 'cc';
import { MainStoryCaseConfig } from '../data/casePrototypes';
import { relationSelectionId, SessionSnapshot } from '../core/PuzzleTypes';
import { puzzleThemes } from '../data/visualCatalog';
import { PuzzleViewShell } from './PuzzleViewShell';
import { RewardedLevelUnlockFlow } from '../services/RewardedLevelUnlockFlow';
import { RewardedHintFlow } from '../services/RewardedHintFlow';
import type { DailyCalendarDay } from '../data/dailyChallenge';

export interface MainStoryViewState {
  coverOpen: boolean;
  hints: RewardedHintFlow;
  levelUnlock?: RewardedLevelUnlockFlow;
  unlockedLevels?: number[];
  completedLevels?: number[];
  caseIndex: number;
  caseData: MainStoryCaseConfig;
  snapshot: SessionSnapshot;
  activePair: string;
  selected: { person: string; option: string } | null;
  positiveMark: boolean;
  canUndo: boolean;
  solved: boolean;
  answerOpen: boolean;
  selectedAnswerId: string | null;
  started: boolean;
  selectorPage: number;
  helpOpen: boolean;
  notesOpen: boolean;
  selectorOpen: boolean;
  unlockedLevel: number;
  archiveUnlocked: boolean;
  caseTitles: string[];
  caseBadge: string;
  dailyMode: boolean;
  dailyDateLabel: string;
  dailyRewardClaimed: boolean;
  dailyCurrency: number;
  dailyCalendarOpen: boolean;
  dailyCalendarMonthLabel: string;
  dailyCalendarDays: DailyCalendarDay[];
  dailyCalendarCanGoNext: boolean;
  dailySelectedDateLabel: string;
  dailySelectedDateKey: string;
  dailySelectedIsToday: boolean;
  dailySelectedCompleted: boolean;
  dailySelectedLevelId: string;
  dailySelectedStatusLabel: string;
  dailySelectedStartCaption: string;
  dailySelectedCanStart: boolean;
}

export interface MainStoryViewActions {
  startGame(): void;
  select(person: string, option: string): void;
  tab(id: string): void;
  mark(positive: boolean): void;
  confirm(): void;
  undo(): void;
  clear(): void;
  answer(id: string): void;
  chooseAnswer(id: string): void;
  submitAnswer(): void;
  start(): void;
  selectorPage(page: number): void;
  toggleAnswer(open: boolean): void;
  toggleHelp(open: boolean): void;
  toggleNotes(open: boolean): void;
  toggleSelector(open: boolean): void;
  selectCase(index: number): void;
  openDaily(): void;
  openDailyCalendar(): void;
  closeDailyCalendar(): void;
  shiftDailyCalendarMonth(delta: number): void;
  selectDailyDate(dateKey: string): void;
  startDailyChallenge(dateKey: string): void;
  leaveDaily(): void;
  openArchive(): void;
  revive(): void;
  declineRevive(): void;
  restart(): void;
  next(): void;
}

/** Shared visual presentation for all main-story cases. */
export class MainStoryPuzzleView extends PuzzleViewShell {
  private boardCaseId = '';
  private firstPerson = 0;
  private firstOption = 0;

  render(root: Node, visible: Size, state: MainStoryViewState, actions: MainStoryViewActions): void {
    this.begin(root, visible, puzzleThemes[state.caseData.themeId ?? state.caseData.definition.id]);
    if (state.coverOpen) {
      this.imageRegion('art/town/town-cover-map-concept-v1', new Rect(64, 0, 664, 1024), 360, 640, 720, 1280);
      const startHotspot = this.panel('cover-start-hotspot', 360, 1076, 510, 138, new Color(0, 0, 0, 0), 0);
      this.clickable(startHotspot, actions.startGame, false);
      return;
    }
    const size = state.caseData.people.length;
    const sixPeople = size >= 6;
    const largeTable = size >= 7;
    if (this.boardCaseId !== state.caseData.definition.id) {
      this.boardCaseId = state.caseData.definition.id;
      this.firstPerson = this.firstOption = 0;
    }
    this.firstPerson = largeTable ? Math.max(0, Math.min(size - 4, this.firstPerson)) : 0;
    this.firstOption = largeTable ? Math.max(0, Math.min(size - 6, this.firstOption)) : 0;

    this.label('谜思小镇', 156, 43, 192, 44, 33, this.ink, true);
    this.label(state.dailyMode ? `每日挑战 · ${state.dailyDateLabel}` : '动物小镇 · 调查手册', 160, 78, 210, 26, 18, this.muted);
    this.button('obtain-hint', 333, 52, 116, 60, state.hints.caption, () => state.hints.open(), 'light', 20,
      !state.started || state.snapshot.status !== 'playing');
    this.button('help', 438, 52, 72, 60, '?', () => actions.toggleHelp(true), 'light', 26);
    this.button('open-case-selector', 537, 52, 108, 60, state.dailyMode ? '日历' : '地图',
      () => state.dailyMode ? actions.openDailyCalendar() : actions.toggleSelector(true));
    this.button('open-archive', 649, 52, 96, 60, '档案馆', actions.openArchive, 'light', 20, !state.archiveUnlocked);

    if (!sixPeople) {
      this.panel('hero-frame', 360, 187, 672, 180, this.paper, 16);
      this.art(0, 360, 185, 656, 164);
    }
    const titleY = sixPeople ? 122 : 237;
    this.panel('case-title-strip', 360, titleY + 1, 656, 58, this.teal, 0);
    this.label(`${state.caseBadge}   ${state.caseData.title}`, 267, titleY, 422, 44, 28, this.paper, true, 'left');
    this.label(`${'♥ '.repeat(state.snapshot.lives)}${'♡ '.repeat(Math.max(0, 2 - state.snapshot.lives))}`, 605, titleY, 130, 44, 30, new Color(255, 201, 166), true);

    const clueY = sixPeople ? 246 : 360;
    const clueTabY = sixPeople ? 188 : 303;
    this.panel('clue-card-shadow', 360, clueY + 6, 672, sixPeople ? 172 : 160, new Color(219, 204, 176), 18);
    this.panel('clue-card', 360, clueY, 672, sixPeople ? 172 : 160, this.paper, 18);
    this.panel('clue-tab', 86, clueTabY, 96, 38, this.gold, 10);
    this.label('新线索', 86, clueTabY, 86, 30, 22, this.ink, true);
    if (state.caseData.investigationNotes) {
      this.button('case-notes', 227, clueTabY, 130, 38, '案情 / 规则', () => actions.toggleNotes(true), 'light', 20);
    }
    const count = state.caseData.definition.requiredConfirmations.filter(id => state.snapshot.confirmed[id] === true).length;
    this.label(`已核实 ${count} / ${state.caseData.definition.requiredConfirmations.length}`, 588, clueTabY, 176, 30, 21, this.teal, true);
    const clues = state.caseData.definition.clues.filter(clue => state.snapshot.activeClueIds.includes(clue.id));
    this.label(clues.length ? clues.map(clue => `• ${clue.text}`).join('\n') : state.solved ? '线索已全部归档，可以回答结案问题了。' : '对照已确认的关系，推理剩余空格。',
      360, clueY + 17, 606, sixPeople ? 112 : 104, clues.length > 2 ? 23 : 25, this.ink, false, 'left');

    state.caseData.pairs.forEach((pair, i) => this.button(`tab-${pair.id}`, i ? 534 : 186, sixPeople ? 369 : 477, 324, 54,
      pair.title, () => actions.tab(pair.id), pair.id === state.activePair ? 'primary' : 'light', 24));
    this.panel('board-card', 360, sixPeople ? 694 : 745, 672, sixPeople ? 560 : 458, this.paper, 20);
    const options = state.caseData.pairs.find(pair => pair.id === state.activePair)!.options;
    const fivePeople = state.caseData.people.length === 5;
    // Keep all five rows inside the board card, above the separate action area.
    // Each cell owns the exact same bounds as its drawn panel.
    const compact = fivePeople || sixPeople;
    const firstX = sixPeople ? 208 : fivePeople ? 224 : 234;
    const columnPitch = sixPeople ? 88 : fivePeople ? 102 : 124;
    const cellWidth = sixPeople ? 82 : fivePeople ? 94 : 116;
    const firstY = sixPeople ? 500 : fivePeople ? 594 : 624;
    const rowPitch = largeTable ? 104 : compact ? 84 : 96;
    const cellHeight = largeTable ? 94 : compact ? 80 : 88;
    const headerY = sixPeople ? 436 : fivePeople ? 536 : 550;
    this.label(compact ? `居民 · ${size}×${size}` : '居民', 96, headerY, compact ? 132 : 116, compact ? 34 : 44, compact ? 21 : 22, this.muted, true);
    const visibleOptions = options.slice(this.firstOption, largeTable ? this.firstOption + 6 : options.length);
    const visiblePeople = state.caseData.people.slice(this.firstPerson, largeTable ? this.firstPerson + 4 : size);
    visibleOptions.forEach((option, col) => this.label(option.name, firstX + col * columnPitch, headerY,
      cellWidth, compact ? 40 : 52, sixPeople ? 20 : fivePeople ? 21 : 23, this.teal, true));
    const excluded = new Set(state.snapshot.autoExcludedSelectionIds);
    visiblePeople.forEach((person, row) => {
      const y = firstY + row * rowPitch;
      this.portrait(person.id, 96, y - (compact ? 9 : 12), compact ? 50 : 60, compact ? 50 : 60);
      this.label(person.name, 96, y + (compact ? 28 : 30), 122, compact ? 24 : 28, 21, this.ink, true);
      visibleOptions.forEach((option, col) => {
        const id = relationSelectionId(state.activePair, person.id, option.id);
        const confirmed = state.snapshot.confirmed[id];
        const draft = state.snapshot.drafts[id];
        const selected = state.selected?.person === person.id && state.selected?.option === option.id;
        const locked = confirmed !== undefined || excluded.has(id);
        const x = firstX + col * columnPitch;
        let fill = new Color(251, 245, 229);
        let caption = '·';
        if (locked) { fill = confirmed === true ? new Color(183, 213, 179) : new Color(233, 232, 218); caption = confirmed === true ? '✓' : '×'; }
        else if (selected) fill = new Color(255, 219, 147);
        else if (draft !== undefined) fill = new Color(242, 228, 192);
        if (!locked && draft !== undefined) caption = draft ? '✓' : '×';
        const cell = this.panel(`relation-${id}`, x, y, cellWidth, cellHeight, fill, 12, selected && !locked ? this.teal : this.line, selected && !locked ? 3 : 1.5);
        this.clickable(cell, () => actions.select(person.id, option.id), locked || state.snapshot.status !== 'playing');
        this.label(caption, x, y - (draft !== undefined && !locked ? 8 : 0), cellWidth - 14, compact ? 48 : 54, compact ? 31 : 35, locked && confirmed !== true ? new Color(164, 166, 148) : this.teal, true);
        if (!locked && draft !== undefined) this.label('暂填', x, y + (compact ? 24 : 27), cellWidth - 14, 23, 16, this.muted);
      });
    });
    if (largeTable) {
      const move = (people: number, optionsOffset: number) => {
        this.firstPerson = Math.max(0, Math.min(size - 4, this.firstPerson + people));
        this.firstOption = Math.max(0, Math.min(size - 6, this.firstOption + optionsOffset));
        this.redrawPresentation();
      };
      this.button('people-up', 114, 929, 156, 54, '↑ 上方人物', () => move(-3, 0), 'light', 20, this.firstPerson === 0);
      this.button('people-down', 278, 929, 156, 54, '↓ 下方人物', () => move(3, 0), 'light', 20, this.firstPerson === size - 4);
      this.button('options-left', 442, 929, 156, 54, '← 左侧选项', () => move(0, -2), 'light', 20, this.firstOption === 0);
      this.button('options-right', 606, 929, 156, 54, '右侧选项 →', () => move(0, 2), 'light', 20, this.firstOption === size - 6);
      this.label(`正在看人物 ${this.firstPerson + 1}–${this.firstPerson + visiblePeople.length} / ${size}，选项 ${this.firstOption + 1}–${this.firstOption + visibleOptions.length} / ${size}`,
        360, 883, 644, 28, 19, this.muted);
    }
    const playing = state.snapshot.status === 'playing';
    const selectionVisible = !state.selected || (visiblePeople.some(person => person.id === state.selected?.person) &&
      visibleOptions.some(option => option.id === state.selected?.option));
    this.button('undo-draft', 186, 1010, 324, 56, '↶  撤销暂填', actions.undo, 'light', 23, !state.canUndo);
    this.button('clear-drafts', 534, 1010, 324, 56, '清空暂填', actions.clear, 'light', 23, !playing);
    this.button('mark-yes', 186, 1091, 324, 70, '✓  是', () => actions.mark(true), state.positiveMark ? 'primary' : 'light', 28, !playing || state.solved || !selectionVisible);
    this.button('mark-no', 534, 1091, 324, 70, '×  否', () => actions.mark(false), !state.positiveMark ? 'primary' : 'light', 28, !playing || state.solved || !selectionVisible);
    this.button('confirm', 360, 1179, 672, 76, state.solved ? '结案推理  →' : !selectionVisible ? '所选格在其他区域，请重新选格' : '确认所选标记',
      state.solved ? () => actions.toggleAnswer(true) : actions.confirm, 'primary', 29, !playing || (!state.solved && !selectionVisible));
    const person = state.caseData.people.find(person => person.id === state.selected?.person);
    const option = options.find(option => option.id === state.selected?.option);
    this.label(person && option ? `已选：${person.name} · ${option.name}　${state.positiveMark ? '是' : '否'}` :
      largeTable ? '用箭头查看完整调查表；各区域的暂填相互保留' : state.activePair === 'person-seat' ? '合并左右关系，推导完整座位顺序' : '结合当前线索与已确认关系，推理对应选项',
      360, 1244, 650, 36, 22, this.muted);

    if (state.snapshot.status === 'awaiting-revive') {
      this.modal('调查暂时停下了', '观看一次广告，可获得 1 条生命继续。\n本关仅有一次复活机会。', '模拟观看广告 · +1 生命', actions.revive, '放弃复活，重新调查', actions.declineRevive);
    } else if (state.snapshot.status === 'failed') {
      this.modal('再整理一次思路', '本轮生命已用完。\n重新调查会清空本轮填写和线索进度。', '重新调查', actions.restart);
    } else if (state.snapshot.status === 'completed') {
      if (state.dailyMode) {
        const rewardText = `\n\n今日首通奖励${state.dailyRewardClaimed ? '已领取' : '尚未发放'}。当前共有 ${state.dailyCurrency} 枚小镇纪念章。`;
        this.modal('今日调查完成', `${state.caseData.completionBody}${rewardText}`, '再玩一次', actions.restart, '返回主线', actions.leaveDaily, true);
      } else {
        this.modal('调查记录已整理', state.caseData.completionBody, state.caseIndex === state.caseTitles.length - 1 ? '进入档案馆  →' : '调查下一案  →', state.caseIndex === state.caseTitles.length - 1 ? actions.openArchive : actions.next, '返回小镇地图', () => actions.toggleSelector(true), true);
      }
    } else if (!state.started && state.caseData.intro) {
      this.modal(state.caseData.title, state.caseData.intro, '开始调查', actions.start, '打开小镇地图', () => actions.toggleSelector(true));
    } else if (state.solved && state.answerOpen && state.caseData.finalDeduction) {
      this.deductionCard({
        caseId: state.caseData.definition.id, question: state.caseData.finalQuestion, evidence: state.caseData.finalDeduction,
        options: state.caseData.finalOptions ?? state.caseData.people,
        selectedAnswerId: state.selectedAnswerId, lives: state.snapshot.lives, hintCaption: state.hints.caption,
      }, { choose: actions.chooseAnswer, submit: actions.submitAnswer, close: () => actions.toggleAnswer(false), hint: () => state.hints.open() });
    } else if (state.solved && state.answerOpen) {
      this.shade('answer');
      this.panel('answer-card', 360, 640, 644, 666, this.paper, 24);
      this.label('最后一个问题', 360, 365, 570, 50, 31, this.teal, true);
      this.button('answer-hint', 360, 974, 244, 52, state.hints.caption, () => state.hints.open(), 'light', 23);
      this.label(state.caseData.finalQuestion, 360, 428, 574, 66, 28, this.ink, true);
      state.caseData.people.forEach((person, index) => {
        const x = index % 2 ? 512 : 208;
        const y = index < 2 ? 555 : 735;
        this.button(`answer-${person.id}`, x, y, 276, 160, '', () => actions.answer(person.id), 'light');
        this.portrait(person.id, x, y - 18, 94, 94);
        this.label(person.name, x, y + 52, 240, 36, 25, this.ink, true);
      });
      this.button('answer-close', 360, 904, 552, 64, '回看表格', () => actions.toggleAnswer(false), 'light', 24);
    }
    if (state.helpOpen) this.modal('调查手册', '每张表中，每位居民只对应一个选项；每个选项也只属于一位居民。\n\n座位关系线索中的左、右，按表头从左到右的顺序理解。\n\n先选格子，再暂填“是”或“否”；暂填可以修改，只有正式确认才判断对错。正确确认会归档线索，错误扣 1 条生命。\n\n绿色 ✓ 是已确认；灰色 × 是已排除。暂填标记带有“暂填”字样。', '明白了', () => actions.toggleHelp(false));
    if (state.notesOpen && state.caseData.investigationNotes) {
      this.shade('case-notes');
      this.panel('case-notes-card', 360, 640, 644, 930, this.paper, 24);
      this.label('本案调查规则', 360, 256, 574, 54, 32, this.teal, true);
      this.label(state.caseData.investigationNotes, 360, 620, 574, 570, 26, this.ink, false, 'left');
      this.button('case-notes-close', 360, 1016, 560, 68, '返回调查', () => actions.toggleNotes(false), 'primary', 25);
    }
    if (state.selectorOpen) {
      if (state.dailyMode) {
        this.shade('case-selector');
        this.panel('case-selector-card', 360, 640, 644, 940, this.paper, 24);
        this.label('今日挑战', 360, 288, 574, 54, 32, this.teal, true);
        this.label(`${state.dailyDateLabel} · 首通奖励 6 枚小镇纪念章`, 360, 350, 584, 44, 22, this.muted);
        this.button('daily-return-main', 360, 496, 560, 88, '返回主线调查', actions.leaveDaily, 'primary', 25);
        this.button('case-selector-close', 360, 1048, 560, 62, '返回今日挑战', () => actions.toggleSelector(false), 'light', 23);
      } else {
        this.renderTownMap(state, actions);
      }
    }
    if (state.dailyCalendarOpen) {
      this.shade('daily-calendar');
      this.panel('daily-calendar-card', 360, 640, 678, 1152, this.paper, 26);
      this.label('每日调查日历', 360, 122, 590, 58, 34, this.teal, true);
      this.button('daily-calendar-previous', 120, 210, 82, 62, '‹', () => actions.shiftDailyCalendarMonth(-1), 'light', 38);
      this.label(state.dailyCalendarMonthLabel, 360, 210, 280, 56, 30, this.teal, true);
      this.button('daily-calendar-next', 600, 210, 82, 62, '›', () => actions.shiftDailyCalendarMonth(1), 'light', 38, !state.dailyCalendarCanGoNext);
      this.label('北京时间每日 00:00 开放新关卡 · 当日免费一次 · 往期关卡需看广告解锁', 360, 274, 622, 42, 18, this.muted);
      const columnX = (column: number) => 102 + column * 86;
      ['日', '一', '二', '三', '四', '五', '六'].forEach((weekday, column) =>
        this.label(weekday, columnX(column), 332, 68, 40, 22, this.muted, true));
      state.dailyCalendarDays.forEach((day, index) => {
        if (day.status === 'empty' || day.day === null) return;
        const row = Math.floor(index / 7);
        const column = index % 7;
        const x = columnX(column);
        const y = 391 + row * 74;
        const selected = day.isSelected;
        const fill = day.status === 'completed' || day.status === 'unlocked' ? new Color(208, 230, 198)
          : day.status === 'upcoming' || day.status === 'unavailable' || day.status === 'ad-locked' ? new Color(235, 231, 219)
            : day.isToday ? new Color(255, 226, 162) : new Color(250, 244, 230);
        const tile = this.panel(`daily-day-${day.dateKey}`, x, y, 72, 66, fill, 12,
          selected ? this.teal : this.line, selected ? 3 : 1.5);
        if (day.status !== 'upcoming' && day.status !== 'unavailable') this.clickable(tile, () => actions.selectDailyDate(day.dateKey), false);
        this.label(String(day.day), x, y - 17, 64, 27, 21, day.status === 'upcoming' || day.status === 'unavailable' ? this.muted : this.ink, true);
        this.label(day.levelId, x, y + 1, 64, 20, 14, this.teal, true);
        const status = day.status === 'upcoming' ? '锁' : day.status === 'unavailable' ? '—'
          : day.status === 'completed' ? '✓' : day.status === 'free-used' ? '已用'
            : day.status === 'ad-locked' ? '看广告' : day.status === 'unlocked' ? '已解锁' : '免费';
        this.label(status, x, y + 20, 64, 18, 12,
          day.status === 'completed' || day.status === 'unlocked' ? this.teal
            : day.status === 'upcoming' || day.status === 'unavailable' || day.status === 'ad-locked' ? this.muted : this.red, true);
      });
      const legend = [
        { x: 112, text: '今日免费', color: new Color(255, 226, 162) },
        { x: 277, text: '广告解锁', color: new Color(235, 231, 219) },
        { x: 442, text: '已解锁', color: new Color(208, 230, 198) },
        { x: 607, text: '未开放', color: new Color(235, 231, 219) },
      ];
      legend.forEach(({ x, text, color }) => {
        this.panel(`daily-legend-${text}`, x, 846, 22, 22, color, 5, this.line, 1);
        this.label(text, x + 47, 846, 76, 28, 17, this.muted, true);
      });
      const selectedStatus = state.dailySelectedDateKey
        ? `${state.dailySelectedLevelId} · ${state.dailySelectedStatusLabel}` : '请选择一个已开放日期';
      this.label(state.dailySelectedDateKey ? `${state.dailySelectedDateLabel}  ·  ${selectedStatus}` : selectedStatus,
        360, 922, 624, 54, 20, this.teal, true);
      this.button('daily-calendar-start', 360, 1002, 610, 76, state.dailySelectedStartCaption,
        () => actions.startDailyChallenge(state.dailySelectedDateKey), 'primary', 25, !state.dailySelectedDateKey || !state.dailySelectedCanStart);
      this.button('daily-calendar-close', 360, 1095, 610, 60,
        state.dailyMode ? '返回当前调查' : '返回案件目录', actions.closeDailyCalendar, 'light', 23);
    }
    this.rewardedHintDialog(state.hints);
    this.levelUnlockDialog(state.levelUnlock);
  }

  private renderTownMap(state: MainStoryViewState, actions: MainStoryViewActions): void {
    const districtMaps = [
      {
        title: '镇中心', range: 'M01–M20', asset: 'map-district-01-v1',
        // Measured source-pixel stone faces: [centerX, centerY, radiusX, radiusY].
        // Verified against numbered full-resolution crops for all five source images.
        stops: [[146,1280,64,33],[245,1186,58,30],[425,1204,54,29],[568,1150,57,30],[674,1073,53,28],[778,1010,50,27],[806,908,50,27],[642,822,54,27],[442,746,49,25],[342,653,44,23],[530,690,47,24],[595,625,45,23],[668,568,47,24],[594,506,41,22],[480,430,42,21],[625,396,39,20],[720,345,38,19],[809,288,34,17],[887,248,31,16],[867,171,31,15]],
      },
      {
        title: '旧街艺坊', range: 'M21–M40', asset: 'map-district-02-v1',
        stops: [[267,1383,42,24],[429,1347,42,24],[557,1289,40,23],[741,1238,39,23],[695,1166,38,22],[562,1107,38,22],[439,1044,37,22],[423,950,37,23],[530,898,37,22],[672,844,37,22],[733,758,37,22],[656,690,37,21],[516,645,37,21],[408,572,36,21],[492,499,35,20],[570,417,35,20],[678,354,34,20],[762,269,33,19],[635,224,32,19],[489,173,31,18]],
      },
      {
        title: '海湾灯塔', range: 'M41–M60', asset: 'map-district-03-v1',
        stops: [[114,1017,34,22],[214,1087,34,22],[369,1116,34,23],[505,1180,34,23],[727,1152,34,23],[811,1047,33,22],[875,948,31,21],[887,857,30,20],[753,799,30,20],[804,558,28,18],[676,615,29,19],[493,592,29,18],[371,550,28,18],[247,515,28,17],[171,285,26,17],[323,319,26,17],[493,342,27,17],[800,402,26,17],[868,325,26,17],[783,266,26,17]],
      },
      {
        title: '林间铁路', range: 'M61–M80', asset: 'map-district-04-v1',
        stops: [[663,1377,42,24],[728,1295,38,23],[660,1211,37,23],[514,1179,38,23],[314,1086,38,23],[276,1008,36,22],[391,944,35,21],[636,902,35,21],[728,850,35,20],[713,769,34,20],[616,715,33,20],[501,696,34,20],[572,480,31,18],[662,421,31,18],[588,362,31,18],[473,337,31,18],[389,282,31,18],[495,226,31,17],[629,195,30,17],[585,141,31,17]],
      },
      {
        title: '档案山径', range: 'M81–M100', asset: 'map-district-05-v1',
        // This illustration has 19 stones; M81 adds a matching oval at the empty entrance.
        stops: [[512,1390,40,23],[609,1298,38,23],[548,1214,38,23],[415,1168,38,22],[319,1096,37,22],[375,1018,35,22],[499,967,35,21],[695,867,35,21],[741,790,35,21],[656,727,34,21],[529,672,35,21],[406,630,34,21],[367,536,34,20],[495,491,33,20],[600,439,33,20],[705,399,33,20],[724,319,32,19],[588,298,32,19],[493,260,31,18],[485,171,30,18]],
      },
    ];
    const pageCount = Math.max(1, Math.ceil(state.caseTitles.length / 20));
    const page = Math.max(0, Math.min(pageCount - 1, state.selectorPage));
    const district = districtMaps[Math.min(page, districtMaps.length - 1)];
    // Artwork and all targets use the same source rectangle and destination scale.
    const mapSource = new Rect(0, 0, 941, 1672);
    const mapWidth = 720, mapHeight = 1280;
    const scaleX = mapWidth / mapSource.width, scaleY = mapHeight / mapSource.height;
    this.imageRegion(`art/town/maps/${district.asset}`, mapSource, 360, 640, mapWidth, mapHeight);
    // Apply generated road repairs only over the six unused discs. Keep the
    // original pixels and calibrated geometry everywhere else on the map.
    const roadRepairs: Record<number, number[][]> = {
      1: [[178, 74, 76, 56], [309, 106, 76, 58]],
      2: [[194, 707, 74, 58], [327, 758, 75, 60], [430, 830, 76, 61], [849, 443, 70, 57]],
    };
    for (const [left, top, width, height] of roadRepairs[page] ?? []) {
      this.imageRegion(`art/town/maps/map-district-0${page + 1}-cleanup-v1`, new Rect(left, top, width, height),
        (left + width / 2) * scaleX, (top + height / 2) * scaleY, width * scaleX, height * scaleY);
    }

    const firstLevel = page * 20;
    const pageLevelCount = Math.min(20, Math.max(0, state.caseTitles.length - firstLevel));
    const openedCount = state.unlockedLevels?.length ?? 1;

    district.stops.slice(0, pageLevelCount).forEach(([sourceX, sourceY, sourceRadiusX, sourceRadiusY], offset) => {
      const index = firstLevel + offset;
      const x = sourceX * scaleX;
      const y = sourceY * scaleY;
      const radiusX = sourceRadiusX * scaleX;
      const radiusY = sourceRadiusY * scaleY;
      const unlocked = state.unlockedLevels?.includes(index) ?? index === 0;
      const completed = state.completedLevels?.includes(index) ?? false;
      const current = index === state.caseIndex && !completed;
      // Keep the illustrated stone visible. The transparent hit rectangle is larger
      // than its shallow perspective face, but remains centered on that same stone.
      const badge = this.node(`town-map-stop-${index}`, x, y,
        Math.max(44, radiusX * 2), Math.max(44, radiusY * 2));
      const graphics = badge.addComponent(Graphics);
      if (page === 4 && offset === 0) {
        graphics.fillColor = new Color(139, 113, 87, 235);
        graphics.ellipse(0, -3, radiusX, radiusY); graphics.fill();
        graphics.fillColor = new Color(246, 225, 190);
        graphics.strokeColor = new Color(187, 157, 119); graphics.lineWidth = 1.5;
        graphics.ellipse(0, 0, radiusX, radiusY); graphics.fill(); graphics.stroke();
        graphics.strokeColor = new Color(255, 248, 223); graphics.lineWidth = 1.2;
        graphics.ellipse(0, 0, radiusX - 3, radiusY - 3); graphics.stroke();
      }
      graphics.fillColor = completed ? new Color(116, 162, 93, 140)
        : current ? new Color(245, 180, 69, 180)
          : unlocked ? new Color(255, 249, 230, 45) : new Color(133, 116, 92, 35);
      graphics.ellipse(0, 0, radiusX * 0.82, radiusY * 0.82); graphics.fill();
      if (current) {
        graphics.strokeColor = new Color(171, 105, 39); graphics.lineWidth = 2;
        graphics.ellipse(0, 0, radiusX * 0.87, radiusY * 0.87); graphics.stroke();
      }
      this.clickable(badge, () => actions.selectCase(index), false);
      this.label(String(index + 1), x, y, Math.max(40, radiusX * 2), 32, index >= 99 ? 18 : 21,
        unlocked ? new Color(88, 63, 39) : new Color(116, 106, 88), true).setParent(badge, true);
    });

    const banner = this.panel('map-district-banner', 360, 40, 650, 68, new Color(255, 249, 230, 226), 23,
      new Color(137, 102, 67, 130), 1.5);
    this.label(`谜思小镇  ·  ${district.title}`, 360, 26, 490, 30, 21, this.ink, true).setParent(banner, true);
    this.label(`${district.range}  ·  已开放 ${openedCount}/${state.caseTitles.length}`,
      360, 55, 450, 24, 15, this.muted, true).setParent(banner, true);
    this.button('map-previous-district', 66, 40, 46, 52, '‹', () => actions.selectorPage(page - 1), 'light', 30, page === 0);
    this.button('map-next-district', 654, 40, 46, 52, '›', () => actions.selectorPage(page + 1), 'light', 27, page >= pageCount - 1);

    this.panel('map-unlock-tip', 360, 1117, 500, 40, new Color(255, 249, 230, 226), 16);
    this.label('点选未开放关卡，可观看广告解锁', 360, 1117, 480, 32, 20, this.ink);
    const tabY = 1192;
    this.button('town-tab-main', 126, tabY, 202, 88, '⌂  主线', () => actions.toggleSelector(false), 'primary', 25);
    this.button('town-tab-archive', 360, tabY, 202, 88, '▤  档案馆', actions.openArchive, 'light', 24, !state.archiveUnlocked);
    this.button('town-tab-daily', 594, tabY, 202, 88, '♧  每日', actions.openDaily, 'light', 25);
  }

}
